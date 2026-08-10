import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getReadingDna, refreshReadingDna } from '../controllers/readingDnaController';
import { requireAuth } from '../middleware/auth';

const router = Router();

const moderateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

router.get('/reading-dna', requireAuth, moderateLimiter, getReadingDna);
router.post('/reading-dna/refresh', requireAuth, moderateLimiter, refreshReadingDna);

export default router;
