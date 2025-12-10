/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for Cloudflare Pages
  output: 'export',

  // Disable image optimization for static export (use Cloudflare Images CDN instead)
  images: {
    unoptimized: true,
  },

  // Trailing slashes for cleaner URLs and better CDN caching
  trailingSlash: true,

  // Security: Disable x-powered-by header
  poweredByHeader: false,

  // Increase static generation timeout for pages that fetch external data
  staticPageGenerationTimeout: 180,

  // Compression is handled by Cloudflare, disable built-in compression
  compress: false,

  // Disable source maps in production for smaller bundles
  productionBrowserSourceMaps: false,

  // Strict mode for better React practices
  reactStrictMode: true,

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Handle ES modules from @amiunique/core
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts'],
    };

    // Production optimizations
    if (!dev && !isServer) {
      // Minimize bundle size
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // Group recharts into its own chunk (large library)
            recharts: {
              name: 'recharts',
              test: /[\\/]node_modules[\\/](recharts|d3-.*)[\\/]/,
              chunks: 'all',
              priority: 30,
            },
            // Group common UI components
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 2,
              priority: 10,
            },
          },
        },
      };
    }

    return config;
  },

  // Experimental features
  experimental: {
    // Optimize package imports to reduce bundle size
    optimizePackageImports: ['lucide-react', 'recharts'],
  },

  // Turbopack configuration (required for Next.js 16+)
  turbopack: {
    resolveAlias: {
      // Handle ES modules from @amiunique/core
    },
  },
};

module.exports = nextConfig;
