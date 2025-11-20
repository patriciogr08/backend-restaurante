import pino from 'pino';
import pinoHttp from 'pino-http';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'info',
  base: undefined,
  // Evita imprimir tokens u otros secretos
  redact: ['req.headers.authorization'],
});

export const httpLogger = pinoHttp({
    logger,

    // ID consistente con tu requestId middleware
    genReqId: (req: any) => req.requestId || undefined,

    // Solo serializa lo mínimo del request/response
    serializers: {
        req(req) { return { method: req.method, url: req.url }; },
        res(res) { return { statusCode: res.statusCode }; },
    },

    // Campos extra concisos
    customProps: (req, res) => ({
        userId: req.user?.id,
        rol: req.user?.rol,
    }),

    // Mensajes cortos
    customSuccessMessage:  (req, res) => `done ${req.url} ${res.statusCode}`,
    customErrorMessage:    (req, res, err) => `fail ${req.url} ${res.statusCode} - ${err?.message}`,

    // Nivel según status
    customLogLevel: (req, res, err) => {
        if (err) return 'error';
        if (res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
    },

    // Menos ruido (evita log extra del req al inicio)
    quietReqLogger: true,

    // Ignora endpoints ruidosos o irrelevantes
    autoLogging: {
        ignore: (req) =>
        req.method === 'OPTIONS' ||
        req.url === '/health' ||
        req.url.startsWith('/images/') || // ajusta a tu MOUNT_PATH
        req.url.startsWith('/static/'),
    },
});
