import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  transpilePackages: ['recharts'],

  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  images: {
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
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

export default nextConfig;
