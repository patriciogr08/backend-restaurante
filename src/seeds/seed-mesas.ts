import { AppDataSource } from '../config/data-source';
import { Mesa } from '../domain/entities/Mesa';

export async function seedMesas() {
    const repo = AppDataSource.getRepository(Mesa);
    const count = await repo.count();
    if (count > 0) return { created: 0, skipped: true };

    const mesas = Array.from({ length: 10 }).map((_, i) =>
        repo.create({ numero: i + 1, capacidad: i < 4 ? 2 : 4, ocupacion: 'LIBRE' })
    );
    await repo.save(mesas);
    return { created: mesas.length, skipped: false };
}
