import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, logout, getMe, forgotPassword, resetPassword, changePassword } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

router.post('/register', strictLimiter, register);
router.post('/login', strictLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.post('/change-password', requireAuth, changePassword);
router.post('/forgot-password', strictLimiter, forgotPassword);
router.post('/reset-password/:token', strictLimiter, resetPassword);

export default router;
