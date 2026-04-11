import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Build the SW regex from instances.json at build time so it stays in sync
// automatically whenever the instance list changes.
const instances: string[] = require("./instances.json");
const escapedHosts = instances
  .map((url) => new URL(url).hostname.replace(/\./g, "\\."))
  .join("|");
const tidalApiPattern = new RegExp(
  `^https:\\/\\/(?:${escapedHosts})\\/api\\/.*`,
  "i",
);

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        // Cache album art images
        urlPattern: /^https:\/\/resources\.tidal\.com\/images\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "tidal-images",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      {
        // Cache Google Fonts
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
      {
        // Network-first for external TIDAL proxy API calls only.
        // Derived from instances.json at build time — adding/removing an instance
        // there is all that's needed to keep this rule in sync.
        // Same-origin /api/ routes (auth, library state) are never matched.
        urlPattern: tidalApiPattern,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 30, // 30 minutes
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Silence Turbopack warning - use webpack for PWA compatibility
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "resources.tidal.com",
      },
      {
        protocol: "https",
        hostname: "*.tidal.com",
      },
      {
        protocol: "https",
        hostname: "static.qobuz.com",
      },
      {
        protocol: "https",
        hostname: "lyricsplus.prjktla.workers.dev",
      },
      {
        protocol: "https",
        hostname: "lrclib.net",
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 85, 90],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    unoptimized: true,
  },
};

export default withPWA(nextConfig);
