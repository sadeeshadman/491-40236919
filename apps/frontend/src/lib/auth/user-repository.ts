import { type ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db/mongodb';

type UserDocument = {
  _id: ObjectId;
  email?: string;
  name?: string;
  role?: string;
  password?: string;
  passwordHash?: string;
  hashedPassword?: string;
};

export type AuthUserRecord = {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  passwordHash: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getPasswordHash(user: UserDocument) {
  if (typeof user.passwordHash === 'string') {
    return user.passwordHash;
  }

  if (typeof user.hashedPassword === 'string') {
    return user.hashedPassword;
  }

  if (typeof user.password === 'string') {
    return user.password;
  }

  return null;
}

export async function findUserByEmail(email: string): Promise<AuthUserRecord | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const db = await getMongoDb();
  const usersCollection = db.collection<UserDocument>('Users');

  let user = await usersCollection.findOne({ email: normalizedEmail });

  if (!user) {
    const emailPattern = new RegExp(`^${escapeRegExp(normalizedEmail)}$`, 'i');
    user = await usersCollection.findOne({ email: emailPattern });
  }

  if (!user || typeof user.email !== 'string') {
    return null;
  }

  return {
    id: user._id.toHexString(),
    email: normalizeEmail(user.email),
    name: typeof user.name === 'string' ? user.name : null,
    role: typeof user.role === 'string' ? user.role : null,
    passwordHash: getPasswordHash(user),
  };
}
