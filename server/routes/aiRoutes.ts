import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { askAboutBook, discoverBooks } from '../controllers/aiController';

const router = Router();

const moderateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { error: 'Too many AI requests, please try again later.' }
});

router.post('/ask', moderateLimiter, askAboutBook);
router.post('/discover', moderateLimiter, discoverBooks);

export default router;
