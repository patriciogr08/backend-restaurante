import { z } from 'zod';

export const rolEnum = z.enum(['MESERO', 'DESPACHADOR']);
export const estadoEnum = z.enum(['ACTIVO', 'INACTIVO']);

export const createUserSchema = z.object({
    nombre:   z.string().trim().min(1).max(120),
    usuario:  z.string().trim().min(3).max(60),
    password: z.string().min(6),
    rol:      rolEnum,
    email:    z.string().trim().email().max(160).nullable().optional(),
    telefono: z.string().trim().min(5).max(30).nullable().optional(),
});

export const updateUserSchema = z.object({
    nombre:   z.string().trim().min(1).max(120).optional(),
    rol:      rolEnum.optional(),
    email:    z.string().trim().email().max(160).nullable().optional(),
    telefono: z.string().trim().min(5).max(30).nullable().optional(),
});

export const changeEstadoParams = z.object({
    id: z.coerce.number().int().positive(),
});

export const changeEstadoBody = z.object({
    estado: estadoEnum,
});
