// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Docker uchun optimallashtirilgan

  // ===== IMAGE OPTIMIZATION =====
  // Configure allowed external image sources for security
  images: {
    // Remote patterns - more flexible than domains (Next.js 13+)
    remotePatterns: [
      {
        // Local development backend
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
      {
        // Local development backend (alternative)
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '4000',
        pathname: '/uploads/**',
      },
      {
        // Production backend - adjust hostname as needed
        protocol: 'https',
        hostname: '*.kuafcv.uz',
        pathname: '/uploads/**',
      },
      {
        // AWS S3 (if used in future)
        protocol: 'https',
        hostname: '*.amazonaws.com',
        pathname: '/**',
      },
      {
        // Cloudinary (if used in future)
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    // Fallback domains for older Next.js versions
    domains: ['localhost', '127.0.0.1'],
    // Image formats to optimize
    formats: ['image/avif', 'image/webp'],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes for the image optimization API
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimum cache TTL (in seconds)
    minimumCacheTTL: 60,
  },

  // ===== API REWRITES =====
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/:path*`
          : 'http://localhost:4000/api/:path*',
      },
    ];
  },

  // ===== SECURITY HEADERS =====
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
