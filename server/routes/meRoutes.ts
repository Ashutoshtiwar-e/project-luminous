import { Router } from 'express';
import { getReadingDna, refreshReadingDna } from '../controllers/readingDnaController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/reading-dna', requireAuth, getReadingDna);
router.post('/reading-dna/refresh', requireAuth, refreshReadingDna);

export default router;
