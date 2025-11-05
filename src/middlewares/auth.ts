import type { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtClaims } from '../types/auth';
import type { Rol } from '../types/domain';

function unauthorized(res: Response, msg = 'No autorizado') {
  return res.status(401).json({ message: msg });
}

export function ensureAuth(req: Request, res: Response, next: NextFunction) {
  if (!env.JWT_SECRET) return unauthorized(res, 'Configuración inválida (JWT)');
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return unauthorized(res, 'Token faltante');

  try {
    const token = auth.slice(7);
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload & JwtClaims;

    if (!payload.id) return unauthorized(res, 'Token incompleto');

    req.user = {
        id: String(payload.id),
        usuario: String(payload.usuario || ''),
        rol: String(payload.rol || '').toUpperCase() as Rol,
        nombre: payload.nombre ? String(payload.nombre) : undefined,
        correo: payload.correo ?? null
    };
    next();
  } catch {
    return unauthorized(res, 'Token inválido o expirado');
  }
}

export function requireRole(...roles: Array<Rol>) {
  const allowed = new Set((roles || []).map(r => String(r).toUpperCase()));
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return unauthorized(res);
    if (allowed.size === 0) return next();
    const role = String(req.user.rol || '').toUpperCase();
    if (!allowed.has(role)) return res.status(403).json({ message: 'No autorizado' });
    next();
  };
}
