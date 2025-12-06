import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack config (Next.js 16 default)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.komosite.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
