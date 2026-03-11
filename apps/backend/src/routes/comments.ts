import { Router } from 'express';
import { dbConnect } from '../lib/mongodb';
import { CannedComment } from '../models/CannedComment';

export const commentsRouter = Router();

commentsRouter.get('/', async (_req, res) => {
  try {
    await dbConnect();
    const comments = await CannedComment.find({}, '-__v').sort({ category: 1, title: 1 }).lean();
    return res.json({ comments });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return res.status(500).json({ error: message });
  }
});
