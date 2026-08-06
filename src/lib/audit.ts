import { connectDB } from "@/lib/db";
import { AuditLog } from "@/models/AuditLog";

export async function logAudit(params: {
  userId: string;
  action: string;
  targetType: string;
  targetId?: string;
}) {
  try {
    await connectDB();
    const log = await AuditLog.create({
      userId: params.userId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId || "",
      timestamp: new Date(),
    });
    console.log(
      `[AuditLog Success] Action: ${params.action} | User: ${params.userId} | Target: ${params.targetType}:${params.targetId}`
    );
    return log;
  } catch (error) {
    console.error("[AuditLog Error] Gagal menyimpan AuditLog ke database:", error);
  }
}
