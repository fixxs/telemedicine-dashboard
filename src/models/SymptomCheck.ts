import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAiResponse {
  possibleConditions: string[];
  urgencyLevel: "low" | "medium" | "high" | "emergency";
  recommendedSpecialization: string;
  summaryText: string;
  disclaimer: string;
  emergencyWarning?: string | null;
}

export interface ISymptomCheck extends Document {
  _id: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  symptoms: string[];
  duration?: string;
  severity?: string;
  additionalNotes?: string;
  aiResponse: IAiResponse;
  disclaimerShown: boolean;
  createdAt: Date;
}

const SymptomCheckSchema = new Schema<ISymptomCheck>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    symptoms: [{ type: String, required: true }],
    duration: { type: String, default: "1-3 hari" },
    severity: { type: String, default: "sedang" },
    additionalNotes: { type: String, default: "" },
    aiResponse: {
      possibleConditions: [{ type: String }],
      urgencyLevel: {
        type: String,
        enum: ["low", "medium", "high", "emergency"],
        default: "medium",
      },
      recommendedSpecialization: { type: String, default: "Dokter Umum" },
      summaryText: { type: String, default: "" },
      disclaimer: { type: String, required: true },
      emergencyWarning: { type: String, default: null },
    },
    disclaimerShown: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const SymptomCheck: Model<ISymptomCheck> =
  mongoose.models.SymptomCheck || mongoose.model<ISymptomCheck>("SymptomCheck", SymptomCheckSchema);
