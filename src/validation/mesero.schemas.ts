import { z } from 'zod';

export const mesaIdParams     = z.object({ id: z.coerce.number().int().positive() });
export const carritoIdParams  = z.object({ id: z.coerce.number().int().positive() });
export const pedidoIdParams   = z.object({ id: z.coerce.number().int().positive() });
export const itemIdParams     = z.object({ itemId: z.coerce.number().int().positive() });

export const transferirSchema = z.object({ meseroId: z.number().int().positive() });

export const cancelarSchema   = z.object({
    motivo: z.string().trim().min(3).max(200)
});

/** Carrito: SIN isExtra */
export const addCarritoItemSchema = z.object({
    productoId: z.number().int().positive(),
    cantidad: z.number().int().positive(),
    notas: z.string().trim().max(255).nullable().optional(),
    tieneDescuento: z.coerce.boolean().optional(),
    descuentoPorcentaje: z.coerce.number().min(0).max(100).optional(),
    descuentoValor: z.coerce.number().min(0).optional(),
});
export const editCarritoItemSchema = addCarritoItemSchema.partial();

/** Pedido: CON isExtra */
export const addPedidoItemSchema = z.object({
    productoId: z.number().int().positive(),
    cantidad: z.number().int().positive(),
    notas: z.string().trim().max(255).nullable().optional(),
    isExtra: z.coerce.boolean().optional(),
    tieneDescuento: z.coerce.boolean().optional(),
    descuentoPorcentaje: z.coerce.number().min(0).max(100).optional(),
    descuentoValor: z.coerce.number().min(0).optional(),
});
export const editPedidoItemSchema = addPedidoItemSchema.partial();
