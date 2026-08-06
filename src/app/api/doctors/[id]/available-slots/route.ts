import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Doctor } from "@/models/Doctor";
import { Appointment } from "@/models/Appointment";
import { getAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Helper function to parse any time string ("08:00", "08:00 AM", "04:00 PM", "16:00") into minutes from midnight
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const cleanStr = timeStr.trim().toUpperCase();
  const isPM = cleanStr.includes("PM");
  const isAM = cleanStr.includes("AM");

  const numbersOnly = cleanStr.replace(/[^\d:]/g, "");
  const parts = numbersOnly.split(":");
  let hours = Number(parts[0]) || 0;
  const minutes = Number(parts[1]) || 0;

  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

// Helper to normalize any time string to "HH:mm" 24-hour format
function normalizeTimeStr(t: string): string {
  if (!t) return "";
  const mins = parseTimeToMinutes(t);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "Belum terautentikasi" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date"); // e.g. "2026-08-05"

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json(
        { success: false, message: "Parameter tanggal (YYYY-MM-DD) wajib diisi" },
        { status: 400 }
      );
    }

    const [year, month, day] = dateStr.split("-").map(Number);
    // Explicit UTC date creation prevents local timezone offset shifts
    const targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ success: false, message: "Tanggal tidak valid" }, { status: 400 });
    }

    await connectDB();

    const doctor = await Doctor.findById(params.id);
    if (!doctor) {
      return NextResponse.json({ success: false, message: "Dokter tidak ditemukan" }, { status: 404 });
    }

    // Determine day of week for target date (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = targetDate.getUTCDay();

    // Find schedule for this day of week with type-safe number comparison
    const daySchedule = doctor.schedule.find(
      (s) => Number(s.dayOfWeek) === Number(dayOfWeek)
    );

    if (!daySchedule) {
      return NextResponse.json({
        success: true,
        date: dateStr,
        dayOfWeek,
        hasSchedule: false,
        message: "Dokter tidak memiliki jadwal praktik pada hari ini",
        slots: [],
      });
    }

    // Parse start and end times cleanly (handles 12-hour AM/PM and 24-hour formats)
    let startMinutes = parseTimeToMinutes(daySchedule.startTime);
    let endMinutes = parseTimeToMinutes(daySchedule.endTime);

    // If endMinutes is less than startMinutes (e.g. 08:00 to 04:00 where 04:00 means 4 PM = 16:00), adjust by 12 hours
    if (endMinutes <= startMinutes && endMinutes < 720) {
      endMinutes += 12 * 60;
    }

    const slotDuration = Number(daySchedule.slotDurationMinutes) || 30;

    // Generate time slots array
    const slots: { time: string; available: boolean }[] = [];
    let currentMinutes = startMinutes;

    while (currentMinutes + slotDuration <= endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      slots.push({ time: timeStr, available: true });
      currentMinutes += slotDuration;
    }

    // Query active appointments for this doctor on this date (UTC day range)
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    const existingAppointments = await Appointment.find({
      doctorId: doctor._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["pending", "confirmed"] },
    }).select("time");

    // Normalize all booked appointment time strings
    const bookedTimes = new Set(
      existingAppointments.map((app) => normalizeTimeStr(app.time))
    );

    // Mark ONLY booked slots as available = false, remaining slots remain available = true
    const formattedSlots = slots.map((s) => ({
      time: s.time,
      available: !bookedTimes.has(s.time),
    }));

    return NextResponse.json({
      success: true,
      date: dateStr,
      dayOfWeek,
      dayName: daySchedule.dayName,
      hasSchedule: true,
      slots: formattedSlots,
    });
  } catch (error) {
    console.error("Error GET /api/doctors/:id/available-slots:", error);
    return NextResponse.json({ success: false, message: "Gagal menghitung slot waktu tersedia" }, { status: 500 });
  }
}
