import { MongoClient, ServerApiVersion, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ override: true });

let clientPromise: Promise<MongoClient> | null = null;
let indexesCreated = false;
let memoryServer: any = null;

export const getDbClient = async (): Promise<MongoClient> => {
  if (clientPromise) return clientPromise;
  
  let uri = process.env.MONGODB_URI;
  
  if (!uri) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('No MONGODB_URI found, starting in-memory MongoDB...');
      const mod = await import('mongodb-memory-server');
      memoryServer = await mod.MongoMemoryServer.create();
      uri = memoryServer.getUri();
      console.log('In-memory MongoDB started at', uri);
    } else {
      throw new Error("MONGODB_URI is not defined in the environment variables.");
    }
  }
  
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    }
  });
  
  clientPromise = client.connect();
  return clientPromise;
};

export const getDb = async (): Promise<Db> => {
  const c = await getDbClient();
  const db = c.db('library');
  
  if (!indexesCreated) {
    indexesCreated = true;
    Promise.all([
      db.collection('books').createIndex({ id: 1 }),
      db.collection('books').createIndex({ title: "text", author: "text", genre: "text", summary: "text", description: "text" }),
      db.collection('reviews').createIndex({ bookId: 1 }),
      db.collection('reviews').createIndex({ userId: 1 }),
      db.collection('users').createIndex({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } }),
      db.collection('users').createIndex({ resetPasswordToken: 1 })
    ]).catch(err => console.error("Failed to create indexes", err));
    
    // Seed some mock books if empty and using in-memory db
    if (!process.env.MONGODB_URI) {
       const count = await db.collection('books').countDocuments();
       if (count === 0) {
         console.log("Seeding in-memory database with mock books...");
         const mockBooks = [
           { id: "1", title: "The Martian", author: "Andy Weir", genre: ["Sci-Fi", "Adventure"], summary: "An astronaut gets stranded on Mars.", description: "A highly realistic science fiction story about survival on Mars.", rating: 4.8, reviewCount: 150, publicationDate: "2014-02-11" },
           { id: "2", title: "Project Hail Mary", author: "Andy Weir", genre: ["Sci-Fi", "Thriller"], summary: "A lone astronaut must save the earth.", description: "A man wakes up on a spaceship with amnesia.", rating: 4.9, reviewCount: 200, publicationDate: "2021-05-04" },
           { id: "3", title: "Dune", author: "Frank Herbert", genre: ["Sci-Fi", "Fantasy"], summary: "A young noble on a desert planet.", description: "Epic science fiction about politics, religion, and ecology.", rating: 4.7, reviewCount: 500, publicationDate: "1965-08-01" },
           { id: "4", title: "Foundation", author: "Isaac Asimov", genre: ["Sci-Fi"], summary: "A mathematician predicts the fall of an empire.", description: "The Foundation series is a classic of the genre.", rating: 4.6, reviewCount: 300, publicationDate: "1951-05-01" },
           { id: "5", title: "The Hobbit", author: "J.R.R. Tolkien", genre: ["Fantasy", "Adventure"], summary: "A hobbit goes on an unexpected journey.", description: "A classic fantasy novel about a hobbit named Bilbo.", rating: 4.8, reviewCount: 400, publicationDate: "1937-09-21" },
         ];
         await db.collection('books').insertMany(mockBooks);
       }
    }
  }
  
  return db;
};
