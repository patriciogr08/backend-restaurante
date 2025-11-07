import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { env } from './env';


export const UPLOAD_DIR = env.UPLOAD_DIR || 'public/images';
export const MOUNT_PATH = env.UPLOAD_MOUNT_PATH.replace(/\/+$/, '')  || '/images';

const BASE = path.join(process.cwd(), UPLOAD_DIR);
fs.mkdirSync(BASE, { recursive: true });

function safeName(original = 'file') {
    const ext = (path.extname(original || '').toLowerCase()) || '.jpg';
    const base = path.basename(original || 'file', ext)
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
    return `${Date.now()}-${base}${ext}`;
}

export function uploaderFor(subdir = '') {
    const dest = path.join(BASE, subdir);
    fs.mkdirSync(dest, { recursive: true });

    const storage = multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, dest),
        filename: (_req, file, cb) => cb(null, safeName(file?.originalname))
    });

    return multer({
        storage
    });
}

export function urlFor(subdir: string, filename: string) {
    return [MOUNT_PATH, subdir || '', filename].filter(Boolean).join('/').replace(/\\/g, '/');
}
