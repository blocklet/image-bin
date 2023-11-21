/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable react/prop-types */
import styled from '@emotion/styled';
import prettyBytes from 'pretty-bytes';
import { format } from 'timeago.js';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import ButtonGroup from '@mui/material/ButtonGroup';
import Dialog from '@arcblock/ux/lib/Dialog';
import { useRef, lazy, useState, useEffect } from 'react';
import Spinner from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Empty from '@arcblock/ux/lib/Empty';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useInfiniteScroll, useResponsive } from 'ahooks';
import { isValid as isValidDid } from '@arcblock/did';
import FolderIcon from '@mui/icons-material/Folder';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useUploadContext } from '../contexts/upload';
import { useResourceContext } from '../contexts/resource';
import { createImageUrl } from '../libs/api';
import Actions from './actions';
import MediaItem from './media-item';
import { ADD_RESOURCE_PAGE_PATH, COMPONENT_DID } from '../libs/constants';

const UploaderTrigger = lazy(() =>
  // eslint-disable-next-line import/no-unresolved
  import('@blocklet/uploader/react').then((res) => ({ default: res.UploaderTrigger }))
);

const borderRadius = '4px !important';
const transformY = '4px';

function BlockletLogo(props) {
  const { did, ...restProps } = props;
  const src = `/.well-known/service/blocklet/logo-bundle/${did}`;

  return isValidDid(did) ? (
    <img width={24} height={24} src={src} alt={did} {...restProps} />
  ) : (
    <FolderIcon
      sx={{
        width: 24,
        height: 24,
        right: '1px !important', // adjust absolute
      }}
      {...restProps}
    />
  );
}

function Gallery({ uploads, type }) {
  const { locale } = useLocaleContext();
  const localeMap = {
    zh: 'zh_CN',
    en: 'en_US',
  };
  // @ts-ignore
  const isMobile = useMediaQuery((theme) => theme?.breakpoints?.down('md'));

  const responsive = useResponsive();
  // eslint-disable-next-line no-nested-ternary
  const cols = responsive.xl ? 4 : responsive.md ? 3 : 1;

  const gap = 16;

  const isResource = type === 'resource';

  return (
    <ImageList
      // variant="masonry"
      cols={cols}
      gap={gap}
      sx={{
        pt: transformY,
        mt: `calc(16px - ${transformY})`,
        overflow: 'hidden',
      }}>
      {uploads.map((x) => {
        return (
          <ImageListItem
            key={x._id}
            sx={{
              border: '1px solid rgba(0,0,0,0.1)',
              position: 'relative',
              borderRadius,
              'object, video': {
                borderRadius,
                borderBottomRightRadius: '0 !important',
                borderBottomLeftRadius: '0 !important',
              },
              '&, & *': {
                transition: 'all 0.25s ease-in-out',
              },
              '&:hover': {
                transform: `translateY(-${transformY})`,
                border: (theme) => `1px solid ${theme?.palette?.primary?.main}`,
                // boxShadow: (theme) => `4px 4px 0 0px ${theme?.palette?.primary?.main}`,
                object: {
                  animation: 'scroll 2s linear 1', // 'scroll 4s linear infinite',
                  '@keyframes scroll': {
                    '0%': {
                      objectPosition: 'center',
                    },
                    '25%': {
                      objectPosition: 'top',
                    },
                    '75%': {
                      objectPosition: 'bottom',
                    },
                    '100%': {
                      objectPosition: 'center',
                    },
                  },
                },
              },
            }}>
            {!x.isNew ? (
              <a
                href={createImageUrl(x.filename, 0, 0)}
                target="_blank"
                title={x.originalname}
                style={{
                  width: '100%',
                  position: 'relative',
                  height: isMobile
                    ? 'calc(100vw - 24px - 24px)'
                    : `calc((100vw - 255px - 24px - 24px - (16px) * ${cols - 1}) / ${cols})`,
                }}>
                <MediaItem {...x} type={type} />
                {isResource && (
                  <BlockletLogo
                    did={x.folderId}
                    style={{
                      position: 'absolute',
                      right: 0,
                      bottom: 0,
                      opacity: 0.85,
                    }}
                    color="primary"
                    width={24}
                    height={24}
                  />
                )}
              </a>
            ) : (
              <UploaderTrigger
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.1)',
                  '&:hover': {
                    cursor: 'pointer',
                    background: (theme) => theme?.palette?.primary?.main,
                  },
                }}>
                <AddCircleIcon
                  sx={{
                    fontSize: 80,
                    margin: '40px',
                    color: 'white',
                  }}
                />
              </UploaderTrigger>
            )}
            {!x.isNew && (
              <ImageListItemBar
                position="below"
                title={
                  !isResource && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 14,
                      }}>
                      {prettyBytes(x.size, {
                        locale,
                      })}
                    </Box>
                  )
                }
                subtitle={isResource ? '' : format(x.createdAt, localeMap[locale] || locale)}
                actionIcon={
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                    }}>
                    <Actions data={x} isResource={isResource} />
                  </Box>
                }
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 1.5,
                  py: isResource ? 1 : 0,
                  borderTop: '1px solid rgba(0,0,0,0.1)',
                  '& .MuiImageListItemBar-titleWrap': {
                    py: 1,
                    '& > div': {
                      lineHeight: '1.25',
                    },
                  },
                }}
              />
            )}
          </ImageListItem>
        );
      })}
    </ImageList>
  );
}

export default function Uploads() {
  const uploadState = useUploadContext();
  const resourceState = useResourceContext();
  const { t } = useLocaleContext();

  // @ts-ignore
  const isMobile = useMediaQuery((theme) => theme?.breakpoints?.down('md'));

  const { uploads, folders, loading, loadMoreUploads, folderId, filterByFolder, tabs, tab, setTab } = uploadState;
  const {
    resources,
    components,
    loading: loadingResources,
    loadResources,
    componentDid,
    filterByComponent,
  } = resourceState;
  const wrapperRef = useRef(null);
  const [showDialog, setShowDialog] = useState(false);
  const iframeRef = useRef(null);

  useInfiniteScroll(loadMoreUploads, {
    target: wrapperRef,
    isNoMore: () => {
      return !uploadState.hasMore;
    },
  });

  useEffect(() => {
    if (tab === 'resource' && !loadingResources) {
      loadResources();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    setTimeout(() => {
      if (showDialog && iframeRef.current) {
        window.addEventListener('message', (event) => {
          if (event?.data?.event === 'component.installed' && event.data.componentDid === COMPONENT_DID) {
            setShowDialog(false);
            setTimeout(() => {
              loadMoreUploads();
            }, 600);
          }
        });
      }
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDialog]);

  return (
    <Div
      ref={wrapperRef}
      style={{
        height: 'calc(100vh - 64px - 80px)',
        overflowY: 'auto',
        padding: '24px',
      }}>
      {!!tabs.length && (
        <Tabs
          sx={{ mt: -2, mb: 2 }}
          value={tab}
          onChange={(e, value) => {
            setTab(value);
          }}>
          {tabs.map((item) => (
            <Tab key={item.key} sx={{ position: 'relative' }} value={item.key} label={item.value} />
          ))}
        </Tabs>
      )}
      {tab === 'bucket' && [
        <Box>
          <ButtonGroup
            size={isMobile ? 'small' : 'medium'}
            variant="outlined"
            aria-label="outlined button group"
            sx={{
              flexWrap: 'wrap',
              '&  button': {
                border: '1px solid currentColor !important',
                mr: 1,
                mb: 1,
                ml: '0px !important',
                borderRadius,
              },
            }}>
            <Button onClick={() => filterByFolder('')} variant={folderId === '' ? 'contained' : 'outlined'}>
              {t('common.all')}
            </Button>
            {[...folders].map((x) => (
              <Button
                key={x._id}
                title={x._id}
                onClick={() => filterByFolder(x._id)}
                startIcon={<BlockletLogo did={x._id} />}
                variant={folderId === x._id ? 'contained' : 'outlined'}>
                {x.name}
              </Button>
            ))}
          </ButtonGroup>
        </Box>,
        uploads.length === 0 ? (
          <Empty>{t('common.empty')}</Empty>
        ) : (
          <Box>
            <Gallery
              uploads={[
                {
                  isNew: true,
                  _id: 'new-item',
                },
                ...uploads,
              ]}
            />
            {loading && (
              <div className="load-more">
                <Spinner />
              </div>
            )}
            {!uploadState.hasMore && (
              <Divider sx={{ mt: 2.5, color: 'rgba(0, 0, 0, 0.3)', fontSize: 14 }}> {t('common.noMore')}</Divider>
            )}
          </Box>
        ),
      ]}
      {tab === 'resource' && [
        <Box>
          <ButtonGroup
            size={isMobile ? 'small' : 'medium'}
            variant="outlined"
            aria-label="outlined button group"
            sx={{
              flexWrap: 'wrap',
              '&  button': {
                border: '1px solid currentColor !important',
                mr: 1,
                mb: 1,
                ml: '0px !important',
                borderRadius,
              },
            }}>
            {components.map((x) => (
              <Button
                key={x._id}
                title={x._id}
                onClick={() => filterByComponent(x.did)}
                startIcon={<BlockletLogo did={x.did} />}
                variant={componentDid === x.did ? 'contained' : 'outlined'}>
                {x.name}
              </Button>
            ))}
            <Button
              key="import"
              title="Import"
              onClick={() => setShowDialog(true)}
              startIcon={<AddCircleOutlineIcon />}
              variant="outlined">
              Import
            </Button>
          </ButtonGroup>
          {showDialog && (
            <DialogWrapper
              title="Add Resource"
              maxWidth={false}
              fullWidth={false}
              PaperProps={{
                style: {
                  maxWidth: 1350,
                  minWidth: 930,
                  width: '80%',
                },
              }}
              onClose={() => setShowDialog(false)}
              showCloseButton
              disableEscapeKeyDown
              open>
              <Box className="body">
                <iframe className="iframe" ref={iframeRef} src={ADD_RESOURCE_PAGE_PATH} title="Add Resource" />
              </Box>
            </DialogWrapper>
          )}
        </Box>,
        components.length === 0 ? (
          <Empty>{t('common.emptyResource')}</Empty>
        ) : (
          <Box>
            <Gallery uploads={resources} type="resource" />
            {loadingResources && (
              <div className="load-more">
                <Spinner />
              </div>
            )}
            {!loadingResources && resources.length === 0 && <Empty>{t('common.emptyResource')}</Empty>}
          </Box>
        ),
      ]}
    </Div>
  );
}

const Div = styled.div`
  .load-more {
    padding: 24px 0;
    text-align: center;
  }
`;

const DialogWrapper = styled(Dialog)`
  .body {
    height: 72vh;
    position: relative;
    .iframe {
      width: 100%;
      height: 100%;
      border: 0;
    }
  }
`;
