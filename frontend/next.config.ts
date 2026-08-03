import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  transpilePackages: ['recharts'],
  turbopack: {},
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion', 'date-fns'],
  },

  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  allowedDevOrigins: [
    "*.localhost",
    "localhost",
    "0.0.0.0",
    "192.168.1.40",
    "192.168.1.46",
  ],

  images: {
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
      {
        protocol: "http",
        hostname: "192.168.29.231",
        port: "3000",
        pathname: "/**",
      },
    ],
  },
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
};

// ✅ PWA CONFIG (ONLY FOR PRODUCTION)
const pwa = withPWA({
  dest: "public",
  register: true,
  disable: isDev, // 👈 important: disable in development to avoid caching issues
  workboxOptions: {
    skipWaiting: true,
    exclude: [/middleware-manifest\.json$/],
  },
});

export default isDev
  ? nextConfig
  : (pwa(nextConfig as any) as NextConfig);
