import 'dotenv/config';
import mongoose from 'mongoose';

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }

  return value;
}

const MONGODB_URI = getRequiredEnv('MONGODB_URI');

type Cache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalAny = globalThis as typeof globalThis & { mongoose?: Cache };
let cached: Cache;

if (globalAny.mongoose) {
  cached = globalAny.mongoose;
} else {
  cached = { conn: null, promise: null };
  globalAny.mongoose = cached;
}

export async function dbConnect() {
  if (cached.conn) return cached.conn;

  cached.promise ??= mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
  });

  cached.conn = await cached.promise;
  return cached.conn;
}
