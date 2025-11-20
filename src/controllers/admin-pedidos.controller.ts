import { Request, Response } from 'express';
import { Between, In, QueryRunner } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { FacturaItem } from '../domain/entities/FacturaItem';
import { Pedido } from '../domain/entities/Pedido';
import { AdminPedidoDTO, AdminPedidoItemDTO } from '../types/admin-pedido';
import { Factura } from '../domain/entities/Factura';
import { PedidoEvents } from '../events/pedido-events';
import { Mesa } from '../domain/entities/Mesa';

type EstadoFront = 'en_proceso' | 'despachados' | 'cobrados' | 'cancelados';

function mapEstadoFrontToDb(estado: EstadoFront): Pedido['estado'] {
  switch (estado) {
    case 'en_proceso':
      return 'EN_PROCESO';
    case 'despachados':
      return 'DESPACHADO';
    case 'cobrados':
      return 'COBRADO';
    case 'cancelados':
      return 'CANCELADO';
    default:
      return 'EN_PROCESO';
  }
}

function getTodayRange() {
    const now = new Date();
    const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0, 0, 0, 0
    );
    const end = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0, 0, 0, 0
    );
    return { start, end };
}

/**
 * Map con cantidad facturada (solo facturas EMITIDAS) por pedidoItemId
 */
async function buildFacturadoMap(pedidoItemIds: number[]) {
    if (!pedidoItemIds.length) return new Map<number, number>();

    const fiRepo = AppDataSource.getRepository(FacturaItem);

    const rows = await fiRepo
        .createQueryBuilder('fi')
        .innerJoin('fi.factura', 'f')
        .where('fi.pedidoItemId IN (:...ids)', { ids: pedidoItemIds })
        .andWhere('f.estado = :estado', { estado: 'EMITIDA' })
        .select('fi.pedidoItemId', 'pedidoItemId')
        .addSelect('SUM(fi.cantidad)', 'facturado')
        .groupBy('fi.pedidoItemId')
        .getRawMany();

    const map = new Map<number, number>();
    for (const r of rows) {
        map.set(Number(r.pedidoItemId), Number(r.facturado));
    }
    return map;
}

/**
 * GET /api/admin/pedidos?estado=en_proceso|despachados|cobrados|cancelados
 * Pedidos del día actual + info de facturación por item.
 */
export async function listarPedidosAdmin(req: Request, res: Response) {
    try {
        const estadoFront = (req.query.estado as EstadoFront) || 'en_proceso';
        const estadoDb = mapEstadoFrontToDb(estadoFront);
        const { start, end } = getTodayRange();

        const pedidoRepo = AppDataSource.getRepository(Pedido);

        const pedidos = await pedidoRepo.find({
                            where: {
                                estado: estadoDb,
                                // createdAt: Between(start, end),
                            },
                            relations: ['mesa', 'mesero', 'items', 'items.producto'],
                            order: { createdAt: 'DESC' },
                            });

        if (!pedidos.length) {
            return res.json([] as AdminPedidoDTO[]);
        }

        // todos los ids de pedidoitem
        const allItemIds = pedidos.flatMap((p) => p.items.map((it) => it.id));
        const facturadoMap = await buildFacturadoMap(allItemIds);

        const data: AdminPedidoDTO[] = pedidos.map((p) => {
        const items: AdminPedidoItemDTO[] = p.items.map((it) => {
            const facturado = facturadoMap.get(it.id) ?? 0;
            const pendiente = it.cantidad - facturado;

            return {
                id: it.id,
                productoId: it.productoId,
                nombre: it.producto.nombre,
                cantidad: it.cantidad,
                nota: it.notas ?? null,
                isExtra: it.isExtra,
                facturado,
                pendiente,
            };
        });

        const itemsPendientes = items.filter((i) => i.pendiente > 0).length;
        const facturadoTotal = itemsPendientes === 0 && items.length > 0;
        const facturadoParcial =
            !facturadoTotal && items.some((i) => i.facturado > 0);

        return {
            id: p.id,
            mesaId: p.mesaId,
            mesaNumero: p.mesa.numero,
            meseroId: p.meseroId,
            meseroNombre: `${p.mesero.nombre}`.trim(),
            total: Number(p.total),
            createdAt: p.createdAt.toISOString(),
            estadoPedido: p.estado,
            items,
            itemsCount: items.length,
            itemsPendientes,
            facturadoTotal,
            facturadoParcial,
        };
        });

        return res.json(data);
    } catch (err) {
        console.error('[ADMIN][Pedidos] error en listarPedidosAdmin', err);
        return res.status(500).json({
        message: 'Error al obtener los pedidos del admin',
        });
    }
}


/**
 * POST /api/admin/pedidos/:pedidoId/facturar
 */
/**
 * POST /api/admin/pedidos/:pedidoId/facturar
 */
export async function facturarPedidoAdmin(req: Request, res: Response) {
    const pedidoId = Number(req.params.pedidoId);
    const body = req.body as any;

    if (!pedidoId || Number.isNaN(pedidoId)) {
        return res.status(400).json({ message: 'pedidoId inválido' });
    }

    if (!body.metodoPago || !['EFECTIVO', 'TRANSFERENCIA'].includes(body.metodoPago)) {
        return res.status(400).json({ message: 'Método de pago inválido' });
    }

    const propinaMonto = Number(body.propinaMonto || 0);
    const evidenciaUrl = body.evidenciaUrl ?? null;

    const ds = AppDataSource;
    const qr: QueryRunner = ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
        const pedidoRepo = qr.manager.getRepository(Pedido);
        const facturaRepo = qr.manager.getRepository(Factura);
        const facturaItemRepo = qr.manager.getRepository(FacturaItem);

        const pedido = await pedidoRepo.findOne({
            where: { id: pedidoId },
            relations: ['items', 'items.producto'],
        });

        if (!pedido) {
            await qr.rollbackTransaction();
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        if (pedido.estado === 'CANCELADO') {
            await qr.rollbackTransaction();
            return res.status(400).json({ message: 'El pedido está cancelado' });
        }

        if (pedido.estado === 'COBRADO') {
            await qr.rollbackTransaction();
            return res.status(400).json({ message: 'El pedido ya está cobrado' });
        }

        // Solo permitir facturar si está DESPACHADO (ajusta si quieres permitir EN_PROCESO)
        if (pedido.estado !== 'DESPACHADO') {
            await qr.rollbackTransaction();
            return res.status(400).json({ message: 'Solo se pueden facturar pedidos despachados' });
        }

        const itemsPedido = pedido.items;
        if (!itemsPedido.length) {
            await qr.rollbackTransaction();
            return res.status(400).json({ message: 'El pedido no tiene ítems' });
        }

        // map de facturado por item (solo facturas EMITIDAS existentes)
        const allItemIds = itemsPedido.map((it) => it.id);
        const facturadoMap = await buildFacturadoMap(allItemIds);

        type DetalleAFacturar = {
            item: (typeof itemsPedido)[number];
            cantidad: number;
        };

        const detallesAFacturar: DetalleAFacturar[] = [];

        // ==========================
        // 1) Resolver qué se va a facturar
        // ==========================
        if (!body.items || !body.items.length) {
            // FACTURAR TODO LO PENDIENTE
            for (const it of itemsPedido) {
                const facturado = facturadoMap.get(it.id) ?? 0;
                const pendiente = it.cantidad - facturado;
                if (pendiente > 0) {
                    detallesAFacturar.push({ item: it, cantidad: pendiente });
                }
            }

            if (!detallesAFacturar.length) {
                await qr.rollbackTransaction();
                return res.status(400).json({
                    message: 'El pedido ya está completamente facturado',
                });
            }
        } else {
            // FACTURAR POR ITEMS SEGÚN BODY
            const bodyById = new Map<number, number>();

            for (const bi of body.items) {
                const id = Number(bi.pedidoItemId);
                const cant = Number(bi.cantidad);
                if (!id || Number.isNaN(id) || cant <= 0) continue;

                bodyById.set(id, (bodyById.get(id) ?? 0) + cant);
            }

            if (!bodyById.size) {
                await qr.rollbackTransaction();
                return res.status(400).json({ message: 'No se enviaron items válidos' });
            }

            for (const it of itemsPedido) {
                const solicitar = bodyById.get(it.id);
                if (!solicitar) continue;

                const facturado = facturadoMap.get(it.id) ?? 0;
                const pendiente = it.cantidad - facturado;

                if (solicitar > pendiente) {
                    await qr.rollbackTransaction();
                    return res.status(400).json({
                        message: `La cantidad a facturar del item ${it.id} (${solicitar}) excede lo pendiente (${pendiente})`,
                    });
                }

                detallesAFacturar.push({ item: it, cantidad: solicitar });
            }

            if (!detallesAFacturar.length) {
                await qr.rollbackTransaction();
                return res.status(400).json({
                    message: 'No hay items válidos para facturar',
                });
            }
        }

        // ==========================
        // 2) Calcular totales de la factura
        // ==========================
        let subtotal = 0;
        for (const det of detallesAFacturar) {
            subtotal += Number(det.item.precioUnitario) * det.cantidad;
        }

        const totalFactura = subtotal + propinaMonto;
        const numero = `F-${Date.now()}`; // luego cambias por tu secuencial

        const factura = facturaRepo.create({
            pedidoId: pedido.id,
            numero,
            metodoPago: body.metodoPago,
            propinaMonto,
            total: totalFactura,
            estado: 'EMITIDA',
            evidenciaUrl,
        });

        const facturaGuardada = await facturaRepo.save(factura);

        // Crear items de factura
        for (const det of detallesAFacturar) {
            const fi = facturaItemRepo.create({
                facturaId: facturaGuardada.id,
                pedidoItemId: det.item.id,
                cantidad: det.cantidad,
                precioUnitario: det.item.precioUnitario,
                discountUnit: 0, // por ahora 0, luego puedes calcularlo
            });
            await facturaItemRepo.save(fi);
        }

        // ==========================
        // 3) Evaluar si el pedido queda totalmente facturado
        //    (sin volver a leer BD, usando el mapa inicial + lo recién facturado)
        // ==========================
        const facturadoFinal = new Map<number, number>(facturadoMap);

        for (const det of detallesAFacturar) {
            const prev = facturadoFinal.get(det.item.id) ?? 0;
            facturadoFinal.set(det.item.id, prev + det.cantidad);
        }

        let todoFacturado = true;
        for (const it of itemsPedido) {
            const fact = facturadoFinal.get(it.id) ?? 0;
            if (fact < it.cantidad) {
                todoFacturado = false;
                break;
            }
        }

        if (todoFacturado) {
            pedido.estado = 'COBRADO';
            pedido.cobradoAt = new Date();
            await pedidoRepo.save(pedido);
        }

        await qr.commitTransaction();

        PedidoEvents.emitActualizado(pedido);

        return res.status(201).json({
            message: 'Factura creada correctamente',
            factura: facturaGuardada,
            pedidoActualizado: {
                id: pedido.id,
                estado: pedido.estado,
                cobradoAt: pedido.cobradoAt ?? null,
            },
        });
    } catch (err) {
        console.error('[ADMIN][Pedidos] error en facturarPedidoAdmin', err);
        await qr.rollbackTransaction();
        return res.status(500).json({ message: 'Error al facturar el pedido' });
    } finally {
        await qr.release();
    }
}


/**
 * POST /api/admin/pedidos/:pedidoId/cancelar
 */
export async function cancelarPedidoAdmin(req: Request, res: Response) {
    const pedidoId = Number(req.params.pedidoId);

    if (!pedidoId || Number.isNaN(pedidoId)) {
        return res.status(400).json({ message: 'pedidoId inválido' });
    }

    const ds = AppDataSource;
    const qr = ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
        const pedidoRepo = qr.manager.getRepository(Pedido);
        const mesaRepo   = qr.manager.getRepository(Mesa);
        const facturaRepo = qr.manager.getRepository(Factura);

        const pedido = await pedidoRepo.findOne({
            where: { id: pedidoId },
            relations: ['mesa'],
        });

        if (!pedido) {
            await qr.rollbackTransaction();
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        if (pedido.estado === 'CANCELADO') {
            await qr.rollbackTransaction();
            return res.status(400).json({ message: 'El pedido ya está cancelado' });
        }

        if (pedido.estado === 'COBRADO') {
            await qr.rollbackTransaction();
            return res.status(400).json({ message: 'El pedido ya está cobrado y no puede cancelarse' });
        }

        // Solo permitir cancelar pedidos EN_PROCESO
        if (pedido.estado !== 'EN_PROCESO') {
            await qr.rollbackTransaction();
            return res.status(400).json({ message: 'Solo se pueden cancelar pedidos en proceso' });
        }

        // No permitir cancelar si ya tiene facturas emitidas
        const facturasEmitidas = await facturaRepo.count({
            where: { pedidoId: pedido.id, estado: 'EMITIDA' },
        });

        if (facturasEmitidas > 0) {
            await qr.rollbackTransaction();
            return res.status(400).json({
                message: 'No se puede cancelar un pedido que ya tiene facturas emitidas',
            });
        }

        // Cambiar estado del pedido
        pedido.estado = 'CANCELADO';
        await pedidoRepo.save(pedido);

        // Liberar la mesa (si existe relación)
        if (pedido.mesaId) {
            await mesaRepo.update(
                { id: pedido.mesaId },
                { ocupacion: 'LIBRE' as any }, // ajusta al enum real si es distinto
            );
        }

        await qr.commitTransaction();

        // Emitir por WebSocket
        PedidoEvents.emitActualizado(pedido);

        return res.json({
            message: 'Pedido cancelado y mesa liberada correctamente',
            pedidoActualizado: {
                id: pedido.id,
                estado: pedido.estado,
            },
        });
    } catch (err) {
        console.error('[ADMIN][Pedidos] error en cancelarPedidoAdmin', err);
        await qr.rollbackTransaction();
        return res.status(500).json({ message: 'Error al cancelar el pedido' });
    } finally {
        await qr.release();
    }
}

