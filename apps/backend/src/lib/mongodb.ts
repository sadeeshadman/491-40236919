import 'dotenv/config';
import mongoose from 'mongoose';

const defaultMongoUri = 'mongodb://admin:admin123@localhost:27018/constein?authSource=admin';
const mongodbUri =
  process.env.MONGODB_URI ?? (process.env.NODE_ENV === 'production' ? undefined : defaultMongoUri);

if (!mongodbUri) throw new Error('Missing MONGODB_URI environment variable');
const MONGODB_URI: string = mongodbUri;

type Cache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalAny = global as unknown as { mongoose?: Cache };
const cached: Cache = globalAny.mongoose ?? { conn: null, promise: null };
globalAny.mongoose = cached;

export async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
