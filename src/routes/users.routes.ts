import { Router } from 'express';
import { ensureAuth, requireRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
    listUsers, createUser, updateUser, changeEstado,
    listUsuariosByRol
} from '../controllers/users.controller';
import {
    changeEstadoBody,
    changeEstadoParams,
    createUserSchema, updateUserSchema, 
} from '../validation/admin-users.schemas';

const r = Router();
r.use(ensureAuth);

r.get('', requireRole('ADMIN'), listUsers);  
r.get('/roles/buscar', listUsuariosByRol);
r.post('', requireRole('ADMIN'), validate(createUserSchema), createUser);     // crear MESERO/DESPACHADOR
r.patch('/:id', requireRole('ADMIN'), validate(changeEstadoParams, 'params'), validate(updateUserSchema), updateUser);
r.patch('/:id/estado', requireRole('ADMIN'), validate(changeEstadoParams, 'params'), validate(changeEstadoBody), changeEstado);


export default r;
