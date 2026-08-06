import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Appointment } from "@/models/Appointment";
import { Patient } from "@/models/Patient";
import { Doctor } from "@/models/Doctor";
import { authorizeRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, errorResponse } = authorizeRole(req, ["pasien", "dokter"]);
    if (errorResponse) return errorResponse;

    await connectDB();

    const appointment = await Appointment.findById(params.id);

    if (!appointment) {
      return NextResponse.json({ success: false, message: "Janji temu tidak ditemukan" }, { status: 404 });
    }

    // Ownership Verification: Must be patient or doctor assigned to this appointment
    let isAuthorized = false;

    if (session!.role === "dokter") {
      const docProfile = await Doctor.findOne({ userId: session!.userId });
      if (docProfile && appointment.doctorId.toString() === docProfile._id.toString()) {
        isAuthorized = true;
      }
    } else if (session!.role === "pasien") {
      const patProfile = await Patient.findOne({ userId: session!.userId });
      if (patProfile && appointment.patientId.toString() === patProfile._id.toString()) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: "Anda tidak berhak mengakses ruang video call ini" },
        { status: 403 }
      );
    }

    // Status Verification: Must be confirmed
    if (appointment.status !== "confirmed") {
      return NextResponse.json(
        { success: false, message: "Ruang video call hanya tersedia untuk janji temu berstatus dikonfirmasi" },
        { status: 400 }
      );
    }

    // Deterministic LiveKit Room Name per appointment
    const roomName = `telemed-${appointment._id.toString()}`;

    // Save room name to Appointment if not yet saved
    if (!appointment.videoRoomName) {
      appointment.videoRoomName = roomName;
      await appointment.save();
    }

    return NextResponse.json({
      success: true,
      videoRoomName: roomName,
    });
  } catch (error: any) {
    console.error("Error POST /api/appointments/[id]/video-room:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menyiapkan ruang video call LiveKit" },
      { status: 500 }
    );
  }
}
