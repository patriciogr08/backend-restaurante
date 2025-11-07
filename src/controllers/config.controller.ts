import { Request, Response } from 'express';
import { getIvaVigentePercent } from '../services/fiscal.service';

export async function ivaVigente(_req: Request, res: Response) {
    const ivaPercent = await getIvaVigentePercent();
    res.json({ ivaPercent });
}
