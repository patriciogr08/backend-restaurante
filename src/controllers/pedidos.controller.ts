// src/controllers/pedidos-mesero.controller.ts (o como lo tengas)
import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/data-source';
import { Pedido } from '../domain/entities/Pedido';
import { PedidoItem } from '../domain/entities/PedidoItem';
import { Producto } from '../domain/entities/Producto';
import { lineTotal, r2, uid, logAudit } from '../utils/common';
import { getIvaVigentePercent } from '../services/fiscal.service';
import { PedidoEvents } from '../events/pedido-events';

const pedidoRepo = () => AppDataSource.getRepository(Pedido);
const itemRepo   = () => AppDataSource.getRepository(PedidoItem);
const prodRepo   = () => AppDataSource.getRepository(Producto);

/**
 * Middleware: valida que el pedido exista, pertenezca al mesero y esté EN_PROCESO
 * Deja el pedido en req.pedido para reutilizar en los handlers.
 */
export async function ensurePedidoEditable(req: Request, res: Response, next: NextFunction) {
    const id = Number(req.params.id);

    const p = await pedidoRepo().findOne({ where: { id } });
    if (!p) return res.status(404).json({ message: 'Pedido no encontrado' });

    if (p.meseroId !== uid(req)) {
        return res.status(403).json({ message: 'No autorizado' });
    }

    if (p.estado !== 'EN_PROCESO') {
        return res.status(400).json({ message: 'Pedido no editable' });
    }

    (req as any).pedido = p;
    next();
}

/** Lista de pedidos EN_PROCESO del mesero autenticado */
export async function listMisPedidos(req: Request, res: Response) {
const { estado } = req.query as { estado?: string };

    // Estados que queremos mostrar en "Mis pedidos"
    const estadosPermitidos = ['EN_PROCESO', 'DESPACHADO'];

    let estadoFiltro: string | null = null;
    if (estado && estadosPermitidos.includes(estado)) {
        estadoFiltro = estado;
    }

    // Rango de HOY (00:00:00.000 - 23:59:59.999)
    const ahora = new Date();
    const desde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
    const hasta = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);

    const qb = pedidoRepo()
        .createQueryBuilder('p')
        .select([
            'p.id',
            'p.mesaId',
            'p.subtotal',
            'p.ivaMonto',
            'p.total',
            'p.createdAt',
            'p.estado',
        ])
        .where('p.meseroId = :meseroId', { meseroId: uid(req) })
        // .andWhere('p.createdAt BETWEEN :desde AND :hasta', { desde, hasta });

    if (estadoFiltro) {
        qb.andWhere('p.estado = :estado', { estado: estadoFiltro });
    } 

    const rows = await qb.orderBy('p.createdAt', 'DESC').getMany();
    res.json(rows);
}


/** Obtener un pedido del mesero con sus items */
export async function getPedido(req: Request, res: Response) {
    const id = Number(req.params.id);

    const p = await pedidoRepo().findOne({
        where: { id, meseroId: uid(req) },
        relations: { items: {
            producto: true
        } },
    });

    if (!p) return res.status(404).json({ message: 'Pedido no encontrado' });

    res.json(p);
}

/**
 * Agregar item a un pedido EN_PROCESO.
 * Por defecto se considera isExtra = true (viene después del carrito).
 */
export async function addPedidoItem(req: Request, res: Response) {
    const p: Pedido = (req as any).pedido;

    const pr = await prodRepo().findOne({ where: { id: req.body.productoId } });
    if (!pr) return res.status(400).json({ message: 'Producto inválido' });

    const isExtra = req.body.isExtra !== undefined ? !!req.body.isExtra : true; // por defecto extra
    const tieneDescuento = !!req.body.tieneDescuento;

    const it = itemRepo().create({
        pedidoId: p.id,
        productoId: pr.id,
        precioUnitario: Number(pr.precio),
        cantidad: Number(req.body.cantidad),
        notas: req.body.notas ?? null,
        isExtra,
        tieneDescuento,
        descuentoPorcentaje: Number(req.body.descuentoPorcentaje || 0),
        descuentoValor: Number(req.body.descuentoValor || 0),
    });

    // inyectamos el producto para que el evento pueda usar el nombre
    (it as any).producto = pr;

    await itemRepo().save(it);
    await recomputeTotals(p.id);

    // recargamos el pedido para tener totales/estado actualizados
    const pRefrescado = await pedidoRepo().findOne({ where: { id: p.id } });
    if (pRefrescado) {
        // 🔔 si es extra, evento específico
        if (it.isExtra) {
            PedidoEvents.emitItemExtra(pRefrescado, it);
        }
        // 🔔 cambiaron los ítems
        PedidoEvents.emitItemsCambiados(pRefrescado);

        // 🔔 totales / estado del pedido actualizados
        PedidoEvents.emitActualizado(pRefrescado);
    }

    await logAudit(uid(req), 'PedidoItem', it.id, 'CREAR', null, it);
    res.status(201).json(it);
}

/** Editar item de un pedido EN_PROCESO */
export async function editPedidoItem(req: Request, res: Response) {
    const p: Pedido = (req as any).pedido;
    const itemId = Number(req.params.itemId);

    const it = await itemRepo().findOne({ where: { id: itemId, pedidoId: p.id } });
    if (!it) return res.status(404).json({ message: 'Item no encontrado' });

    const antes = { ...it };
    const b = req.body;

    if (b.cantidad !== undefined) it.cantidad = Number(b.cantidad);
    if (b.notas !== undefined) it.notas = b.notas ?? null;
    if (b.isExtra !== undefined) it.isExtra = !!b.isExtra;
    if (b.tieneDescuento !== undefined) it.tieneDescuento = !!b.tieneDescuento;
    if (b.descuentoPorcentaje !== undefined) {
        it.descuentoPorcentaje = Number(b.descuentoPorcentaje || 0).toString();
    }
    if (b.descuentoValor !== undefined) {
        it.descuentoValor = Number(b.descuentoValor || 0).toString();
    }

    await itemRepo().save(it);
    await recomputeTotals(p.id);

    const pRefrescado = await pedidoRepo().findOne({ where: { id: p.id } });
    if (pRefrescado) {
        // 🔔 cambiaron los ítems (cantidad, notas, descuentos, etc.)
        PedidoEvents.emitItemsCambiados(pRefrescado);
        // 🔔 totales / estado actualizados
        PedidoEvents.emitActualizado(pRefrescado);
    }

    await logAudit(uid(req), 'PedidoItem', it.id, 'EDITAR', antes, it);
    res.json(it);
}

/** Eliminar item de un pedido EN_PROCESO */
export async function removePedidoItem(req: Request, res: Response) {
    const p: Pedido = (req as any).pedido;
    const itemId = Number(req.params.itemId);

    const it = await itemRepo().findOne({ where: { id: itemId, pedidoId: p.id } });
    if (!it) return res.status(404).json({ message: 'Item no encontrado' });

    await itemRepo().delete({ id: it.id });
    await recomputeTotals(p.id);
    
    const pRefrescado = await pedidoRepo().findOne({ where: { id: p.id } });
    if (pRefrescado) {
        // 🔔 items cambiaron (uno menos)
        PedidoEvents.emitItemsCambiados(pRefrescado);
        // 🔔 totales / estado actualizados
        PedidoEvents.emitActualizado(pRefrescado);
    }

    await logAudit(uid(req), 'PedidoItem', it.id, 'ELIMINAR', it, null);
    res.json({ ok: true });
}


export async function transferirPedido(req: Request, res: Response) {
    const id = Number(req.params.id);
    const p = await pedidoRepo().findOne({ where: { id } });
    if (!p) return res.status(404).json({ message: 'Pedido no encontrado' });

    if (p.meseroId !== uid(req)) {
        return res.status(403).json({ message: 'No autorizado' });
    }

    if (p.estado !== 'EN_PROCESO') {
        return res.status(400).json({ message: 'Solo se pueden transferir pedidos EN_PROCESO' });
    }

    const nuevoMeseroId = Number(req.body.meseroId);
    if (!nuevoMeseroId) {
        return res.status(400).json({ message: 'meseroId requerido' });
    }

    const antes = { ...p };
    p.meseroId = nuevoMeseroId;
    

    await pedidoRepo().save(p);

    await logAudit(uid(req), 'Pedido', p.id, 'TRANSFERIR', antes, { meseroId: p.meseroId });

    res.json({ id: p.id, meseroId: p.meseroId });
}



/**
 * Recalcula subtotal, ivaMonto y total de un pedido
 * usando el ivaPercent del pedido si existe; si no, consulta el vigente.
 */
async function recomputeTotals(pedidoId: number) {
    const p = await pedidoRepo().findOne({
        where: { id: pedidoId },
        relations: { items: true },
    });

    if (!p) return;

    // Si ya hay ivaPercent en el pedido, lo respetamos; si no, usamos el vigente
    const ivaPercent = p.ivaPercent
        ? Number(p.ivaPercent)
        : Number(await getIvaVigentePercent());

    const subtotal = r2(
        (p.items || []).reduce(
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

    p.ivaPercent = ivaPercent.toString();
    p.subtotal   = subtotal.toString();
    p.ivaMonto   = ivaMonto.toString();
    p.total      = total.toString();

    await pedidoRepo().save(p);
}
