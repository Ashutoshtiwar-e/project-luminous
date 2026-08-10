import { Router } from 'express';
import { 
  joinCommunity, 
  getCommunityPosts, 
  createCommunityPost, 
  deleteCommunityPost,
  getPostReplies,
  createPostReply
} from '../controllers/communityController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/:id/join', requireAuth, joinCommunity);
router.get('/:id/posts', getCommunityPosts);
router.post('/:id/posts', requireAuth, createCommunityPost);
router.delete('/:id/posts/:postId', requireAuth, deleteCommunityPost);

// Replies
router.get('/:id/posts/:postId/replies', getPostReplies);
router.post('/:id/posts/:postId/replies', requireAuth, createPostReply);

export default router;
