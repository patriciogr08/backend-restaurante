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
// Seguridad / performance
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: true, 
  credentials: true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['authorization', 'content-type'],
  preflightContinue: false
}));
app.use(httpLogger);
app.use(timeZone);
app.use(compression());
app.use(rateLimiter);

// // Parsers
app.use(express.json({ limit: '5mb' }));

    // Archivos estáticos (imágenes)
const uploadDir: string = path.isAbsolute(process.env.UPLOAD_DIR ?? '')
                        ? (process.env.UPLOAD_DIR as string)
                        : path.join(__dirname, '..', process.env.UPLOAD_DIR ?? 'public/images');

    // Sirve todo lo que esté dentro de UPLOAD_DIR en /images (o lo que definas en MOUNT_PATH)
app.use(MOUNT_PATH, express.static(uploadDir));

// Rutas base (aún sin controladores de negocio)
app.use('/api', apiRouter);

// 404 y errores
app.use(notFound);
app.use(errorHandler);
