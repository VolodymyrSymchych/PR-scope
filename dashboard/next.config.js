/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile AWS SDK packages
  transpilePackages: ['@aws-sdk', '@aws-crypto'],
  webpack: (config, { isServer, dir }) => {
    if (!isServer) {
      // Exclude AWS SDK from client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Add parent node_modules to resolution paths for monorepo
    // Use webpack's context instead of __dirname for Edge Runtime compatibility
    const path = require('path');
    config.resolve.modules = [
      path.join(dir, 'node_modules'),
      path.join(dir, '../node_modules'),
      'node_modules',
    ];
    
    // Add alias for server directory at root level
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/server': path.join(dir, '../server'),
    };

    // Suppress warnings for deprecated Tailwind CSS line-clamp plugin
    // (line-clamp is now built into Tailwind CSS v3.3+)
    config.ignoreWarnings = [
      { module: /node_modules\/@tailwindcss\/line-clamp/ },
      /Can't resolve '@tailwindcss\/line-clamp'/,
    ];

    return config;
  },
  // Use experimental option for Next.js 14.2.0
  experimental: {
    serverComponentsExternalPackages: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'],
  },
};

module.exports = nextConfig;
