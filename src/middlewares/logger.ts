import pino from 'pino';
import pinoHttp from 'pino-http';

export const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug', base: undefined });

export const httpLogger = pinoHttp({
    logger,
    genReqId: (req: any) => req.requestId || undefined,
    customProps: (req) => ({
        requestId: (req as any).requestId,
        userId: req.user?.id,   // <- antes sub
        rol: req.user?.rol
    })
});
