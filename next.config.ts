import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  
  experimental: {
    turbo: {
      resolveAlias: {
        '@': './src',
      },
    },
  },
};


export default nextConfig;

