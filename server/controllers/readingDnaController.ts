import { Request, Response } from 'express';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { getDb } from '../config/db';
import { ObjectId } from 'mongodb';

const calculateFrequencies = (books: any[]) => {
  const genres: Record<string, number> = {};
  const authors: Record<string, number> = {};
  const lengthCategories: Record<string, number> = {
    short: 0, // < 250
    medium: 0, // 250-400
    long: 0 // > 400
  };

  for (const book of books) {
    if (book.genre && Array.isArray(book.genre)) {
      book.genre.forEach((g: string) => {
        genres[g] = (genres[g] || 0) + 1;
      });
    }
    if (book.author) {
      authors[book.author] = (authors[book.author] || 0) + 1;
    }
    if (book.pageCount) {
      if (book.pageCount < 250) lengthCategories.short++;
      else if (book.pageCount <= 400) lengthCategories.medium++;
      else lengthCategories.long++;
    }
  }

  // Sort and take top
  const topGenres = Object.entries(genres).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
  const topAuthors = Object.entries(authors).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
  
  const preferredLength = Object.entries(lengthCategories).sort((a, b) => b[1] - a[1])[0][0];

  return {
    topGenres,
    topAuthors,
    preferredLength,
    bookCount: books.length
  };
};

export const getReadingDna = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.readingDna && user.readingDna.data) {
      return res.json(user.readingDna.data);
    }
    
    return generateAndSaveDna(req, res, user, db);
  } catch (err: any) {
    console.error("Reading DNA Error:", err);
    let errorMessage = 'Failed to fetch Reading DNA';
    if (err && (err.status === 429 || err.status === 'RESOURCE_EXHAUSTED' || (err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED'))))) {
      errorMessage = "AI services are currently busy or over quota. Please try again later.";
    }
    res.status(500).json({ error: errorMessage });
  }
};

export const refreshReadingDna = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });

    return generateAndSaveDna(req, res, user, db);
  } catch (err: any) {
    console.error("Reading DNA Error:", err);
    let errorMessage = 'Failed to refresh Reading DNA';
    if (err && (err.status === 429 || err.status === 'RESOURCE_EXHAUSTED' || (err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED'))))) {
      errorMessage = "AI services are currently busy or over quota. Please try again later.";
    }
    res.status(500).json({ error: errorMessage });
  }
};

const generateAndSaveDna = async (req: any, res: Response, user: any, db: any) => {
  const userId = user._id.toString();
  const savedBookIds = user.savedBooks || [];
  
  const reviews = await db.collection('reviews').find({ userId }).toArray();
  const reviewedBookIds = reviews.map((r: any) => r.bookId);

  const allRelevantIds = [...new Set([...savedBookIds, ...reviewedBookIds])];

  if (allRelevantIds.length === 0) {
    return res.json({ notEnoughData: true });
  }

  const books = await db.collection('books').find({ id: { $in: allRelevantIds } }).toArray();
  
  const stats = calculateFrequencies(books);

  const apiKey = process.env.GEMINI_API_KEY;
  console.log("[AI Service DNA] Initializing Gemini API...");
  
  if (!apiKey) {
    console.error("[AI Service DNA] Error: Gemini API key is missing.");
    return res.status(500).json({ error: 'Gemini API key is missing. Please configure the GEMINI_API_KEY environment variable.' });
  }
  if (apiKey === 'MY_GEMINI_API_KEY' || apiKey.includes('YOUR_API_KEY')) {
    console.error("[AI Service DNA] Error: Gemini API key is a placeholder.");
    return res.status(500).json({ error: 'Gemini API key is set to a placeholder. Please provide a valid GEMINI_API_KEY.' });
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a Reading DNA analyzer for Luminous AI.
Analyze the following user reading statistics and assign them a unique "Reading Personality".
Do not calculate statistics. Interpret them.

User Stats:
- Total books analyzed: ${stats.bookCount}
- Top Genres: ${stats.topGenres.join(', ')}
- Top Authors: ${stats.topAuthors.join(', ')}
- Preferred Length: ${stats.preferredLength}

Based on these stats and your knowledge of these genres/authors, generate a Reading DNA profile.

Return JSON matching this schema:
- readingPersonality: A catchy title for their reading personality (e.g. "The Dreamer", "Thrill Seeker", "World Builder")
- readingStyle: Brief description of how they read
- storyPreference: Brief description of the types of stories they prefer
- preferredThemes: Array of 3-4 themes they likely enjoy
- preferredMood: Their likely preferred mood
- preferredPacing: Their likely preferred pacing
- preferredDifficulty: Their likely preferred difficulty
- preferredLength: A descriptive string of their preferred length based on the stats
- favoriteAuthors: The provided top authors array
- favoriteGenres: The provided top genres array
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            readingPersonality: { type: Type.STRING },
            readingStyle: { type: Type.STRING },
            storyPreference: { type: Type.STRING },
            preferredThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
            preferredMood: { type: Type.STRING },
            preferredPacing: { type: Type.STRING },
            preferredDifficulty: { type: Type.STRING },
            preferredLength: { type: Type.STRING },
            favoriteAuthors: { type: Type.ARRAY, items: { type: Type.STRING } },
            favoriteGenres: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: [
            "readingPersonality", "readingStyle", "storyPreference", 
            "preferredThemes", "preferredMood", "preferredPacing", 
            "preferredDifficulty", "preferredLength", "favoriteAuthors", 
            "favoriteGenres"
          ]
        }
      }
    });

    if (!response.text) {
      return res.status(500).json({ error: 'Failed to generate Reading DNA' });
    }

    const dnaData = JSON.parse(response.text);

    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { readingDna: { timestamp: new Date(), data: dnaData } } }
    );

    res.json(dnaData);
  } catch (err: any) {
    console.error("Reading DNA Generate Error:", err);
    let errorMessage = 'Failed to generate Reading DNA';
    if (err && (err.status === 429 || err.status === 'RESOURCE_EXHAUSTED' || (err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED'))))) {
      errorMessage = "AI services are currently busy or over quota. Please try again later.";
    }
    res.status(500).json({ error: errorMessage });
  }
};
