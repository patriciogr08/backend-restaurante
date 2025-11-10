// src/validation/mesas.schema.ts
import { z } from 'zod';

export const mesaCreateSchema = z.object({
    numero: z.number().int().positive(),
    capacidad: z.number().int().min(1).max(20)
});

export const mesaUpdateSchema = mesaCreateSchema.partial();

export const mesaSetOcupacionSchema = z.object({
    ocupacion: z.enum(['LIBRE', 'OCUPADA', 'EN_COBRO'])
});
