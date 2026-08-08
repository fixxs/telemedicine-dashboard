import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const MONGODB_URI = "mongodb://fikrinerza0_db_user:LlonATCaFFvXuChC@ac-digsqg3-shard-00-00.2bm3beg.mongodb.net:27017,ac-digsqg3-shard-00-01.2bm3beg.mongodb.net:27017,ac-digsqg3-shard-00-02.2bm3beg.mongodb.net:27017/?ssl=true&replicaSet=atlas-5h0bq7-shard-0&authSource=admin&appName=Rumahsakit";
const JWT_SECRET = "c8829fd46000ef79b9c1c4a2ebd5400db2b2381568f670567f4e629610603020";

async function verifyPhase4() {
  const baseUrl = "http://localhost:3000";
  console.log("=== LIVE HTTP RE-TEST PHASE 4: AI SYMPTOM CHECKER ===");

  await mongoose.connect(MONGODB_URI);
  const Appointment = mongoose.connection.collection("appointments");
  const Patients = mongoose.connection.collection("patients");
  const Doctors = mongoose.connection.collection("doctors");

  const appointment = await Appointment.findOne({ status: "confirmed" });

  if (!appointment) {
    console.error("Tidak ada appointment confirmed untuk dites!");
    await mongoose.disconnect();
    return;
  }

  const patientDoc = await Patients.findOne({ _id: appointment.patientId });
  const doctorDoc = await Doctors.findOne({ _id: appointment.doctorId });

  // Find another doctor not assigned to this appointment
  let otherDoctorDoc = await Doctors.findOne({ _id: { $ne: appointment.doctorId } });
  if (!otherDoctorDoc) {
    // create temporary doctor doc
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

  console.log("\n--- TEST 1: POST /api/symptom-check (Pasien Submit Gejala ke Gemini AI) ---");
  const resPost = await fetch(`${baseUrl}/api/symptom-check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `auth_token=${patientToken}`,
    },
    body: JSON.stringify({
      symptoms: ["Demam / Panas Tinggi", "Batuk Kering", "Sesak Napas"],
      duration: "1-3 hari",
      severity: "sedang",
      additionalNotes: "Batuk terasa berat saat malam hari",
    }),
  });

  const statusPost = resPost.status;
  const bodyPost = await resPost.json();

  console.log("HTTP Status Code:", statusPost);
  console.log("Response Payload:", JSON.stringify(bodyPost, null, 2));

  if (statusPost === 200 && bodyPost.success && bodyPost.symptomCheck) {
    console.log("✅ TEST 1 PASS: Analisis Gejala AI Gemini BERHASIL diproses & disimpan ke MongoDB!");
    console.log("Urgency Level:", bodyPost.symptomCheck.aiResponse.urgencyLevel);
    console.log("Rekomendasi Spesialis:", bodyPost.symptomCheck.aiResponse.recommendedSpecialization);
  } else {
    console.error(`❌ TEST 1 FAIL: ${statusPost} ${JSON.stringify(bodyPost)}`);
  }

  console.log("\n--- TEST 2: GET /api/symptom-check (Pasien Membaca Riwayat Milik Sendiri) ---");
  const resGetPat = await fetch(`${baseUrl}/api/symptom-check`, {
    method: "GET",
    headers: { Cookie: `auth_token=${patientToken}` },
  });

  const statusGetPat = resGetPat.status;
  const bodyGetPat = await resGetPat.json();

  console.log("HTTP Status Code:", statusGetPat);
  console.log("Riwayat Count:", bodyGetPat.symptomChecks?.length || 0);

  if (statusGetPat === 200 && bodyGetPat.success && Array.isArray(bodyGetPat.symptomChecks)) {
    console.log("✅ TEST 2 PASS: Pasien BERHASIL membaca riwayat symptom check miliknya!");
  } else {
    console.error(`❌ TEST 2 FAIL: ${statusGetPat} ${JSON.stringify(bodyGetPat)}`);
  }

  console.log("\n--- TEST 3: GET /api/symptom-check (Admin Request Riwayat - Harus 403 Forbidden) ---");
  const resGetAdmin = await fetch(`${baseUrl}/api/symptom-check`, {
    method: "GET",
    headers: { Cookie: `auth_token=${adminToken}` },
  });

  const statusGetAdmin = resGetAdmin.status;
  const bodyGetAdmin = await resGetAdmin.json();

  console.log("HTTP Status Code:", statusGetAdmin);
  console.log("Response Payload:", JSON.stringify(bodyGetAdmin, null, 2));

  if (statusGetAdmin === 403) {
    console.log("✅ TEST 3 PASS: Admin DITOLAK dengan status 403 Forbidden!");
  } else {
    console.error(`❌ TEST 3 FAIL: Expected 403 but received ${statusGetAdmin}`);
  }

  console.log("\n--- TEST 4: GET /api/symptom-check (Dokter Lain Tanpa Appointment - Harus 403 Forbidden) ---");
  const resGetUnassignedDoc = await fetch(`${baseUrl}/api/symptom-check?patientId=${patientDoc._id.toString()}`, {
    method: "GET",
    headers: { Cookie: `auth_token=${unassignedDoctorToken}` },
  });

  const statusGetUnassignedDoc = resGetUnassignedDoc.status;
  const bodyGetUnassignedDoc = await resGetUnassignedDoc.json();

  console.log("HTTP Status Code:", statusGetUnassignedDoc);
  console.log("Response Payload:", JSON.stringify(bodyGetUnassignedDoc, null, 2));

  if (statusGetUnassignedDoc === 403) {
    console.log("✅ TEST 4 PASS: Dokter lain tanpa janji temu DITOLAK dengan status 403 Forbidden!");
  } else {
    console.error(`❌ TEST 4 FAIL: Expected 403 but received ${statusGetUnassignedDoc}`);
  }

  console.log("\n--- TEST 5: GET /api/symptom-check (Dokter Assigned Terkait Appointment - Harus 200 OK) ---");
  const resGetAssignedDoc = await fetch(`${baseUrl}/api/symptom-check?patientId=${patientDoc._id.toString()}`, {
    method: "GET",
    headers: { Cookie: `auth_token=${doctorToken}` },
  });

  const statusGetAssignedDoc = resGetAssignedDoc.status;
  const bodyGetAssignedDoc = await resGetAssignedDoc.json();

  console.log("HTTP Status Code:", statusGetAssignedDoc);
  console.log("Riwayat Count:", bodyGetAssignedDoc.symptomChecks?.length || 0);

  if (statusGetAssignedDoc === 200 && bodyGetAssignedDoc.success) {
    console.log("✅ TEST 5 PASS: Dokter yang menangani janji temu BERHASIL membaca referensi symptom check pasien!");
  } else {
    console.error(`❌ TEST 5 FAIL: ${statusGetAssignedDoc} ${JSON.stringify(bodyGetAssignedDoc)}`);
  }
}

verifyPhase4().catch((err) => {
  console.error("Test execution error:", err);
});
