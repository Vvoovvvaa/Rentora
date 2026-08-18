import type { NextConfig } from 'next';

const adminApiUrl = process.env.ADMIN_API_URL || 'http://localhost:2020';

const nextConfig: NextConfig = {
  rewrites() {
    return Promise.resolve([
      {
        source: '/admin-api',
        destination: `${adminApiUrl}/`,
      },
      {
        source: '/admin-api/:path*',
        destination: `${adminApiUrl}/:path*`,
      },
    ]);
  },
};

export default nextConfig;
