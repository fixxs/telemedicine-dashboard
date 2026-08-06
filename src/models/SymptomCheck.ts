import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISymptomCheck extends Document {
  _id: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  symptoms: string[];
  aiResponse: string;
  disclaimerShown: boolean;
  createdAt: Date;
}

const SymptomCheckSchema = new Schema<ISymptomCheck>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    symptoms: [{ type: String, required: true }],
    aiResponse: { type: String, required: true },
    disclaimerShown: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const SymptomCheck: Model<ISymptomCheck> =
  mongoose.models.SymptomCheck || mongoose.model<ISymptomCheck>("SymptomCheck", SymptomCheckSchema);
