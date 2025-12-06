import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qdsafvfijboezatmbur.supabase.co',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
  },

  // Environment variables validation in build time
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Redirects for production
  async redirects() {
    return [
      // No redirects configured
    ];
  },
};

export default nextConfig;
