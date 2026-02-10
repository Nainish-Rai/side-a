module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // expo-router isn't hoisted to root node_modules in this monorepo,
      // so babel-preset-expo can't auto-detect it. Include the plugin manually.
     require("babel-preset-expo/build/expo-router-plugin").expoRouterBabelPlugin,
  "react-native-worklets/plugin"
    ],
  };
};
