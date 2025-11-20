import { AppDataSource } from '..//config/data-source';
import { Auditoria } from '../domain/entities/Auditoria';

export const uid = (req: any) => Number(req.user?.id);

export async function logAudit(
    userId: number, entidad: string, entidadId: number, accion: string, antes: any, despues: any
) {
    const repo = AppDataSource.getRepository(Auditoria);
    await repo.save(repo.create({
        usuarioId: userId,
        entidad, entidadId, accion,
        antesJson: antes ?? null,
        despuesJson: despues ?? null,
    }));
}

export const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function lineTotal(
    precioUnitario: number,
    cantidad: number,
    tieneDescuento?: boolean,
    descuentoPorcentaje?: number,
    descuentoValor?: number,
) {
    let unit = Number(precioUnitario);
    if (tieneDescuento) {
        const dv = Number(descuentoValor || 0);
        const dp = Number(descuentoPorcentaje || 0);
        const d  = dv > 0 ? dv : r2(unit * dp / 100);
        unit = Math.max(0, unit - d);
    }
    return r2(unit * Number(cantidad));
}
