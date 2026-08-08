import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SymptomCheck } from "@/models/SymptomCheck";
import { Patient } from "@/models/Patient";
import { Doctor } from "@/models/Doctor";
import { Appointment } from "@/models/Appointment";
import { authorizeRole, getAuthSession } from "@/lib/auth";
import { createSymptomCheckSchema } from "@/lib/validations/symptom-check";
import { analyzeSymptomsWithGemini } from "@/lib/gemini";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/symptom-check
 * Patient submits symptoms for AI analysis using Gemini API.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Strict Role Authorization: Only 'pasien' role allowed
    const { session, errorResponse } = authorizeRole(req, ["pasien"]);
    if (errorResponse) return errorResponse;

    await connectDB();

    const patientDoc = await Patient.findOne({ userId: session!.userId });
    if (!patientDoc) {
      return NextResponse.json(
        { success: false, message: "Profil pasien tidak ditemukan." },
        { status: 404 }
      );
    }

    // 2. Input Validation
    const body = await req.json();
    const validated = createSymptomCheckSchema.parse(body);

    // 3. Call Gemini API for AI Symptom Analysis
    const aiAnalysis = await analyzeSymptomsWithGemini({
      symptoms: validated.symptoms,
      duration: validated.duration,
      severity: validated.severity,
      additionalNotes: validated.additionalNotes,
    });

    // 4. Save result to SymptomCheck collection
    const symptomCheckRecord = await SymptomCheck.create({
      patientId: patientDoc._id,
      symptoms: validated.symptoms,
      duration: validated.duration,
      severity: validated.severity,
      additionalNotes: validated.additionalNotes,
      aiResponse: aiAnalysis,
      disclaimerShown: true,
    });

    // 5. Log Audit Event: CREATE_SYMPTOM_CHECK
    await logAudit({
      userId: session!.userId,
      action: "CREATE_SYMPTOM_CHECK",
      targetType: "SymptomCheck",
      targetId: symptomCheckRecord._id.toString(),
    });

    return NextResponse.json({
      success: true,
      message: "Analisis gejala AI berhasil diproses.",
      symptomCheck: {
        id: symptomCheckRecord._id.toString(),
        symptoms: symptomCheckRecord.symptoms,
        duration: symptomCheckRecord.duration,
        severity: symptomCheckRecord.severity,
        additionalNotes: symptomCheckRecord.additionalNotes,
        aiResponse: symptomCheckRecord.aiResponse,
        createdAt: symptomCheckRecord.createdAt,
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: error.errors[0]?.message || "Input gejala tidak valid." },
        { status: 400 }
      );
    }
    console.error("Error POST /api/symptom-check:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memproses analisis gejala AI." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/symptom-check
 * Patients view their own history.
 * Doctors view patient history ONLY for assigned appointments.
 * Admin receives 403 Forbidden.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Strict Role Authorization: Only 'pasien' and 'dokter' allowed.
    // 'admin' role is unconditionally rejected here with 403 Forbidden.
    const { session, errorResponse } = authorizeRole(req, ["pasien", "dokter"]);

    if (errorResponse) {
      const rawSession = getAuthSession(req);
      if (rawSession) {
        logAudit({
          userId: rawSession.userId,
          action: "UNAUTHORIZED_SYMPTOM_CHECK_ATTEMPT",
          targetType: "SymptomCheck",
        });
      }
      return errorResponse;
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const targetPatientId = searchParams.get("patientId");
    const targetAppointmentId = searchParams.get("appointmentId");

    // 2. Patient Access Scoping (Own History Only)
    if (session!.role === "pasien") {
      const patientDoc = await Patient.findOne({ userId: session!.userId });
      if (!patientDoc) {
        return NextResponse.json(
          { success: false, message: "Profil pasien tidak ditemukan." },
          { status: 404 }
        );
      }

      const records = await SymptomCheck.find({ patientId: patientDoc._id })
        .sort({ createdAt: -1 })
        .lean();

      const formatted = records.map((r) => ({
        id: r._id.toString(),
        symptoms: r.symptoms,
        duration: r.duration || "1-3 hari",
        severity: r.severity || "sedang",
        additionalNotes: r.additionalNotes || "",
        aiResponse: r.aiResponse,
        createdAt: r.createdAt,
      }));

      return NextResponse.json({
        success: true,
        symptomChecks: formatted,
      });
    }

    // 3. Doctor Access Authorization (Assigned Patient Appointments Only)
    if (session!.role === "dokter") {
      const doctorDoc = await Doctor.findOne({ userId: session!.userId });
      if (!doctorDoc) {
        return NextResponse.json(
          { success: false, message: "Profil dokter tidak ditemukan." },
          { status: 404 }
        );
      }

      let targetPatientObjId: any = null;

      if (targetAppointmentId) {
        const app = await Appointment.findOne({
          _id: targetAppointmentId,
          doctorId: doctorDoc._id,
        });

        if (!app) {
          logAudit({
            userId: session!.userId,
            action: "UNAUTHORIZED_SYMPTOM_CHECK_ATTEMPT",
            targetType: "Appointment",
            targetId: targetAppointmentId,
          });

          return NextResponse.json(
            { success: false, message: "Akses Ditolak: Anda tidak berhak melihat gejala pasien dari janji temu ini." },
            { status: 403 }
          );
        }
        targetPatientObjId = app.patientId;
      } else if (targetPatientId) {
        // Verify doctor has at least one appointment with target patient
        const app = await Appointment.findOne({
          doctorId: doctorDoc._id,
          patientId: targetPatientId,
        });

        if (!app) {
          logAudit({
            userId: session!.userId,
            action: "UNAUTHORIZED_SYMPTOM_CHECK_ATTEMPT",
            targetType: "Patient",
            targetId: targetPatientId,
          });

          return NextResponse.json(
            { success: false, message: "Akses Ditolak: Anda hanya berhak melihat riwayat symptom check pasien yang Anda tangani." },
            { status: 403 }
          );
        }
        targetPatientObjId = targetPatientId;
      } else {
        return NextResponse.json(
          { success: false, message: "Dokter harus menyertakan patientId atau appointmentId untuk melihat riwayat gejala." },
          { status: 400 }
        );
      }

      const records = await SymptomCheck.find({ patientId: targetPatientObjId })
        .sort({ createdAt: -1 })
        .lean();

      const formatted = records.map((r) => ({
        id: r._id.toString(),
        symptoms: r.symptoms,
        duration: r.duration || "1-3 hari",
        severity: r.severity || "sedang",
        additionalNotes: r.additionalNotes || "",
        aiResponse: r.aiResponse,
        createdAt: r.createdAt,
      }));

      return NextResponse.json({
        success: true,
        symptomChecks: formatted,
      });
    }

    // Default Fail-Closed
    return NextResponse.json(
      { success: false, message: "Akses ditolak." },
      { status: 403 }
    );
  } catch (error: any) {
    console.error("Error GET /api/symptom-check:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil riwayat symptom check." },
      { status: 500 }
    );
  }
}
