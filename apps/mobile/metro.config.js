const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Monorepo: watch files in both the mobile app and the monorepo root
config.watchFolders = [monorepoRoot];

// Tell Metro where to look for node_modules. Mobile-local first so that
// react@19.1.0 (needed by Expo SDK 54 / RN 0.81) wins over the root
// react@19.2.3 (installed for Next.js).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Guarantee every `require('react')` resolves to the mobile app's copy
// (react@19.1.0), even when the requiring file lives in hoisted root
// node_modules. Without this, react-native (hoisted) picks up root's
// react@19.2.3, creating two React instances → "Invalid hook call".
const reactPath = path.resolve(projectRoot, "node_modules/react");

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react") {
    return {
      filePath: require.resolve(reactPath),
      type: "sourceFile",
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativewind(config, {
  inlineVariables: false,
  globalClassNamePolyfill: false,
});
