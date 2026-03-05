import { Router } from 'express';
import { dbConnect } from '../lib/mongodb';

export const healthRouter = Router();

healthRouter.get('/db', async (_req, res) => {
  try {
    await dbConnect();
    return res.json({ ok: true, db: 'connected' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return res.status(500).json({ ok: false, error: message });
  }
});
