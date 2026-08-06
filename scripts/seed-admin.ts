import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore
}

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...values] = trimmed.split("=");
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join("=").trim();
      }
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_SEED_PASSWORD = process.env.ADMIN_SEED_PASSWORD;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI belum diatur di .env.local");
  process.exit(1);
}

if (!ADMIN_SEED_PASSWORD) {
  console.error("Error: ADMIN_SEED_PASSWORD belum diatur di .env.local");
  process.exit(1);
}

// Mask password for display
const maskedURI = MONGODB_URI.replace(/:([^@]+)@/, ":****@");
console.log(`Menggunakan MONGODB_URI: ${maskedURI}`);

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: String,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function seedAdmin() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGODB_URI!, { serverSelectionTimeoutMS: 5000 });

    const adminEmail = "admin@hospital.com";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`✅ Admin account (${adminEmail}) sudah ada di database.`);
    } else {
      const passwordHash = await bcrypt.hash(ADMIN_SEED_PASSWORD!, 10);
      await User.create({
        name: "Administrator Utama",
        email: adminEmail,
        passwordHash,
        role: "admin",
      });
      console.log(`🎉 BERHASIL! Akun Admin awal (${adminEmail}) telah dibuat dengan password dari ADMIN_SEED_PASSWORD.`);
    }
  } catch (error: any) {
    console.error("❌ Gagal melakukan seed admin:", error.message || error);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
