import { Router } from 'express';
import { ensureAuth, requireRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
    listProductos, createProducto, updateProducto, changeProductoEstado
} from '../controllers/admin-products.controller';
import {
    createProductoSchema, updateProductoParams, updateProductoBody,
    changeProductoEstadoParams, changeProductoEstadoBody
} from '../validation/admin-products.schemas';

const r = Router();
r.use(ensureAuth, requireRole('ADMIN'));

/* Productos */
r.get('', listProductos);
r.post('', validate(createProductoSchema), createProducto);
r.patch('/:id', validate(updateProductoParams, 'params'), validate(updateProductoBody), updateProducto);
r.patch('/:id/estado', validate(changeProductoEstadoParams, 'params'), validate(changeProductoEstadoBody), changeProductoEstado);

export default r;
