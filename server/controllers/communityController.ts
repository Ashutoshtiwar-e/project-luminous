import { Request, Response } from 'express';
import { getDb } from '../config/db';
import { ObjectId } from 'mongodb';
import { AuthRequest } from '../middleware/auth';

export const joinCommunity = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    let joinedCommunities = user.joinedCommunities || [];
    if (joinedCommunities.includes(id)) {
      joinedCommunities = joinedCommunities.filter((c: string) => c !== id);
    } else {
      joinedCommunities.push(id);
    }
    
    await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { joinedCommunities } });
    res.json({ joinedCommunities });
  } catch (err) {
    res.status(500).json({ error: 'Failed to join community' });
  }
};

export const getCommunityPosts = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    const db = await getDb();
    const results = await db.collection('posts').find({ communityId: id }).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

export const createCommunityPost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
    
    const db = await getDb();
    
    const newPost = {
      communityId: id,
      authorId: req.user._id,
      authorUsername: req.user.username,
      title,
      content,
      upvotes: 0,
      createdAt: new Date()
    };
    
    const result = await db.collection('posts').insertOne(newPost);
    res.json({ _id: result.insertedId, ...newPost });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create post' });
  }
};

export const deleteCommunityPost = async (req: AuthRequest, res: Response) => {
  try {
    const { id, postId } = req.params;
    const userId = req.user._id;

    const db = await getDb();
    const post = await db.collection('posts').findOne({ _id: new ObjectId(postId), communityId: id });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await db.collection('posts').deleteOne({ _id: new ObjectId(postId) });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};
