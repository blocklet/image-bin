const { Server } = require('@tus/server');
const { FileStore } = require('@tus/file-store');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const mime = require('mime-types');
const joinUrl = require('url-join');

export function initLocalStorageServer({
  path,
  onUploadFinish: _onUploadFinish,
  express,
  ...restProps
}: {
  path: string;
  onUploadFinish?: Function;
  express: Function;
}) {
  const app = express();

  const newServer = new Server({
    path: '/', // UNUSED
    relativeLocation: true,
    // respectForwardedHeaders: true,
    namingFunction: (req: any) => {
      const ext = req.headers['x-uploader-file-ext'];
      const randomName = `${crypto.randomBytes(16).toString('hex')}${ext ? `.${ext}` : ''}`;
      return req.headers['x-uploader-file-name'] || randomName; // use a random name
    },
    datastore: new FileStore({ directory: path }),
    onUploadFinish: async (req: any, res: any, uploadMetadata: Object) => {
      if (_onUploadFinish) {
        const result = await _onUploadFinish(req, res, uploadMetadata);

        // result can be res or value
        if (result && !result.send) {
          const body = typeof result === 'string' ? result : JSON.stringify(result);
          throw { body, status_code: 200 };
        } else {
          return result;
        }
      }
      return res;
    },
    ...restProps,
  });

  // default root path
  // newServer.get('/', async (req: any, res: any) => {
  //   const files = await fs.readdir(newServer.datastore.directory);
  //   // Format and return
  //   res.json(files);
  // });

  app.all('*', setContentType, newServer.handle.bind(newServer));

  newServer.handle = app;

  return newServer;
}

export function getFileNameParam(
  req: any,
  res: any,
  { isRequired = true } = {} as {
    isRequired: boolean;
  }
) {
  let { fileName } = req.params;

  if (!fileName) {
    // try to get from url
    fileName = req.originalUrl.replace(req.baseUrl, '');
  }

  if (!fileName && isRequired) {
    res.status(400).json({ error: 'Parameter "fileName" is required' });
    return;
  }

  return fileName;
}

export function getLocalStorageFile({ server }: any) {
  return async (req: any, res: any, next: any) => {
    // get file name
    const fileName = getFileNameParam(req, res);

    const filePath = path.join(server.datastore.directory, fileName);

    // check if file exists
    const fileExists = await fs.stat(filePath).catch(() => false);

    if (!fileExists) {
      res.status(404).json({ error: 'file not found' });
      return;
    }

    // set content type
    setContentType(req, res);

    const file = await fs.readFile(filePath);
    res.send(file);

    next?.();
  };
}

export function setContentType(req: any, res: any, next?: Function) {
  let { method, headers } = req;
  // get file name
  const fileName = getFileNameParam(req, res, {
    isRequired: false,
  });

  method = method.toLowerCase();

  // resolve the bug of component mount
  if (method === 'post' && !req.baseUrl.startsWith(headers['x-path-prefix'])) {
    req.baseUrl = joinUrl(headers['x-path-prefix'], req.baseUrl);
  }

  if (method === 'get' && fileName) {
    // set content type
    const contentType = mime.lookup(fileName);
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
  }

  next?.();
}