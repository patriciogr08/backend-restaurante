import { AppDataSource } from '../config/data-source';
import { Usuario } from '../domain/entities/Usuario';
import { hashPassword } from '../utils/password';

export async function seedAdmin() {
    const adminUsuario = (process.env.ADMIN_USUARIO || 'admin').trim();
    const adminNombre  = (process.env.ADMIN_NOMBRE  || 'Administrador').trim();
    const adminPass    = (process.env.ADMIN_PASSWORD || 'Admin123*').trim();
    const adminEmail   = (process.env.ADMIN_EMAIL || '').trim() || null;

    const repo = AppDataSource.getRepository(Usuario);

    const exists = await repo.findOne({ where: { usuario: adminUsuario } });
    if (exists) {
        return { created: false, id: exists.id, usuario: exists.usuario };
    }

    const hash = await hashPassword(adminPass);
    const admin = repo.create({
        nombre: adminNombre,
        usuario: adminUsuario,
        email: adminEmail,
        hash,
        rol: 'ADMIN',
        estado: 'ACTIVO'
    });
    const saved = await repo.save(admin);
    return { created: true, id: saved.id, usuario: saved.usuario };
}
