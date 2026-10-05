import type { NextConfig } from 'next';

const adminApiUrl = process.env.ADMIN_API_URL || 'http://localhost:2020';

// The browser always talks to the Next.js origin. This keeps the user API
// usable both from localhost and from a phone on the local network, where
// `localhost` would otherwise mean the phone itself. The Nest address remains
// server-side configuration only.
const configuredApiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
const apiUrl = configuredApiUrl?.startsWith('http')
  ? configuredApiUrl
  : 'http://localhost:2000';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.10.65'],

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
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ]);
  },
};

export default nextConfig;
