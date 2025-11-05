export type Rol = 'ADMIN' | 'MESERO' | 'DESPACHADOR';
export type EstadoUsuario = 'ACTIVO' | 'INACTIVO';

export type OcupacionMesa = 'LIBRE' | 'OCUPADA' | 'EN_COBRO';
export type EstadoCatalogo = 'ACTIVO' | 'INACTIVO';

export type EstadoCarrito = 'ACTIVO' | 'CANCELADO';

export type EstadoPedido = 'EN_PROCESO' | 'DESPACHADO' | 'COBRADO' | 'CANCELADO';

export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA';
export type EstadoFactura = 'EMITIDA' | 'ANULADA';
export type EstadoPago = 'CONFIRMADO' | 'RECHAZADO';
