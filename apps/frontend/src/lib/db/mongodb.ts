import { MongoClient } from 'mongodb';

const DEFAULT_DB_NAME = 'constein';

type GlobalMongoCache = typeof globalThis & {
  _frontendMongoClientPromise?: Promise<MongoClient>;
};

const globalMongo = globalThis as GlobalMongoCache;

function getMongoUri() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI must be set for frontend authentication.');
  }

  return mongoUri;
}

function getMongoClientPromise() {
  if (process.env.NODE_ENV === 'development') {
    if (!globalMongo._frontendMongoClientPromise) {
      globalMongo._frontendMongoClientPromise = new MongoClient(getMongoUri()).connect();
    }

    return globalMongo._frontendMongoClientPromise;
  }

  return new MongoClient(getMongoUri()).connect();
}

export async function getMongoDb() {
  const dbName = process.env.MONGODB_DB_NAME ?? DEFAULT_DB_NAME;
  const client = await getMongoClientPromise();
  return client.db(dbName);
}
