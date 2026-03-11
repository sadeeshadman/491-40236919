import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { dbConnect } from '../lib/mongodb';
import { Inspection } from '../models/Inspection';
import {
  draftExpiryDays,
  getInitialSections,
  inspectionStatusValues,
  propertyTypeValues,
  type InspectionStatus,
  urgencyValues,
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

const findingSchema = z
  .object({
    component: z.string().trim().min(1),
    condition: z.string().trim().min(1),
    implication: z.string().trim().min(1),
    recommendation: z.string().trim().min(1),
    urgency: z.enum(urgencyValues),
    imageUrls: z.array(z.string().trim()).default([]),
  })
  .strict();

const sectionSchema = z
  .object({
    title: z.string().trim().min(1),
    isApplicable: z.boolean(),
    limitations: z.string().trim(),
    findings: z.array(findingSchema),
  })
  .strict();

const updateInspectionSchema = z
  .object({
    propertyAddress: z.string().trim().min(1),
    propertyType: z.enum(propertyTypeValues),
    status: z.enum(inspectionStatusValues),
    sections: z.array(sectionSchema),
  })
  .strict();

function isValidObjectId(value: string) {
  return mongoose.Types.ObjectId.isValid(value);
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

inspectionsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid inspection id' });
    }

    await dbConnect();

    const inspection = await Inspection.findById(id);

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    return res.json({ inspection });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return res.status(500).json({ error: message });
  }
});

inspectionsRouter.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid inspection id' });
    }

    const parseResult = updateInspectionSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    await dbConnect();

    const payload = parseResult.data;
    const expiresAt = payload.status === 'Draft' ? getDraftExpiryDate() : null;

    const inspection = await Inspection.findByIdAndUpdate(
      id,
      {
        propertyAddress: payload.propertyAddress,
        propertyType: payload.propertyType,
        status: payload.status,
        sections: payload.sections,
        expiresAt,
      },
      { new: true, runValidators: true },
    );

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    return res.json({ inspection });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return res.status(500).json({ error: message });
  }
});
