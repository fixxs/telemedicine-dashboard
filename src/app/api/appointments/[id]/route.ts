import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Appointment } from "@/models/Appointment";
import { Doctor } from "@/models/Doctor";
import { Patient } from "@/models/Patient";
import { authorizeRole } from "@/lib/auth";
import { updateAppointmentStatusSchema } from "@/lib/validations/booking";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, errorResponse } = authorizeRole(req, ["dokter", "pasien", "admin"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const validatedData = updateAppointmentStatusSchema.parse(body);

    await connectDB();

    const appointment = await Appointment.findById(params.id);
    if (!appointment) {
      return NextResponse.json({ success: false, message: "Janji temu tidak ditemukan" }, { status: 404 });
    }

    // Role-based Ownership Checks
    if (session!.role === "dokter") {
      const doctorDoc = await Doctor.findOne({ userId: session!.userId });
      if (!doctorDoc || appointment.doctorId.toString() !== doctorDoc._id.toString()) {
        return NextResponse.json(
          { success: false, message: "Akses ditolak: Anda hanya dapat memperbarui janji temu pasien Anda sendiri" },
          { status: 403 }
        );
      }
    } else if (session!.role === "pasien") {
      const patientDoc = await Patient.findOne({ userId: session!.userId });
      if (!patientDoc || appointment.patientId.toString() !== patientDoc._id.toString()) {
        return NextResponse.json(
          { success: false, message: "Akses ditolak: Anda hanya dapat membatalkan janji temu milik Anda sendiri" },
          { status: 403 }
        );
      }

      // Patients can only cancel appointments that are currently "pending"
      if (validatedData.status !== "cancelled") {
        return NextResponse.json(
          { success: false, message: "Pasien hanya dapat membatalkan janji temu" },
          { status: 400 }
        );
      }

      if (appointment.status !== "pending") {
        return NextResponse.json(
          { success: false, message: "Janji temu yang sudah dikonfirmasi atau selesai tidak dapat dibatalkan secara mandiri" },
          { status: 400 }
        );
      }
    }

    appointment.status = validatedData.status;
    await appointment.save();

    await logAudit({
      userId: session!.userId,
      action: `${validatedData.status.toUpperCase()}_APPOINTMENT`,
      targetType: "Appointment",
      targetId: appointment._id.toString(),
    });

    return NextResponse.json({
      success: true,
      message: `Status janji temu berhasil diperbarui menjadi '${validatedData.status}'`,
      appointment: {
        id: appointment._id.toString(),
        status: appointment.status,
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: error.errors[0]?.message || "Input status tidak valid" },
        { status: 400 }
      );
    }

    console.error("Error PATCH /api/appointments/:id:", error);
    return NextResponse.json({ success: false, message: "Gagal memperbarui status janji temu" }, { status: 500 });
  }
}
