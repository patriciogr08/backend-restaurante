// src/routes/adminPedidos.routes.ts
import { Router } from 'express';
import { ensureAuth, requireRole } from '../middlewares/auth';
import { cancelarPedidoAdmin, facturarPedidoAdmin, listarPedidosAdmin } from '../controllers/admin-pedidos.controller';

const router = Router();
router.use(ensureAuth);


// GET /api/admin/pedidos?estado=en_proceso|despachados|cobrados|cancelados
router.get('/pedidos',listarPedidosAdmin);
// POST: facturar pedido (total o parcial)
router.post('/pedidos/:pedidoId/facturar',requireRole('ADMIN'),facturarPedidoAdmin);
router.post('/pedidos/:pedidoId/cancelar',requireRole('ADMIN'),cancelarPedidoAdmin);

export default router;
