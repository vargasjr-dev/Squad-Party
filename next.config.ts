import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ─── Performance ─────────────────────────────────────
  // Enable React strict mode for better development warnings
  reactStrictMode: true,

  // ─── Images ──────────────────────────────────────────
  images: {
    // Optimize images from these external domains
    remotePatterns: [
      {
        protocol: "https",
        hostname: "squad-party.vercel.app",
      },
    ],
    // Modern formats for smaller bundles
    formats: ["image/avif", "image/webp"],
  },

  // ─── Build ───────────────────────────────────────────
  // Disable type checking during build (run separately in CI)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    dirs: ["app", "components", "lib"],
  },

  // ─── Headers ─────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: "/(.*)\\.(png|jpg|jpeg|gif|svg|ico|webp|avif|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  pageExtensions: ["tsx", "ts", "jsx", "js"],
};

export default nextConfig;
