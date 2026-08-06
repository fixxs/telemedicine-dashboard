import { z } from "zod";

export const createMedicalRecordSchema = z.object({
  appointmentId: z.string().min(1, "Appointment ID wajib diisi"),
  chiefComplaint: z.string().min(3, "Keluhan utama minimal 3 karakter"),
  diagnosis: z.string().min(3, "Diagnosis minimal 3 karakter"),
  notes: z.string().optional(),
  vitalSigns: z
    .object({
      bloodPressure: z.string().optional(),
      temperature: z.preprocess(
        (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
        z.number().positive("Suhu tubuh harus positif").optional()
      ),
      heartRate: z.preprocess(
        (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
        z.number().positive("Denyut nadi harus positif").optional()
      ),
    })
    .optional(),
});

export const updateMedicalRecordSchema = createMedicalRecordSchema.omit({ appointmentId: true });

export type CreateMedicalRecordInput = z.infer<typeof createMedicalRecordSchema>;
export type UpdateMedicalRecordInput = z.infer<typeof updateMedicalRecordSchema>;
