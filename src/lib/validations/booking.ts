import { z } from "zod";

export const doctorScheduleItemSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  dayName: z.string().min(1, "Nama hari wajib diisi"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format jam mulai harus HH:mm"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format jam selesai harus HH:mm"),
  slotDurationMinutes: z.number().min(10).max(120).default(30),
});

export const updateDoctorScheduleSchema = z.object({
  doctorId: z.string().optional(), // Diperlukan jika Admin yang mengedit jadwal dokter lain
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  schedule: z.array(doctorScheduleItemSchema),
});

export type UpdateDoctorScheduleInput = z.infer<typeof updateDoctorScheduleSchema>;

export const createAppointmentSchema = z.object({
  doctorId: z.string().min(1, "Dokter wajib dipilih"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format waktu harus HH:mm"),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(["confirmed", "cancelled"], {
    required_error: "Status baru wajib ditentukan",
  }),
});

export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
