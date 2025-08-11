import * as Sentry from '@sentry/nextjs';

if (process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
    tracesSampleRate: 0.05,
    replaysOnErrorSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    beforeSend(event) {
      // basic PII scrub
      if (event.request) {
        delete (event.request as any).headers;
        delete (event.request as any).cookies;
      }
      return event;
    }
  });
}
