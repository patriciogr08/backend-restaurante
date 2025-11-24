// src/modules/admin/controllers/admin-dashboard.controller.ts
import { Request, Response } from 'express';
import {
  AdminDashboardResponse,
  KpisDashboard,
  MetodoPagoResumen,
  PedidoCobrado,
  PedidoDemorado,
  TopProducto,
  VentaPorHora,
} from '../types/admin-dashboard';
import { AppDataSource } from '../config/data-source';
import { Pedido } from '../domain/entities/Pedido';
import { Factura } from '../domain/entities/Factura';
import { Mesa } from '../domain/entities/Mesa';
import { PedidoItem } from '../domain/entities/PedidoItem';

export async function getAdminDashboard(req: Request, res: Response) {
    try {
        const ds = AppDataSource;

        const { fecha, desde, hasta } = req.query as {
            fecha?: string;
            desde?: string;
            hasta?: string;
        };

        let fechaDesde: string;
        let fechaHasta: string;

        if (desde || hasta) {
            // RANGO
            const d = (desde || hasta)!;
            const h = (hasta || desde)!;

            // normalizar para que desde <= hasta
            if (d <= h) {
                fechaDesde = d;
                fechaHasta = h;
            } else {
                fechaDesde = h;
                fechaHasta = d;
            }
        } else {
            // SOLO DÍA (por defecto hoy)
            const hoy = new Date().toISOString().slice(0, 10);
            const f = fecha || hoy;
            fechaDesde = f;
            fechaHasta = f;
        }

        const dayStart = new Date(`${fechaDesde}T00:00:00.000Z`);
        const dayEnd = new Date(`${fechaHasta}T23:59:59.999Z`);

        const pedidoRepo = ds.getRepository(Pedido);
        const facturaRepo = ds.getRepository(Factura);
        const mesaRepo = ds.getRepository(Mesa);

        // ===== 2) KPIs =====

        // 2.1 Ventas totales del día (facturas EMITIDAS hoy)
        const ventasRow = await facturaRepo
        .createQueryBuilder('f')
        .select('COALESCE(SUM(f.total), 0)', 'total')
        .where('f.estado = :estado', { estado: 'EMITIDA' })
        .andWhere('f.createdAt BETWEEN :ini AND :fin', { ini: dayStart, fin: dayEnd })
        .getRawOne<{ total: string }>();

        const totalVentasDia = Number(ventasRow?.total ?? 0);

        // 2.2 Conteo de pedidos por estado (hoy)
        const pedidosEstadoRows = await pedidoRepo
        .createQueryBuilder('p')
        .select('p.estado', 'estado')
        .addSelect('COUNT(*)', 'cantidad')
        .where('p.createdAt BETWEEN :ini AND :fin', { ini: dayStart, fin: dayEnd })
        .groupBy('p.estado')
        .getRawMany<{ estado: string; cantidad: string }>();

        const pedidosPorEstado: Record<string, number> = {
        EN_PROCESO: 0,
        DESPACHADO: 0,
        COBRADO: 0,
        CANCELADO: 0,
        };
        let totalPedidosDia = 0;
        for (const row of pedidosEstadoRows) {
        const est = row.estado as keyof typeof pedidosPorEstado;
        const cant = Number(row.cantidad);
        pedidosPorEstado[est] = cant;
        totalPedidosDia += cant;
        }

        // 2.3 Ticket promedio (pedidos cobrados/despachados de hoy)
        const ticketRow = await pedidoRepo
        .createQueryBuilder('p')
        .select('COALESCE(AVG(p.total), 0)', 'promedio')
        .where('p.createdAt BETWEEN :ini AND :fin', { ini: dayStart, fin: dayEnd })
        .andWhere('p.estado IN (:...estados)', { estados: ['DESPACHADO', 'COBRADO'] })
        .getRawOne<{ promedio: string }>();
        const ticketPromedio = Number(ticketRow?.promedio ?? 0);

        // 2.4 Ocupación de mesas (estado actual)
        const mesasRows = await mesaRepo
        .createQueryBuilder('m')
        .select('m.ocupacion', 'ocupacion')
        .addSelect('COUNT(*)', 'cantidad')
        .groupBy('m.ocupacion')
        .getRawMany<{ ocupacion: string; cantidad: string }>();

        let mesasOcupadas = 0;
        let mesasLibres = 0;
        for (const row of mesasRows) {
        const cant = Number(row.cantidad);
        if (row.ocupacion === 'LIBRE') mesasLibres += cant;
        else mesasOcupadas += cant;
        }

        // 2.5 Tiempo promedio de preparación (minutos) para pedidos despachados hoy
        const tiempoRow = await pedidoRepo
        .createQueryBuilder('p')
        .select('AVG(TIMESTAMPDIFF(MINUTE, p.createdAt, p.despachadoAt))', 'promedio')
        .where('p.despachadoAt IS NOT NULL')
        .andWhere('p.createdAt BETWEEN :ini AND :fin', { ini: dayStart, fin: dayEnd })
        .getRawOne<{ promedio: string | null }>();

        const tiempoPromedioPreparacionMin =
        tiempoRow?.promedio !== null && tiempoRow?.promedio !== undefined
            ? Number(tiempoRow.promedio)
            : null;

        const kpis: KpisDashboard = {
        totalVentasDia,
        totalPedidosDia,
        pedidosEnProceso: pedidosPorEstado.EN_PROCESO,
        pedidosDespachados: pedidosPorEstado.DESPACHADO,
        pedidosCobrados: pedidosPorEstado.COBRADO,
        pedidosCancelados: pedidosPorEstado.CANCELADO,
        ticketPromedio,
        mesasOcupadas,
        mesasLibres,
        tiempoPromedioPreparacionMin,
        };

        // ===== 3) Ventas por hora (facturas de hoy) =====
        const ventasHoraRows = await facturaRepo
        .createQueryBuilder('f')
        .select("DATE_FORMAT(f.createdAt, '%H:00')", 'hora')
        .addSelect('SUM(f.total)', 'total')
        .where('f.estado = :estado', { estado: 'EMITIDA' })
        .andWhere('f.createdAt BETWEEN :ini AND :fin', { ini: dayStart, fin: dayEnd })
        .groupBy('hora')
        .orderBy('hora', 'ASC')
        .getRawMany<{ hora: string; total: string }>();

        const ventasPorHora: VentaPorHora[] = ventasHoraRows.map((r) => ({
        hora: r.hora,
        total: Number(r.total),
        }));

        // ===== 4) Top productos (pedidoitem de pedidos de hoy) =====
        const topProductosRows = await ds
        .getRepository(PedidoItem)
        .createQueryBuilder('pi')
        .innerJoin('pi.pedido', 'p')
        .innerJoin('pi.producto', 'pr')
        .select('pi.productoId', 'productoId')
        .addSelect('pr.nombre', 'nombre')
        .addSelect('SUM(pi.cantidad)', 'cantidad')
        .where('p.createdAt BETWEEN :ini AND :fin', { ini: dayStart, fin: dayEnd })
        .groupBy('pi.productoId')
        .addGroupBy('pr.nombre')
        .orderBy('cantidad', 'DESC')
        .limit(10)
        .getRawMany<{ productoId: number; nombre: string; cantidad: string }>();

        const topProductos: TopProducto[] = topProductosRows.map((r) => ({
        productoId: Number(r.productoId),
        nombre: r.nombre,
        cantidad: Number(r.cantidad),
        }));

        // ===== 5) Pedidos demorados (en proceso, más de X minutos) =====
        const MINUTOS_DEMORA = 20;

        const pedidosDemoradosRows = await pedidoRepo
        .createQueryBuilder('p')
        .leftJoin('p.mesa', 'm')
        .leftJoin('p.mesero', 'u')
        .select('p.id', 'id')
        .addSelect('m.numero', 'mesaNumero')
        .addSelect('u.nombre', 'meseroNombre')
        .addSelect('p.total', 'total')
        .addSelect('TIMESTAMPDIFF(MINUTE, p.createdAt, NOW())', 'minutos')
        .where('p.estado = :estado', { estado: 'EN_PROCESO' })
        .andWhere('p.createdAt BETWEEN :ini AND :fin', { ini: dayStart, fin: dayEnd })
        .andWhere('TIMESTAMPDIFF(MINUTE, p.createdAt, NOW()) >= :min', { min: MINUTOS_DEMORA })
        .orderBy('minutos', 'DESC')
        .getRawMany<{
            id: number;
            mesaNumero: number;
            meseroNombre: string | null;
            total: string;
            minutos: string;
        }>();

        const pedidosDemorados: PedidoDemorado[] = pedidosDemoradosRows.map((r) => ({
            id: Number(r.id),
            mesaNumero: Number(r.mesaNumero),
            meseroNombre: r.meseroNombre,
            total: Number(r.total),
            minutosEnProceso: Number(r.minutos),
        }));

        // ===== 6) Últimos pedidos cobrados =====
        const ultimosCobradosRows = await pedidoRepo
        .createQueryBuilder('p')
        .leftJoin('p.mesa', 'm')
        .select('p.id', 'id')
        .addSelect('m.numero', 'mesaNumero')
        .addSelect('p.total', 'total')
        .addSelect('p.cobradoAt', 'cobradoAt')
        .where('p.estado = :estado', { estado: 'COBRADO' })
        .andWhere('p.cobradoAt IS NOT NULL')
        .andWhere('p.cobradoAt BETWEEN :ini AND :fin', { ini: dayStart, fin: dayEnd })
        .orderBy('p.cobradoAt', 'DESC')
        .limit(10)
        .getRawMany<{ id: number; mesaNumero: number; total: string; cobradoAt: Date }>();

        const ultimosCobrados: PedidoCobrado[] = ultimosCobradosRows.map((r) => ({
        id: Number(r.id),
        mesaNumero: Number(r.mesaNumero),
        total: Number(r.total),
        cobradoAt: r.cobradoAt.toISOString(),
        }));

        // ===== 7) Métodos de pago & propina total =====
        const metodosRows = await facturaRepo
        .createQueryBuilder('f')
        .select('f.metodoPago', 'metodo')
        .addSelect('SUM(f.total)', 'total')
        .where('f.estado = :estado', { estado: 'EMITIDA' })
        .andWhere('f.createdAt BETWEEN :ini AND :fin', { ini: dayStart, fin: dayEnd })
        .groupBy('f.metodoPago')
        .getRawMany<{ metodo: 'EFECTIVO' | 'TRANSFERENCIA'; total: string }>();

        const metodosPago: MetodoPagoResumen[] = metodosRows.map((r) => ({
        metodo: r.metodo,
        total: Number(r.total),
        }));

        const propinaRow = await facturaRepo
        .createQueryBuilder('f')
        .select('COALESCE(SUM(f.propinaMonto), 0)', 'propina')
        .where('f.estado = :estado', { estado: 'EMITIDA' })
        .andWhere('f.createdAt BETWEEN :ini AND :fin', { ini: dayStart, fin: dayEnd })
        .getRawOne<{ propina: string }>();

        const propinaTotal = Number(propinaRow?.propina ?? 0);

        const response: AdminDashboardResponse = {
            fechaDesde,
            fechaHasta,
            kpis,
            ventasPorHora,
            topProductos,
            pedidosDemorados,
            ultimosCobrados,
            metodosPago,
            propinaTotal,
        };

        return res.json(response);
    } catch (err) {
        console.error('[ADMIN][Dashboard] Error en getAdminDashboard', err);
        return res.status(500).json({ message: 'Error al obtener dashboard admin' });
    }
}
