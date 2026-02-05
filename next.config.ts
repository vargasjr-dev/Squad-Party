import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignore Expo/React Native files during Next.js build
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "react-native$": "react-native-web",
    };
    return config;
  },
  // Exclude mobile app directories from Next.js
  pageExtensions: ["tsx", "ts", "jsx", "js"],
};

export default nextConfig;
