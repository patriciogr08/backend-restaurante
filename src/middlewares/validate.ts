import type { Request, Response, NextFunction } from 'express';
import type * as zod from 'zod';
type Part = 'body'|'params'|'query';

export function validate(schema: zod.ZodSchema, part: Part = 'body') {
    return (req: Request, res: Response, next: NextFunction) => {
        const data = (req as any)[part];
        const parsed = schema.safeParse(data);
        if (!parsed.success) {
        return res.status(400).json({
            error: 'Validación fallida',
            details: parsed.error.flatten(),
            requestId: req.requestId
        });
        }
        (req as any)[part] = parsed.data;
        next();
    };
}
