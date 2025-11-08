import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import * as userController from '../controllers/user.controller';

const userRoutes = new Hono();

// All user routes require authentication
userRoutes.use('/*', authMiddleware);

userRoutes.get('/profile', userController.getProfile);
userRoutes.put('/profile', userController.updateProfile);

export default userRoutes;
