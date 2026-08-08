import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { Doctor } from "@/models/Doctor";
import { MedicalRecord } from "@/models/MedicalRecord";
import { Prescription } from "@/models/Prescription";
import { AuditLog } from "@/models/AuditLog";
import { prescriptionInputSchema } from "@/lib/validations/prescription";

export async function POST(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session || session.role !== "dokter") {
      return NextResponse.json(
        { success: false, message: "Akses ditolak: Hanya dokter yang berhak membuat/mengubah resep obat." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = prescriptionInputSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { medicalRecordId, medicines, generalNotes } = validation.data;

    await connectDB();

    // Resolve Doctor document
    const doctorDoc = await Doctor.findOne({ userId: session.userId });
    if (!doctorDoc) {
      return NextResponse.json(
        { success: false, message: "Profil dokter tidak ditemukan." },
        { status: 404 }
      );
    }

    // Verify Medical Record exists and is owned by this doctor
    const record = await MedicalRecord.findById(medicalRecordId);
    if (!record) {
      return NextResponse.json(
        { success: false, message: "Rekam medis tidak ditemukan." },
        { status: 404 }
      );
    }

    if (record.doctorId.toString() !== doctorDoc._id.toString()) {
      await AuditLog.create({
        userId: session.userId,
        action: "UNAUTHORIZED_PRESCRIPTION_ACCESS",
        targetType: "MedicalRecord",
        targetId: medicalRecordId,
      });

      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak berhak menerbitkan resep untuk rekam medis ini." },
        { status: 403 }
      );
    }

    // Check if prescription already exists for this medical record
    let prescription = await Prescription.findOne({ medicalRecordId });
    let actionType: "CREATE_PRESCRIPTION" | "UPDATE_PRESCRIPTION" = "CREATE_PRESCRIPTION";

    if (prescription) {
      // Update existing prescription
      actionType = "UPDATE_PRESCRIPTION";
      prescription.medicines = medicines;
      prescription.generalNotes = generalNotes;
      await prescription.save();
    } else {
      // Create new prescription
      prescription = await Prescription.create({
        medicalRecordId: record._id,
        appointmentId: record.appointmentId,
        patientId: record.patientId,
        doctorId: doctorDoc._id,
        medicines,
        generalNotes,
      });
    }

    // Audit Logging: Log CREATE_PRESCRIPTION or UPDATE_PRESCRIPTION separately
    await AuditLog.create({
      userId: session.userId,
      action: actionType,
      targetType: "Prescription",
      targetId: prescription._id.toString(),
    });

    return NextResponse.json({
      success: true,
      message: actionType === "CREATE_PRESCRIPTION" ? "Resep obat berhasil diterbitkan." : "Resep obat berhasil diperbarui.",
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
    console.error("POST /api/prescriptions Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menyimpan resep obat." },
      { status: 500 }
    );
  }
}
