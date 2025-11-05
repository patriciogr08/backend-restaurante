import { AppDataSource } from '../config/data-source';
import { ConfigFiscal } from '../domain/entities/ConfigFiscal';

export async function seedIVA() {
    const repo = AppDataSource.getRepository(ConfigFiscal);
    const vigente = await repo.findOne({ where: { vigenteHasta: require('typeorm').IsNull() } });
    if (vigente) return { created: false, iva: vigente.ivaPercent };

    const ivaPercent = (process.env.IVA_PERCENT || '15.00').trim(); // 15.00 = 15%
    const ahora = new Date();
    const cfg = repo.create({ ivaPercent, vigenteDesde: ahora, vigenteHasta: null });
    const saved = await repo.save(cfg);
    return { created: true, iva: saved.ivaPercent };
}
