import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPatient extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  birthDate?: Date;
  gender?: "Laki-laki" | "Perempuan";
  bloodType?: "A" | "B" | "AB" | "O";
  allergies: string[];
}

const PatientSchema = new Schema<IPatient>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    birthDate: { type: Date },
    gender: { type: String, enum: ["Laki-laki", "Perempuan"] },
    bloodType: { type: String, enum: ["A", "B", "AB", "O"] },
    allergies: [{ type: String }],
  },
  { timestamps: true }
);

export const Patient: Model<IPatient> = mongoose.models.Patient || mongoose.model<IPatient>("Patient", PatientSchema);
