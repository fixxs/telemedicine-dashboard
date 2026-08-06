import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const MONGODB_URI = "mongodb://fikrinerza0_db_user:LlonATCaFFvXuChC@ac-digsqg3-shard-00-00.2bm3beg.mongodb.net:27017,ac-digsqg3-shard-00-01.2bm3beg.mongodb.net:27017,ac-digsqg3-shard-00-02.2bm3beg.mongodb.net:27017/?ssl=true&replicaSet=atlas-5h0bq7-shard-0&authSource=admin&appName=Rumahsakit";
const JWT_SECRET = "c8829fd46000ef79b9c1c4a2ebd5400db2b2381568f670567f4e629610603020";

async function verifyResetAndTest() {
  const baseUrl = "http://localhost:3000";
  console.log("=== LIVE RE-TEST VERIFIKASI GENERATE ROOM BARU DAILY.CO ===");

  await mongoose.connect(MONGODB_URI);
  const Appointment = mongoose.connection.collection("appointments");
  const Doctors = mongoose.connection.collection("doctors");
  const Users = mongoose.connection.collection("users");

  const appObjId = new mongoose.Types.ObjectId("6a72ed31fea30526035d7ce7");
  let appointment = await Appointment.findOne({ _id: appObjId });

  if (!appointment) {
    appointment = await Appointment.findOne({ status: "confirmed" });
  }

  if (!appointment) {
    console.error("No confirmed appointment found to test!");
    await mongoose.disconnect();
    return;
  }

  console.log("\n[Database State]");
  console.log(`- Target Appointment ID: ${appointment._id.toString()}`);
  console.log(`- Status: ${appointment.status}`);
  console.log(`- Stored videoRoomUrl: "${appointment.videoRoomUrl || ""}"`);
  console.log(`- Stored videoRoomName: "${appointment.videoRoomName || ""}"`);

  // Find assigned Doctor user ID
  const doctorDoc = await Doctors.findOne({ _id: appointment.doctorId });
  const doctorUser = doctorDoc ? await Users.findOne({ _id: doctorDoc.userId }) : null;

  await mongoose.disconnect();

  const userId = doctorUser ? doctorUser._id.toString() : "test_user_id";
  const userEmail = doctorUser ? doctorUser.email : "doctor@hospital.com";
  const userName = doctorUser ? doctorUser.name : "dr. Test";

  // Generate valid auth token for assigned doctor
  const token = jwt.sign(
    { userId, name: userName, email: userEmail, role: "dokter" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  console.log(`\nStep 2: Mengirim POST request ke /api/appointments/${appointment._id}/video-room...`);
  const roomRes = await fetch(`${baseUrl}/api/appointments/${appointment._id}/video-room`, {
    method: "POST",
    headers: {
      Cookie: `auth_token=${token}`,
    },
  });

  const roomStatus = roomRes.status;
  const roomBody = await roomRes.json();

  console.log("\n=================== LIVE RE-TEST RESULTS ===================");
  console.log("HTTP STATUS CODE:", roomStatus);
  console.log("RESPONSE BODY:", JSON.stringify(roomBody, null, 2));
  console.log("============================================================\n");

  if (roomStatus === 200 && roomBody.success) {
    console.log(`✅ VERIFIKASI BERHASIL 100%!`);
    console.log(`✅ Daily.co Room URL Baru: "${roomBody.videoRoomUrl}"`);
    console.log(`✅ Daily.co Room Name Baru: "${roomBody.videoRoomName}"`);

    if (roomBody.videoRoomUrl.includes("rumahsakit-telemedika")) {
      console.log(`✅ DOMAIN BARU TERKONFIRMASI: Menggunakan domain 'rumahsakit-telemedika'!`);
    } else {
      console.error(`❌ Domain mismatch: ${roomBody.videoRoomUrl}`);
    }
  } else {
    console.error(`❌ Request Gagal: ${roomStatus} ${JSON.stringify(roomBody)}`);
  }
}

verifyResetAndTest().catch((err) => {
  console.error("Test error:", err);
});
