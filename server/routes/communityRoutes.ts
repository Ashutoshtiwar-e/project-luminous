import { Router } from 'express';
import { joinCommunity, getCommunityPosts, createCommunityPost, deleteCommunityPost } from '../controllers/communityController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/:id/join', requireAuth, joinCommunity);
router.get('/:id/posts', getCommunityPosts);
router.post('/:id/posts', requireAuth, createCommunityPost);

export default router;

router.delete('/:id/posts/:postId', requireAuth, deleteCommunityPost);
