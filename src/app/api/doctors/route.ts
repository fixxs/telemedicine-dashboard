import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Doctor } from "@/models/Doctor";
import { User } from "@/models/User";
import { getAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "Belum terautentikasi" }, { status: 401 });
    }

    await connectDB();

    // Fetch doctors populated with User fields
    const doctors = await Doctor.find({})
      .populate({ path: "userId", select: "name email role", model: User })
      .lean();

    const formattedDoctors = doctors.map((doc: any) => ({
      id: doc._id.toString(),
      userId: doc.userId?._id?.toString() || doc.userId?.toString(),
      name: doc.userId?.name || "Dokter",
      email: doc.userId?.email || "",
      specialization: doc.specialization,
      licenseNumber: doc.licenseNumber,
      schedule: doc.schedule || [],
    }));

    return NextResponse.json({
      success: true,
      doctors: formattedDoctors,
    });
  } catch (error) {
    console.error("Error GET /api/doctors:", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil daftar dokter" }, { status: 500 });
  }
}
