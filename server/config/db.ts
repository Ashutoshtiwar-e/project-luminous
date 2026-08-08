import { MongoClient, ServerApiVersion, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let clientPromise: Promise<MongoClient> | null = null;
let indexesCreated = false;

export const getDbClient = async (): Promise<MongoClient> => {
  if (clientPromise) return clientPromise;
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined in the environment variables.");
  }
  
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
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
      db.collection('users').createIndex({ email: 1 }, { unique: true }),
      db.collection('users').createIndex({ resetPasswordToken: 1 })
    ]).catch(err => console.error("Failed to create indexes", err));
  }
  
  return db;
};
