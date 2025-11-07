import { Router } from 'express';
import authRouter from './auth.routes';
import profileRoutes from './profile.routes';
import usuariosRoutes from './admin-users.routes';
import typeProductosRoutes from './admin-type-products.routes';
import productosRoutes from './admin-products.routes';
import configRoutes from './config.routes';


const apiRouter = Router();

apiRouter.get('/', (_req, res) => res.json({ api: 'restaurante', version: '1.0' }));
apiRouter.use('/auth', authRouter);
apiRouter.use('/config', configRoutes);
apiRouter.use('/perfil', profileRoutes);
apiRouter.use('/usuarios', usuariosRoutes);
apiRouter.use('/usuarios', usuariosRoutes);
apiRouter.use('/tipos-producto', typeProductosRoutes);
apiRouter.use('/productos', productosRoutes);

export default apiRouter;

