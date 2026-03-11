import type { NextConfig } from 'next';
import path from 'path';

const backendOrigin = (
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000'
).replace(/\/$/, '');

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, '..', '..'),
  },
  async rewrites() {
    return [
      {
        // Keep NextAuth routes on Next.js (do not proxy to Express backend).
        source: '/api/:path((?!auth(?:/|$)).*)',
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
