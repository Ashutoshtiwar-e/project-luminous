import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function migrate() {
  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db('library');
  const books = await db.collection('books').find({}).toArray();
  
  for (const book of books) {
    if (book.reviews && book.reviews.length > 0) {
      for (const review of book.reviews) {
        // Only insert if it doesn't exist
        const existing = await db.collection('reviews').findOne({ id: review.id });
        if (!existing) {
          await db.collection('reviews').insertOne({
            ...review,
            bookId: book.id
          });
        }
      }
    }
  }
  
  // Clean up old reviews array from books to normalize? 
  // No, let's keep it for a moment just in case, or we can just remove it to enforce the new schema
  await db.collection('books').updateMany({}, { $unset: { reviews: "" } });
  
  console.log("Migration done");
  process.exit(0);
}

migrate().catch(console.error);
