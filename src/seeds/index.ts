import 'reflect-metadata';
import { initDataSource, AppDataSource } from '../config/data-source';
import { seedAdmin } from './seed-admin';
import { seedMesas } from './seed-mesas';
import { seedCatalogos } from './seed-catalogos';
import { seedIVA } from './seed-iva';

async function run() {
    await initDataSource();
    // Opcional: una sola transacción para todo
    await AppDataSource.transaction(async () => {
        const a = await seedAdmin();
        const m = await seedMesas();
        const c = await seedCatalogos();
        const v = await seedIVA();

        console.log('✅ Seed resumen:', { admin: a, mesas: m, catalogos: c, iva: v });
    });
    process.exit(0);
}

run().catch((err) => {
    console.error('❌ Error ejecutando seed:', err);
    process.exit(1);
});
