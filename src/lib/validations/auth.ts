import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerPatientSchema = z
  .object({
    name: z.string().min(2, "Nama lengkap minimal 2 karakter"),
    email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
    birthDate: z.string().optional(),
    gender: z.enum(["Laki-laki", "Perempuan"]).optional(),
    bloodType: z.enum(["A", "B", "AB", "O"]).optional(),
    allergies: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok dengan password",
    path: ["confirmPassword"],
  });

export type RegisterPatientInput = z.infer<typeof registerPatientSchema>;

export const createManagedUserSchema = z.object({
  name: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["admin", "dokter"], {
    required_error: "Role harus dipilihi (admin / dokter)",
  }),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
});

export type CreateManagedUserInput = z.infer<typeof createManagedUserSchema>;
