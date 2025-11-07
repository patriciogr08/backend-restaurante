import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source'; // en tu árbol es data-sources.ts
import { Repository } from 'typeorm';
import { Usuario } from '../domain/entities/Usuario';
import { ChangePasswordDto, UpdateProfileDto } from '../types/profile';
import bcrypt from 'bcrypt';
import { urlFor } from '../config/multer';

const repo: Repository<Usuario> = AppDataSource.getRepository(Usuario);

function uid(req: Request) {
    // tu ensureAuth setea req.user.id como string
    const id = Number(req.user?.id);
    if (!id) throw new Error('Usuario no autenticado');
    return id;
}

export async function me(req: Request, res: Response) {
    try {
        const u = await repo.findOne({
        where: { id: uid(req) },
        select: {
            id: true, nombre: true, usuario: true, email: true,
            telefono: true, avatarUrl: true, rol: true, estado: true,
            createdAt: true, updatedAt: true
        }
        });
        if (!u) return res.status(404).json({ message: 'No encontrado' });
        res.json(u);
    } catch {
        res.status(401).json({ message: 'No autorizado' });
    }
}

export async function update(req: Request, res: Response) {
    try {
        const dto = req.body as UpdateProfileDto;
        await repo.update({ id: uid(req) }, { ...dto });
        const refreshed = await repo.findOne({
        where: { id: uid(req) },
        select: {
            id: true, nombre: true, usuario: true, email: true,
            telefono: true, avatarUrl: true, rol: true, estado: true,
            createdAt: true, updatedAt: true
        }
        });
        res.json(refreshed);
    } catch (e: any) {
        res.status(400).json({ message: e?.message || 'Error al actualizar' });
    }
}

export async function changePassword(req: Request, res: Response) {
    const { actual, nueva } = (req.body || {}) as ChangePasswordDto;
    if (!actual || !nueva) return res.status(400).json({ message: 'Datos inválidos' });

    const u = await repo.findOne({ where: { id: uid(req) }, select: { id: true, hash: true } });
    if (!u) return res.status(404).json({ message: 'Usuario no encontrado' });

    const ok = await bcrypt.compare(actual, u.hash);
    if (!ok) return res.status(400).json({ message: 'Contraseña actual incorrecta' });

    const newHash = await bcrypt.hash(nueva, 10);
    await repo.update({ id: u.id }, { hash: newHash });

    res.json({ ok: true });
}

export async function avatar(req: any, res: any) {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
        return res.status(400).json({ message: 'Archivo requerido', requestId: req.requestId });
    }

    const publicUrl = urlFor('avatars', file.filename);
    await repo.update({ id: uid(req) }, { avatarUrl: publicUrl });

    const refreshed = await repo.findOne({
        where: { id: uid(req) },
        select: {
        id: true, nombre: true, usuario: true, email: true,
        telefono: true, avatarUrl: true, rol: true, estado: true,
        createdAt: true, updatedAt: true
        }
    });
    res.json(refreshed);
}
