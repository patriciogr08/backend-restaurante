// src/routes/despacho.routes.ts
import { Router } from 'express';
import { ensureAuth, requireRole } from '../middlewares/auth';
import { listPedidosDespacho, marcarPedidoDespachado } from '../controllers/despacho.controller';

const router = Router();
router.use(ensureAuth, requireRole('DESPACHADOR')); // solo ese rol

router.get('/pedidos', listPedidosDespacho);
router.post('/pedidos/:id/despachar', marcarPedidoDespachado);

export default router;
