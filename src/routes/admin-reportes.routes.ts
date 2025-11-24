import { Router } from 'express';
import { getReporteVentas, exportReporteVentasExcel, getReporteProductos, exportReporteProductosExcel, getReporteMeseros, exportReporteMeserosExcel } from '../controllers/admin-reportes.controller';
import { ensureAuth, requireRole } from '../middlewares/auth';

const router = Router();
router.use(ensureAuth,requireRole('ADMIN'));

router.get('/ventas', getReporteVentas);
router.get('/ventas/export-excel', exportReporteVentasExcel);


router.get('/productos', getReporteProductos);
router.get('/productos/export-excel', exportReporteProductosExcel);

router.get('/meseros', getReporteMeseros);
router.get('/meseros/export-excel', exportReporteMeserosExcel);

export default router;
