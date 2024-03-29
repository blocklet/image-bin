const path = require('path');
const xbytes = require('xbytes');
const config = require('@blocklet/sdk/lib/config');
const uniq = require('lodash/uniq');
const logger = require('./logger');

const currentComponentInfo = config.components.find((x) => x.did === 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9');

let envMap = {};

const otherBlockletUploaderRoles = [
  // AI Blocklet
  'promptsEditor',
  // Pages Kit
  'pagesEditor',
  // Discuss Kit
  'blogEditor',
  'member',
];

const updateEnv = () => {
  logger.info('updating image bin env');
  envMap = {
    ...config.env,
    uploadDir: path.join(config.env.dataDir, 'uploads'),
    maxUploadSize: xbytes.parseSize(process.env.MAX_UPLOAD_SIZE, { iec: false }), // not use iec
    uploaderRoles: uniq(
      process.env.UPLOADER_ROLES?.split(',')
        .concat(otherBlockletUploaderRoles)
        .map((x) => x.trim())
        .filter(Boolean)
    ),
    getProviderOptions: () => {
      const providerOptions = {};
      // unsplash
      if (config.env.UNSPLASH_KEY && config.env.UNSPLASH_SECRET) {
        providerOptions.unsplash = {
          key: config.env.UNSPLASH_KEY,
          secret: config.env.UNSPLASH_SECRET,
        };
      }
      return providerOptions;
    },
    currentComponentInfo,
  };
};

updateEnv();

module.exports = {
  ...envMap,
  updateEnv,
};
