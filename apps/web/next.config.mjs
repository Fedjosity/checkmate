/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent Next.js from bundling these server-side, bypassing SWC parsing errors for modern ES syntax
  experimental: {
    serverComponentsExternalPackages: ['undici', 'firebase', '@firebase/auth', '@firebase/app'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'undici'];
    } else {
      config.resolve.alias = {
        ...config.resolve.alias,
        undici: false,
      };
    }
    return config;
  },
};

export default nextConfig;
