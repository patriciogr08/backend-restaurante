import type { AuthPayload } from './auth';

declare global {
    namespace Express {
        interface Request {
        requestId?: string;
        user?: AuthPayload;
        }
    }
}

export {};
