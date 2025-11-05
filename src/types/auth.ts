import type { Rol } from './domain';

export type AuthPayload = {
    id: string;
    usuario: string;
    rol: Rol;
    nombre?: string;
    correo?: string | null;
};

export type JwtClaims = AuthPayload & {
    iat?: number;
    exp?: number;
    iss?: string;
    aud?: string;
};
