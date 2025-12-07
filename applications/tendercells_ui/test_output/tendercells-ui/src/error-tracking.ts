// error-tracking.ts
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';

Sentry.init({
  dsn: 'your-sentry-dsn',
  integrations: [new Integrations.BrowserTracing()],
  tracesSampleRate: 1.0,
});
