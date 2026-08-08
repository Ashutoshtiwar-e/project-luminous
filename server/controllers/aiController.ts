import { Request, Response } from 'express';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { getDb } from '../config/db';

export const askAboutBook = async (req: Request, res: Response) => {
  try {
    const { query, bookId } = req.body;
    if (!query || !bookId) return res.status(400).json({ error: 'Query and bookId are required' });
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Gemini API key is missing' });
    
    const ai = new GoogleGenAI({ apiKey });
    const db = await getDb();
    
    const book = await db.collection('books').findOne({ id: bookId });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    
    const prompt = `You are a book assistant for Project Luminous, specifically helping the user understand the book "${book.title}" by ${book.author}.
Your job is to answer the user's question USING ONLY the provided context about this book.

RULES:
1. ONLY answer questions related to the book's content, themes, style, reading experience, and community reception.
2. If the user asks an unrelated question (e.g. "What is the weather?", "Who won the game?", or general questions not about this book), respond exactly with: "I can help you understand this book, but I'm not designed to answer unrelated questions."
3. DO NOT recommend random books based on keywords in unrelated queries.
4. DO NOT invent information. If the provided context does not contain enough information to answer the question, respond with: "I don't have enough information about this book to answer that reliably."
5. Be concise and helpful.

BOOK CONTEXT:
Title: ${book.title}
Author: ${book.author}
Genres: ${book.genre?.join(', ')}
Description: ${book.summary || book.description}
${book.contentWarnings && book.contentWarnings.length > 0 ? `Content Warnings: ${book.contentWarnings.join(', ')}` : ''}

USER QUESTION:
"${query}"`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    res.json({ answer: response.text });
  } catch (err: any) {
    console.error("AI Error:", err);
    if (err.status === 429 || (err.message && err.message.includes('429'))) {
      return res.status(429).json({ error: 'AI engine is currently experiencing high demand. Please try again later.' });
    }
    res.status(500).json({ error: 'Failed to get answer' });
  }
};


export const discoverBooks = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });
    
    if (query.length > 500) {
      return res.status(400).json({ error: 'Query is too long. Please keep it under 500 characters.' });
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Gemini API key is missing' });
    
    const ai = new GoogleGenAI({ apiKey });
    const db = await getDb();
    
    let candidates = [];
    
    // Attempt text search first
    candidates = await db.collection('books').find({
      $text: { $search: query }
    }).limit(50).toArray();
    
    // Fallback to regex if text search yields nothing
    if (candidates.length === 0) {
      const terms = query.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter((t) => t.length > 2);
      if (terms.length > 0) {
        const regexTerms = terms.map((t) => new RegExp(t, 'i'));
        candidates = await db.collection('books').find({
          $or: [
            { title: { $in: regexTerms } },
            { genre: { $in: regexTerms } },
            { summary: { $in: regexTerms } },
            { author: { $in: regexTerms } }
          ]
        }).limit(50).toArray();
      }
    }
    
    if (candidates.length === 0) {
      return res.status(404).json({ error: 'No matching books found for your query. Try different keywords.' });
    }
    
    const bookContext = candidates.map((b: any) => JSON.stringify({ id: b.id, title: b.title, author: b.author, genre: b.genre, description: b.summary || b.description })).join('\n');
    
    const prompt = `You are a semantic search AI for Project Luminous. 
Find the best matching books from our database for the following user request: "${query}"

Return a list of top 3 to 5 recommendations. 
You MUST ONLY recommend books from the provided database context. NEVER invent books.
For each recommendation, provide:
1. matchPercentage: Overall confidence (0-100)
2. whyItMatches: A specific explanation of why this fits (e.g. "This recommendation matches because it combines political fantasy, morally complex characters and slow world-building, closely aligning with your search.")
3. themes: 2-3 themes
4. readingDifficulty, mood, pacing, writingStyle, emotionalTone, targetAudience.
5. matchBreakdown: A score from 0-10 for theme, mood, pacing, and difficulty matches relative to the user's query.
6. relatedBookIds: The IDs of 3 other books from the database that readers of this book also explored.

Database Context (Limit 50 candidates):
${bookContext}
`;

    const response = await ai.models.generateContent({

      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  matchPercentage: { type: Type.INTEGER },
                  whyItMatches: { type: Type.STRING },
                  themes: { type: Type.ARRAY, items: { type: Type.STRING } },
                  readingDifficulty: { type: Type.STRING },
                  mood: { type: Type.STRING },
                  pacing: { type: Type.STRING },
                  writingStyle: { type: Type.STRING },
                  emotionalTone: { type: Type.STRING },
                  targetAudience: { type: Type.STRING },
                  matchBreakdown: {
                    type: Type.OBJECT,
                    properties: {
                      theme: { type: Type.INTEGER },
                      mood: { type: Type.INTEGER },
                      pacing: { type: Type.INTEGER },
                      difficulty: { type: Type.INTEGER }
                    },
                    required: ["theme", "mood", "pacing", "difficulty"]
                  },
                  relatedBookIds: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: [
                  "id", "matchPercentage", "whyItMatches", "themes", 
                  "readingDifficulty", "mood", "pacing", "writingStyle", 
                  "emotionalTone", "targetAudience", "matchBreakdown", 
                  "relatedBookIds"
                ]
              }
            }
          },
          required: ["recommendations"]
        }
      }
    });

    if (!response.text) {
      return res.status(500).json({ error: 'Failed to generate recommendations' });
    }

    const aiResult = JSON.parse(response.text);
    
    // Map IDs back to full book objects and related books
    const recommendedBooks = aiResult.recommendations.map((rec: any) => {
      const bookDetails = books.find(b => b.id === rec.id);
      if (!bookDetails) return null;
      
      const relatedBooks = (rec.relatedBookIds || [])
        .map((relId: string) => books.find(b => b.id === relId))
        .filter(Boolean)
        .slice(0, 3);
        
      return {
        ...rec,
        book: bookDetails,
        relatedBooks
      };
    }).filter(Boolean);
    
    // Sort by match percentage descending
    recommendedBooks.sort((a: any, b: any) => b.matchPercentage - a.matchPercentage);

    res.json(recommendedBooks);
  } catch (err: any) {
    console.error("AI Discovery Error:", err);
    if (err.status === 429 || (err.message && err.message.includes('429'))) {
      return res.status(429).json({ error: 'AI engine is currently experiencing high demand. Please try again later.' });
    }
    res.status(500).json({ error: 'Failed to process AI discovery. Please try refining your search.' });
  }
};

export const getAiOverview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    
    const book = await db.collection('books').findOne({ id });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    
    // Use cached overview if available
    if (book.aiOverviewText) {
      return res.json({ overview: book.aiOverviewText });
    }
    
    // Otherwise, generate it
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Gemini API key is missing' });
    
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `You are a literary assistant for Project Luminous. 
Generate a concise, spoiler-free overview of the book "${book.title}" by ${book.author}.
Include:
- What the book is about
- Main themes
- Reading experience
- Who might enjoy it

Do NOT generate a full plot summary. Do NOT introduce spoilers. Do NOT use markdown. Just provide a natural, readable paragraph or two.

Context:
Description: ${book.summary || book.description}
Genres: ${book.genre?.join(', ')}
${book.aiSummary ? 'Insights: ' + book.aiSummary.join('. ') : ''}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    if (!response.text) {
      throw new Error("Failed to generate overview text");
    }

    const overviewText = response.text.trim();
    
    // Cache it in the database
    await db.collection('books').updateOne(
      { id },
      { $set: { aiOverviewText: overviewText } }
    );
    
    res.json({ overview: overviewText });
  } catch (err: any) {
    console.error("AI Overview Error:", err);
    if (err.status === 429 || (err.message && err.message.includes('429'))) {
      return res.status(429).json({ error: 'AI engine is currently experiencing high demand. Please try again later.' });
    }
    res.status(500).json({ error: 'Failed to generate overview' });
  }
};

export const getReviewDigest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    
    const book = await db.collection('books').findOne({ id });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    
    const reviews = await db.collection('reviews').find({ bookId: id }).toArray();
    
    // We want at least some reviews to form a community opinion. 
    // Let's say if it's 0, we can't do it.
    if (reviews.length === 0) {
       return res.json({ notEnoughReviews: true });
    }

    // Determine the current version of the reviews
    const currentReviewVersion = book.reviewUpdatedAt || reviews.length;

    // Check cache
    if (book.reviewDigest && book.reviewDigest.version === currentReviewVersion) {
      return res.json(book.reviewDigest.data);
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Gemini API key is missing' });
    
    const ai = new GoogleGenAI({ apiKey });
    
    const reviewsText = reviews.map((r: any) => `Rating: ${r.rating}/5. Review: ${r.text}`).join('\n\n');
    
    const prompt = `You are a literary analyst for Project Luminous. 
Analyze the following community reviews for the book "${book.title}" by ${book.author} and create a review digest.
Do NOT invent opinions or facts. ONLY use the provided reviews.

Reviews:
${reviewsText}

Provide your response matching this JSON schema:
- summary: A concise overall community opinion and spoiler-free summary
- pros: Array of things readers loved (max 4)
- cons: Array of things readers disliked (max 4)
- readingExperience: A brief description of the reading experience
- writingStyle: A brief description of the writing style
- pacing: A brief description of the pacing
- difficulty: A brief description of the difficulty
- recommendedFor: A brief description of who should read it
- notRecommendedFor: A brief description of who might not enjoy it
- confidence: A score from 0-100 indicating how strong the consensus is based on the reviews`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            pros: { type: Type.ARRAY, items: { type: Type.STRING } },
            cons: { type: Type.ARRAY, items: { type: Type.STRING } },
            readingExperience: { type: Type.STRING },
            writingStyle: { type: Type.STRING },
            pacing: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            recommendedFor: { type: Type.STRING },
            notRecommendedFor: { type: Type.STRING },
            confidence: { type: Type.INTEGER }
          },
          required: ["summary", "pros", "cons", "readingExperience", "writingStyle", "pacing", "difficulty", "recommendedFor", "notRecommendedFor", "confidence"]
        }
      }
    });

    if (!response.text) {
      return res.status(500).json({ error: 'Failed to generate review digest' });
    }

    const digestData = JSON.parse(response.text);

    // Cache the result
    await db.collection('books').updateOne(
      { id },
      { $set: { reviewDigest: { version: currentReviewVersion, data: digestData } } }
    );

    res.json(digestData);
  } catch (err: any) {
    console.error("Review Digest Error:", err);
    if (err.status === 429 || (err.message && err.message.includes('429'))) {
      return res.status(429).json({ error: 'AI engine is currently experiencing high demand. Please try again later.' });
    }
    res.status(500).json({ error: 'Failed to generate review digest. Please try again later.' });
  }
};
