import { Router } from 'express';
import authRouter from './auth.routes';

export const apiRouter = Router();

apiRouter.get('/', (_req, res) => res.json({ api: 'restaurante', version: '1.0' }));
apiRouter.use('/auth', authRouter);

export default apiRouter;

