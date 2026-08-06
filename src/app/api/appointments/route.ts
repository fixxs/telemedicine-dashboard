import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Appointment } from "@/models/Appointment";
import { Doctor } from "@/models/Doctor";
import { Patient } from "@/models/Patient";
import { User } from "@/models/User";
import { authorizeRole, getAuthSession } from "@/lib/auth";
import { createAppointmentSchema } from "@/lib/validations/booking";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { session, errorResponse } = authorizeRole(req, ["pasien"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const validatedData = createAppointmentSchema.parse(body);

    await connectDB();

    // Resolve Patient profile for logged-in user
    const patientDoc = await Patient.findOne({ userId: session!.userId });
    if (!patientDoc) {
      return NextResponse.json(
        { success: false, message: "Profil pasien Anda tidak ditemukan" },
        { status: 404 }
      );
    }

    // Verify doctor exists
    const doctorDoc = await Doctor.findById(validatedData.doctorId);
    if (!doctorDoc) {
      return NextResponse.json(
        { success: false, message: "Dokter pilihan tidak ditemukan" },
        { status: 404 }
      );
    }

    const [year, month, day] = validatedData.date.split("-").map(Number);
    const bookingDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    // Application level double-booking check
    const existingBooking = await Appointment.findOne({
      doctorId: doctorDoc._id,
      date: bookingDate,
      time: validatedData.time.trim(),
      status: { $in: ["pending", "confirmed"] },
    });

    if (existingBooking) {
      return NextResponse.json(
        { success: false, message: "Slot waktu ini telah dipesan oleh pasien lain. Silakan pilih slot lain." },
        { status: 409 }
      );
    }

    // Create appointment
    const newAppointment = await Appointment.create({
      patientId: patientDoc._id,
      doctorId: doctorDoc._id,
      date: bookingDate,
      time: validatedData.time.trim(),
      status: "pending",
    });

    await logAudit({
      userId: session!.userId,
      action: "CREATE_APPOINTMENT",
      targetType: "Appointment",
      targetId: newAppointment._id.toString(),
    });

    return NextResponse.json({
      success: true,
      message: "Janji temu berhasil dibuat! Menunggu konfirmasi dari dokter.",
      appointment: {
        id: newAppointment._id.toString(),
        date: validatedData.date,
        time: newAppointment.time,
        status: newAppointment.status,
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: error.errors[0]?.message || "Input booking tidak valid" },
        { status: 400 }
      );
    }

    // Database-level race condition protection check (Mongo Code 11000 Duplicate Key Error)
    if (error.code === 11000 || (error.message && error.message.includes("E11000"))) {
      return NextResponse.json(
        {
          success: false,
          message: "Slot waktu ini baru saja dipesan oleh pasien lain (Konkurensi terdeteksi). Silakan pilih slot lain.",
        },
        { status: 409 }
      );
    }

    console.error("Error POST /api/appointments:", error);
    return NextResponse.json({ success: false, message: "Gagal membuat janji temu" }, { status: 500 });
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
      if (!patientDoc) return NextResponse.json({ success: true, appointments: [] });
      filter = { patientId: patientDoc._id };
    } else if (session.role === "dokter") {
      const doctorDoc = await Doctor.findOne({ userId: session.userId });
      if (!doctorDoc) return NextResponse.json({ success: true, appointments: [] });
      filter = { doctorId: doctorDoc._id };
    } else if (session.role === "admin") {
      filter = {}; // Admin can monitor all appointments
    }

    const appointments = await Appointment.find(filter)
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
      .sort({ date: 1, time: 1 })
      .lean();

    const formatted = appointments.map((app: any) => ({
      id: app._id.toString(),
      date: new Date(app.date).toISOString().split("T")[0],
      time: app.time,
      status: app.status,
      createdAt: app.createdAt,
      doctor: {
        id: app.doctorId?._id?.toString(),
        name: app.doctorId?.userId?.name || "Dokter",
        email: app.doctorId?.userId?.email || "",
        specialization: app.doctorId?.specialization || "Dokter Umum",
      },
      patient: {
        id: app.patientId?._id?.toString(),
        name: app.patientId?.userId?.name || "Pasien",
        email: app.patientId?.userId?.email || "",
        gender: app.patientId?.gender || "-",
        bloodType: app.patientId?.bloodType || "-",
      },
    }));

    return NextResponse.json({
      success: true,
      appointments: formatted,
    });
  } catch (error) {
    console.error("Error GET /api/appointments:", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil daftar janji temu" }, { status: 500 });
  }
}
