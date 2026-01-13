/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['images-na.ssl-images-amazon.com', 'm.media-amazon.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:8087'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
