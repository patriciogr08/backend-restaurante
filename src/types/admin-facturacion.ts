import { Pedido } from "../domain/entities/Pedido";

interface FacturarItemInput {
  pedidoItemId: number;
  cantidad: number;
}

interface FacturarPedidoBody {
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA';
  propinaMonto?: number;
  evidenciaUrl?: string | null;
  items?: FacturarItemInput[];
}


export interface PedidoExtraPayload {
  pedidoId: number;
  mesaId: number;
  meseroId: number;
  item: {
    id: number;
    productoId: number;
    nombre: string;
    cantidad: number;
    isExtra: boolean;
    notas: string | null;
  };
}

export interface PedidoFacturadoPayload {
  pedidoId: number;
  mesaId: number;
  meseroId: number;
  estado: Pedido['estado'];   // 'DESPACHADO' | 'COBRADO' | ...
  facturadoTotal: boolean;    // true cuando ya quedó totalmente cobrado
}