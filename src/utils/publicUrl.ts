import { env } from '../config/env';

export function publicUrl(relativePath: string) {
    const base = env.PUBLIC_BASE_URL.replace(/\/+$/, '');
    const rel  = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${base}${rel}`;
}
