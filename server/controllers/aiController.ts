import { Request, Response } from 'express';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { getDb } from '../config/db';

const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("[AI Service] Initializing Gemini API...");
  console.log("[AI Service] GEMINI_API_KEY is present:", !!apiKey);
  console.log("[AI Service] GEMINI_API_KEY starts with:", apiKey ? apiKey.substring(0, 4) + "..." : "undefined");
  
  if (!apiKey) {
    console.error("[AI Service] Error: Gemini API key is completely missing.");
    throw new Error('Gemini API key is missing. Please configure the GEMINI_API_KEY environment variable.');
  }
  
  if (apiKey === 'MY_GEMINI_API_KEY' || apiKey.includes('YOUR_API_KEY')) {
    console.error("[AI Service] Error: Gemini API key is a placeholder.");
    throw new Error('Gemini API key is set to a placeholder ("' + apiKey + '"). Please provide a valid GEMINI_API_KEY.');
  }
  
  return new GoogleGenAI({ apiKey });
};

async function fetchAndSeedGoogleBooks(query: string, db: any) {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&langRestrict=en`);
    const data = await res.json();
    if (!data.items) return;

    const books = data.items.map((item: any) => {
      const vol = item.volumeInfo;
      return {
        id: item.id,
        title: vol.title || 'Unknown Title',
        author: vol.authors ? vol.authors.join(', ') : 'Unknown Author',
        genre: vol.categories || [],
        publicationDate: vol.publishedDate || 'Unknown',
        rating: vol.averageRating || 0,
        coverImage: vol.imageLinks ? vol.imageLinks.thumbnail.replace('http:', 'https:') : '',
        summary: vol.description || '',
        pageCount: vol.pageCount || 0,
        publisher: vol.publisher || 'Unknown Publisher'
      };
    }).filter((b: any) => b.summary.length > 50);

    if (books.length > 0) {
      const bulkOps = books.map((b: any) => ({
        updateOne: {
          filter: { id: b.id },
          update: { $set: b },
          upsert: true
        }
      }));
      await db.collection('books').bulkWrite(bulkOps, { ordered: false });
    }
  } catch (err) {
    console.error("Failed to seed books from Google Books API:", err);
  }
}

export const askAboutBook = async (req: Request, res: Response) => {
  try {
    const { query, bookId } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });
    if (query.length > 200) return res.status(400).json({ error: 'Query too long' });
    if (!bookId) return res.status(400).json({ error: 'Book ID is required' });

    const db = await getDb();
    const book = await db.collection('books').findOne({ id: bookId });
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const prompt = `You are a helpful AI assistant in a book library application.
A user is asking a question about the book "${book.title}" by ${book.author}.

Here are the details we have about the book:
- Title: ${book.title}
- Author: ${book.author}
- Genres: ${(book.genre || []).join(', ')}
- Published: ${book.publicationDate}
- Rating: ${book.rating}
- Summary: ${book.summary || ''}
- Description: ${book.description || ''}

User's question: "${query}"

Guidelines:
1. Answer the user's question directly and in a friendly, conversational tone.
2. If the user asks about basic facts (author, genre, publication date, rating, summary), use the provided details to answer accurately.
3. If the user asks a more complex question or something not explicitly in the details, use your general knowledge as an AI to provide a graceful, informed response about this specific book, but do not hallucinate details that contradict the provided summary.
4. Keep the response concise, usually 1-3 paragraphs.`;

    const response = await getAi().models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });
    res.json({ answer: response.text });
  } catch (err: any) {
    console.error("AI Assistant Error:", err);
    let errorMessage = 'Failed to process AI query.';
    if (err && (err.status === 429 || err.status === 'RESOURCE_EXHAUSTED' || (err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED'))))) {
      errorMessage = "AI services are currently busy or over quota. Please try again later.";
    }
    res.status(500).json({ error: errorMessage });
  }
};

export const discoverBooks = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });
    if (query.length > 200) return res.status(400).json({ error: 'Query too long' });

    const db = await getDb();
    let candidates: any[] = [];
    
    try {
      candidates = await db.collection('books').find({ $text: { $search: query } }).limit(20).toArray();
    } catch (e) {}

    if (candidates.length === 0) {
      const terms = query.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter((t: string) => t.length > 2);
      if (terms.length > 0) {
        const regexTerms = terms.map((t: string) => new RegExp(t, 'i'));
        candidates = await db.collection('books').find({
          $or: [
            { title: { $in: regexTerms } },
            { genre: { $in: regexTerms } },
            { summary: { $in: regexTerms } },
            { author: { $in: regexTerms } }
          ]
        }).limit(20).toArray();
      }
    }

    if (candidates.length < 5) {
      await fetchAndSeedGoogleBooks(query, db);
      
      const terms = query.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter((t: string) => t.length > 2);
      if (terms.length > 0) {
        const regexTerms = terms.map((t: string) => new RegExp(t, 'i'));
        candidates = await db.collection('books').find({
          $or: [
            { title: { $in: regexTerms } },
            { genre: { $in: regexTerms } },
            { summary: { $in: regexTerms } },
            { author: { $in: regexTerms } }
          ]
        }).limit(20).toArray();
      }
    }

    if (candidates.length === 0) {
       candidates = await db.collection('books').aggregate([{ $sample: { size: 20 } }]).toArray();
    }

    const booksContext = candidates.map((b: any) => 
      `ID: ${b.id}\nTitle: ${b.title}\nAuthor: ${b.author}\nGenres: ${(b.genre||[]).join(',')}\nSummary: ${b.summary || ''}`
    ).join('\n---\n');

    const prompt = `A user is looking for book recommendations with this query: "${query}".

Here are some candidate books from our database:
---
${booksContext}
---

Analyze the user's query and the candidate books. Select the best 1 to 5 books that match the query.

Return the result as a JSON array where each object has the exact following structure:
{
  "id": "string (the exact ID of the book)",
  "matchPercentage": number (0-100),
  "whyItMatches": "string (1-2 sentences explaining why)",
  "themes": ["string", "string"],
  "readingDifficulty": "string (e.g. Easy, Moderate, Advanced)",
  "mood": "string",
  "pacing": "string",
  "writingStyle": "string",
  "emotionalTone": "string",
  "targetAudience": "string",
  "matchBreakdown": {
    "theme": number (1-10),
    "mood": number (1-10),
    "pacing": number (1-10),
    "difficulty": number (1-10)
  }
}`;

    const response = await getAi().models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    let aiResults = [];
    try {
      aiResults = JSON.parse(response.text || '[]');
      if (!Array.isArray(aiResults)) aiResults = [aiResults];
    } catch (e) {
      aiResults = [];
    }

    // Attach full book objects
    const finalResults = [];
    for (const res of aiResults) {
      const book = candidates.find((c: any) => c.id === res.id);
      if (book) {
        finalResults.push({ ...res, book });
      }
    }

    if (finalResults.length === 0) {
      return res.status(404).json({ error: 'No matching books found for your query. Try different keywords.' });
    }

    res.json(finalResults);
  } catch (err: any) {
    console.error("AI Discovery Error:", err);
    let errorMessage = 'Failed to process AI discovery. Please try refining your search.';
    if (err && (err.status === 429 || err.status === 'RESOURCE_EXHAUSTED' || (err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED'))))) {
      errorMessage = "AI services are currently busy or over quota. Please try again later.";
    }
    res.status(500).json({ error: errorMessage });
  }
};

export const getAiOverview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    
    const book = await db.collection('books').findOne({ id });
    if (!book) return res.status(404).json({ error: 'Book not found' });

    if (book.aiOverviewText) {
      return res.json({ overview: book.aiOverviewText });
    }

    const prompt = `You are an expert book reviewer.
Write an engaging, insightful overview (3-4 sentences) for the book "${book.title}" by ${book.author}. 
Genres: ${(book.genre || []).join(', ')}.
Summary: ${book.summary || book.description || ''}.

Your overview should:
1. Capture the core essence and mood of the book.
2. Explain what makes it compelling and why a reader would enjoy it.
3. Use an evocative and professional tone. Do not just summarize the plot again.`;

    const response = await getAi().models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const overviewText = response.text || '';
    if (overviewText) {
      await db.collection('books').updateOne(
        { id },
        { $set: { aiOverviewText: overviewText } }
      );
    }
    res.json({ overview: overviewText });
  } catch (err: any) {
    console.error("AI Overview Error:", err);
    let errorMessage = 'Failed to generate overview';
    if (err && (err.status === 429 || err.status === 'RESOURCE_EXHAUSTED' || (err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED'))))) {
      errorMessage = "AI services are currently busy or over quota. Please try again later.";
    }
    res.status(500).json({ error: errorMessage });
  }
};

export const getReviewDigest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    
    const book = await db.collection('books').findOne({ id });
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const reviews = await db.collection('reviews').find({ bookId: id }).sort({ date: -1 }).limit(30).toArray();
    if (reviews.length === 0) {
        return res.json({ notEnoughReviews: true });
    }

    const currentReviewVersion = book.reviewUpdatedAt || reviews.length;
    if (book.reviewDigest && book.reviewDigest.version === currentReviewVersion) {
      return res.json(book.reviewDigest.data);
    }

    const reviewsText = reviews.map((r: any) => `Rating: ${r.rating}/5\nReview: ${r.content}`).join('\n---\n');

    const prompt = `Analyze the following reader reviews for the book "${book.title}" by ${book.author}.
Reviews:
---
${reviewsText}
---

Create a comprehensive digest of these reviews. Return the result as a JSON object with this exact structure:
{
  "summary": "string (2-3 sentences summarizing overall sentiment)",
  "pros": ["string", "string", "string"],
  "cons": ["string", "string"],
  "readingExperience": "string (1 sentence)",
  "writingStyle": "string (1 sentence)",
  "pacing": "string (1 sentence)",
  "difficulty": "string (e.g. Easy, Moderate, Advanced, Complex)",
  "recommendedFor": "string (1 sentence)",
  "notRecommendedFor": "string (1 sentence)",
  "confidence": number (0-100, based on consistency of reviews)
}`;

    const response = await getAi().models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    let digestData;
    try {
      digestData = JSON.parse(response.text || '{}');
    } catch (e) {
      throw new Error("Failed to parse JSON response");
    }

    await db.collection('books').updateOne(
      { id },
      { $set: { reviewDigest: { version: currentReviewVersion, data: digestData } } }
    );
    res.json(digestData);
  } catch (err: any) {
    console.error("Review Digest Error:", err);
    let errorMessage = 'Failed to generate review digest. Please try again later.';
    if (err && (err.status === 429 || err.status === 'RESOURCE_EXHAUSTED' || (err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED'))))) {
      errorMessage = "AI services are currently busy or over quota. Please try again later.";
    }
    res.status(500).json({ error: errorMessage });
  }
};
