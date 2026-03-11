import { Router } from 'express';
import { z } from 'zod';
import { dbConnect } from '../lib/mongodb';
import { Inspection } from '../models/Inspection';
import {
  draftExpiryDays,
  getInitialSections,
  propertyTypeValues,
  type InspectionStatus,
} from '../inspections/templates';

const startInspectionSchema = z
  .object({
    propertyAddress: z.string().trim().min(1),
    propertyType: z.enum(propertyTypeValues),
  })
  .strict();

function getDraftExpiryDate() {
  return new Date(Date.now() + draftExpiryDays * 24 * 60 * 60 * 1000);
}

export const inspectionsRouter = Router();

inspectionsRouter.post('/start', async (req, res) => {
  try {
    const parseResult = startInspectionSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    await dbConnect();

    const payload = parseResult.data;
    const status: InspectionStatus = 'Draft';
    const expiresAt = status === 'Draft' ? getDraftExpiryDate() : undefined;

    const inspection = await Inspection.create({
      propertyAddress: payload.propertyAddress,
      propertyType: payload.propertyType,
      status,
      expiresAt,
      sections: getInitialSections(payload.propertyType),
    });

    return res.status(201).json({ inspection });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return res.status(500).json({ error: message });
  }
});
