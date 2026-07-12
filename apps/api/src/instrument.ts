import * as Sentry from "@sentry/node";
import { env } from "./config/env.config";

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: env.NODE_ENV,
  });
}
