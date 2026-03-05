import { Schema, model, models } from 'mongoose';

const QuoteSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, default: 'new' },
  },
  { timestamps: true },
);

export const Quote = models.Quote || model('Quote', QuoteSchema);
