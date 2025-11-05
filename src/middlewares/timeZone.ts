import type { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/data-source';
import { env } from '../config/env';

export async function timeZone(_req: Request, _res: Response, next: NextFunction) {
    try { await AppDataSource.query(`SET time_zone = '${env.DB_TIMEZONE}';`); } catch {}
    next();
}