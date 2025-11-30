/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for Cloudflare Pages
  output: 'export',

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Trailing slashes for cleaner URLs
  trailingSlash: true,

  // Disable x-powered-by header
  poweredByHeader: false,

  // Increase static generation timeout for pages that fetch external data
  staticPageGenerationTimeout: 180,

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787',
  },

  // Webpack configuration
  webpack: (config) => {
    // Handle ES modules from @amiunique/core
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts'],
    };
    return config;
  },
};

module.exports = nextConfig;
