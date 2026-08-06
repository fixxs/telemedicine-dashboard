import mongoose from "mongoose";

const MONGODB_URI = "mongodb://fikrinerza0_db_user:LlonATCaFFvXuChC@ac-digsqg3-shard-00-00.2bm3beg.mongodb.net:27017,ac-digsqg3-shard-00-01.2bm3beg.mongodb.net:27017,ac-digsqg3-shard-00-02.2bm3beg.mongodb.net:27017/?ssl=true&replicaSet=atlas-5h0bq7-shard-0&authSource=admin&appName=Rumahsakit";

async function inspect() {
  await mongoose.connect(MONGODB_URI);
  const Appointment = mongoose.connection.collection("appointments");
  const Doctors = mongoose.connection.collection("doctors");
  const Patients = mongoose.connection.collection("patients");
  const Users = mongoose.connection.collection("users");

  const app = await Appointment.findOne({ status: "confirmed" });
  console.log("Appointment Found:", app);

  if (app) {
    const doc = await Doctors.findOne({ _id: app.doctorId });
    console.log("Doctor Doc:", doc);
    if (doc) {
      const docUser = await Users.findOne({ _id: doc.userId });
      console.log("Doctor User:", docUser);
    }

    const pat = await Patients.findOne({ _id: app.patientId });
    console.log("Patient Doc:", pat);
    if (pat) {
      const patUser = await Users.findOne({ _id: pat.userId });
      console.log("Patient User:", patUser);
    }
  }

  await mongoose.disconnect();
}

inspect().catch(console.error);
