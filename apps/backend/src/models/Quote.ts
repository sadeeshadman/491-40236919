import { Schema, model, models } from 'mongoose';

const QuoteSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    typeOfService: { type: String, trim: true },
    specification: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    preferredContactMethod: { type: String, trim: true },
    propertyLocation: { type: String, trim: true },
    timeline: { type: String, trim: true },
    sourcePage: { type: String, trim: true },
    status: { type: String, default: 'new' },
  },
  { timestamps: true },
);

export const Quote = models.Quote || model('Quote', QuoteSchema);
