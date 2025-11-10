// src/routes/mesas.routes.ts
import { Router } from 'express';
import { ensureAuth, requireRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
    mesaCreateSchema,
    mesaUpdateSchema,
    mesaSetOcupacionSchema,
} from '../validation/mesas.schema';
import {
    listMesas,
    createMesa,
    updateMesa,
    deleteMesa,
    setOcupacion,
    restoreMesa,
} from '../controllers/mesas.controller';

const router = Router();
router.use(ensureAuth);

router.get('/',requireRole('ADMIN'), listMesas);                                   // GET /api/admin/mesas
router.post('/', requireRole('ADMIN') , validate(mesaCreateSchema), createMesa);      // POST /api/admin/mesas
router.patch('/:id', requireRole('ADMIN') , validate(mesaUpdateSchema), updateMesa);  // PATCH /api/admin/mesas/:id
router.delete('/:id', requireRole('ADMIN') ,deleteMesa);                             // DELETE /api/admin/mesas/:id
router.patch('/:id/ocupacion',                                // PATCH /api/admin/mesas/:id/ocupacion
    requireRole('ADMIN'),
    validate(mesaSetOcupacionSchema),
    setOcupacion
);

router.patch('/:id/restore', requireRole('ADMIN'), restoreMesa);

export default router;
