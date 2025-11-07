import type { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Producto } from '../domain/entities/Producto';
import { TipoProducto } from '../domain/entities/TipoProducto';
import { In } from 'typeorm';
import { aplicarDescuento, pvpDesdeBase } from '../utils/precios';
import { getIvaVigentePercent } from '../services/fiscal.service';

const prodRepo = () => AppDataSource.getRepository(Producto);
const tipoRepo = () => AppDataSource.getRepository(TipoProducto);

/* ===== Tipos de producto ===== */

export async function listTipos(_req: Request, res: Response) {
    const rows = await tipoRepo().find({
        select: { id:true, nombre:true, estado:true, createdAt:true, updatedAt:true },
        order: { nombre: 'ASC' }
    });
    res.json(rows);
}

export async function createTipo(req: Request, res: Response) {
    const { nombre } = req.body;
    const exists = await tipoRepo().findOne({ where: { nombre } });
    if (exists) return res.status(409).json({ message: 'El tipo ya existe' });
    const t = tipoRepo().create({ nombre, estado: 'ACTIVO' });
    await tipoRepo().save(t);
    res.status(201).json(t);
}

export async function updateTipo(req: Request, res: Response) {
    const id = Number(req.params.id);
    const t = await tipoRepo().findOne({ where: { id } });
    if (!t) return res.status(404).json({ message: 'No encontrado' });

    const { nombre, estado } = req.body;
    if (nombre !== undefined) t.nombre = nombre;
    if (estado !== undefined) t.estado = estado;
    await tipoRepo().save(t);
    res.json(t);
}

export async function changeTipoEstado(req: Request, res: Response) {
    const id = Number(req.params.id);
    const t = await tipoRepo().findOne({ where: { id } });
    if (!t) return res.status(404).json({ message: 'No encontrado' });
    t.estado = req.body.estado;
    await tipoRepo().save(t);
    res.json({ id: t.id, estado: t.estado });
}

/* ===== Productos ===== */

export async function listProductos(req: Request, res: Response) {
    const { estado, tipo } = req.query as { estado?: 'ACTIVO'|'INACTIVO'; tipo?: string };

    const where: any = {};
    if (estado) where.estado = estado;
    if (tipo)   where.tipoProductoId = Number(tipo);

    const rows = await prodRepo().find({
        where,
        relations: { tipoProducto: true },
        select: {
        id:true, nombre:true, descripcion:true, precio:true, estado:true,
        tieneDescuento:true, descuentoPorcentaje:true, descuentoValor:true,
        tipoProducto: { id:true, nombre:true },
        createdAt:true, updatedAt:true
        },
        order: { createdAt: 'DESC' }
    });

    const iva = await getIvaVigentePercent();
    res.json(rows.map(r => toDto(r, iva)));
}

export async function createProducto(req: Request, res: Response) {
    const {
        tipoProductoId, nombre, descripcion = null, precio,
        tieneDescuento = false, descuentoPorcentaje = 0, descuentoValor = 0
    } = req.body;

    const tipo = await tipoRepo().findOne({ where: { id: Number(tipoProductoId) } });
    if (!tipo) return res.status(400).json({ message: 'Tipo inválido' });

    const p = prodRepo().create({
        tipoProductoId: Number(tipoProductoId),
        nombre,
        descripcion,
        precio,
        tieneDescuento,
        descuentoPorcentaje,
        descuentoValor,
        estado: 'ACTIVO'
    });
    await prodRepo().save(p);

    const saved = await prodRepo().findOne({
        where: { id: p.id },
        relations: { tipoProducto: true },
        select: {
        id:true, nombre:true, descripcion:true, precio:true, estado:true,
        tieneDescuento:true, descuentoPorcentaje:true, descuentoValor:true,
        tipoProducto: { id:true, nombre:true }, createdAt:true, updatedAt:true
        }
    });

    const iva = await getIvaVigentePercent();
    res.status(201).json(toDto(saved!, iva));
}

export async function updateProducto(req: Request, res: Response) {
    const id = Number(req.params.id);
    const p = await prodRepo().findOne({ where: { id } });
    if (!p) return res.status(404).json({ message: 'No encontrado' });

    const {
        tipoProductoId, nombre, descripcion, precio,
        tieneDescuento, descuentoPorcentaje, descuentoValor, estado
    } = req.body;

    if (tipoProductoId !== undefined) {
        const tipo = await tipoRepo().findOne({ where: { id: Number(tipoProductoId) } });
        if (!tipo) return res.status(400).json({ message: 'Tipo inválido' });
        p.tipoProductoId = Number(tipoProductoId);
    }
    if (nombre                !== undefined) p.nombre = nombre;
    if (descripcion           !== undefined) p.descripcion = descripcion;
    if (precio                !== undefined) p.precio = precio;
    if (tieneDescuento        !== undefined) p.tieneDescuento = !!tieneDescuento;
    if (descuentoPorcentaje   !== undefined) p.descuentoPorcentaje = Number(descuentoPorcentaje);
    if (descuentoValor        !== undefined) p.descuentoValor = Number(descuentoValor);
    if (estado                !== undefined) p.estado = estado;

    await prodRepo().save(p);

    const saved = await prodRepo().findOne({
        where: { id: p.id },
        relations: { tipoProducto: true },
        select: {
        id:true, nombre:true, descripcion:true, precio:true, estado:true,
        tieneDescuento:true, descuentoPorcentaje:true, descuentoValor:true,
        tipoProducto: { id:true, nombre:true }, createdAt:true, updatedAt:true
        }
    });

    const iva = await getIvaVigentePercent();
    res.json(toDto(saved!, iva));
}

export async function changeProductoEstado(req: Request, res: Response) {
    const id = Number(req.params.id);
    const p = await prodRepo().findOne({ where: { id } });
    if (!p) return res.status(404).json({ message: 'No encontrado' });
    p.estado = req.body.estado;
    await prodRepo().save(p);
    res.json({ id: p.id, estado: p.estado });
}


function toDto(p: Producto, ivaPercent: number) {
    const precio = Number(p.precio || 0); // SIN IVA
    const pvpReal = pvpDesdeBase(precio, ivaPercent);      // sin descuento
    const pvp     = aplicarDescuento(
        pvpReal,
        !!p.tieneDescuento,
        Number(p.descuentoPorcentaje || 0),
        Number(p.descuentoValor || 0),
    );

    return {
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: precio,               // SIN IVA
        estado: p.estado,
        tieneDescuento: !!p.tieneDescuento,
        descuentoPorcentaje: Number(p.descuentoPorcentaje || 0),
        descuentoValor: Number(p.descuentoValor || 0),
        tipoProducto: p.tipoProducto ? { id: p.tipoProducto.id, nombre: p.tipoProducto.nombre } : undefined,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        // nuevos
        ivaPercent,
        pvpReal,
        pvp,
    };
}