// src/controllers/mesas.controller.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Mesa } from '../domain/entities/Mesa';
import { lineTotal, logAudit, r2, uid } from '../utils/common';
import { Carrito } from '../domain/entities/Carrito';
import { CarritoItem } from '../domain/entities/CarritoItem';
import { Producto } from '../domain/entities/Producto';
import { Pedido } from '../domain/entities/Pedido';
import { PedidoItem } from '../domain/entities/PedidoItem';
import { getIvaVigentePercent } from '../services/fiscal.service';
import { PedidoEvents } from '../events/pedido-events';

const mesaRepo       = () => AppDataSource.getRepository(Mesa);
const carritoRepo    = () => AppDataSource.getRepository(Carrito);
const itemRepo       = () => AppDataSource.getRepository(CarritoItem);
const prodRepo       = () => AppDataSource.getRepository(Producto);


/**
 * Lista de mesas para el MESERO.
 *
 * Reglas:
 * - Si la mesa tiene un carrito ACTIVO del mesero actual => puedeEntrarCarrito = true.
 * - Si la mesa tiene un pedido EN_PROCESO del mesero actual => tienePedido = true (no puede abrir).
 * - Si no tiene ni carrito ni pedido => puedeAbrir = true.
 */
export async function listMesasMesero(req: Request, res: Response) {
    const meseroId = uid(req);

    const rows = await mesaRepo()
        .createQueryBuilder('m')
        // carrito ACTIVO del mesero actual
        .leftJoin(Carrito, 'c',
            'c.mesaId = m.id AND c.estado = :carritoEstado AND c.meseroId = :meseroId',
            { carritoEstado: 'ACTIVO', meseroId }
        )
        // pedido EN_PROCESO del mesero actual
        .leftJoin(Pedido, 'p',
            'p.mesaId = m.id AND p.estado = :pedidoEstado AND p.meseroId = :meseroId',
            { pedidoEstado: 'EN_PROCESO', meseroId }
        )
        .select([
            'm.id AS id',
            'm.numero AS numero',
            'm.capacidad AS capacidad',
            'm.ocupacion AS ocupacion',
            'c.id AS carritoId',
            'p.id AS pedidoId',
        ])
        .orderBy('m.numero', 'ASC')
        .getRawMany();

    const mesas = rows.map(r => {
        const carritoId = r.carritoId ? Number(r.carritoId) : null;
        const pedidoId  = r.pedidoId  ? Number(r.pedidoId)  : null;

        const puedeAbrir        = !carritoId && !pedidoId;
        const puedeEntrarCarrito = !!carritoId;
        const tienePedido       = !!pedidoId;

        return {
            id: Number(r.id),
            numero: Number(r.numero),
            capacidad: Number(r.capacidad),
            ocupacion: r.ocupacion as string,
            carritoId,
            pedidoId,
            puedeAbrir,
            puedeEntrarCarrito,
            tienePedido,
        };
    });

    res.json(mesas);
}


/** Abrir mesa -> crea carrito ACTIVO (si LIBRE) y marca mesa OCUPADA */
export async function abrirMesa(req: Request, res: Response) {
    const id = Number(req.params.id);
    const m = await mesaRepo().findOne({ where: { id } });
    if (!m) return res.status(404).json({ message: 'Mesa no encontrada' });
    if (m.ocupacion !== 'LIBRE') return res.status(400).json({ message: 'Mesa no está libre' });

    const c = carritoRepo().create({
        mesaId: m.id,
        meseroId: uid(req),
        estado: 'ACTIVO',
    });
    await carritoRepo().save(c);

    m.ocupacion = 'OCUPADA';
    await mesaRepo().save(m);

    // 🔔 WS: la mesa cambió a OCUPADA
    PedidoEvents.emitMesaActualizada(m);

    await logAudit(uid(req), 'Carrito', c.id, 'CREAR', null, { mesaId: m.id });
    res.status(201).json({ carritoId: c.id, mesaId: m.id });
}


/** Entrar a mesa -> devuelve carrito ACTIVO del mesero (si pertenece) */
export async function getCarritoActivoByMesa(req: Request, res: Response) {
    const id = Number(req.params.id);
    const c = await carritoRepo().findOne({
        where: { mesaId: id, estado: 'ACTIVO' },
        order: { createdAt: 'DESC' }
    });
    if (!c) return res.status(404).json({ message: 'Sin carrito activo' });
    if (c.meseroId !== uid(req)) return res.status(403).json({ message: 'Carrito pertenece a otro mesero' });
    res.json(c);
}

/** Detalle de carrito con items */
export async function getCarrito(req: Request, res: Response) {
    const id = Number(req.params.id);
    const c = await carritoRepo().findOne({
        where: { id },
        relations: { items:  {
                producto: true // Incluir la relación con productos
            } 
        }
    });
    if (!c) return res.status(404).json({ message: 'Carrito no encontrado' });
    if (c.meseroId !== uid(req)) return res.status(403).json({ message: 'No autorizado' });
    res.json(c);
}

/** Agregar item al carrito (SIN isExtra, es base del pedido) */
export async function addCarritoItem(req: Request, res: Response) {
    const id = Number(req.params.id);
    const c = await carritoRepo().findOne({ where: { id, estado: 'ACTIVO' } });
    if (!c) return res.status(404).json({ message: 'Carrito no encontrado' });
    if (c.meseroId !== uid(req)) return res.status(403).json({ message: 'No autorizado' });

    const p = await prodRepo().findOne({ where: { id: req.body.productoId } });
    if (!p) return res.status(400).json({ message: 'Producto inválido' });

    const it = itemRepo().create({
        carritoId: c.id,
        productoId: p.id,
        precioUnitario: Number(p.precio),
        cantidad: Number(req.body.cantidad),
        notas: req.body.notas ?? null,
        tieneDescuento: !!req.body.tieneDescuento,
        descuentoPorcentaje: Number(req.body.descuentoPorcentaje || 0),
        descuentoValor: Number(req.body.descuentoValor || 0),
    });
    await itemRepo().save(it);

    await logAudit(uid(req), 'CarritoItem', it.id, 'CREAR', null, it);
    res.status(201).json(it);
}

/** Editar item (SIN isExtra) */
export async function editCarritoItem(req: Request, res: Response) {
    const id = Number(req.params.id);
    const itemId = Number(req.params.itemId);

    const c = await carritoRepo().findOne({ where: { id, estado: 'ACTIVO' } });
    if (!c) return res.status(404).json({ message: 'Carrito no encontrado' });
    if (c.meseroId !== uid(req)) return res.status(403).json({ message: 'No autorizado' });

    const it = await itemRepo().findOne({ where: { id: itemId, carritoId: c.id } });
    if (!it) return res.status(404).json({ message: 'Item no encontrado' });

    const antes = { ...it };
    const b = req.body;

    if (b.cantidad !== undefined) it.cantidad = Number(b.cantidad);
    if (b.notas !== undefined) it.notas = b.notas ?? null;
    if (b.tieneDescuento !== undefined) it.tieneDescuento = !!b.tieneDescuento;
    if (b.descuentoPorcentaje !== undefined) {
        it.descuentoPorcentaje = String(Number(b.descuentoPorcentaje || 0));
    }
    if (b.descuentoValor !== undefined) {
        it.descuentoValor = String(Number(b.descuentoValor || 0));
    }

    await itemRepo().save(it);
    await logAudit(uid(req), 'CarritoItem', it.id, 'EDITAR', antes, it);
    res.json(it);
}

/** Eliminar item del carrito */
export async function removeCarritoItem(req: Request, res: Response) {
    const id = Number(req.params.id);
    const itemId = Number(req.params.itemId);

    const c = await carritoRepo().findOne({ where: { id, estado: 'ACTIVO' } });
    if (!c) return res.status(404).json({ message: 'Carrito no encontrado' });
    if (c.meseroId !== uid(req)) return res.status(403).json({ message: 'No autorizado' });

    const it = await itemRepo().findOne({ where: { id: itemId, carritoId: c.id } });
    if (!it) return res.status(404).json({ message: 'Item no encontrado' });

    await itemRepo().delete({ id: it.id });
    await logAudit(uid(req), 'CarritoItem', it.id, 'ELIMINAR', it, null);
    res.json({ ok: true });
}

/** Enviar a cocina: convierte Carrito -> Pedido EN_PROCESO; isExtra = 0 en todos */
export async function enviarACocina(req: Request, res: Response) {
    const id = Number(req.params.id);
    const c = await carritoRepo().findOne({
        where: { id, estado: 'ACTIVO' },
        relations: { items: true }
    });

    if (!c) return res.status(404).json({ message: 'Carrito no encontrado' });
    if (c.meseroId !== uid(req)) return res.status(403).json({ message: 'No autorizado' });
    if (!c.items || c.items.length === 0) {
        return res.status(400).json({ message: 'Carrito vacío' });
    }

    const ivaPercent = await getIvaVigentePercent();

    try {
        const { pedido, mesa } = await AppDataSource.transaction(async (manager) => {
            const pedidoRepoTx     = manager.getRepository(Pedido);
            const pedidoItemRepoTx = manager.getRepository(PedidoItem);
            const itemRepoTx       = manager.getRepository(CarritoItem);
            const mesaRepoTx       = manager.getRepository(Mesa);
            const carritoRepoTx    = manager.getRepository(Carrito);

            const subtotal = r2(
                c.items.reduce(
                    (acc, it) =>
                        acc +
                        lineTotal(
                            Number(it.precioUnitario),
                            it.cantidad,
                            !!it.tieneDescuento,
                            Number(it.descuentoPorcentaje),
                            Number(it.descuentoValor)
                        ),
                    0
                )
            );
            const ivaMonto = r2(subtotal * (ivaPercent / 100));
            const total    = r2(subtotal + ivaMonto);

            const p = pedidoRepoTx.create({
                mesaId: c.mesaId,
                meseroId: c.meseroId,
                estado: 'EN_PROCESO',
                ivaPercent,
                subtotal,
                ivaMonto,
                total,
            });

            await pedidoRepoTx.save(p);

            for (const it of c.items) {
                const pi = pedidoItemRepoTx.create({
                    pedidoId: p.id,
                    productoId: it.productoId,
                    precioUnitario: Number(it.precioUnitario),
                    cantidad: it.cantidad,
                    notas: it.notas ?? null,
                    tieneDescuento: !!it.tieneDescuento,
                    descuentoPorcentaje: Number(it.descuentoPorcentaje || 0),
                    descuentoValor: Number(it.descuentoValor || 0),
                    isExtra: 0, // todos base
                });
                await pedidoItemRepoTx.save(pi);
            }

            // limpiar carrito
            await carritoRepoTx.delete({ id: c.id });

            // actualizar mesa a OCUPADA
            let m = await mesaRepoTx.findOne({ where: { id: c.mesaId } });
            if (m) {
                m.ocupacion = 'OCUPADA';
                await mesaRepoTx.save(m);
            }

            await logAudit(
                uid(req),
                'Pedido',
                p.id,
                'CREAR_DESDE_CARRITO',
                { carritoId: c.id },
                { pedidoId: p.id }
            );

            return { pedido: p, mesa: m };
        });

        PedidoEvents.emitCreado(pedido);

        if (mesa) {
            PedidoEvents.emitMesaActualizada(mesa);
        }

        return res.status(201).json(pedido);
    } catch (error: any) {
        console.error('Error enviarACocina', error);
        return res.status(500).json({ message: 'Error al enviar carrito a cocina' });
    }
}

export async function limpiarCarrito(req: Request, res: Response) {
    const id = Number(req.params.id);

    const c = await carritoRepo().findOne({ where: { id } });
    if (!c) return res.status(404).json({ message: 'Carrito no encontrado' });
    if (c.meseroId !== uid(req)) {
        return res.status(403).json({ message: 'No autorizado' });
    }
    if (c.estado !== 'ACTIVO') {
        return res.status(400).json({ message: 'Solo se puede limpiar un carrito ACTIVO' });
    }

    await AppDataSource.transaction(async (manager) => {
        const carritoTx = manager.getRepository(Carrito);
        const itemTx    = manager.getRepository(CarritoItem);
        const mesaTx    = manager.getRepository(Mesa);

        const antes = { ...c };

        // Eliminar items del carrito
        await itemTx.delete({ carritoId: c.id });

        // Eliminar carrito
        await carritoTx.delete({ id: c.id });

        // Poner mesa en LIBRE
        const m = await mesaTx.findOne({ where: { id: c.mesaId } });
        if (m) {
            m.ocupacion = 'LIBRE';
            await mesaTx.save(m);
            PedidoEvents.emitMesaActualizada(m);
        }

        await logAudit(uid(req), 'Carrito', c.id, 'LIMPIAR', antes, null);
    });

    return res.json({ ok: true });
}
