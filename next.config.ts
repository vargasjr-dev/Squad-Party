import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force SWC even though babel.config.js exists (for Expo)
  experimental: {
    forceSwcTransforms: true,
  },
  // Disable type checking during build (run separately)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // Only lint Next.js app directory
    dirs: ["app"],
  },
  // Ignore Expo/React Native files during Next.js build
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "react-native$": "react-native-web",
    };
    return config;
  },
  pageExtensions: ["tsx", "ts", "jsx", "js"],
};

export default nextConfig;
