import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVitalSigns {
  bloodPressure?: string; // e.g. "120/80 mmHg"
  temperature?: number; // e.g. 36.6
  heartRate?: number; // e.g. 80
}

export interface IMedicalRecord extends Document {
  _id: mongoose.Types.ObjectId;
  appointmentId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  chiefComplaint: string;
  diagnosis: string;
  notes?: string;
  vitalSigns?: IVitalSigns;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalRecordSchema = new Schema<IMedicalRecord>(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
    chiefComplaint: { type: String, required: true },
    diagnosis: { type: String, required: true },
    notes: { type: String },
    vitalSigns: {
      bloodPressure: { type: String },
      temperature: { type: Number },
      heartRate: { type: Number },
    },
  },
  { timestamps: true }
);

export const MedicalRecord: Model<IMedicalRecord> =
  mongoose.models.MedicalRecord || mongoose.model<IMedicalRecord>("MedicalRecord", MedicalRecordSchema);
