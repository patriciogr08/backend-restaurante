
import { AppDataSource } from '../config/data-source';
import { Factura } from '../domain/entities/Factura';
import { Mesa } from '../domain/entities/Mesa';
import { Pedido } from '../domain/entities/Pedido';
import { Usuario } from '../domain/entities/Usuario';
import type { Request } from 'express';
import {
    ReporteMeserosResponse,
    ReporteMeserosRow,
    ReporteProductosResponse,
    ReporteProductosRow,
  ReporteVentasResponse,
  ReporteVentasRow,
} from '../types/admin-reportes';
import { FacturaItem } from '../domain/entities/FacturaItem';
import { PedidoItem } from '../domain/entities/PedidoItem';
import { Producto } from '../domain/entities/Producto';
import { TipoProducto } from '../domain/entities/TipoProducto';

// --- helpers de fechas que ya habíamos usado ---
function parseRangoFechas(req: Request): { fechaDesde: string; fechaHasta: string } {
    const { desde, hasta } = req.query as { desde?: string; hasta?: string };

    let fechaDesde: string;
    let fechaHasta: string;

    if (desde || hasta) {
        const d = (desde || hasta)!;
        const h = (hasta || desde)!;

        if (d <= h) {
        fechaDesde = d;
        fechaHasta = h;
        } else {
        fechaDesde = h;
        fechaHasta = d;
        }
    } else {
        const hoy = new Date().toISOString().slice(0, 10);
        fechaDesde = hoy;
        fechaHasta = hoy;
    }

    return { fechaDesde, fechaHasta };
}



/**
 * Construye la data del reporte de ventas (JSON) para reutilizar en
 * respuesta normal y exportaciones (Excel, etc.)
 */
export async function buildReporteVentasData(req: Request): Promise<ReporteVentasResponse> {
    const ds = AppDataSource;
    const facturaRepo = ds.getRepository(Factura);

    const { fechaDesde, fechaHasta } = parseRangoFechas(req);
    const { metodoPago } = req.query as { metodoPago?: string };

    const ini = new Date(`${fechaDesde}T00:00:00.000Z`);
    const fin = new Date(`${fechaHasta}T23:59:59.999Z`);

    const qb = facturaRepo
        .createQueryBuilder('f')
        .leftJoinAndMapOne('f.pedido', Pedido, 'p', 'p.id = f.pedidoId')
        .leftJoinAndMapOne('p.mesa', Mesa, 'm', 'm.id = p.mesaId')
        .leftJoinAndMapOne('p.mesero', Usuario, 'u', 'u.id = p.meseroId')
        .where('f.estado = :estado', { estado: 'EMITIDA' })
        .andWhere('f.createdAt BETWEEN :ini AND :fin', { ini, fin });

    if (metodoPago && ['EFECTIVO', 'TRANSFERENCIA'].includes(metodoPago)) {
        qb.andWhere('f.metodoPago = :mp', { mp: metodoPago });
    }

    const facturas = await qb
        .select([
        'f.id AS facturaId',
        'f.numero AS numero',
        'f.createdAt AS createdAt',
        'f.metodoPago AS metodoPago',
        'f.total AS total',
        'f.propinaMonto AS propina',
        'm.numero AS mesaNumero',
        'u.nombre AS meseroNombre',
        ])
        .orderBy('f.createdAt', 'ASC')
        .getRawMany<{
        facturaId: number;
        numero: string;
        createdAt: Date;
        metodoPago: 'EFECTIVO' | 'TRANSFERENCIA';
        total: string;
        propina: string;
        mesaNumero: number | null;
        meseroNombre: string | null;
        }>();

    const rows: ReporteVentasRow[] = facturas.map((f) => {
        const fechaIso = f.createdAt.toISOString();
        const fecha = fechaIso.slice(0, 10);
        const hora = fechaIso.slice(11, 16);

        return {
        facturaId: f.facturaId,
        numero: f.numero,
        fecha,
        hora,
        mesaNumero: f.mesaNumero ?? null,
        meseroNombre: f.meseroNombre ?? null,
        metodoPago: f.metodoPago,
        total: Number(f.total),
        propina: Number(f.propina),
        };
    });

    const totalFacturas = rows.length;
    const totalFacturado = rows.reduce((acc, r) => acc + r.total, 0);
    const totalPropina = rows.reduce((acc, r) => acc + r.propina, 0);
    const ticketPromedio = totalFacturas > 0 ? totalFacturado / totalFacturas : 0;

    const resp: ReporteVentasResponse = {
        fechaDesde,
        fechaHasta,
        metodoPago: metodoPago || null,
        totalFacturado,
        totalPropina,
        totalFacturas,
        ticketPromedio,
        rows,
    };

    return resp;
}

/**
 * Reporte de productos vendidos en un rango de fechas.
 * Se basa en FacturaItem (lineas facturadas) + Factura (fecha / estado) + Producto.
 */
export async function buildReporteProductosData(req: Request): Promise<ReporteProductosResponse> {
    const ds = AppDataSource;
    const fiRepo = ds.getRepository(FacturaItem);

    const { fechaDesde, fechaHasta } = parseRangoFechas(req);
    const ini = new Date(`${fechaDesde}T00:00:00.000Z`);
    const fin = new Date(`${fechaHasta}T23:59:59.999Z`);

    const qb = fiRepo
        .createQueryBuilder('fi')
        .innerJoin(Factura, 'f', 'f.id = fi.facturaId')
        .innerJoin(PedidoItem, 'pi', 'pi.id = fi.pedidoItemId')
        .innerJoin(Producto, 'pr', 'pr.id = pi.productoId')
        .innerJoin(TipoProducto, 'tp', 'pr.tipoProductoId = tp.id')
        .where('f.estado = :estado', { estado: 'EMITIDA' })
        .andWhere('f.createdAt BETWEEN :ini AND :fin', { ini, fin });

    // si algún día quieres filtrar por categoría de producto, aquí va:
    // const { categoriaId } = req.query as { categoriaId?: string };
    // if (categoriaId) qb.andWhere('pr.categoriaId = :cat', { cat: Number(categoriaId) });

    const raw = await qb
        .select('pr.id', 'productoId')
        .addSelect('pr.nombre', 'nombre')
        .addSelect('tp.nombre', 'categoriaNombre')
        .addSelect('SUM(fi.cantidad)', 'cantidadVendida')
        .addSelect('SUM(fi.cantidad * fi.precioUnitario)', 'totalVendido')
        .groupBy('pr.id')
        .addGroupBy('pr.nombre')
        .orderBy('totalVendido', 'DESC')
        .getRawMany<{
        productoId: number;
        nombre: string;
        categoriaNombre: string;
        cantidadVendida: string;
        totalVendido: string;
        }>();

    const rows: ReporteProductosRow[] = raw.map((r) => ({
        productoId: r.productoId,
        nombre: r.nombre,
        categoriaNombre: r.categoriaNombre,
        cantidadVendida: Number(r.cantidadVendida ?? 0),
        totalVendido: Number(r.totalVendido ?? 0),
    }));

    const totalCantidad = rows.reduce((acc, r) => acc + r.cantidadVendida, 0);
    const totalMonto = rows.reduce((acc, r) => acc + r.totalVendido, 0);

    return {
        fechaDesde,
        fechaHasta,
        totalCantidad,
        totalMonto,
        rows,
    };
}


/**
 * Reporte de rendimiento por mesero (basado en facturas emitidas).
 */
export async function buildReporteMeserosData(req: Request): Promise<ReporteMeserosResponse> {
    const ds = AppDataSource;
    const facturaRepo = ds.getRepository(Factura);

    const { fechaDesde, fechaHasta } = parseRangoFechas(req);
    const ini = new Date(`${fechaDesde}T00:00:00.000Z`);
    const fin = new Date(`${fechaHasta}T23:59:59.999Z`);

    const { meseroId } = req.query as { meseroId?: string };

    const qb = facturaRepo
        .createQueryBuilder('f')
        .innerJoin(Pedido, 'p', 'p.id = f.pedidoId')
        .innerJoin(Usuario, 'u', 'u.id = p.meseroId')
        .where('f.estado = :estado', { estado: 'EMITIDA' })
        .andWhere('f.createdAt BETWEEN :ini AND :fin', { ini, fin });

    if (meseroId) {
        qb.andWhere('u.id = :mid', { mid: Number(meseroId) });
    }

    const raw = await qb
        .select('u.id', 'meseroId')
        .addSelect('u.nombre', 'meseroNombre')
        .addSelect('COUNT(DISTINCT f.pedidoId)', 'cantidadPedidos')
        .addSelect('SUM(f.total)', 'totalFacturado')
        .addSelect('SUM(f.propinaMonto)', 'totalPropina')
        .groupBy('u.id')
        .addGroupBy('u.nombre')
        .orderBy('totalFacturado', 'DESC')
        .getRawMany<{
        meseroId: number;
        meseroNombre: string;
        cantidadPedidos: string;
        totalFacturado: string;
        totalPropina: string;
        }>();

    const rows: ReporteMeserosRow[] = raw.map((r) => {
        const cantidadPedidos = Number(r.cantidadPedidos ?? 0);
        const totalFacturado = Number(r.totalFacturado ?? 0);
        const totalPropina = Number(r.totalPropina ?? 0);
        const ticketPromedio = cantidadPedidos > 0 ? totalFacturado / cantidadPedidos : 0;

        return {
        meseroId: r.meseroId,
        meseroNombre: r.meseroNombre,
        cantidadPedidos,
        totalFacturado,
        totalPropina,
        ticketPromedio,
        };
    });

    const totalFacturado = rows.reduce((acc, r) => acc + r.totalFacturado, 0);
    const totalPropina = rows.reduce((acc, r) => acc + r.totalPropina, 0);
    const totalPedidos = rows.reduce((acc, r) => acc + r.cantidadPedidos, 0);

    return {
        fechaDesde,
        fechaHasta,
        totalFacturado,
        totalPropina,
        totalPedidos,
        rows,
    };
}

