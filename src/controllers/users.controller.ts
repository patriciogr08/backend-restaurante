import type { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Usuario } from '../domain/entities/Usuario';
import { Like, Not } from "typeorm";

import bcrypt from 'bcryptjs';

const repo = () => AppDataSource.getRepository(Usuario);

export async function listUsers(_req: Request, res: Response) {
    const users = await repo().find({
        where: { rol: Not ('ADMIN') },
        select: { id:true, nombre:true, usuario:true, email:true, telefono:true, avatarUrl:true, rol:true, estado:true, createdAt:true }
    });
    res.json(users);
}

export async function createUser(req: Request, res: Response) {
    const { nombre, usuario, password, rol, email = null, telefono = null } = req.body;
    const exists = await repo().findOne({ where: [{ usuario }, ...(email ? [{ email }] : [])] as any });
    if (exists) return res.status(409).json({ message: 'Usuario o email ya existe' });

    const hash = await bcrypt.hash(password, 10);
    const u = repo().create({ nombre, usuario, hash, rol, email, telefono, estado: 'ACTIVO' });
    await repo().save(u);

    res.status(201).json({
        id:u.id, nombre:u.nombre, usuario:u.usuario, email:u.email, telefono:u.telefono,
        avatarUrl:u.avatarUrl, rol:u.rol, estado:u.estado, createdAt:u.createdAt
    });
}

export async function updateUser(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { nombre, rol, email, telefono, password } = req.body;

    const u = await repo().findOne({ where: { id } });
    if (!u) return res.status(404).json({ message: 'No encontrado' });

    if (email && email !== u.email) {
        const emailTaken = await repo().findOne({ where: { email } });
        if (emailTaken) return res.status(409).json({ message: 'Email ya existe' });
    }
    if (password) u.hash = await bcrypt.hash(password, 10);
    if (nombre !== undefined) u.nombre = nombre;
    if (rol !== undefined) u.rol = rol;
    if (telefono !== undefined) u.telefono = telefono;
    if (email !== undefined) u.email = email;

    await repo().save(u);

    res.json({
        id:u.id, nombre:u.nombre, usuario:u.usuario, email:u.email, telefono:u.telefono,
        avatarUrl:u.avatarUrl, rol:u.rol, estado:u.estado, createdAt:u.createdAt, updatedAt:u.updatedAt
    });
}

export async function changeEstado(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { estado } = req.body;
    const u = await repo().findOne({ where: { id } });
    if (!u) return res.status(404).json({ message: 'No encontrado' });

    u.estado = estado;
    await repo().save(u);
    res.json({ id:u.id, estado:u.estado });
}

export async function listUsuariosByRol(req: Request, res: Response) {
    const rol = (req.query.rol as string) || 'MESERO';
    const q   = (req.query.q as string | undefined)?.trim();
    const where: any = { estado: 'ACTIVO' };
    where.rol = rol;
    
    if (q) {
        where.nombre = Like(`%${q}%`);
    }

    const rows = await repo().find({
        where,
        select: {
        id: true,
        nombre: true,
        email: true,
        },
        order: { nombre: 'ASC' },
    });

    res.json(rows);
}
