import { Router } from 'express';
import { getAuthConfig, getMe, loginWithGoogle, logout } from '../controllers/authController';
import { attachUser } from '../middleware/requireAuth';

export const authRouter = Router();

authRouter.get('/config', getAuthConfig);
authRouter.get('/me', attachUser, getMe);
authRouter.post('/google', loginWithGoogle);
authRouter.post('/logout', logout);
