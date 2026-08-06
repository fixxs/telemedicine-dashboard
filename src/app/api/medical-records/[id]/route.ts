import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { MedicalRecord } from "@/models/MedicalRecord";
import { Doctor } from "@/models/Doctor";
import { Patient } from "@/models/Patient";
import { User } from "@/models/User";
import { authorizeRole, getAuthSession } from "@/lib/auth";
import { updateMedicalRecordSchema } from "@/lib/validations/medical-record";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. STRICT ROLE AUTHORIZATION: Only 'pasien' and 'dokter' roles are permitted.
    // 'admin' role is unconditionally rejected here with 403 Forbidden.
    const { session, errorResponse } = authorizeRole(req, ["pasien", "dokter"]);

    if (errorResponse) {
      const rawSession = getAuthSession(req);
      if (rawSession) {
        // Log unauthorized attempt to audit log
        logAudit({
          userId: rawSession.userId,
          action: "UNAUTHORIZED_VIEW_MEDICAL_RECORD_ATTEMPT",
          targetType: "MedicalRecord",
          targetId: params.id,
        });
      }
      // EXPLICIT IMMEDIATE RETURN: Stops code execution completely
      return errorResponse;
    }

    // 2. SECONDARY AIRTIGHT CHECK FOR ADMIN ROLE (FAIL-CLOSED)
    if (session!.role === "admin") {
      logAudit({
        userId: session!.userId,
        action: "UNAUTHORIZED_VIEW_MEDICAL_RECORD_ATTEMPT",
        targetType: "MedicalRecord",
        targetId: params.id,
      });
      // EXPLICIT IMMEDIATE RETURN: Stops code execution completely
      return NextResponse.json(
        {
          success: false,
          message: "Akses Ditolak: Admin tidak diizinkan membaca isi rekam medis pasien (Prinsip Privasi Data Kesehatan).",
        },
        { status: 403 }
      );
    }

    // 3. DATABASE QUERY IS ONLY EXECUTED AFTER ROLE CHECKS PASS
    await connectDB();

    const record = await MedicalRecord.findById(params.id)
      .populate({
        path: "doctorId",
        select: "specialization licenseNumber userId",
        populate: { path: "userId", select: "name email", model: User },
        model: Doctor,
      })
      .populate({
        path: "patientId",
        select: "userId birthDate gender bloodType allergies",
        populate: { path: "userId", select: "name email", model: User },
        model: Patient,
      })
      .lean();

    if (!record) {
      return NextResponse.json({ success: false, message: "Rekam medis tidak ditemukan" }, { status: 404 });
    }

    const docObj = record.doctorId as any;
    const patObj = record.patientId as any;

    // 4. RESOURCE OWNERSHIP VERIFICATION
    if (session!.role === "pasien") {
      const patientDoc = await Patient.findOne({ userId: session!.userId });
      if (!patientDoc || patObj?._id?.toString() !== patientDoc._id.toString()) {
        logAudit({
          userId: session!.userId,
          action: "UNAUTHORIZED_VIEW_MEDICAL_RECORD_ATTEMPT",
          targetType: "MedicalRecord",
          targetId: params.id,
        });

        return NextResponse.json(
          { success: false, message: "Anda hanya berhak melihat rekam medis milik sendiri" },
          { status: 403 }
        );
      }
    } else if (session!.role === "dokter") {
      const doctorDoc = await Doctor.findOne({ userId: session!.userId });
      if (!doctorDoc || docObj?._id?.toString() !== doctorDoc._id.toString()) {
        logAudit({
          userId: session!.userId,
          action: "UNAUTHORIZED_VIEW_MEDICAL_RECORD_ATTEMPT",
          targetType: "MedicalRecord",
          targetId: params.id,
        });

        return NextResponse.json(
          { success: false, message: "Anda tidak berhak melihat rekam medis pasien dari dokter lain" },
          { status: 403 }
        );
      }
    } else {
      // FAIL-CLOSED DEFAULT FOR ANY OTHER ROLE
      return NextResponse.json(
        { success: false, message: "Akses ditolak" },
        { status: 403 }
      );
    }

    // 5. LOG SUCCESSFUL ACCESS AND RETURN FULL CLINICAL DATA
    logAudit({
      userId: session!.userId,
      action: "VIEW_MEDICAL_RECORD",
      targetType: "MedicalRecord",
      targetId: params.id,
    });

    const formatted = {
      id: record._id.toString(),
      appointmentId: record.appointmentId?.toString(),
      chiefComplaint: record.chiefComplaint,
      diagnosis: record.diagnosis,
      notes: record.notes || "",
      vitalSigns: record.vitalSigns || {},
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      doctor: {
        id: docObj?._id?.toString(),
        name: docObj?.userId?.name || "Dokter",
        email: docObj?.userId?.email || "",
        specialization: docObj?.specialization || "Dokter Umum",
        licenseNumber: docObj?.licenseNumber || "-",
      },
      patient: {
        id: patObj?._id?.toString(),
        name: patObj?.userId?.name || "Pasien",
        email: patObj?.userId?.email || "",
        gender: patObj?.gender || "-",
        bloodType: patObj?.bloodType || "-",
        allergies: patObj?.allergies || "-",
      },
    };

    return NextResponse.json({
      success: true,
      medicalRecord: formatted,
    });
  } catch (error) {
    console.error("Error GET /api/medical-records/:id:", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil detail rekam medis" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, errorResponse } = authorizeRole(req, ["dokter"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const validatedData = updateMedicalRecordSchema.parse(body);

    await connectDB();

    const doctorDoc = await Doctor.findOne({ userId: session!.userId });
    if (!doctorDoc) {
      return NextResponse.json({ success: false, message: "Profil dokter tidak ditemukan" }, { status: 404 });
    }

    const record = await MedicalRecord.findById(params.id);
    if (!record) {
      return NextResponse.json({ success: false, message: "Rekam medis tidak ditemukan" }, { status: 404 });
    }

    // Ownership check: Only creator doctor can update
    if (record.doctorId.toString() !== doctorDoc._id.toString()) {
      logAudit({
        userId: session!.userId,
        action: "UNAUTHORIZED_UPDATE_MEDICAL_RECORD_ATTEMPT",
        targetType: "MedicalRecord",
        targetId: params.id,
      });

      return NextResponse.json(
        { success: false, message: "Anda tidak berhak mengedit rekam medis yang dibuat dokter lain" },
        { status: 403 }
      );
    }

    record.chiefComplaint = validatedData.chiefComplaint;
    record.diagnosis = validatedData.diagnosis;
    if (validatedData.notes !== undefined) record.notes = validatedData.notes;
    if (validatedData.vitalSigns !== undefined) record.vitalSigns = validatedData.vitalSigns;

    await record.save();

    logAudit({
      userId: session!.userId,
      action: "UPDATE_MEDICAL_RECORD",
      targetType: "MedicalRecord",
      targetId: record._id.toString(),
    });

    return NextResponse.json({
      success: true,
      message: "Rekam medis berhasil diperbarui.",
      medicalRecord: {
        id: record._id.toString(),
        chiefComplaint: record.chiefComplaint,
        diagnosis: record.diagnosis,
        notes: record.notes,
        vitalSigns: record.vitalSigns,
        updatedAt: record.updatedAt,
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: error.errors[0]?.message || "Input pembaruan rekam medis tidak valid" },
        { status: 400 }
      );
    }
    console.error("Error PATCH /api/medical-records/:id:", error);
    return NextResponse.json({ success: false, message: "Gagal memperbarui rekam medis" }, { status: 500 });
  }
}
