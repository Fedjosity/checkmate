import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.config';
import { apiLimiter } from './middleware/rateLimit.middleware';
import { errorHandler } from './middleware/error.middleware';
import routes from './routes';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(apiLimiter);

import * as Sentry from '@sentry/node';

// Mount routes
app.use('/', routes);

// Sentry Error Handler (must be before custom error handlers)
Sentry.setupExpressErrorHandler(app);

// Global error handler
app.use(errorHandler);
