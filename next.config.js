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
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'static01.nyt.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'i.redd.it',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'scontent.cdninstagram.com',
        pathname: '/**'
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
