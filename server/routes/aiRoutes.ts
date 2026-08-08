import { Router } from 'express';
import { askAboutBook, discoverBooks } from '../controllers/aiController';

const router = Router();

router.post('/ask', askAboutBook);
router.post('/discover', discoverBooks);

export default router;
