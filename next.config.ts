import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable Edge Runtime for API routes
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
