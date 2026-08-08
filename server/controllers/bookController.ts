import { Request, Response } from 'express';
import { getDb } from '../config/db';
import { ObjectId } from 'mongodb';
import { AuthRequest } from '../middleware/auth';

export const getBooks = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const genre = req.query.genre as string;
    const author = req.query.author as string;
    
    const db = await getDb();
    
    const filter: any = {};
    if (genre) filter.genre = genre;
    if (author) filter.author = new RegExp(author, 'i');
    
    const allBooks = await db.collection('books').find(filter).skip(skip).limit(limit).toArray();
    res.json(allBooks);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
};

export const searchBooks = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const genre = req.query.genre as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const db = await getDb();
    
    const filter: any = {};
    if (genre) filter.genre = genre;
    if (query) {
      const regex = new RegExp(query, 'i');
      filter.$or = [
        { title: regex },
        { author: regex },
        { genre: regex }
      ];
    }
    
    const results = await db.collection('books').find(filter)
                               .skip(skip)
                               .limit(limit)
                               .toArray();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
};

export const getBookById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const book = await db.collection('books').findOne({ id });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    
    // Fetch reviews from separate collection
    const reviews = await db.collection('reviews').find({ bookId: id }).sort({ date: -1 }).toArray();
    book.reviews = reviews;
    
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch book' });
  }
};

export const toggleSaveBook = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    let savedBooks = user.savedBooks || [];
    if (savedBooks.includes(id)) {
      savedBooks = savedBooks.filter((bookId: string) => bookId !== id);
    } else {
      savedBooks.push(id);
    }
    
    await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { savedBooks } });
    res.json({ savedBooks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save book' });
  }
};

export const getSavedBooks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const savedBookIds = user.savedBooks || [];
    if (savedBookIds.length === 0) return res.json([]);
    
    const books = await db.collection('books').find({ id: { $in: savedBookIds } }).toArray();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch saved books' });
  }
};

export const getGroupedByCategories = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const grouped = await db.collection('books').aggregate([
      { $unwind: "$genre" },
      { $group: { _id: "$genre", books: { $push: "$$ROOT" } } },
      { $project: { _id: 0, category: "$_id", books: { $slice: ["$books", 10] } } },
      { $sort: { category: 1 } }
    ]).toArray();
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch grouped categories' });
  }
};

export const getAlphabeticalList = async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const books = await db.collection('books').find({}).sort({ title: 1 }).toArray();
    
    const map = new Map();
    books.forEach(book => {
      const firstLetter = book.title.charAt(0).toUpperCase();
      const key = /[A-Z]/.test(firstLetter) ? firstLetter : '#';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(book);
    });
    
    const sortedKeys = Array.from(map.keys()).sort((a, b) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    });
    
    const grouped = sortedKeys.map(key => ({ letter: key, books: map.get(key) }));
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alphabetical list' });
  }
};

export const getHomeData = async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const [trending, recentlyAdded, hiddenGems] = await Promise.all([
      db.collection('books').find().sort({ rating: -1 }).limit(10).toArray(),
      db.collection('books').find().sort({ publicationDate: -1 }).limit(10).toArray(),
      db.collection('books').aggregate([
        { 
          $addFields: {
            calcReviewCount: { $ifNull: ["$reviewCount", 0] },
            calcRating: { $ifNull: ["$rating", 0] }
          }
        },
        {
          $addFields: {
            // Bayesian average: (rating * reviewCount + priorMean * priorWeight) / (reviewCount + priorWeight)
            // Using priorMean = 3.5 and priorWeight = 5
            confidenceScore: {
              $divide: [
                { $add: [ { $multiply: ["$calcRating", "$calcReviewCount"] }, 17.5 ] },
                { $add: ["$calcReviewCount", 5] }
              ]
            }
          }
        },
        { $sort: { confidenceScore: -1 } },
        { $limit: 10 },
        { $project: { calcReviewCount: 0, calcRating: 0, confidenceScore: 0 } }
      ]).toArray()
    ]);
    
    let recommended: any[] = [];
    if (req.user) {
      const user = await db.collection('users').findOne({ _id: new ObjectId(req.user._id) });
      if (user && user.savedBooks && user.savedBooks.length > 0) {
        const savedBooksData = await db.collection('books').find({ id: { $in: user.savedBooks } }).toArray();
        const savedGenres = [...new Set(savedBooksData.flatMap(b => b.genre))];
        recommended = await db.collection('books').find({ 
          genre: { $in: savedGenres }, 
          id: { $nin: user.savedBooks } 
        }).limit(10).toArray();
      }
    }
    if (recommended.length === 0) {
       recommended = await db.collection('books').aggregate([{ $sample: { size: 10 } }]).toArray();
    }
    
    res.json({ trending, recentlyAdded, hiddenGems, recommended });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch home data' });
  }
};
