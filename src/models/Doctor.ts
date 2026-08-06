import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDoctorSchedule {
  dayOfWeek: number; // 0 = Minggu, 1 = Senin, 2 = Selasa, 3 = Rabu, 4 = Kamis, 5 = Jumat, 6 = Sabtu
  dayName: string;   // "Senin", "Selasa", dll.
  startTime: string; // HH:mm, e.g. "08:00"
  endTime: string;   // HH:mm, e.g. "12:00"
  slotDurationMinutes: number; // e.g. 30
}

export interface IDoctor extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  specialization: string;
  licenseNumber: string;
  schedule: IDoctorSchedule[];
}

const DoctorSchema = new Schema<IDoctor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    specialization: { type: String, default: "Dokter Umum" },
    licenseNumber: { type: String, default: "-" },
    schedule: [
      {
        dayOfWeek: { type: Number, required: true },
        dayName: { type: String, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        slotDurationMinutes: { type: Number, default: 30 },
      },
    ],
  },
  { timestamps: true }
);

export const Doctor: Model<IDoctor> = mongoose.models.Doctor || mongoose.model<IDoctor>("Doctor", DoctorSchema);
