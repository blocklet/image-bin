const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const express = require('express');
const joinUrl = require('url-join');
const pick = require('lodash/pick');
const middleware = require('@blocklet/sdk/lib/middlewares');
const mime = require('mime-types');
const { customRandom, urlAlphabet, random } = require('nanoid');

const env = require('../libs/env');
const Upload = require('../states/upload');
const Folder = require('../states/folder');
const { api } = require('../libs/api');

const uploadRouter = express.Router();
const nanoid = customRandom(urlAlphabet, 24, random);
const auth = middleware.auth({ roles: env.uploaderRoles });
const user = middleware.user();
const ensureAdmin = middleware.auth({ roles: ['admin', 'owner'] });
const upload = multer({
  storage: multer.diskStorage({
    destination: env.uploadDir,
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${nanoid()}.${mime.extension(file.mimetype)}`);
    },
  }),
});

uploadRouter.post('/', user, auth, upload.single('image'), async (req, res) => {
  const obj = new URL(env.appUrl);
  obj.protocol = req.get('x-forwarded-proto') || req.protocol;
  obj.pathname = joinUrl(req.headers['x-path-prefix'] || '/', '/uploads', req.file.filename);

  const buffer = await fs.readFile(req.file.path);

  await api.put(
    '',
    {
      data: buffer,
    },
    {
      headers: {
        'x-skip-signature': true,
      },
    }
  );

  // FIXME:
  if (req.file) {
    throw new Error('upload failed!');
  }

  const doc = await Upload.insert({
    ...pick(req.file, ['size', 'filename', 'mimetype', 'originalname']),
    remark: req.body.remark || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: req.user.did,
    updatedBy: req.user.did,
  });

  res.json({ url: obj.href, ...doc });
});

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
uploadRouter.get('/', user, auth, async (req, res) => {
  let page = Number(req.query.page || 1);
  let pageSize = Number(req.query.pageSize || DEFAULT_PAGE_SIZE);

  page = Number.isNaN(page) ? 1 : page;
  pageSize = Number.isNaN(pageSize) ? DEFAULT_PAGE_SIZE : pageSize;
  pageSize = pageSize > MAX_PAGE_SIZE ? MAX_PAGE_SIZE : pageSize;

  const condition = {};
  if (req.query.folderId) {
    condition.folderId = req.query.folderId;
  }

  if (['guest', 'member'].includes(req.user.role)) {
    condition.createdBy = req.user.did;
  }

  const uploads = await Upload.paginate({ condition, sort: { createdAt: -1 }, page, size: pageSize });
  const total = await Upload.count(condition);

  const folders = await Folder.cursor({}).sort({ createdAt: -1 }).exec();

  res.jsonp({ uploads, folders, total, page, pageSize, pageCount: Math.ceil(total / pageSize) });
});

// preview image
uploadRouter.get('/:filename', user, auth, async (req, res) => {
  const doc = await Upload.findOne({ filename: req.params.filename });
  res.jsonp(doc);
});

// remove upload
uploadRouter.delete('/:id', user, ensureAdmin, async (req, res) => {
  const doc = await Upload.findOne({ _id: req.params.id });
  if (!doc) {
    res.jsonp({ error: 'No such upload' });
    return;
  }

  const result = await Upload.remove({ _id: req.params.id });
  if (result) {
    fs.unlinkSync(path.join(env.uploadDir, doc.filename));
  }

  res.jsonp(doc);
});

// create folder
uploadRouter.post('/folders', user, ensureAdmin, async (req, res) => {
  const name = req.body.name.trim();
  if (!name) {
    res.jsonp({ error: 'folder name required' });
    return;
  }

  const exist = await Folder.findOne({ name });
  if (exist) {
    res.json(exist);
    return;
  }

  const doc = await Folder.insert({
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: req.user.did,
    updatedBy: req.user.did,
  });

  res.json(doc);
});

// move to folder
uploadRouter.put('/:id', user, ensureAdmin, async (req, res) => {
  const doc = await Upload.findOne({ _id: req.params.id });
  if (!doc) {
    res.jsonp({ error: 'No such upload' });
    return;
  }

  const [, updatedDoc] = await Upload.update(
    { _id: req.params.id },
    { $set: pick(req.body, ['folderId']) },
    { returnUpdatedDocs: true }
  );

  res.jsonp(updatedDoc);
});

module.exports = { uploadRouter };
