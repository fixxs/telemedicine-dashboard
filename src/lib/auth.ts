import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JWTPayload } from "./jwt";

export function getAuthSession(req: NextRequest): JWTPayload | null {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function authorizeRole(
  req: NextRequest,
  allowedRoles: Array<"admin" | "dokter" | "pasien">
): { session: JWTPayload | null; errorResponse: NextResponse | null } {
  const session = getAuthSession(req);

  if (!session) {
    return {
      session: null,
      errorResponse: NextResponse.json(
        { success: false, message: "Sesi tidak valid atau belum login" },
        { status: 401 }
      ),
    };
  }

  if (!allowedRoles.includes(session.role)) {
    return {
      session,
      errorResponse: NextResponse.json(
        { success: false, message: "Akses ditolak: Anda tidak memiliki wewenang untuk aksi ini" },
        { status: 403 }
      ),
    };
  }

  return { session, errorResponse: null };
}
