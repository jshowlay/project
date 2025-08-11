import * as Sentry from '@sentry/nextjs';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.05,
    beforeSend(event) {
      // scrub request headers/cookies
      if (event.request) {
        delete (event.request as any).headers;
        delete (event.request as any).cookies;
      }
      return event;
    }
  });
}
