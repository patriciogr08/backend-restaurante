// src/utils/pedido-mapper.ts (o donde lo tengas)
import { Pedido } from '../domain/entities/Pedido';

export function buildPedidoDespachoDto(p: Pedido) {
    return {
        id: p.id,
        mesaId: p.mesaId, // FK real
        // numero visible: ajusta según tu entidad Mesa
        mesaNumero: (p.mesa as any)?.numero ?? `M-${p.mesaId}`,
        estado: p.estado,
        creadoEn: p.createdAt,
        tiempoMaxMinutos: 20,
        total: Number((p as any).total ?? 0),
        items: (p.items ?? []).map(i => ({
        id: i.id,
        nombre: i.producto?.nombre ?? '',
        cantidad: i.cantidad,
        isExtra: i.isExtra,
        nota: i.notas ?? null,
        })),
    };
}

export function buildPedidoWsDto(p: Pedido) {
    return {
        id: p.id,
        meseroId: p.meseroId, // ajusta al nombre real
        mesaId: p.mesaId,
        mesaNumero: (p.mesa as any)?.numero ?? `M-${p.mesaId}`,
        estado: p.estado,
        createdAt: p.createdAt.toISOString(),
    };
}
