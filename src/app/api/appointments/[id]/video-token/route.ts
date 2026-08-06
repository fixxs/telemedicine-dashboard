import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Appointment } from "@/models/Appointment";
import { Patient } from "@/models/Patient";
import { Doctor } from "@/models/Doctor";
import { User } from "@/models/User";
import { authorizeRole, getAuthSession } from "@/lib/auth";
import { generateLiveKitToken } from "@/lib/livekit";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Strict Role Authorization: Only 'pasien' and 'dokter' allowed.
    // 'admin' role is unconditionally rejected here with 403 Forbidden.
    const { session, errorResponse } = authorizeRole(req, ["pasien", "dokter"]);

    if (errorResponse) {
      const rawSession = getAuthSession(req);
      if (rawSession) {
        logAudit({
          userId: rawSession.userId,
          action: "UNAUTHORIZED_JOIN_VIDEO_CALL_ATTEMPT",
          targetType: "Appointment",
          targetId: params.id,
        });
      }
      return errorResponse;
    }

    await connectDB();

    const appointment = await Appointment.findById(params.id);

    if (!appointment) {
      return NextResponse.json({ success: false, message: "Janji temu tidak ditemukan" }, { status: 404 });
    }

    // 2. Strict Resource Ownership Verification
    // Resolve Doctor or Patient profile ID for current session user
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
      logAudit({
        userId: session!.userId,
        action: "UNAUTHORIZED_JOIN_VIDEO_CALL_ATTEMPT",
        targetType: "Appointment",
        targetId: params.id,
      });

      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak berhak masuk ke ruang videocall janji temu ini" },
        { status: 403 }
      );
    }

    // 3. Status Verification
    if (appointment.status !== "confirmed" && appointment.status !== "completed") {
      return NextResponse.json(
        { success: false, message: "Sesi video call hanya aktif untuk janji temu yang dikonfirmasi" },
        { status: 400 }
      );
    }

    // 4. Ensure Room Name is set
    const roomName = `telemed-${appointment._id.toString()}`;
    if (!appointment.videoRoomName) {
      appointment.videoRoomName = roomName;
      await appointment.save();
    }

    // Resolve user display name
    const currentUserDoc = await User.findById(session!.userId);
    const userName = currentUserDoc?.name || (session!.role === "dokter" ? "Dokter" : "Pasien");
    const isDoctorOwner = session!.role === "dokter";

    // 5. Generate LiveKit JWT AccessToken using server secret
    const livekitToken = await generateLiveKitToken({
      roomName: roomName,
      userId: session!.userId,
      userName: userName,
      isDoctor: isDoctorOwner,
    });

    const livekitServerUrl =
      process.env.NEXT_PUBLIC_LIVEKIT_URL ||
      process.env.LIVEKIT_URL ||
      "wss://rumahsakit-telemedika-4hslm0d0.livekit.cloud";

    // 6. Log Audit Event: JOIN_VIDEO_CALL
    await logAudit({
      userId: session!.userId,
      action: "JOIN_VIDEO_CALL",
      targetType: "Appointment",
      targetId: params.id,
    });

    // Clean JSON response (LIVEKIT_API_SECRET is NEVER returned)
    return NextResponse.json({
      success: true,
      token: livekitToken,
      roomName: roomName,
      serverUrl: livekitServerUrl,
    });
  } catch (error: any) {
    console.error("Error POST /api/appointments/[id]/video-token:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal membuat token akses video call LiveKit" },
      { status: 500 }
    );
  }
}
