import { z } from 'zod';

export const loginSchema = z.object({
    usuario: z.string().min(3).max(60).trim(),
    password: z.string().min(6).max(128),
});
export type LoginDto = z.infer<typeof loginSchema>;
