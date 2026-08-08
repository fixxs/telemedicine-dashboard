import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const MONGODB_URI = "mongodb://fikrinerza0_db_user:LlonATCaFFvXuChC@ac-digsqg3-shard-00-00.2bm3beg.mongodb.net:27017,ac-digsqg3-shard-00-01.2bm3beg.mongodb.net:27017,ac-digsqg3-shard-00-02.2bm3beg.mongodb.net:27017/?ssl=true&replicaSet=atlas-5h0bq7-shard-0&authSource=admin&appName=Rumahsakit";
const JWT_SECRET = "c8829fd46000ef79b9c1c4a2ebd5400db2b2381568f670567f4e629610603020";

async function verifyPhase5() {
  let baseUrl = "http://localhost:3001";
  try {
    const ping = await fetch(`${baseUrl}/api/auth/me`);
  } catch (e) {
    baseUrl = "http://localhost:3000";
  }

  console.log(`=== LIVE HTTP RE-TEST PHASE 5: RESEP DIGITAL & LAPORAN PDF (Target: ${baseUrl}) ===`);

  await mongoose.connect(MONGODB_URI);
  const MedicalRecord = mongoose.connection.collection("medicalrecords");
  const Patients = mongoose.connection.collection("patients");
  const Doctors = mongoose.connection.collection("doctors");

  const record = await MedicalRecord.findOne({});

  if (!record) {
    console.error("Tidak ada rekam medis di DB untuk dites!");
    await mongoose.disconnect();
    return;
  }

  const patientDoc = await Patients.findOne({ _id: record.patientId });
  const doctorDoc = await Doctors.findOne({ _id: record.doctorId });

  // Find another doctor not assigned to this record
  let otherDoctorDoc = await Doctors.findOne({ _id: { $ne: record.doctorId } });
  if (!otherDoctorDoc) {
    const newDocId = new mongoose.Types.ObjectId();
    const newUserId = new mongoose.Types.ObjectId();
    await Doctors.insertOne({ _id: newDocId, userId: newUserId, specialization: "Dokter Gigi" });
    otherDoctorDoc = { _id: newDocId, userId: newUserId };
  }

  await mongoose.disconnect();

  if (!patientDoc || !doctorDoc) {
    console.error("Dokumen Patient atau Doctor tidak ditemukan!");
    return;
  }

  const patUserId = patientDoc.userId.toString();
  const docUserId = doctorDoc.userId.toString();
  const otherDocUserId = otherDoctorDoc.userId.toString();

  // Create JWT Auth Tokens
  const patientToken = jwt.sign(
    { userId: patUserId, name: "Siti Rahma", email: "siti.rahma@gmail.com", role: "pasien" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const doctorToken = jwt.sign(
    { userId: docUserId, name: "dr. Ahmad Hidayat", email: "dokter.ahmad@hospital.com", role: "dokter" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const adminToken = jwt.sign(
    { userId: "admin_id_123", name: "Admin", email: "admin@hospital.com", role: "admin" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const unassignedDoctorToken = jwt.sign(
    { userId: otherDocUserId, name: "dr. Lain", email: "dokter.lain@hospital.com", role: "dokter" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const recordId = record._id.toString();

  console.log("\n--- TEST 1: POST /api/prescriptions (Dokter Menerbitkan Resep Baru -> CREATE_PRESCRIPTION AuditLog) ---");
  const resPostCreate = await fetch(`${baseUrl}/api/prescriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `auth_token=${doctorToken}`,
    },
    body: JSON.stringify({
      medicalRecordId: recordId,
      medicines: [
        {
          name: "Parasetamol 500mg",
          dosage: "1 tablet",
          frequency: "3x1 sehari sesudah makan",
          duration: "5 hari",
          notes: "Bila demam saja",
        },
        {
          name: "Amoksisisilin 500mg",
          dosage: "1 kaplet",
          frequency: "3x1 sehari sesudah makan",
          duration: "5 hari (sampai habis)",
          notes: "Antibiotik wajib dihabiskan",
        },
      ],
      generalNotes: "Istirahat cukup dan banyak minum air putih.",
    }),
  });

  const statusPostCreate = resPostCreate.status;
  const bodyPostCreate = await resPostCreate.json();

  console.log("HTTP Status Code:", statusPostCreate);
  console.log("Response Payload:", JSON.stringify(bodyPostCreate, null, 2));

  if (statusPostCreate === 200 && bodyPostCreate.success && bodyPostCreate.prescription) {
    console.log("✅ TEST 1 PASS: Resep Digital BERHASIL diterbitkan oleh Dokter (CREATE_PRESCRIPTION)!");
  } else {
    console.error(`❌ TEST 1 FAIL: ${statusPostCreate} ${JSON.stringify(bodyPostCreate)}`);
  }

  console.log("\n--- TEST 2: POST /api/prescriptions (Dokter Meng-UPDATE Resep -> UPDATE_PRESCRIPTION AuditLog) ---");
  const resPostUpdate = await fetch(`${baseUrl}/api/prescriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `auth_token=${doctorToken}`,
    },
    body: JSON.stringify({
      medicalRecordId: recordId,
      medicines: [
        {
          name: "Parasetamol 500mg",
          dosage: "1 tablet",
          frequency: "3x1 sehari sesudah makan",
          duration: "5 hari",
          notes: "Bila demam saja",
        },
        {
          name: "Amoksisisilin 500mg",
          dosage: "1 kaplet",
          frequency: "3x1 sehari sesudah makan",
          duration: "5 hari (sampai habis)",
          notes: "Antibiotik wajib dihabiskan",
        },
        {
          name: "Vitamin C 500mg",
          dosage: "1 tablet",
          frequency: "1x1 sehari sesudah makan",
          duration: "10 hari",
          notes: "Suplemen pemulihan",
        },
      ],
      generalNotes: "Perbarui resep: Ditambahkan Vitamin C.",
    }),
  });

  const statusPostUpdate = resPostUpdate.status;
  const bodyPostUpdate = await resPostUpdate.json();

  console.log("HTTP Status Code:", statusPostUpdate);
  console.log("Response Payload:", JSON.stringify(bodyPostUpdate, null, 2));

  if (statusPostUpdate === 200 && bodyPostUpdate.success && bodyPostUpdate.prescription?.medicines?.length === 3) {
    console.log("✅ TEST 2 PASS: Resep Digital BERHASIL diperbarui oleh Dokter (UPDATE_PRESCRIPTION)!");
  } else {
    console.error(`❌ TEST 2 FAIL: ${statusPostUpdate} ${JSON.stringify(bodyPostUpdate)}`);
  }

  console.log("\n--- TEST 3: GET /api/prescriptions/[medicalRecordId] (Pasien Membaca Resep Milik Sendiri) ---");
  const resGetPrescriptionPat = await fetch(`${baseUrl}/api/prescriptions/${recordId}`, {
    method: "GET",
    headers: { Cookie: `auth_token=${patientToken}` },
  });

  const statusGetPrescriptionPat = resGetPrescriptionPat.status;
  const bodyGetPrescriptionPat = await resGetPrescriptionPat.json();

  console.log("HTTP Status Code:", statusGetPrescriptionPat);
  console.log("Item Obat Count:", bodyGetPrescriptionPat.prescription?.medicines?.length || 0);

  if (statusGetPrescriptionPat === 200 && bodyGetPrescriptionPat.success) {
    console.log("✅ TEST 3 PASS: Pasien BERHASIL membaca resep obat digital miliknya!");
  } else {
    console.error(`❌ TEST 3 FAIL: ${statusGetPrescriptionPat} ${JSON.stringify(bodyGetPrescriptionPat)}`);
  }

  console.log("\n--- TEST 4: GET /api/prescriptions/[medicalRecordId] (Admin Request Resep -> Harus 403 Forbidden) ---");
  const resGetPrescriptionAdmin = await fetch(`${baseUrl}/api/prescriptions/${recordId}`, {
    method: "GET",
    headers: { Cookie: `auth_token=${adminToken}` },
  });

  const statusGetPrescriptionAdmin = resGetPrescriptionAdmin.status;
  const bodyGetPrescriptionAdmin = await resGetPrescriptionAdmin.json();

  console.log("HTTP Status Code:", statusGetPrescriptionAdmin);
  console.log("Response Payload:", JSON.stringify(bodyGetPrescriptionAdmin, null, 2));

  if (statusGetPrescriptionAdmin === 403) {
    console.log("✅ TEST 4 PASS: Admin DITOLAK membaca resep individual dengan status 403 Forbidden!");
  } else {
    console.error(`❌ TEST 4 FAIL: Expected 403 but received ${statusGetPrescriptionAdmin}`);
  }

  console.log("\n--- TEST 5: GET /api/medical-records/[id]/report-pdf (Pasien Download Laporan PDF) ---");
  const resGetPdfPat = await fetch(`${baseUrl}/api/medical-records/${recordId}/report-pdf`, {
    method: "GET",
    headers: { Cookie: `auth_token=${patientToken}` },
  });

  const statusGetPdfPat = resGetPdfPat.status;
  const contentTypePat = resGetPdfPat.headers.get("content-type");
  const bufferPat = await resGetPdfPat.arrayBuffer();
  const headerPdfText = Buffer.from(bufferPat).toString("utf8", 0, 8);

  console.log("HTTP Status Code:", statusGetPdfPat);
  console.log("Content-Type Header:", contentTypePat);
  console.log("PDF Header Signature:", headerPdfText);
  console.log("PDF Buffer Size:", bufferPat.byteLength, "bytes");

  if (statusGetPdfPat === 200 && contentTypePat === "application/pdf" && headerPdfText.startsWith("%PDF")) {
    console.log("✅ TEST 5 PASS: Pasien BERHASIL mengunduh Laporan PDF Rekam Medis & Resep (%PDF-1.4)!");
  } else {
    console.error(`❌ TEST 5 FAIL: ${statusGetPdfPat} ContentType: ${contentTypePat}`);
  }

  console.log("\n--- TEST 6: GET /api/medical-records/[id]/report-pdf (Dokter Pembuat Download Laporan PDF) ---");
  const resGetPdfDoc = await fetch(`${baseUrl}/api/medical-records/${recordId}/report-pdf`, {
    method: "GET",
    headers: { Cookie: `auth_token=${doctorToken}` },
  });

  const statusGetPdfDoc = resGetPdfDoc.status;
  const contentTypeDoc = resGetPdfDoc.headers.get("content-type");

  console.log("HTTP Status Code:", statusGetPdfDoc);
  console.log("Content-Type Header:", contentTypeDoc);

  if (statusGetPdfDoc === 200 && contentTypeDoc === "application/pdf") {
    console.log("✅ TEST 6 PASS: Dokter pembuat BERHASIL mengunduh Laporan PDF Rekam Medis!");
  } else {
    console.error(`❌ TEST 6 FAIL: ${statusGetPdfDoc}`);
  }

  console.log("\n--- TEST 7: GET /api/medical-records/[id]/report-pdf (Dokter Lain / Admin Download PDF -> Harus 403 Forbidden) ---");
  const resGetPdfOtherDoc = await fetch(`${baseUrl}/api/medical-records/${recordId}/report-pdf`, {
    method: "GET",
    headers: { Cookie: `auth_token=${unassignedDoctorToken}` },
  });

  const statusGetPdfOtherDoc = resGetPdfOtherDoc.status;
  const bodyGetPdfOtherDoc = await resGetPdfOtherDoc.json();

  console.log("HTTP Status Code (Unassigned Doctor):", statusGetPdfOtherDoc);
  console.log("Response Payload:", JSON.stringify(bodyGetPdfOtherDoc, null, 2));

  const resGetPdfAdmin = await fetch(`${baseUrl}/api/medical-records/${recordId}/report-pdf`, {
    method: "GET",
    headers: { Cookie: `auth_token=${adminToken}` },
  });

  const statusGetPdfAdmin = resGetPdfAdmin.status;

  console.log("HTTP Status Code (Admin):", statusGetPdfAdmin);

  if (statusGetPdfOtherDoc === 403 && statusGetPdfAdmin === 403) {
    console.log("✅ TEST 7 PASS: Dokter lain & Admin DITOLAK mengunduh PDF rekam medis orang lain (403 Forbidden)!");
  } else {
    console.error(`❌ TEST 7 FAIL: Expected 403 for both, got OtherDoc=${statusGetPdfOtherDoc}, Admin=${statusGetPdfAdmin}`);
  }
}

verifyPhase5().catch((err) => {
  console.error("Test execution error:", err);
});
