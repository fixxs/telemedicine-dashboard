import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMedicine {
  name: string;
  dosage: string;
  instruction: string;
}

export interface IPrescription extends Document {
  _id: mongoose.Types.ObjectId;
  medicalRecordId: mongoose.Types.ObjectId;
  medicines: IMedicine[];
}

const PrescriptionSchema = new Schema<IPrescription>(
  {
    medicalRecordId: { type: Schema.Types.ObjectId, ref: "MedicalRecord", required: true },
    medicines: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        instruction: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const Prescription: Model<IPrescription> =
  mongoose.models.Prescription || mongoose.model<IPrescription>("Prescription", PrescriptionSchema);
