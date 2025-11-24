// src/routes/admin.routes.ts
import { Router } from 'express';
import { getAdminDashboard } from '../controllers/admin-dashboard.controller';
import { ensureAuth, requireRole } from '../middlewares/auth';

const router = Router();
router.use(ensureAuth,requireRole('ADMIN'));
router.get('/dashboard', getAdminDashboard);

export default router;
