/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  async rewrites() {
    return [
      {
        source: '/cron/compute-trends',
        destination: '/api/cron/compute-trends',
      },
    ];
  },
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
// Temporarily disable Sentry to fix chunk loading issues
// try {
//   if (process.env.SENTRY_DSN) {
//     const { withSentryConfig } = require('@sentry/nextjs');
//     cfg = withSentryConfig(baseConfig, { silent: true });
//   }
// } catch {}
module.exports = cfg;
