import { AppDataSource } from '../config/data-source';
import { ConfigFiscal } from '../domain/entities/ConfigFiscal';

export async function getIvaVigentePercent(): Promise<number> {
    const repo = AppDataSource.getRepository(ConfigFiscal);
    const now = new Date();
    const row = await repo.createQueryBuilder('c')
        .where('c.vigenteDesde <= :now', { now })
        .andWhere('(c.vigenteHasta IS NULL OR :now < c.vigenteHasta)', { now })
        .orderBy('c.vigenteDesde', 'DESC')
        .getOne();
    return row ? Number(row.ivaPercent) : 0;
}
