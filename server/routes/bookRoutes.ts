import { Router } from 'express';
import { getBooks, searchBooks, getBookById, toggleSaveBook, getSavedBooks, getGroupedByCategories, getAlphabeticalList, getHomeData } from '../controllers/bookController';
import { addReview, updateReview, deleteReview } from '../controllers/reviewController';
import { getReviewDigest, getAiOverview } from '../controllers/aiController';
import { requireAuth } from '../middleware/auth';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'super-secret-key-for-dev');
if (process.env.NODE_ENV === 'production' && !JWT_SECRET) throw new Error("JWT_SECRET missing in production");

export const optionalAuth = (req: any, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    }
    next();
  } catch (err) {
    next();
  }
};

const router = Router();

router.get('/home', optionalAuth, getHomeData);
router.get('/search', searchBooks);
router.get('/categories', getGroupedByCategories);
router.get('/alphabetical', getAlphabeticalList);
router.get('/saved', requireAuth, getSavedBooks);
router.get('/', getBooks);
router.get('/:id', getBookById);
router.get('/:id/review-digest', getReviewDigest);
router.get('/:id/overview', getAiOverview);
router.post('/:id/save', requireAuth, toggleSaveBook);

// Reviews
router.post('/:id/reviews', requireAuth, addReview);
router.put('/:bookId/reviews/:reviewId', requireAuth, updateReview);
router.delete('/:bookId/reviews/:reviewId', requireAuth, deleteReview);

export default router;
