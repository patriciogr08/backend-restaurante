import { Router } from 'express';
import { ensureAuth, requireRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
    listTipos, createTipo, updateTipo, changeTipoEstado,
} from '../controllers/admin-products.controller';
import {
    createTipoSchema, updateTipoParams, updateTipoBody,
    changeTipoEstadoParams, changeTipoEstadoBody,
} from '../validation/admin-products.schemas';

const r = Router();
r.use(ensureAuth, requireRole('ADMIN'));

/* Tipos */
r.get('', listTipos);
r.post('', validate(createTipoSchema), createTipo);
r.patch('/:id', validate(updateTipoParams, 'params'), validate(updateTipoBody), updateTipo);
r.patch('/:id/estado', validate(changeTipoEstadoParams, 'params'), validate(changeTipoEstadoBody), changeTipoEstado);

export default r;
