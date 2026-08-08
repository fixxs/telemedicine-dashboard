import { z } from "zod";

export const createSymptomCheckSchema = z.object({
  symptoms: z
    .array(z.string().min(1, "Nama gejala tidak boleh kosong"))
    .min(1, "Pilih atau ketik setidaknya 1 gejala yang Anda rasakan"),
  duration: z.string().optional().default("1-3 hari"),
  severity: z.enum(["ringan", "sedang", "berat"]).optional().default("sedang"),
  additionalNotes: z.string().optional().default(""),
});

export type CreateSymptomCheckInput = z.infer<typeof createSymptomCheckSchema>;
