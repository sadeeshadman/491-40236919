import { Schema, model, models } from 'mongoose';

const cannedCommentCategories = [
  'Electrical',
  'Plumbing',
  'Roofing',
  'Exterior',
  'Structure',
  'Interior',
  'HVAC',
  'Insulation & Ventilation',
  'Attic',
  'Basement',
  'Garage',
  'Appliances',
  'Grounds',
  'Safety',
  'General',
] as const;

export type CannedCommentCategory = (typeof cannedCommentCategories)[number];

const CannedCommentSchema = new Schema(
  {
    category: { type: String, required: true, enum: cannedCommentCategories, trim: true },
    title: { type: String, required: true, trim: true },
    condition: { type: String, required: true, trim: true },
    implication: { type: String, required: true, trim: true },
    recommendation: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

CannedCommentSchema.index({ category: 1, title: 1 });

export const CannedComment = models.CannedComment || model('CannedComment', CannedCommentSchema);
