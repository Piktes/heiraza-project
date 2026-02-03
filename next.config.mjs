/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Disable image optimization to allow loading images from /uploads/ on production
    // This fixes the "lazy-imageset" issue where images fail to load through nginx
    unoptimized: true,
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
      // Increased to 50mb to handle larger audio/track file uploads
      bodySizeLimit: '50mb',
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

