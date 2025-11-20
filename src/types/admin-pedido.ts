// src/dto/admin-pedido.dto.ts
export interface AdminPedidoItemDTO {
    id: number;
    productoId: number;
    nombre: string;
    cantidad: number;
    nota: string | null;
    isExtra: boolean;
    facturado: number;   // cantidad ya facturada (sum(facturaItem.cantidad))
    pendiente: number;
}

export interface AdminPedidoDTO {
    id: number;
    mesaId: number;
    mesaNumero: number;   // viene de Mesa
    meseroId: number;
    meseroNombre: string; // viene de Usuario (mesero)
    total: number;
    createdAt: string;    // ISO (el front lo convierte a "hace X minutos")
    estadoPedido: 'EN_PROCESO' | 'DESPACHADO' | 'COBRADO' | 'CANCELADO';
    items: AdminPedidoItemDTO[];

     // flags útiles para el admin
    itemsCount: number;
    itemsPendientes: number;
    facturadoTotal: boolean;
    facturadoParcial: boolean;
}
