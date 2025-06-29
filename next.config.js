/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // appDir is now stable and enabled by default in Next.js 13+
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000') + '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 