import { Router } from 'express';
import { ensureAuth, requireRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
    listUsers, createUser, updateUser, changeEstado
} from '../controllers/admin-users.controller';
import {
    changeEstadoBody,
    changeEstadoParams,
    createUserSchema, updateUserSchema, 
} from '../validation/admin-users.schemas';

const r = Router();
r.use(ensureAuth, requireRole('ADMIN'));

r.get('', listUsers);                                   // listar (excluye ADMIN)
r.post('', validate(createUserSchema), createUser);     // crear MESERO/DESPACHADOR
r.patch('/:id', validate(changeEstadoParams, 'params'), validate(updateUserSchema), updateUser);
r.patch('/:id/estado', validate(changeEstadoParams, 'params'), validate(changeEstadoBody), changeEstado);

export default r;
