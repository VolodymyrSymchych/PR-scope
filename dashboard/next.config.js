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
    
    // Fix for AWS SDK util-endpoints module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    // Ensure proper module resolution for AWS SDK
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      'node_modules',
    ];
    
    // Ignore missing optional dependencies
    config.ignoreWarnings = [
      { module: /node_modules\/@aws-sdk\/util-endpoints/ },
      { message: /Can't resolve '@aws-crypto\/crc32'/ },
      { message: /Can't resolve '@aws-crypto\/util'/ },
      { message: /Can't resolve '@aws-crypto\/crc32c'/ },
    ];
    
    return config;
  },
  // Use experimental option for Next.js 14.2.0
  experimental: {
    serverComponentsExternalPackages: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'],
  },
};

module.exports = nextConfig;
