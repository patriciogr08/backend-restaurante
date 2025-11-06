import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import { env } from './config/env';
import { requestId } from './middlewares/requestId';
import { httpLogger } from './middlewares/logger';
import { rateLimiter } from './middlewares/rateLimiter';
import { timeZone } from './middlewares/timeZone';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';
import { MOUNT_PATH, UPLOAD_DIR } from './config/multer';
import apiRouter from './routes';

export const app = express();

// IDs y logs
app.use(requestId);
app.use(httpLogger);

// Seguridad / performance
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(compression());

// Rate limit
app.use(rateLimiter);

// Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Salud
app.get('/health', (_req, res) => {
  res.json({ ok: true, tz: env.DB_TIMEZONE, now: new Date().toISOString() });
});

// Archivos estáticos (uploads)
app.use(
  env.UPLOAD_MOUNT_PATH.replace(/\/+$/, ''),
  express.static(path.join(process.cwd(), env.UPLOAD_DIR), {
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  })
);

// Fijar TZ por request (opcional si ya lo ejecutas en init)
app.use(timeZone);

// Rutas base (aún sin controladores de negocio)
app.use('/api', apiRouter);

// 404 y errores
app.use(notFound);
app.use(errorHandler);
