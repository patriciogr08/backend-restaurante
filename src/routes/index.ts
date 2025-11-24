import { Router } from 'express';
import authRouter from './auth.routes';
import profileRoutes from './profile.routes';
import usuariosRoutes from './users.routes';
import typeProductosRoutes from './admin-type-products.routes';
import productosRoutes from './admin-products.routes';
import configRoutes from './config.routes';
import mesasRoutes from './mesas.routes';
import meseroRoutes from './mesero.routes';
import despachoRoutes from './despacho.routes';
import pedidosAdmin from './admin-pedidos.routes';
import dashboardAdmin from './admin-dashboard.routes';
import reportesdAdmin from './admin-reportes.routes';


const apiRouter = Router();

apiRouter.get('/', (_req, res) => res.json({ api: 'restaurante', version: '1.0' }));
apiRouter.use('/auth', authRouter);
apiRouter.use('/config', configRoutes);
apiRouter.use('/perfil', profileRoutes);
apiRouter.use('/usuarios', usuariosRoutes);
apiRouter.use('/usuarios', usuariosRoutes);
apiRouter.use('/tipos-producto', typeProductosRoutes);
apiRouter.use('/productos', productosRoutes);
apiRouter.use('/mesas', mesasRoutes);
apiRouter.use('/mesero', meseroRoutes);
apiRouter.use('/despachador', despachoRoutes);
apiRouter.use('/admin', pedidosAdmin);
apiRouter.use('/admin', dashboardAdmin);
apiRouter.use('/admin/reportes', reportesdAdmin);

export default apiRouter;

