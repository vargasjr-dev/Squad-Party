module.exports = function (api) {
  api.cache(true);

  // Only apply Expo babel config to non-Next.js files
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./client",
            "@shared": "./shared",
          },
          extensions: [".ios.js", ".android.js", ".js", ".ts", ".tsx", ".json"],
        },
      ],
      "react-native-reanimated/plugin",
    ],
    // Only apply to Expo/React Native files
    ignore: ["./app/**", "./node_modules/next/**"],
  };
};
