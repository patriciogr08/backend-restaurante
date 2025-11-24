export interface ReporteVentasRow {
    facturaId: number;
    numero: string;
    fecha: string;      // YYYY-MM-DD
    hora: string;       // HH:mm
    mesaNumero: number | null;
    meseroNombre: string | null;
    metodoPago: 'EFECTIVO' | 'TRANSFERENCIA';
    total: number;
    propina: number;
}

export interface ReporteVentasResponse {
    fechaDesde: string;
    fechaHasta: string;
    metodoPago?: string | null;
    totalFacturado: number;
    totalPropina: number;
    totalFacturas: number;
    ticketPromedio: number;
    rows: ReporteVentasRow[];
}


// Productos
export interface ReporteProductosRow {
    productoId: number;
    nombre: string;
    categoriaNombre : string;
    cantidadVendida: number;
    totalVendido: number;
}

export interface ReporteProductosResponse {
    fechaDesde: string;
    fechaHasta: string;
    totalCantidad: number;
    totalMonto: number;
    rows: ReporteProductosRow[];
}

// Meseros
export interface ReporteMeserosRow {
    meseroId: number;
    meseroNombre: string;
    cantidadPedidos: number;
    totalFacturado: number;
    totalPropina: number;
    ticketPromedio: number;
}

export interface ReporteMeserosResponse {
    fechaDesde: string;
    fechaHasta: string;
    totalFacturado: number;
    totalPropina: number;
    totalPedidos: number;
    rows: ReporteMeserosRow[];
}
