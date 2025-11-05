import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import type { AuthPayload, JwtClaims } from '../types/auth';

const JWT_SECRET   = process.env.JWT_SECRET || '';
const JWT_EXPIRES  = process.env.JWT_EXPIRES_IN || '8h';
const JWT_ISSUER   = process.env.JWT_ISSUER || 'restaurante-api';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'restaurante-app';

type Exp = SignOptions['expiresIn'];

export function signToken(payload: AuthPayload, expiresIn?: Exp): string {
    const opts: SignOptions = {
        algorithm: 'HS256',
        expiresIn: expiresIn ?? (JWT_EXPIRES as Exp),
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    };
    return jwt.sign(payload, JWT_SECRET, opts);
}

export function verifyToken<T extends JwtPayload = JwtClaims>(token: string): T {
    return jwt.verify(token, JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    }) as T;
}

export function decodeToken<T = any>(token: string): T | null {
    return (jwt.decode(token) as T) || null;
}
