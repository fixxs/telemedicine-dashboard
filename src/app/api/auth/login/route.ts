import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { signToken } from "@/lib/jwt";
import { loginSchema } from "@/lib/validations/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = loginSchema.parse(body);

    await connectDB();

    const cleanEmail = validatedData.email.trim().toLowerCase();
    const cleanPassword = validatedData.password.trim();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      console.warn(`[API /api/auth/login 401] User not found for email: "${cleanEmail}"`);
      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(cleanPassword, user.passwordHash);
    if (!isMatch) {
      console.warn(`[API /api/auth/login 401] Password mismatch for user: "${cleanEmail}"`);
      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    await logAudit({
      userId: user._id.toString(),
      action: "USER_LOGIN",
      targetType: "User",
      targetId: user._id.toString(),
    });

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 hari
    });

    return response;
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: error.errors[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    console.error("Error login:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server saat login" },
      { status: 500 }
    );
  }
}
