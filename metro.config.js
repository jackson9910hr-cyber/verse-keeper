// https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite on web runs wa-sqlite (WebAssembly) in a worker.
config.resolver.assetExts.push('wasm');

// SharedArrayBuffer needs cross-origin isolation. These headers cover `expo start --web`;
// the static GitHub Pages build gets them from coi-serviceworker (scripts/build-web.mjs).
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  middleware(req, res, next);
};

module.exports = config;
