// error-tracking.ts
export const initErrorTracking = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    return;
  }

  console.info("Sentry DSN configured, but Sentry packages are not installed in this build.");
};
