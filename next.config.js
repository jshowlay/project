/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' for development
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // App router is now default, no need for experimental.appDir
};

module.exports = nextConfig;
