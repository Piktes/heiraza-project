/** @type {import('next').NextConfig} */

// Inject build time at build for version tracking
const buildTime = new Date().toISOString();

const nextConfig = {
  // Expose build time to client for version mismatch detection
  env: {
    NEXT_PUBLIC_BUILD_TIME: buildTime,
  },
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
      // Limit to 30mb for admin file uploads (matches nginx client_max_body_size)
      bodySizeLimit: '30mb',
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

