import { z } from 'zod';

export const estadoEnum = z.enum(['ACTIVO','INACTIVO']);

export const createTipoSchema = z.object({
    nombre: z.string().trim().min(1).max(80),
});

export const updateTipoParams = z.object({ id: z.coerce.number().int().positive() });
export const updateTipoBody   = z.object({
    nombre: z.string().trim().min(1).max(80).optional(),
    estado: estadoEnum.optional(),
});

export const changeTipoEstadoParams = updateTipoParams;
export const changeTipoEstadoBody   = z.object({ estado: estadoEnum });

export const createProductoSchema = z.object({
    tipoProductoId: z.coerce.number().int().positive(),
    nombre:   z.string().trim().min(1).max(120),
    descripcion: z.string().trim().max(255).nullable().optional(),
    precio:   z.coerce.number().nonnegative(),
    tieneDescuento: z.coerce.boolean().optional().default(false),
    descuentoPorcentaje: z.coerce.number().min(0).max(100).optional().default(0),
    descuentoValor:      z.coerce.number().min(0).optional().default(0),
});

export const updateProductoParams = z.object({ id: z.coerce.number().int().positive() });
export const updateProductoBody   = z.object({
    tipoProductoId: z.coerce.number().int().positive().optional(),
    nombre:   z.string().trim().min(1).max(120).optional(),
    descripcion: z.string().trim().max(255).nullable().optional(),
    precio:   z.coerce.number().nonnegative().optional(),
    tieneDescuento: z.coerce.boolean().optional(),
    descuentoPorcentaje: z.coerce.number().min(0).max(100).optional(),
    descuentoValor:      z.coerce.number().min(0).optional(),
    estado: estadoEnum.optional(),
});

export const changeProductoEstadoParams = updateProductoParams;
export const changeProductoEstadoBody   = z.object({ estado: estadoEnum });
