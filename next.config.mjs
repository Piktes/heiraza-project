/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'test.heiraza.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      // Allow server actions from these origins (fixes LiteSpeed proxy issues)
      allowedOrigins: [
        'test.heiraza.com',
        'www.test.heiraza.com',
        'heiraza.com',
        'www.heiraza.com',
        'localhost:3000',
      ],
    },
  },
  // Skip URL normalization in middleware - handle it ourselves
  skipMiddlewareUrlNormalize: true,
};

export default nextConfig;

