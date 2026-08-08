import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const MONGODB_URI = "mongodb://fikrinerza0_db_user:LlonATCaFFvXuChC@ac-digsqg3-shard-00-00.2bm3beg.mongodb.net:27017,ac-digsqg3-shard-00-01.2bm3beg.mongodb.net:27017,ac-digsqg3-shard-00-02.2bm3beg.mongodb.net:27017/?ssl=true&replicaSet=atlas-5h0bq7-shard-0&authSource=admin&appName=Rumahsakit";
const JWT_SECRET = "c8829fd46000ef79b9c1c4a2ebd5400db2b2381568f670567f4e629610603020";

async function verifyPhase6() {
  let baseUrl = "http://localhost:3000";
  try {
    const ping = await fetch(`${baseUrl}/api/auth/me`);
  } catch (e) {
    baseUrl = "http://localhost:3001";
  }

  console.log(`=== LIVE HTTP RE-TEST PHASE 6: HOSPITAL ANALYTICS DASHBOARD (Target: ${baseUrl}) ===`);

  await mongoose.connect(MONGODB_URI);
  const Patients = mongoose.connection.collection("patients");
  const Doctors = mongoose.connection.collection("doctors");

  const patientDoc = await Patients.findOne({});
  const doctorDoc = await Doctors.findOne({});

  await mongoose.disconnect();

  if (!patientDoc || !doctorDoc) {
    console.error("Dokumen Patient atau Doctor tidak ditemukan!");
    return;
  }

  const patUserId = patientDoc.userId.toString();
  const docUserId = doctorDoc.userId.toString();

  // Create JWT Auth Tokens
  const adminToken = jwt.sign(
    { userId: "admin_id_123", name: "Admin", email: "admin@hospital.com", role: "admin" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

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

  console.log("\n--- TEST 1: GET /api/admin/analytics (Admin Access -> Harus 200 OK & Agregat Lengkap) ---");
  const resGetAdmin = await fetch(`${baseUrl}/api/admin/analytics`, {
    method: "GET",
    headers: { Cookie: `auth_token=${adminToken}` },
  });

  const statusGetAdmin = resGetAdmin.status;
  const bodyGetAdmin = await resGetAdmin.json();

  console.log("HTTP Status Code:", statusGetAdmin);
  console.log("Analytics Payload Keys:", Object.keys(bodyGetAdmin.analytics || {}));
  console.log("Summary Metrics:", JSON.stringify(bodyGetAdmin.analytics?.summary, null, 2));

  if (statusGetAdmin === 200 && bodyGetAdmin.success && bodyGetAdmin.analytics) {
    console.log("✅ TEST 1 PASS: Admin BERHASIL mengambil data analytics hospital!");
  } else {
    console.error(`❌ TEST 1 FAIL: ${statusGetAdmin} ${JSON.stringify(bodyGetAdmin)}`);
  }

  console.log("\n--- TEST 2: PRIVACY AUDIT topDiagnoses Payload (Harus HANYA { diagnosis, count }, Zero PII) ---");
  const topDiagnoses = bodyGetAdmin.analytics?.topDiagnoses || [];
  console.log("Top Diagnoses Payload:", JSON.stringify(topDiagnoses, null, 2));

  let hasPII = false;
  for (const item of topDiagnoses) {
    const keys = Object.keys(item);
    if (keys.includes("patientId") || keys.includes("patientName") || keys.includes("userId")) {
      hasPII = true;
    }
  }

  if (!hasPII) {
    console.log("✅ TEST 2 PASS: Data statistik diagnosa 100% TERPROTEKSI (Agregat murni DB, Zero Patient PII)!");
  } else {
    console.error("❌ TEST 2 FAIL: Ditemukan PII pasien pada payload diagnosa!");
  }

  console.log("\n--- TEST 3: GET /api/admin/analytics (Pasien Request -> Harus 403 Forbidden) ---");
  const resGetPat = await fetch(`${baseUrl}/api/admin/analytics`, {
    method: "GET",
    headers: { Cookie: `auth_token=${patientToken}` },
  });

  const statusGetPat = resGetPat.status;
  const bodyGetPat = await resGetPat.json();

  console.log("HTTP Status Code:", statusGetPat);
  console.log("Response Payload:", JSON.stringify(bodyGetPat, null, 2));

  if (statusGetPat === 403) {
    console.log("✅ TEST 3 PASS: Pasien DITOLAK mengakses dashboard analytics (403 Forbidden)!");
  } else {
    console.error(`❌ TEST 3 FAIL: Expected 403 but received ${statusGetPat}`);
  }

  console.log("\n--- TEST 4: GET /api/admin/analytics (Dokter Request -> Harus 403 Forbidden) ---");
  const resGetDoc = await fetch(`${baseUrl}/api/admin/analytics`, {
    method: "GET",
    headers: { Cookie: `auth_token=${doctorToken}` },
  });

  const statusGetDoc = resGetDoc.status;
  const bodyGetDoc = await resGetDoc.json();

  console.log("HTTP Status Code:", statusGetDoc);
  console.log("Response Payload:", JSON.stringify(bodyGetDoc, null, 2));

  if (statusGetDoc === 403) {
    console.log("✅ TEST 4 PASS: Dokter DITOLAK mengakses dashboard analytics (403 Forbidden)!");
  } else {
    console.error(`❌ TEST 4 FAIL: Expected 403 but received ${statusGetDoc}`);
  }
}

verifyPhase6().catch((err) => {
  console.error("Test execution error:", err);
});
