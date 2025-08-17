/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'trenderai.com',
        pathname: '/wp-content/uploads/**'
      },
      {
        protocol: 'http',
        hostname: 'trenderai.com',
        pathname: '/wp-content/uploads/**'
      }
    ]
  }
};

let cfg = baseConfig;
try {
  if (process.env.SENTRY_DSN) {
    const { withSentryConfig } = require('@sentry/nextjs');
    cfg = withSentryConfig(baseConfig, { silent: true });
  }
} catch {}
module.exports = cfg;
