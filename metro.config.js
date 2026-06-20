const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const { transformer, resolver } = config;

config.resolver = {
  ...resolver,
  sourceExts: [...resolver.sourceExts, 'mjs'],
};

module.exports = config;
