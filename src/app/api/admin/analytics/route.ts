import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { Patient } from "@/models/Patient";
import { Doctor } from "@/models/Doctor";
import { Appointment } from "@/models/Appointment";
import { MedicalRecord } from "@/models/MedicalRecord";
import { SymptomCheck } from "@/models/SymptomCheck";
import { AuditLog } from "@/models/AuditLog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Akses ditolak: Dashboard Analytics hanya dapat diakses oleh Admin." },
        { status: 403 }
      );
    }

    await connectDB();

    // 1. Audit Log: Log VIEW_ANALYTICS_DASHBOARD
    await AuditLog.create({
      userId: session.userId,
      action: "VIEW_ANALYTICS_DASHBOARD",
      targetType: "Analytics",
      targetId: "global",
    });

    // 2. Aggregate Total Patients & Total Doctors
    const totalPatients = await Patient.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalSymptomChecks = await SymptomCheck.countDocuments();

    // 3. Breakdown Doctors by Specialization
    const doctorsPerSpecialization = await Doctor.aggregate([
      { $group: { _id: "$specialization", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // 4. Appointment Status Breakdown
    const appointmentStatusRaw = await Appointment.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const appointmentStats = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      total: 0,
    };

    appointmentStatusRaw.forEach((item) => {
      const status = item._id as keyof typeof appointmentStats;
      if (status in appointmentStats) {
        appointmentStats[status] = item.count;
      }
      appointmentStats.total += item.count;
    });

    // 5. Top 5 Active Doctors by Completed Appointments
    const topDoctorsRaw = await Appointment.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: "$doctorId", completedCount: { $sum: 1 } } },
      { $sort: { completedCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "doctors",
          localField: "_id",
          foreignField: "_id",
          as: "doctorDoc",
        },
      },
      { $unwind: { path: "$doctorDoc", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "doctorDoc.userId",
          foreignField: "_id",
          as: "userDoc",
        },
      },
      { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          doctorId: "$_id",
          doctorName: { $ifNull: ["$userDoc.name", "Dokter TeleMedika"] },
          specialization: { $ifNull: ["$doctorDoc.specialization", "Dokter Umum"] },
          completedCount: 1,
        },
      },
    ]);

    // 6. Consultation Trends Over Time (Grouped by Day)
    const trendsRaw = await Appointment.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    const consultationTrends = trendsRaw.map((item) => ({
      date: item._id,
      total: item.total,
      completed: item.completed,
      cancelled: item.cancelled,
    }));

    // 7. Top Medical Diagnoses Aggregation (STRICT PRIVACY: Aggregate purely at DB level)
    // NEVER send raw patient data to frontend! Returns only { diagnosis: string, count: number }
    const topDiagnoses = await MedicalRecord.aggregate([
      { $group: { _id: "$diagnosis", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          diagnosis: "$_id",
          count: 1,
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      analytics: {
        summary: {
          totalPatients,
          totalDoctors,
          totalSymptomChecks,
          appointmentStats,
        },
        doctorsPerSpecialization: doctorsPerSpecialization.map((d) => ({
          specialization: d._id || "Dokter Umum",
          count: d.count,
        })),
        topDoctors: topDoctorsRaw,
        consultationTrends,
        topDiagnoses,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/analytics Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengambil data analytics hospital." },
      { status: 500 }
    );
  }
}
