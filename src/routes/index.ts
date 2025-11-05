import { Router } from 'express';
export const router = Router();

router.get('/', (_req, res) => res.json({ api: 'restaurante', version: '1.0' }));
