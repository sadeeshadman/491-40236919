import { Router } from 'express';
import { z } from 'zod';
import { dbConnect } from '../lib/mongodb';
import { Quote } from '../models/Quote';
import { sendQuoteEmails } from '../lib/email';

const createQuoteSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  phone: z.string().trim().optional(),
  typeOfService: z.string().trim().optional(),
  specification: z.string().trim().optional(),
  message: z.string().trim().optional(),
  requestDetails: z.string().trim().optional(),
  preferredContactMethod: z.enum(['email', 'phone']).optional(),
  propertyLocation: z.string().trim().optional(),
  timeline: z.string().trim().optional(),
  sourcePage: z.string().trim().optional(),
});

export const quotesRouter = Router();

quotesRouter.post('/', async (req, res) => {
  try {
    await dbConnect();
    const parseResult = createQuoteSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    const payload = parseResult.data;
    const requestMessage = payload.requestDetails ?? payload.message;

    if (!requestMessage) {
      return res.status(400).json({ error: 'Request details are required' });
    }

    const quote = await Quote.create({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      typeOfService: payload.typeOfService,
      specification: payload.specification,
      message: requestMessage,
      preferredContactMethod: payload.preferredContactMethod,
      propertyLocation: payload.propertyLocation,
      timeline: payload.timeline,
      sourcePage: payload.sourcePage,
    });

    const emailResult = await sendQuoteEmails({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      typeOfService: payload.typeOfService ?? 'General Inquiry',
      specification: payload.specification,
      requestDetails: requestMessage,
      preferredContactMethod: payload.preferredContactMethod,
      propertyLocation: payload.propertyLocation,
      timeline: payload.timeline,
      sourcePage: payload.sourcePage,
    });

    return res.status(201).json({ quote, email: emailResult });
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
