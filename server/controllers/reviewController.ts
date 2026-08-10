import { Request, Response } from 'express';
import { getDb } from '../config/db';
import { ObjectId } from 'mongodb';
import { AuthRequest } from '../middleware/auth';

const updateBookReviewStats = async (db: any, bookId: string) => {
  const reviews = await db.collection('reviews').find({ bookId }).toArray();
  const reviewCount = reviews.length;
  let averageRating = 0;
  
  if (reviewCount > 0) {
    const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
    // Round to 1 decimal place
    averageRating = Math.round((totalRating / reviewCount) * 10) / 10;
  }
  
  await db.collection('books').updateOne(
    { id: bookId },
    { 
      $set: { 
        rating: averageRating,
        reviewCount: reviewCount,
        reviewUpdatedAt: Date.now()
      } 
    }
  );
};

export const addReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { text, rating } = req.body;
    if (!text || rating === undefined) return res.status(400).json({ error: 'Text and rating required' });
    if (text.length > 5000) return res.status(400).json({ error: 'Review text too long' });
    
    const db = await getDb();
    
    const reviewId = new ObjectId().toString();
    const review = {
      id: reviewId,
      bookId: id,
      userId: req.user._id,
      user: req.user.username,
      rating: parseFloat(rating),
      text,
      date: new Date().toISOString().split('T')[0]
    };
    
    await db.collection('reviews').insertOne(review);
    await updateBookReviewStats(db, id as string);
    
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add review' });
  }
};

export const updateReview = async (req: AuthRequest, res: Response) => {
  try {
    const { bookId, reviewId } = req.params;
    const { text, rating } = req.body;
    if (text && text.length > 5000) return res.status(400).json({ error: 'Review text too long' });
    
    const db = await getDb();
    const review = await db.collection('reviews').findOne({ id: reviewId });
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.userId !== req.user._id) return res.status(403).json({ error: 'Not authorized' });
    
    await db.collection('reviews').updateOne(
      { id: reviewId },
      { $set: { text, rating: parseFloat(rating) } }
    );
    
    await updateBookReviewStats(db, bookId as string);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update review' });
  }
};

export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const { bookId, reviewId } = req.params;
    
    const db = await getDb();
    const review = await db.collection('reviews').findOne({ id: reviewId });
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.userId !== req.user._id) return res.status(403).json({ error: 'Not authorized' });
    
    await db.collection('reviews').deleteOne({ id: reviewId });
    
    await updateBookReviewStats(db, bookId as string);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
};
