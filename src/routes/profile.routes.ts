import { Router } from 'express';
import { me, update, changePassword, avatar } from '../controllers/profile.controller';
import { ensureAuth } from '../middlewares/auth';
import { uploaderFor } from '../config/multer';

const router = Router();
router.use(ensureAuth);

const upload = uploaderFor('avatars'); // queda en UPLOAD_DIR/avatars

router.get('/me', me);
router.post('/update', update);
router.post('/change-password', changePassword);
router.post('/avatar', upload.single('avatar'), avatar);

export default router;
