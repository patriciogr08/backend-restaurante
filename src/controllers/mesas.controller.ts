// src/controllers/mesas.controller.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Mesa } from '../domain/entities/Mesa';
import { IsNull, Not } from 'typeorm';
import { Carrito } from '../domain/entities/Carrito';

const mesaRepo = () => AppDataSource.getRepository(Mesa);

export async function listMesas(req: Request, res: Response) {
    try {
        const includeDeleted = req.query.includeDeleted === '1';
        
        const rows = await mesaRepo().find({
            withDeleted: includeDeleted, // Esto es lo importante
            order: { numero: 'ASC' },
            cache: true 
        });
        
        if (!rows.length) return res.status(204).send(); // No Content

        res.json(rows);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener las mesas',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

export async function createMesa(req: Request, res: Response) {
    const { numero, capacidad } = req.body;

    // Evitar duplicados ignorando soft-deleted
    const dup = await mesaRepo().findOne({ where: { numero, deletedAt: IsNull() } });
    if (dup) return res.status(400).json({ message: 'El número de mesa ya existe' });

    const m = mesaRepo().create({ numero, capacidad, ocupacion: 'LIBRE' });
    await mesaRepo().save(m);
    res.status(201).json(m);
}

export async function updateMesa(req: Request, res: Response) {
    const id = Number(req.params.id);
    const m = await mesaRepo().findOne({ where: { id, deletedAt: IsNull() } });
    if (!m) return res.status(404).json({ message: 'No encontrado' });

    const { numero, capacidad } = req.body;

    if (numero !== undefined) {
        const dup = await mesaRepo().findOne({
        where: { numero, id: Not(id), deletedAt: IsNull() }
        });
        if (dup) return res.status(400).json({ message: 'Número ya en uso' });
        m.numero = numero;
    }
    if (capacidad !== undefined) m.capacidad = capacidad;

    await mesaRepo().save(m);
    res.json(m);
}

export async function deleteMesa(req: Request, res: Response) {
    const id = Number(req.params.id);
    // soft delete
    const result = await mesaRepo().softDelete({ id });
    if (!result.affected) return res.status(404).json({ message: 'No encontrado' });
    res.json({ ok: true });
}

export async function restoreMesa(req: Request, res: Response) {
    const id = Number(req.params.id);
    const r = await mesaRepo().restore({ id });
    if (!r.affected) return res.status(404).json({ message: 'No encontrado' });
    const m = await mesaRepo().findOne({ where: { id, deletedAt: IsNull() } });
    res.json(m);
}
