import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const MONGODB_URI = "mongodb://fikrinerza0_db_user:LlonATCaFFvXuChC@ac-digsqg3-shard-00-00.2bm3beg.mongodb.net:27017,ac-digsqg3-shard-00-01.2bm3beg.mongodb.net:27017,ac-digsqg3-shard-00-02.2bm3beg.mongodb.net:27017/?ssl=true&replicaSet=atlas-5h0bq7-shard-0&authSource=admin&appName=Rumahsakit";
const JWT_SECRET = "c8829fd46000ef79b9c1c4a2ebd5400db2b2381568f670567f4e629610603020";
const LIVEKIT_API_SECRET = "jmpjjUWkwHi6eJmd8nlBuCns4hpxozFlR7fWSqj17ecB";

async function verifyLiveKitMigration() {
  const baseUrl = "http://localhost:3001";
  console.log("=== LIVE HTTP RE-TEST: VERIFIKASI MIGRASI LIVEKIT CLOUD ===");

  await mongoose.connect(MONGODB_URI);
  const Appointment = mongoose.connection.collection("appointments");
  const Doctors = mongoose.connection.collection("doctors");
  const Patients = mongoose.connection.collection("patients");

  const appointment = await Appointment.findOne({ status: "confirmed" });

  if (!appointment) {
    console.error("Tidak ada appointment confirmed untuk dites!");
    await mongoose.disconnect();
    return;
  }

  const appTargetId = appointment._id.toString();
  console.log(`Target Appointment ID: ${appTargetId}`);

  // Resolve Doctor & Patient documents
  const doctorDoc = await Doctors.findOne({ _id: appointment.doctorId });
  const patientDoc = await Patients.findOne({ _id: appointment.patientId });

  await mongoose.disconnect();

  if (!doctorDoc || !patientDoc) {
    console.error("Dokter atau Pasien document tidak ditemukan di database!");
    return;
  }

  const docUserId = doctorDoc.userId.toString();
  const patUserId = patientDoc.userId.toString();

  console.log(`Assigned Doctor User ID: ${docUserId}`);
  console.log(`Assigned Patient User ID: ${patUserId}`);

  // 1. Generate Authorized Doctor Token
  const authorizedDoctorToken = jwt.sign(
    { userId: docUserId, name: "dr. Ahmad Hidayat", email: "dokter.ahmad@hospital.com", role: "dokter" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  // 2. Generate Authorized Patient Token
  const authorizedPatientToken = jwt.sign(
    { userId: patUserId, name: "Siti Rahma", email: "siti.rahma@gmail.com", role: "pasien" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  // 3. Generate Admin Token (Unauthorized for video-token)
  const adminToken = jwt.sign(
    { userId: "admin_id_123", name: "Admin", email: "admin@hospital.com", role: "admin" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  // 4. Generate Unassigned Doctor Token (Other doctor not assigned to this appointment)
  const otherDoctorToken = jwt.sign(
    { userId: "6a7078bc8cb88eb19ae19999", name: "dr. Lain", email: "dokter.lain@hospital.com", role: "dokter" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  console.log("\n--- TEST 1: Request Video Token sebagai Dokter Berhak ---");
  const res1 = await fetch(`${baseUrl}/api/appointments/${appTargetId}/video-token`, {
    method: "POST",
    headers: { Cookie: `auth_token=${authorizedDoctorToken}` },
  });

  const status1 = res1.status;
  const body1 = await res1.json();

  console.log("HTTP Status Code:", status1);
  console.log("Response Payload:", JSON.stringify(body1, null, 2));

  if (status1 === 200 && body1.success && body1.token) {
    console.log("✅ TEST 1 PASS: LiveKit Access Token untuk Dokter Berhak BERHASIL di-generate (HTTP 200 OK)!");

    const rawResponseBody = JSON.stringify(body1);
    if (rawResponseBody.includes(LIVEKIT_API_SECRET)) {
      console.error("❌ SECURITY FAILURE: LIVEKIT_API_SECRET TERBOCOR DI RESPONSE!");
    } else {
      console.log("✅ SECURITY PASS: LIVEKIT_API_SECRET 100% TIDAK TERBOCOR di response!");
    }
  } else {
    console.error(`❌ TEST 1 FAIL: ${status1} ${JSON.stringify(body1)}`);
  }

  console.log("\n--- TEST 2: Request Video Token sebagai Pasien Berhak ---");
  const resPasien = await fetch(`${baseUrl}/api/appointments/${appTargetId}/video-token`, {
    method: "POST",
    headers: { Cookie: `auth_token=${authorizedPatientToken}` },
  });

  const statusPasien = resPasien.status;
  const bodyPasien = await resPasien.json();

  console.log("HTTP Status Code:", statusPasien);
  console.log("Response Payload:", JSON.stringify(bodyPasien, null, 2));

  if (statusPasien === 200 && bodyPasien.success && bodyPasien.token) {
    console.log("✅ TEST 2 PASS: LiveKit Access Token untuk Pasien Berhak BERHASIL di-generate (HTTP 200 OK)!");
  } else {
    console.error(`❌ TEST 2 FAIL: ${statusPasien} ${JSON.stringify(bodyPasien)}`);
  }

  console.log("\n--- TEST 3: Request Video Token sebagai Admin (Harus 403 Forbidden) ---");
  const resAdmin = await fetch(`${baseUrl}/api/appointments/${appTargetId}/video-token`, {
    method: "POST",
    headers: { Cookie: `auth_token=${adminToken}` },
  });

  const statusAdmin = resAdmin.status;
  const bodyAdmin = await resAdmin.json();

  console.log("HTTP Status Code:", statusAdmin);
  console.log("Response Payload:", JSON.stringify(bodyAdmin, null, 2));

  if (statusAdmin === 403) {
    console.log("✅ TEST 3 PASS: Admin ditolak dengan status 403 Forbidden!");
  } else {
    console.error(`❌ TEST 3 FAIL: Expected 403 but received ${statusAdmin}`);
  }

  console.log("\n--- TEST 4: Request Video Token sebagai Dokter Lain / Pihak Tidak Berkepentingan (Harus 403 Forbidden) ---");
  const resOther = await fetch(`${baseUrl}/api/appointments/${appTargetId}/video-token`, {
    method: "POST",
    headers: { Cookie: `auth_token=${otherDoctorToken}` },
  });

  const statusOther = resOther.status;
  const bodyOther = await resOther.json();

  console.log("HTTP Status Code:", statusOther);
  console.log("Response Payload:", JSON.stringify(bodyOther, null, 2));

  if (statusOther === 403) {
    console.log("✅ TEST 4 PASS: Dokter lain / Pihak tidak berkepentingan ditolak dengan status 403 Forbidden!");
  } else {
    console.error(`❌ TEST 4 FAIL: Expected 403 but received ${statusOther}`);
  }
}

verifyLiveKitMigration().catch((err) => {
  console.error("Test execution failed:", err);
});
