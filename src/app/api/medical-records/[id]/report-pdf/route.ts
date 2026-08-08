import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { connectDB } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { User } from "@/models/User"; // Ensure User model is registered for populate
import { Patient } from "@/models/Patient";
import { Doctor } from "@/models/Doctor";
import { MedicalRecord } from "@/models/MedicalRecord";
import { Prescription } from "@/models/Prescription";
import { AuditLog } from "@/models/AuditLog";
import { MedicalReportPdfDocument } from "@/lib/pdf/pdf-report";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Sesi tidak valid atau telah berakhir." },
        { status: 401 }
      );
    }

    // Admin MUST NOT access individual medical records or PDF reports
    if (session.role === "admin") {
      await AuditLog.create({
        userId: session.userId,
        action: "UNAUTHORIZED_PDF_ACCESS",
        targetType: "MedicalRecord",
        targetId: params.id,
      });

      return NextResponse.json(
        { success: false, message: "Akses ditolak: Admin tidak memiliki wewenang mengunduh Laporan PDF medis." },
        { status: 403 }
      );
    }

    await connectDB();

    // Ensure User model is explicitly referenced so Mongoose registers it
    if (!User) {
      console.warn("User model handle check");
    }

    const record = await MedicalRecord.findById(params.id);
    if (!record) {
      return NextResponse.json(
        { success: false, message: "Rekam medis tidak ditemukan." },
        { status: 404 }
      );
    }

    // Resolve Patient & Doctor details for report header
    const patientDoc = await Patient.findById(record.patientId).populate("userId");
    const doctorDoc = await Doctor.findById(record.doctorId).populate("userId");

    if (!patientDoc || !doctorDoc) {
      return NextResponse.json(
        { success: false, message: "Data pasien atau dokter penanggung jawab tidak lengkap." },
        { status: 404 }
      );
    }

    // Verify Ownership
    let isAuthorized = false;

    if (session.role === "pasien") {
      const currentPatient = await Patient.findOne({ userId: session.userId });
      if (currentPatient && record.patientId.toString() === currentPatient._id.toString()) {
        isAuthorized = true;
      }
    } else if (session.role === "dokter") {
      const currentDoctor = await Doctor.findOne({ userId: session.userId });
      if (currentDoctor && record.doctorId.toString() === currentDoctor._id.toString()) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      await AuditLog.create({
        userId: session.userId,
        action: "UNAUTHORIZED_PDF_ACCESS",
        targetType: "MedicalRecord",
        targetId: params.id,
      });

      return NextResponse.json(
        { success: false, message: "Akses Ditolak: Anda tidak berhak mengunduh laporan PDF medis pasien lain." },
        { status: 403 }
      );
    }

    // Fetch related Prescription if available
    const prescriptionDoc = await Prescription.findOne({ medicalRecordId: record._id });

    // Format consultation date
    const formattedDate = new Date(record.createdAt).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const patientName = (patientDoc.userId as any)?.name || "Pasien TeleMedika";
    const patientEmail = (patientDoc.userId as any)?.email || "-";
    const doctorName = (doctorDoc.userId as any)?.name || "dr. TeleMedika";

    const pdfProps = {
      hospitalInfo: {
        name: "RUMAH SAKIT TELEMEDIKA DIGITAL",
        address: "Jl. Kesehatan Medika No. 88, Jakarta Selatan 12930",
        phone: "(021) 555-9988",
        email: "support@telemedika.rs.id",
      },
      patientInfo: {
        name: patientName,
        email: patientEmail,
        recordNo: `RM-${record.patientId.toString().slice(-6).toUpperCase()}`,
      },
      doctorInfo: {
        name: doctorName,
        specialization: doctorDoc.specialization || "Dokter Umum",
      },
      consultationInfo: {
        date: formattedDate,
        appointmentId: record.appointmentId.toString(),
        chiefComplaint: record.chiefComplaint,
        diagnosis: record.diagnosis,
        notes: record.notes,
        vitalSigns: record.vitalSigns,
      },
      prescription: prescriptionDoc
        ? {
            medicines: prescriptionDoc.medicines,
            generalNotes: prescriptionDoc.generalNotes,
          }
        : null,
    };

    // Generate PDF Buffer using @react-pdf/renderer React.createElement
    const pdfElement = React.createElement(MedicalReportPdfDocument as any, pdfProps);
    const pdfBuffer = await renderToBuffer(pdfElement as any);

    // Audit Logging: DOWNLOAD_MEDICAL_REPORT_PDF
    await AuditLog.create({
      userId: session.userId,
      action: "DOWNLOAD_MEDICAL_REPORT_PDF",
      targetType: "MedicalRecord",
      targetId: record._id.toString(),
    });

    const pdfUint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfUint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Laporan-Rekam-Medis-${record._id.toString().slice(-6)}.pdf"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    console.error("GET /api/medical-records/[id]/report-pdf Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal meng-generate laporan PDF rekam medis." },
      { status: 500 }
    );
  }
}
