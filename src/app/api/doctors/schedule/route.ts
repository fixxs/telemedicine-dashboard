import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Doctor } from "@/models/Doctor";
import { authorizeRole } from "@/lib/auth";
import { updateDoctorScheduleSchema } from "@/lib/validations/booking";
import { logAudit } from "@/lib/audit";

export async function PUT(req: NextRequest) {
  try {
    const { session, errorResponse } = authorizeRole(req, ["dokter", "admin"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const validatedData = updateDoctorScheduleSchema.parse(body);

    await connectDB();

    let doctorDoc;

    if (session!.role === "dokter") {
      // Strict ownership check for Doctor role:
      // Must edit doctor document associated with session.userId
      doctorDoc = await Doctor.findOne({ userId: session!.userId });

      if (!doctorDoc) {
        return NextResponse.json(
          { success: false, message: "Profil dokter Anda tidak ditemukan" },
          { status: 404 }
        );
      }

      // If doctor passed a doctorId in payload, verify it belongs to them
      if (validatedData.doctorId && validatedData.doctorId !== doctorDoc._id.toString()) {
        return NextResponse.json(
          { success: false, message: "Akses ditolak: Anda hanya dapat memperbarui jadwal praktik Anda sendiri" },
          { status: 403 }
        );
      }
    } else if (session!.role === "admin") {
      // Admin role can update schedule for specified doctorId
      if (!validatedData.doctorId) {
        return NextResponse.json(
          { success: false, message: "Admin harus mencantumkan doctorId yang ingin diperbarui" },
          { status: 400 }
        );
      }
      doctorDoc = await Doctor.findById(validatedData.doctorId);
      if (!doctorDoc) {
        return NextResponse.json(
          { success: false, message: "Dokter target tidak ditemukan" },
          { status: 404 }
        );
      }
    }

    if (!doctorDoc) {
      return NextResponse.json({ success: false, message: "Dokter tidak ditemukan" }, { status: 404 });
    }

    // Update schedule & doctor info
    doctorDoc.schedule = validatedData.schedule;
    if (validatedData.specialization) doctorDoc.specialization = validatedData.specialization;
    if (validatedData.licenseNumber) doctorDoc.licenseNumber = validatedData.licenseNumber;

    await doctorDoc.save();

    await logAudit({
      userId: session!.userId,
      action: "UPDATE_DOCTOR_SCHEDULE",
      targetType: "Doctor",
      targetId: doctorDoc._id.toString(),
    });

    return NextResponse.json({
      success: true,
      message: "Jadwal praktik dokter berhasil diperbarui",
      doctor: {
        id: doctorDoc._id.toString(),
        specialization: doctorDoc.specialization,
        licenseNumber: doctorDoc.licenseNumber,
        schedule: doctorDoc.schedule,
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: error.errors[0]?.message || "Input jadwal tidak valid" },
        { status: 400 }
      );
    }
    console.error("Error PUT /api/doctors/schedule:", error);
    return NextResponse.json({ success: false, message: "Gagal memperbarui jadwal praktik" }, { status: 500 });
  }
}
