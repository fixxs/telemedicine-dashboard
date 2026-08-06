import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { MedicalRecord } from "@/models/MedicalRecord";
import { Appointment } from "@/models/Appointment";
import { Doctor } from "@/models/Doctor";
import { Patient } from "@/models/Patient";
import { User } from "@/models/User";
import { authorizeRole, getAuthSession } from "@/lib/auth";
import { createMedicalRecordSchema } from "@/lib/validations/medical-record";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { session, errorResponse } = authorizeRole(req, ["dokter"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const validatedData = createMedicalRecordSchema.parse(body);

    await connectDB();

    // Resolve Doctor profile for logged-in user
    const doctorDoc = await Doctor.findOne({ userId: session!.userId });
    if (!doctorDoc) {
      return NextResponse.json(
        { success: false, message: "Profil dokter Anda tidak ditemukan" },
        { status: 404 }
      );
    }

    // Verify appointment exists
    const appointment = await Appointment.findById(validatedData.appointmentId);
    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "Janji temu tidak ditemukan" },
        { status: 404 }
      );
    }

    // Ownership check: Appointment must be assigned to logged-in doctor
    if (appointment.doctorId.toString() !== doctorDoc._id.toString()) {
      await logAudit({
        userId: session!.userId,
        action: "UNAUTHORIZED_CREATE_MEDICAL_RECORD_ATTEMPT",
        targetType: "Appointment",
        targetId: appointment._id.toString(),
      });
      return NextResponse.json(
        { success: false, message: "Anda tidak berhak mengisi rekam medis untuk janji temu dokter lain" },
        { status: 403 }
      );
    }

    // Status check: Must be confirmed or completed
    if (appointment.status !== "confirmed" && appointment.status !== "completed") {
      return NextResponse.json(
        { success: false, message: "Rekam medis hanya bisa diisi untuk janji temu bertatus dikonfirmasi atau selesai" },
        { status: 400 }
      );
    }

    // Check if record already exists for this appointment
    let medicalRecord = await MedicalRecord.findOne({ appointmentId: appointment._id });

    if (medicalRecord) {
      // Update existing record
      medicalRecord.chiefComplaint = validatedData.chiefComplaint;
      medicalRecord.diagnosis = validatedData.diagnosis;
      medicalRecord.notes = validatedData.notes;
      medicalRecord.vitalSigns = validatedData.vitalSigns;
      await medicalRecord.save();
    } else {
      // Create new record
      medicalRecord = await MedicalRecord.create({
        appointmentId: appointment._id,
        patientId: appointment.patientId,
        doctorId: doctorDoc._id,
        chiefComplaint: validatedData.chiefComplaint,
        diagnosis: validatedData.diagnosis,
        notes: validatedData.notes,
        vitalSigns: validatedData.vitalSigns,
      });
    }

    // Automatically update appointment status to completed
    if (appointment.status !== "completed") {
      appointment.status = "completed";
      await appointment.save();
    }

    // Audit Log for creating/updating medical record
    await logAudit({
      userId: session!.userId,
      action: "CREATE_MEDICAL_RECORD",
      targetType: "MedicalRecord",
      targetId: medicalRecord._id.toString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Rekam medis berhasil disimpan dan status janji temu telah diperbarui menjadi Selesai.",
        medicalRecord: {
          id: medicalRecord._id.toString(),
          appointmentId: medicalRecord.appointmentId.toString(),
          chiefComplaint: medicalRecord.chiefComplaint,
          diagnosis: medicalRecord.diagnosis,
          notes: medicalRecord.notes,
          vitalSigns: medicalRecord.vitalSigns,
          createdAt: medicalRecord.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: error.errors[0]?.message || "Input rekam medis tidak valid" },
        { status: 400 }
      );
    }
    console.error("Error POST /api/medical-records:", error);
    return NextResponse.json({ success: false, message: "Gagal menyimpan rekam medis" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "Belum terautentikasi" }, { status: 401 });
    }

    await connectDB();

    let filter: any = {};

    if (session.role === "pasien") {
      const patientDoc = await Patient.findOne({ userId: session.userId });
      if (!patientDoc) return NextResponse.json({ success: true, records: [] });
      filter = { patientId: patientDoc._id };
    } else if (session.role === "dokter") {
      const doctorDoc = await Doctor.findOne({ userId: session.userId });
      if (!doctorDoc) return NextResponse.json({ success: true, records: [] });
      filter = { doctorId: doctorDoc._id };
    } else if (session.role === "admin") {
      filter = {}; // Admin queries all records, but response will be strictly sanitized below
    }

    const records = await MedicalRecord.find(filter)
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
      .sort({ createdAt: -1 })
      .lean();

    const formatted = records.map((rec: any) => {
      const baseData = {
        id: rec._id.toString(),
        appointmentId: rec.appointmentId?.toString(),
        createdAt: rec.createdAt,
        updatedAt: rec.updatedAt,
        doctor: {
          id: rec.doctorId?._id?.toString(),
          name: rec.doctorId?.userId?.name || "Dokter",
          specialization: rec.doctorId?.specialization || "Dokter Umum",
        },
        patient: {
          id: rec.patientId?._id?.toString(),
          name: rec.patientId?.userId?.name || "Pasien",
          gender: rec.patientId?.gender || "-",
          bloodType: rec.patientId?.bloodType || "-",
        },
      };

      // STRICT ADMIN PRIVACY CONTROL: Exclude clinical details for Admin role
      if (session.role === "admin") {
        return {
          ...baseData,
          isSanitized: true, // Metadata tag for Admin view
        };
      }

      // Return full clinical records for Patient (own) & Doctor (created by self)
      return {
        ...baseData,
        chiefComplaint: rec.chiefComplaint,
        diagnosis: rec.diagnosis,
        notes: rec.notes || "",
        vitalSigns: rec.vitalSigns || {},
        isSanitized: false,
      };
    });

    return NextResponse.json({
      success: true,
      records: formatted,
    });
  } catch (error) {
    console.error("Error GET /api/medical-records:", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil daftar rekam medis" }, { status: 500 });
  }
}
