import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Patient } from "@/models/Patient";
import { signToken } from "@/lib/jwt";
import { registerPatientSchema } from "@/lib/validations/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = registerPatientSchema.parse(body);

    await connectDB();

    const existingUser = await User.findOne({ email: validatedData.email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    const newUser = await User.create({
      name: validatedData.name,
      email: validatedData.email.toLowerCase(),
      passwordHash,
      role: "pasien",
    });

    const newPatient = await Patient.create({
      userId: newUser._id,
      birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : undefined,
      gender: validatedData.gender,
      bloodType: validatedData.bloodType,
      allergies: validatedData.allergies ? validatedData.allergies.split(",").map((s) => s.trim()) : [],
    });

    await logAudit({
      userId: newUser._id.toString(),
      action: "REGISTER_PATIENT",
      targetType: "User",
      targetId: newUser._id.toString(),
    });

    const token = signToken({
      userId: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "Registrasi pasien berhasil",
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        patientId: newPatient._id.toString(),
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

    console.error("Error register:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server saat registrasi" },
      { status: 500 }
    );
  }
}
