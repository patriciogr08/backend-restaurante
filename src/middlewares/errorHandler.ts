import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  // Multer: tamaño o tipo
  if (err instanceof multer.MulterError) {
    const code = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(code).json({ error: err.message, requestId: req.requestId });
  }
  if (err?.message === 'Tipo de archivo no permitido') {
    return res.status(400).json({ error: err.message, requestId: req.requestId });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Error interno';
  res.status(status).json({ error: message, requestId: req.requestId });
}
