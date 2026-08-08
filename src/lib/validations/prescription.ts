import { z } from "zod";

export const medicineItemSchema = z.object({
  name: z.string().min(2, "Nama obat minimal 2 karakter"),
  dosage: z.string().min(1, "Dosis obat wajib diisi (misal: 1 tablet)"),
  frequency: z.string().min(1, "Aturan minum wajib diisi (misal: 3x1 sehari sesudah makan)"),
  duration: z.string().min(1, "Durasi minum wajib diisi (misal: 5 hari)"),
  notes: z.string().optional(),
});

export const prescriptionInputSchema = z.object({
  medicalRecordId: z.string().min(1, "ID Rekam Medis wajib diisi"),
  medicines: z.array(medicineItemSchema).min(1, "Resep harus memuat setidaknya 1 item obat"),
  generalNotes: z.string().optional(),
});

export type MedicineItemInput = z.infer<typeof medicineItemSchema>;
export type PrescriptionInput = z.infer<typeof prescriptionInputSchema>;
