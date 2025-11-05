import bcrypt from 'bcrypt';

const ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

/** Hashea una contraseña en texto plano. */
export async function hashPassword(plain: string): Promise<string> {
    if (!plain || plain.length < 6) {
        throw new Error('La contraseña es obligatoria y debe tener al menos 6 caracteres');
    }
    return bcrypt.hash(plain, ROUNDS);
}

/** Compara contraseña en texto plano contra el hash guardado. */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
    if (!plain || !hash) return false;
    return bcrypt.compare(plain, hash);
}
