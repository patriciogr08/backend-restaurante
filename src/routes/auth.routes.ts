import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { ensureAuth } from '../middlewares/auth';

export const router = Router();

router.post('/login', AuthController.login);
router.get('/me', ensureAuth, AuthController.me);


export default router;

