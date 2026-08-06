import mongoose from "mongoose";

const MONGODB_URI = "mongodb://fikrinerza0_db_user:LlonATCaFFvXuChC@ac-digsqg3-shard-00-00.2bm3beg.mongodb.net:27017,ac-digsqg3-shard-00-01.2bm3beg.mongodb.net:27017,ac-digsqg3-shard-00-02.2bm3beg.mongodb.net:27017/?ssl=true&replicaSet=atlas-5h0bq7-shard-0&authSource=admin&appName=Rumahsakit";

async function main() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  const Appointment = mongoose.connection.collection("appointments");

  // Search for appointment by room name pattern or old domain
  const targetRoomPattern = "6a72ed31fea30526035d7ce7";
  const query = {
    $or: [
      { videoRoomName: { $regex: targetRoomPattern, $options: "i" } },
      { videoRoomUrl: { $regex: "telemedika", $options: "i" } },
      { videoRoomUrl: { $ne: "" } },
    ],
  };

  const matchedBefore = await Appointment.find(query).toArray();
  console.log(`Found ${matchedBefore.length} matching appointment(s) before reset:`);
  matchedBefore.forEach((app) => {
    console.log(`- ID: ${app._id}, Current URL: "${app.videoRoomUrl}", RoomName: "${app.videoRoomName}"`);
  });

  // Reset videoRoomUrl & videoRoomName to empty strings
  const updateResult = await Appointment.updateMany(query, {
    $set: {
      videoRoomUrl: "",
      videoRoomName: "",
    },
  });

  console.log(`\nUpdated ${updateResult.modifiedCount} appointment(s). Fields videoRoomUrl & videoRoomName reset to "".`);

  const matchedAfter = await Appointment.find({ _id: { $in: matchedBefore.map((a) => a._id) } }).toArray();
  console.log("\nStatus after reset:");
  matchedAfter.forEach((app) => {
    console.log(`- ID: ${app._id}, Reset URL: "${app.videoRoomUrl}", Reset RoomName: "${app.videoRoomName}"`);
  });

  await mongoose.disconnect();
  console.log("MongoDB connection closed.");
}

main().catch((err) => {
  console.error("Error in reset script:", err);
});
