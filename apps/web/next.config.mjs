/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent Next.js from bundling these server-side, bypassing SWC parsing errors for modern ES syntax
  experimental: {
    serverComponentsExternalPackages: ['undici', 'firebase', '@firebase/auth', '@firebase/app'],
  },
};

export default nextConfig;
