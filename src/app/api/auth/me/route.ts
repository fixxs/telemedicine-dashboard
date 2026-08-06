import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = getAuthSession(req);

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Belum login" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: session,
  });
}
