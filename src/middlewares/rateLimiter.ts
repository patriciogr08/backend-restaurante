import type { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const limiter = new RateLimiterMemory({ points: 300, duration: 60 }); // 300 req/min/IP

export async function rateLimiter(req: Request, res: Response, next: NextFunction) {
    try {
        await limiter.consume(req.ip || 'anon');
        next();
    } catch {
        res.status(429).json({ error: 'Demasiadas peticiones', requestId: req.requestId });
    }
}