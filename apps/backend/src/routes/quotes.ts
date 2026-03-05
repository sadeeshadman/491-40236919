import { Router } from 'express';
import { z } from 'zod';
import { dbConnect } from '../lib/mongodb';
import { Quote } from '../models/Quote';

const createQuoteSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  message: z.string().min(1),
});

export const quotesRouter = Router();

quotesRouter.post('/', async (req, res) => {
  try {
    await dbConnect();
    const parseResult = createQuoteSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    const quote = await Quote.create(parseResult.data);
    return res.status(201).json({ quote });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return res.status(500).json({ error: message });
  }
});

quotesRouter.get('/', async (_req, res) => {
  try {
    await dbConnect();
    const quotes = await Quote.find().sort({ createdAt: -1 }).limit(20);
    return res.json({ quotes });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return res.status(500).json({ error: message });
  }
});
