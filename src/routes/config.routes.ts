import { Router } from 'express';
import { ivaVigente } from '../controllers/config.controller';

const configRoutes = Router();

configRoutes.get('/iva', ivaVigente);

export default configRoutes;