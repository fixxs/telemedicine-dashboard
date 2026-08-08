import { GoogleGenerativeAI } from "@google/generative-ai";
import { IAiResponse } from "@/models/SymptomCheck";
import { ACTIVE_GEMINI_MODEL } from "./gemini-config";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const MODEL_NAME = ACTIVE_GEMINI_MODEL;

export async function analyzeSymptomsWithGemini(params: {
  symptoms: string[];
  duration?: string;
  severity?: string;
  additionalNotes?: string;
}): Promise<IAiResponse> {
  if (!GEMINI_API_KEY) {
    console.error("[Gemini Error] GEMINI_API_KEY is missing in environment variables.");
    throw new Error("Sistem AI Symptom Checker belum dikonfigurasi di server.");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2, // Low temperature for deterministic, reliable medical classification
    },
  });

  const prompt = `Anda adalah Asisten Skrining Gejala Medis Awal (AI Symptom Checker) untuk Rumah Sakit TeleMedika.

TUGAS UTAMA:
Menganalisis gejala yang dikeluhkan oleh pasien, memperkirakan 2-4 kemungkinan kondisi kesehatan umum, menentukan tingkat urgensi medis, dan merekomendasikan jenis dokter spesialisasi yang sesuai untuk konsultasi lanjutan.

ATURAN DAN BATASAN KETAT (MANDATORY MEDICAL GUARDRAILS):
1. DILARANG KERAS memberikan diagnosis pasti/final atau menyatakan bahwa pasien pasti menderita penyakit tertentu. Gunakan bahasa estimasi indikasi awal.
2. DILARANG KERAS meresepkan obat, menyebutkan nama obat keras/bebas, atau memberikan dosis obat apapun.
3. DILARANG KERAS menyuruh pasien membatalkan atau tidak perlu berkonsultasi dengan dokter.
4. DILARANG KERAS menggantikan keputusan klinis tenaga medis resmi.

DETEKSI GEJALA DARURAT (RED FLAGS DETECTOR):
Jika keluhan pasien mengandung indikasi kondisi gawat darurat seperti:
- Nyeri dada hebat, dada terasa ditekan berat, atau menjalar ke lengan/rahang
- Sesak napas berat / kesulitan bernapas parah
- Pendarahan hebat yang tidak kunjung berhenti
- Kehilangan kesadaran, pingsan, atau kebingungan mendadak
- Kelumpuhan separuh wajah/tubuh, bicara pelo (gejala stroke)
- Kejang berulang atau demam sangat tinggi (>39.5C) pada bayi/anak
MAKA:
Setel "urgencyLevel" menjadi "emergency", buat "emergencyWarning" berisi instruksi tegas di awal respons agar pasien SEGERA menuju ke IGD (Instalasi Gawat Darurat) Rumah Sakit terdekat atau menghubungi layanan darurat 119.

FORMAT RESPONS (WAJIB JSON MURNI VALID):
Anda HARUS merespons dalam format JSON terstruktur persis seperti schema berikut:
{
  "possibleConditions": ["Indikasi/Kondisi Umum 1", "Indikasi/Kondisi Umum 2"],
  "urgencyLevel": "low" | "medium" | "high" | "emergency",
  "recommendedSpecialization": "Nama Spesialisasi Dokter (misal: Dokter Umum / Dokter Spesialis Paru / Dokter Spesialis Jantung)",
  "summaryText": "Penjelasan ringkas dan ramah dalam 2-3 kalimat mengenai analisis indikasi gejala pasien.",
  "disclaimer": "Ini bukan diagnosis medis resmi. Analisis ini dibuat oleh AI sebagai skrining awal. Untuk penanganan tepat, selalu konsultasikan gejala Anda dengan dokter resmi RS TeleMedika.",
  "emergencyWarning": "Isi dengan instruksi tegas IGD jika urgencyLevel = emergency, atau isi null jika bukan emergency."
}

DATA GEJALA PASIEN:
- Daftar Gejala Dipilih: ${params.symptoms.join(", ")}
- Durasi Dirasakan: ${params.duration || "1-3 hari"}
- Tingkat Keparahan Menurut Pasien: ${params.severity || "sedang"}
- Catatan Tambahan Pasien: ${params.additionalNotes || "Tidak ada catatan tambahan"}
`;

  try {
    const result = await model.generateContent(prompt);
    let responseText = result.response.text().trim();

    // Strip markdown code block wrappers if present
    if (responseText.startsWith("```")) {
      responseText = responseText.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "").trim();
    }

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(responseText);
    } catch (parseErr) {
      console.warn("Raw JSON parse failed, attempting string cleanup...", parseErr);
      const cleanedText = responseText.replace(/[\u0000-\u001F\u007F-\u009F]/g, " ");
      parsedJson = JSON.parse(cleanedText);
    }

    return {
      possibleConditions: Array.isArray(parsedJson.possibleConditions)
        ? parsedJson.possibleConditions
        : ["Indikasi Gejala Umum"],
      urgencyLevel: ["low", "medium", "high", "emergency"].includes(parsedJson.urgencyLevel)
        ? parsedJson.urgencyLevel
        : "medium",
      recommendedSpecialization: parsedJson.recommendedSpecialization || "Dokter Umum",
      summaryText: parsedJson.summaryText || "Analisis gejala awal telah selesai.",
      disclaimer:
        parsedJson.disclaimer ||
        "Ini bukan diagnosis medis resmi. Untuk penanganan tepat, selalu konsultasikan gejala Anda dengan dokter resmi RS TeleMedika.",
      emergencyWarning: parsedJson.emergencyWarning || null,
    };
  } catch (err: any) {
    console.error("Gemini API call failed:", err);
    throw new Error(`Gagal memproses analisis gejala AI: ${err.message || "Terjadi kesalahan sistem"}`);
  }
}
