/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile AWS SDK packages
  transpilePackages: ['@aws-sdk', '@aws-crypto'],
  webpack: (config, { isServer }) => {
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
    const path = require('path');
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '../node_modules'),
      'node_modules',
    ];

    return config;
  },
  // Use experimental option for Next.js 14.2.0
  experimental: {
    serverComponentsExternalPackages: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'],
  },
};

module.exports = nextConfig;
