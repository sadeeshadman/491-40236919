import { Schema, model, models } from 'mongoose';
import {
  draftExpiryDays,
  inspectionStatusValues,
  propertyTypeValues,
  urgencyValues,
} from '../inspections/templates';

function getDraftExpiryDate() {
  return new Date(Date.now() + draftExpiryDays * 24 * 60 * 60 * 1000);
}

const FindingSchema = new Schema(
  {
    component: { type: String, required: true, trim: true },
    condition: { type: String, required: true, trim: true },
    implication: { type: String, required: true, trim: true },
    recommendation: { type: String, required: true, trim: true },
    urgency: { type: String, required: true, enum: urgencyValues },
    imageUrls: { type: [String], default: [] },
  },
  { _id: false },
);

const SectionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    isApplicable: { type: Boolean, required: true, default: true },
    limitations: { type: String, default: '', trim: true },
    findings: { type: [FindingSchema], default: [] },
  },
  { _id: false },
);

const InspectionSchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
    propertyAddress: { type: String, required: true, trim: true },
    propertyType: { type: String, required: true, enum: propertyTypeValues },
    status: { type: String, required: true, enum: inspectionStatusValues, default: 'Draft' },
    expiresAt: {
      type: Date,
      default: function getDefaultExpiry(this: { status?: string }) {
        return this.status === 'Draft' ? getDraftExpiryDate() : undefined;
      },
    },
    sections: { type: [SectionSchema], default: [] },
  },
  { timestamps: true },
);

export const Inspection = models.Inspection || model('Inspection', InspectionSchema);
