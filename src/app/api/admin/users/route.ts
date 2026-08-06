import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Doctor } from "@/models/Doctor";
import { authorizeRole } from "@/lib/auth";
import { createManagedUserSchema } from "@/lib/validations/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Enforcement: API Route level role authorization (Admin only)
    const { session, errorResponse } = authorizeRole(req, ["admin"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const validatedData = createManagedUserSchema.parse(body);

    await connectDB();

    const existingUser = await User.findOne({ email: validatedData.email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email pengguna sudah terdaftar" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    const newUser = await User.create({
      name: validatedData.name,
      email: validatedData.email.toLowerCase(),
      passwordHash,
      role: validatedData.role,
    });

    let doctorProfile = null;
    if (validatedData.role === "dokter") {
      doctorProfile = await Doctor.create({
        userId: newUser._id,
        specialization: validatedData.specialization || "Dokter Umum",
        licenseNumber: validatedData.licenseNumber || "STR-UNSET",
        schedule: [],
      });
    }

    await logAudit({
      userId: session!.userId,
      action: `CREATE_MANAGED_USER_${validatedData.role.toUpperCase()}`,
      targetType: "User",
      targetId: newUser._id.toString(),
    });

    return NextResponse.json({
      success: true,
      message: `Akun ${validatedData.role} berhasil dibuat oleh Admin`,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        doctor: doctorProfile,
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: error.errors[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    console.error("Error admin create user:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membuat pengguna baru" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = authorizeRole(req, ["admin"]);
    if (errorResponse) return errorResponse;

    await connectDB();

    const users = await User.find({}).select("-passwordHash").sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Error get users:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil daftar pengguna" },
      { status: 500 }
    );
  }
}
