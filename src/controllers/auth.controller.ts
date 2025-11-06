import { Request, Response } from 'express';
import { loginSchema } from '../validation/auth.schemas';
import { AppDataSource } from '../config/data-source';
import { Usuario } from '../domain/entities/Usuario';
import { verifyPassword } from '../utils/password';
import { signToken } from '../utils/jwt';

const BadRequest = (res:Response, msg:string) => res.status(400).json({ message: msg });
const Unauthorized = (res:Response, msg='Credenciales inválidas') => res.status(401).json({ message: msg });

export class AuthController {
    static async login(req: Request, res: Response) {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            const msg = parsed.error.issues[0]?.message || 'Payload inválido';
            return BadRequest(res, msg);
        }

        const { usuario, password } = parsed.data;

        const repo = AppDataSource.getRepository(Usuario);
        const user = await repo.findOne({ where: { usuario } });
        if (!user || user.estado !== 'ACTIVO') return Unauthorized(res);

        const ok = await verifyPassword(password, user.hash);
        if (!ok) return Unauthorized(res);

        const token = signToken({
            id: String(user.id),
            usuario: user.usuario,
            rol: user.rol,
            nombre: user.nombre,
            correo: user.email ?? null,
        });

        return res.json({
        token,
        user: {
            id: user.id,
            usuario: user.usuario,
            nombre: user.nombre,
            rol: user.rol,
        },
        });
    }

    static async me(req: Request, res: Response) {
        // req.user lo pone ensureAuth
        return res.json({ user: req.user });
    }
}
