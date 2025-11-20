// src/events/pedido-events.ts
import { Pedido } from '../domain/entities/Pedido';
import { Mesa } from '../domain/entities/Mesa';
import { PedidoItem } from '../domain/entities/PedidoItem';
import { getIO } from '../ws/socket';
import { PedidoFacturadoPayload } from '../types/admin-facturacion';

export interface PedidoPayload {
    id: number;
    mesaId: number;
    meseroId: number;
    estado: string;
    total: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface PedidoExtraPayload {
    pedidoId: number;
    mesaId: number;
    meseroId: number;
    item: {
        id: number;
        productoId: number;
        nombre?: string;
        cantidad: number;
        isExtra: boolean;
        notas?: string | null;
    };
}

export interface MesaPayload {
    id: number;
    numero?: number;
    ocupacion: string;  // 'LIBRE' | 'OCUPADA' | ...
    updatedAt?: Date;
}

export class PedidoEvents {

    // ===== HELPERS INTERNOS =====

    private static buildPedidoPayload(p: Pedido): PedidoPayload {
        return {
            id: p.id,
            mesaId: p.mesaId,
            meseroId: p.meseroId,
            estado: p.estado,
            total: Number(p.total ?? 0),
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        };
    }

    private static buildMesaPayload(m: Mesa): MesaPayload {
        return {
            id: m.id,
            numero: (m as any).numero,
            ocupacion: m.ocupacion,
            updatedAt: m.updatedAt,
        };
    }

    private static emitToAllRooms(event: string, payload: any, meseroId: number) {
        const io = getIO();

        // Cocina / despachador
        io.to('despachador').emit(event, payload);

        // Mesero dueño
        io.to(`mesero:${meseroId}`).emit(event, payload);

        // Admin
        io.to('admin').emit(event, payload);
    }

    // ===== EVENTOS DE PEDIDO =====

    /**
     * Cuando se crea un pedido nuevo (enviar a cocina desde carrito).
     */
    static emitCreado(p: Pedido) {
        const payload = this.buildPedidoPayload(p);
        this.emitToAllRooms('pedido:creado', payload, p.meseroId);
    }

    /**
     * Cualquier cambio "importante" del pedido:
     * - cambios de estado (EN_PROCESO, DESPACHADO, CANCELADO, etc.)
     * - cambios de totales
     * - cambios en items (además de eventos específicos)
     */
    static emitActualizado(p: Pedido) {
        const payload = this.buildPedidoPayload(p);
        this.emitToAllRooms('pedido:actualizado', payload, p.meseroId);
    }

    /**
     * Cuando el mesero agrega un extra (isExtra = true).
     * Se puede disparar además de emitActualizado(p).
     */
    static emitItemExtra(p: Pedido, item: PedidoItem) {
        const io = getIO();

        const payload: PedidoExtraPayload = {
            pedidoId: p.id,
            mesaId: p.mesaId,
            meseroId: p.meseroId,
            item: {
                id: item.id,
                productoId: item.productoId,
                nombre: (item as any).producto?.nombre,
                cantidad: item.cantidad,
                isExtra: item.isExtra,
                notas: item.notas ?? null,
            },
        };

        // Cocina / despachador debe ver claramente los extras
        io.to('despachador').emit('pedido:extra', payload);
        // Si quieres que mesero/admin también lo vean:
        io.to(`mesero:${p.meseroId}`).emit('pedido:extra', payload);
        io.to('admin').emit('pedido:extra', payload);
    }

    /**
     * Cuando cambian los items (agregar/quitar/editar).
     * Útil si quieres diferenciar a nivel UI.
     */
    static emitItemsCambiados(p: Pedido) {
        const payload = this.buildPedidoPayload(p);
        this.emitToAllRooms('pedido:items-cambiados', payload, p.meseroId);
    }

    /**
     * Cuando el despachador marca el pedido como DESPACHADO.
     * Esto además libera la mesa.
     */
    static emitDespachado(p: Pedido) {
        const payload = this.buildPedidoPayload(p);
        this.emitToAllRooms('pedido:despachado', payload, p.meseroId);
    }



    // ===== EVENTOS DE MESA =====

    /**
     * Cuando cambia el estado de una mesa (LIBRE/OCUPADA/RESERVADA, etc.).
     * Se puede llamar desde:
     * - crear pedido (mesa pasa LIBRE -> OCUPADA)
     * - despachar / cerrar pedido (mesa pasa OCUPADA -> LIBRE)
     * - reasignación, etc.
     */
    static emitMesaActualizada(mesa: Mesa) {
        const io = getIO();
        const payload = this.buildMesaPayload(mesa);

        // Admin debe ver todos los cambios en las mesas
        io.to('admin').emit('mesa:actualizada', payload);

        io.emit('mesa:actualizada', payload);

    }
}
