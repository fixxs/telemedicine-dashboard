import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { Patient } from "@/models/Patient";
import { Doctor } from "@/models/Doctor";
import { MedicalRecord } from "@/models/MedicalRecord";
import { Prescription } from "@/models/Prescription";
import { AuditLog } from "@/models/AuditLog";

export async function GET(
  req: NextRequest,
  { params }: { params: { medicalRecordId: string } }
) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Sesi tidak valid atau telah berakhir." },
        { status: 401 }
      );
    }

    // Admin MUST NOT view individual prescription details
    if (session.role === "admin") {
      await AuditLog.create({
        userId: session.userId,
        action: "UNAUTHORIZED_PRESCRIPTION_ACCESS",
        targetType: "MedicalRecord",
        targetId: params.medicalRecordId,
      });

      return NextResponse.json(
        { success: false, message: "Akses ditolak: Admin tidak memiliki hak akses ke data resep individual." },
        { status: 403 }
      );
    }

    await connectDB();

    const record = await MedicalRecord.findById(params.medicalRecordId);
    if (!record) {
      return NextResponse.json(
        { success: false, message: "Rekam medis tidak ditemukan." },
        { status: 404 }
      );
    }

    // Verify Ownership
    let isAuthorized = false;

    if (session.role === "pasien") {
      const patientDoc = await Patient.findOne({ userId: session.userId });
      if (patientDoc && record.patientId.toString() === patientDoc._id.toString()) {
        isAuthorized = true;
      }
    } else if (session.role === "dokter") {
      const doctorDoc = await Doctor.findOne({ userId: session.userId });
      if (doctorDoc && record.doctorId.toString() === doctorDoc._id.toString()) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      await AuditLog.create({
        userId: session.userId,
        action: "UNAUTHORIZED_PRESCRIPTION_ACCESS",
        targetType: "MedicalRecord",
        targetId: params.medicalRecordId,
      });

      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak berhak melihat resep ini." },
        { status: 403 }
      );
    }

    const prescription = await Prescription.findOne({ medicalRecordId: params.medicalRecordId });
    if (!prescription) {
      return NextResponse.json({
        success: true,
        prescription: null,
        message: "Belum ada resep obat untuk rekam medis ini.",
      });
    }

    return NextResponse.json({
      success: true,
      prescription: {
        id: prescription._id.toString(),
        medicalRecordId: prescription.medicalRecordId.toString(),
        appointmentId: prescription.appointmentId.toString(),
        patientId: prescription.patientId.toString(),
        doctorId: prescription.doctorId.toString(),
        medicines: prescription.medicines,
        generalNotes: prescription.generalNotes,
        createdAt: prescription.createdAt,
        updatedAt: prescription.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("GET /api/prescriptions/[medicalRecordId] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengambil data resep obat." },
      { status: 500 }
    );
  }
}
