import { UploaderProps } from '../types';
import keyBy from 'lodash/keyBy';
import isEmpty from 'lodash/isEmpty';
import { useReactive } from 'ahooks';
import { createRoot } from 'react-dom/client';
import { Fragment, IframeHTMLAttributes, forwardRef, useEffect, useImperativeHandle, lazy } from 'react';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import Uppy from '@uppy/core';
import Webcam from '@uppy/webcam';
import ImportFromUrl from '@uppy/url';
import Unsplash from '@uppy/unsplash';
import uniq from 'lodash/uniq';
import { Dashboard, DragDrop as UppyDragDrop } from '@uppy/react';
import ImageEditor from '@uppy/image-editor';
import Tus from '@uppy/tus';
// import GoldenRetriever from '@uppy/golden-retriever';

// Don't forget the CSS: core and the UI components + plugins you are using.
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import '@uppy/webcam/dist/style.min.css';
import '@uppy/image-editor/dist/style.min.css';
import '@uppy/drag-drop/dist/style.min.css';
import '@uppy/status-bar/dist/style.min.css';

// @ts-ignore
import Uploaded from './plugins/uploaded';
// @ts-ignore
import PrepareUpload from './plugins/prepare-upload';
// @ts-ignore
import AIImage from './plugins/ai-image';
// @ts-ignore
import AIImage from './plugins/ai-image';
// @ts-ignore
const AIImageShowPanel = lazy(() => import('./plugins/ai-image/show-panel'));

import { getExt, getUploaderEndpoint } from '../utils';

const getPluginList = (props: UploaderProps) => {
  const { apiPathProps } = props;
  const companionUrl = getUploaderEndpoint(apiPathProps?.companion as string);

  return [
    {
      id: 'ImageEditor',
      plugin: ImageEditor, // use image editor
      options: {
        quality: 1,
      },
    },
    {
      id: 'Uploaded',
      plugin: Uploaded, //
      options: {},
    },
    {
      id: 'AIImage',
      plugin: AIImage,
      options: {
        companionUrl,
      },
      onShowPanel: () => {
        // wait for render
        setTimeout(() => {
          const root = document.getElementById('ai-image');
          // @ts-ignore
          createRoot(root).render(
            <AIImageShowPanel
              embed
              onSelect={(res) => {
                console.warn(res);
              }}
              api={() => {}}
              disabledSize={false}
            />
          );
        }, 100);
      },
    },
    {
      id: 'Url',
      plugin: ImportFromUrl,
      options: {
        companionUrl,
      },
    },
    {
      id: 'Webcam',
      plugin: Webcam,
      options: {},
    },
    {
      id: 'Unsplash',
      plugin: Unsplash,
      options: {
        companionUrl,
        companionHeaders: {},
        companionCookiesRule: 'same-origin',
      },
    },
    {
      id: 'PrepareUpload',
      plugin: PrepareUpload,
      options: {
        companionUrl,
      },
      alwayUse: true,
    },
  ];
};

function useUploader(props: UploaderProps) {
  const {
    id,
    plugins,
    onAfterResponse: _onAfterResponse,
    onUploadFinish: _onUploadFinish,
    coreProps,
    apiPathProps,
  } = props;

  const pluginList = getPluginList(props);

  const pluginMap = keyBy(pluginList, 'id');

  // Adding to global `meta` will add it to every file.
  // Every Uppy instance needs a unique ID.

  const currentUppy = new Uppy({
    id,
    meta: {
      uploaderId: id,
    },
    ...coreProps,
  }).use(Tus, {
    chunkSize: 1024 * 1024 * 20, // 20MB
    // docs: https://github.com/tus/tus-js-client/blob/main/docs/api.md
    withCredentials: true,
    endpoint: getUploaderEndpoint(apiPathProps?.uploader as string),
    async onBeforeRequest(req, file) {
      // @ts-ignore
      const { hashFileName, id } = file;

      const ext = getExt(file);
      // put the hash in the header
      req.setHeader('x-uploader-file-name', `${hashFileName}`);
      req.setHeader('x-uploader-file-id', `${id}`);
      req.setHeader('x-uploader-file-ext', `${ext}`);

      // @ts-ignore get folderId when upload using
      if (window?.blocklet?.componentId) {
        // @ts-ignore
        req.setHeader('x-component-did', (window.blocklet.componentId || '').split('/').pop());
      }
    },
    onAfterResponse: async (req, res) => {
      const result = {} as any;
      const xhr = req.getUnderlyingObject();

      try {
        if (xhr.response) {
          result.data = JSON.parse(xhr.response);
        }
      } catch (error) {
        result.data = {};
      }

      result.method = req.getMethod().toUpperCase();
      result.url = req.getURL();
      result.status = xhr.status;
      // @ts-ignore
      result.headers = req._headers;

      // each time a response is received

      if (_onAfterResponse) {
        await _onAfterResponse?.(xhr);
      }

      // only call onUploadFinish if it's a PATCH / POST request
      if (['PATCH', 'POST'].includes(result.method) && result.status === 200) {
        // remove uppy record
        Object.keys(localStorage).forEach((item) =>
          item.indexOf(result.headers['x-uploader-file-id']) != -1 ? localStorage.removeItem(item) : ''
        );
        await _onUploadFinish?.(result);
      }
    },
  });

  // .use(GoldenRetriever);

  plugins?.forEach((item) => {
    if (item) {
      const { plugin, options } = pluginMap[item] || {};
      // @ts-ignore
      plugin && currentUppy.use(plugin, options);
    }
  });

  return currentUppy;
}

const Uploader = forwardRef((props: UploaderProps & IframeHTMLAttributes<HTMLIFrameElement>, ref: any) => {
  // apiPathProps default is use image-bin
  const apiPathProps = props?.apiPathProps || {
    uploader: '/api/uploads',
    companion: '/api/companion',
  };

  const pluginList = getPluginList({ ...props, apiPathProps });

  const {
    plugins: _plugins = pluginList.map((item) => item.id),
    id = 'Uploader',
    popup = false,
    uploadedProps,
    onOpen,
    onClose,
  } = props;

  // get pluginMap tp get plugin some props
  const pluginMap = keyBy(pluginList, 'id');

  const plugins = uniq([..._plugins, ...pluginList.filter((item) => item.alwayUse).map((item) => item.id)]);

  // @ts-ignore
  const isMobile = useMediaQuery((theme) => theme?.breakpoints?.down('md'));

  const state = useReactive({
    open: false,
    uppy: useUploader({
      ...props,
      id,
      plugins,
      apiPathProps,
    }),
  });

  function open() {
    state.open = true;
    onOpen?.();
  }

  function close() {
    // @ts-ignore
    state.uppy.getPlugin('upload-dashboard')?.hideAllPanels();
    state.open = false;
    onClose?.();
  }

  useImperativeHandle(
    ref,
    () =>
      ({
        getUploader: () => state.uppy,
        open,
        close,
      } as {
        getUploader: Function;
        open: Function;
        close: Function;
      })
  );

  // custom plugin
  useEffect(() => {
    // handle uploaded:selected
    if (plugins.includes('Uploaded') && uploadedProps?.onSelectedFiles) {
      // @ts-ignore
      state.uppy.on('uploaded:selected', (files: Object[]) => {
        uploadedProps?.onSelectedFiles(files);
        close();
      });
    }

    // @ts-ignore
    state.uppy.on('dashboard:show-panel', (source) => {
      const { onShowPanel } = pluginMap[source];
      if (onShowPanel) {
        onShowPanel();
      }
    });
  }, plugins);

  const target = 'uploader-container';

  const Wrapper = popup ? Backdrop : Fragment;
  const wrapperProps = popup
    ? {
        sx: {
          '& > *': {
            display: !state.open ? 'none' : 'block', // hide uppy when close
          },
        },
        open: state.open,
        onClick: (e: any) => {
          if (document.activeElement === document.body) {
            e.stopPropagation();
            close();
          }
        },
        ...props.wrapperProps,
      }
    : ({
        ...props.wrapperProps,
      } as any);

  return (
    <Wrapper key="uploader-wrapper" {...wrapperProps}>
      {/* ignore backdrop trigger */}
      <Box
        key="uploader-container"
        id={target}
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: isMobile ? '90vw' : 720,
          '.uppy-Dashboard-AddFiles-title': {
            whiteSpace: 'normal',
          },
          '.uploaded, .ai-image': {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            '& > div': {
              width: '100%',
            },
            '& .uppy-ProviderBrowser-body': {
              background: '#fff',
            },
            '& .uppy-ProviderBrowser-list': {
              // flexDirection: 'column',
              // justifyContent: 'flex-start',
              // display: '-webkit-inline-box',
              height: 'fit-content',
            },
            '& .uppy-ProviderBrowser-header': {
              // hide the logout
              display: 'none',
            },
          },
          '& .uppy-Url': {
            width: '100% !important',
            display: 'flex',
            justifyContent: 'center',
            '& input': {
              width: '70%',
            },
          },
        }}>
        {/* @ts-ignore */}
        <Dashboard
          inline
          // @ts-ignore
          target={`#${target}`}
          id="upload-dashboard"
          uppy={state.uppy}
          plugins={plugins}
          fileManagerSelectionType="both"
          proudlyDisplayPoweredByUppy={false}
          showProgressDetails
          waitForThumbnailsBeforeUpload
          // theme="light"
          note=""
          {...props.dashboardProps}
        />
      </Box>
    </Wrapper>
  );
});

const DragDrop = ({ uploader }: { uploader: any }) => {
  return <UppyDragDrop uppy={uploader}></UppyDragDrop>;
};

export default Uploader;

export { DragDrop, useUploader, Uploader };
