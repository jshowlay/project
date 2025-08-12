/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

let cfg = nextConfig;

try {
  // Enable Sentry build-time integration only if DSN is set
  if (process.env.SENTRY_DSN) {
    const { withSentryConfig } = require('@sentry/nextjs');
    cfg = withSentryConfig(nextConfig, {
      silent: true
    });
  }
} catch {}

module.exports = cfg;
