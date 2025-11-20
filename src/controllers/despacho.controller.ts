// src/controllers/despacho.controller.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Pedido } from '../domain/entities/Pedido';
import { Between } from 'typeorm';
import { Mesa } from '../domain/entities/Mesa';
import { PedidoEvents } from '../events/pedido-events';
import { buildPedidoDespachoDto } from '../utils/pedido-mapper';

const pedidoRepo = () => AppDataSource.getRepository(Pedido);

/**
 * GET /api/despachador/pedidos
 * Devuelve pedidos EN_PROCESO y DESPACHADO de HOY
 * {
 *   enProceso: PedidoDespachoDto[],
 *   despachados: PedidoDespachoDto[]
 * }
 */
export async function listPedidosDespacho(req: Request, res: Response) {
  try {
    const ahora = new Date();
    const desde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
    const hasta = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);

    // Si más adelante quieres filtrar por sucursal:
    // const sucursalId = (req as any).user.sucursalId;

    const baseWhere = {
      // createdAt: Between(desde, hasta),
      // sucursalId
    };

    const [enProceso, despachados] = await Promise.all([
      pedidoRepo().find({
        where: { ...baseWhere, estado: 'EN_PROCESO' },
        relations: { items: { producto: true }, mesa: true, mesero: true },
        order: { createdAt: 'ASC' },
      }),
      pedidoRepo().find({
        where: { ...baseWhere, estado: 'DESPACHADO' },
        relations: { items: { producto: true }, mesa: true, mesero: true },
        order: { createdAt: 'DESC' },
      }),
    ]);

    res.json({
      enProceso: enProceso.map(buildPedidoDespachoDto),
      despachados: despachados.map(buildPedidoDespachoDto),
    });
  } catch (err) {
    console.error('Error listPedidosDespacho:', err);
    res.status(500).json({ message: 'Error obteniendo pedidos para despacho' });
  }
}

/**
 * POST /api/despachador/pedidos/:id/despachar
 * Marca un pedido EN_PROCESO como DESPACHADO, libera mesa y devuelve el DTO
 */
export async function marcarPedidoDespachado(req: Request, res: Response) {
  const id = Number(req.params.id);

  try {
    const pedido = await pedidoRepo().findOne({
      where: { id },
      relations: { mesa: true },
    });

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    if (pedido.estado !== 'EN_PROCESO') {
      return res.status(400).json({ message: 'Solo se pueden despachar pedidos EN_PROCESO' });
    }

    await AppDataSource.transaction(async (trx) => {
      const pRepo = trx.getRepository(Pedido);
      const mRepo = trx.getRepository(Mesa);

      pedido.estado = 'DESPACHADO';
      await pRepo.save(pedido);

      const mesa = await mRepo.findOne({ where: { id: pedido.mesaId } });
      if (mesa) {
        mesa.ocupacion = 'LIBRE';
        await mRepo.save(mesa);
      }

      // Evento para WS (puedes emitir el entity, el DTO, o un payload específico)
      PedidoEvents.emitDespachado(pedido);
    });

    // Volvemos a leer el pedido completo con relaciones para devolverlo al FE
    const pedidoActualizado = await pedidoRepo().findOne({
      where: { id },
      relations: { items: { producto: true }, mesa: true, mesero: true },
    });

    if (!pedidoActualizado) {
      return res.status(500).json({ message: 'Pedido despachado, pero no se pudo recargar' });
    }

    const dto = buildPedidoDespachoDto(pedidoActualizado);

    res.json(dto);
  } catch (err) {
    console.error('Error marcarPedidoDespachado:', err);
    res.status(500).json({ message: 'Error al despachar el pedido' });
  }
}
