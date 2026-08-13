#  Dokumentasi Final Project: Sistem Telemedicine Rumah Sakit + AI Symptom Checker

**RS TeleMedika Digital** — Platform Layanan Kesehatan Terpadu Berbasis Web, kecerdasan buatan (AI Triage), video call konsul langsung, dan analitik operasional rumah sakit.

---

## 1.  Ringkasan Project

- **Nama Project**: Sistem Telemedicine Rumah Sakit + AI Symptom Checker (RS TeleMedika Digital)
- **Tujuan**: Menghadirkan portal layanan medis digital modern, teraman, dan terintegrasi untuk 3 peran utama: **Pasien**, **Dokter**, dan **Admin Rumah Sakit**.
- **Deskripsi Singkat**: Aplikasi web full-stack modern berbasis Next.js 14 App Router yang mengintegrasikan alur pelayanan medis dari awal hingga akhir:
  - Otentikasi dan otorisasi berbasis peran (Role-Based Access Control / RBAC) yang ketat.
  - Janji temu telemedicine (Booking Wizard 3-Langkah) dengan penentuan slot jam real-time.
  - Rekam medis elektronik (EMR) dengan prinsip privasi medis absolut (**Admin Ditolak / 403 Forbidden**).
  - Video Call konsultasi WebRTC langsung di browser via **LiveKit Cloud**.
  - Skrining gejala awal bertenaga AI dengan **Google Gemini API** (`gemini-3.5-flash`) yang dilengkapi deteksi bahaya medis (*Red-Flag Detector*).
  - Resep obat digital dan laporan rekam medis berformat PDF yang di generate langsung di sisi server (*Server-Side PDF Buffer Stream*).
  - Dashboard Analitik Operasional Rumah Sakit berbasis grafik responsif (**Recharts**) dengan agregasi murni di level database tanpa memaparkan identitas pasien.

---

## 2.  Stack Teknis Lengkap & Versi Aktual

Seluruh dependensi di bawah diambil langsung dari konfigurasi `package.json` dan arsitektur aktif saat ini:

| Kategori | Teknologi / Library | Versi | Fungsi & Kegunaan |
| :--- | :--- | :--- | :--- |
| **Core Framework** | **Next.js** | `14.2.5` | React Framework (App Router, Server Components & Route Handlers) |
| **Frontend UI** | **React** | `18.3.1` | Declarative UI Library |
| **Styling & Icons** | **Tailwind CSS** | `3.4.9` | Utility-First CSS Framework |
| | **Lucide React** | `0.427.0` | Modern Medical & UI Icons |
| | **Radix UI Primitives** | `1.x` | Accessibility Unstyled UI Primitives (`dialog`, `dropdown`, `select`) |
| | **class-variance-authority**| `0.7.0` | Component Variant Builder |
| **State & Data Fetching**| **TanStack React Query**| `5.51.23` | Server-State Management, Caching, & Refetching |
| **Form & Validasi** | **React Hook Form** | `7.52.2` | High-Performance Form State Handler |
| | **Zod** | `3.23.8` | TypeScript-First Schema Validation |
| | **@hookform/resolvers** | `3.9.0` | Zod Resolver untuk React Hook Form |
| **Backend & Database** | **Node.js API Routes** | `v20+` | Next.js Serverless Route Handlers |
| | **Mongoose** | `8.5.3` | Object Data Modeling (ODM) untuk MongoDB Atlas Cloud |
| **Keamanan & Auth** | **JSON Web Token (JWT)** | `9.0.2` | Session Token dengan Penyimpanan HttpOnly Cookie |
| | **BcryptJS** | `2.4.3` | One-Way Hashing untuk Password Pengguna |
| **Video Call (WebRTC)**| **LiveKit Server SDK** | `2.17.0` | Penjanaan Token Akses Room Video Call Sisi Server |
| | **LiveKit Client & React**| `2.21.0` / `2.9.23` | WebRTC Media Stream Client & Component Control Bar |
| **AI Engine** | **Google Generative AI** | `0.24.1` | SDK Resmi Google Gemini API (Model: `gemini-3.5-flash`) |
| **PDF Engine** | **@react-pdf/renderer** | `4.5.1` | Server-Side PDF Stream Buffer Generation |
| **Visualisasi Grafik** | **Recharts** | `2.15.1` | SVG Declarative Responsive Charting Library |

---

## 3.  Rincian Fase Pengembangan (Phase 0 - Phase 6)

###  Phase 0: Auth, RBAC, & System Shell
- **Fitur Utama**: Register Pasien, Login Multi-Role (Pasien, Dokter, Admin), Session Handling via HttpOnly Cookies, Shell Layout Responsif per Role.
- **Endpoint API**:
  - `POST /api/auth/register` — Pendaftaran akun Pasien baru.
  - `POST /api/auth/login` — Login pengguna dan penyetelan Cookie JWT.
  - `POST /api/auth/logout` — Hapus Session Cookie.
  - `GET /api/auth/me` — Ambil profil pengguna aktif dari JWT Session.
  - `POST /api/admin/users` — Admin membuat akun Dokter/Admin baru terkelola.
  - `GET /api/admin/users` — Admin membaca daftar seluruh akun pengguna.
- **Model Database**: `User`, `Patient`, `Doctor`, `AuditLog`
- **Aturan Otorisasi**:
  - Pasien: Register & Login mandiri.
  - Dokter & Admin: Dibuat secara eksklusif oleh Admin terdaftar.

---

###  Phase 1: Doctor Booking Wizard & Schedule Management
- **Fitur Utama**: Pengaturan Jadwal Praktik Mingguan oleh Dokter/Admin, Booking Wizard 3-Langkah untuk Pasien (Pilih Dokter -> Pilih Tanggal & Slot Jam -> Konfirmasi), Monitoring Status Janji Temu (`pending`, `confirmed`, `completed`, `cancelled`).
- **Endpoint API**:
  - `GET /api/doctors` — Daftar dokter aktif beserta spesialisasi & STR.
  - `POST /api/doctors/schedule` — Dokter/Admin menyimpan jadwal praktik mingguan.
  - `GET /api/doctors/schedule` — Ambil jadwal praktik dokter.
  - `GET /api/doctors/[id]/available-slots` — Hitung slot jam bebas di tanggal tertentu.
  - `POST /api/appointments` — Pasien memesan janji temu.
  - `GET /api/appointments` — Daftar janji temu terfilter per role.
  - `PATCH /api/appointments/[id]` — Dokter/Admin meng-update status janji temu.
- **Model Database**: `DoctorSchedule`, `Appointment`
- **Aturan Otorisasi**: Pasien hanya melihat janji temu miliknya. Dokter melihat janji temu pasien yang memilih dirinya. Admin memonitor seluruh metadata janji temu.

---

###  Phase 2: Medical Records & Strict Admin Privacy
- **Fitur Utama**: Pengisian Rekam Medis (Diagnosis, Keluhan Utama, Catatan Klinis, Tanda Vital: TD, Nadi, Suhu, BB) oleh Dokter setelah konsultasi.
- **Endpoint API**:
  - `POST /api/medical-records` — Dokter menerbitkan/meng-update rekam medis.
  - `GET /api/medical-records` — Ambil riwayat rekam medis (Pasien/Dokter).
  - `GET /api/medical-records/[id]` — Detail rekam medis individual.
- **Model Database**: `MedicalRecord`
- **Aturan Otorisasi & Privasi Ketat (Garansi Sesuai Spesifikasi)**:
  - **Dokter**: Hanya dokter yang menangani janji temu tersebut yang berhak menulis/membaca.
  - **Pasien**: Hanya pasien pemilik rekam medis yang berhak membaca (*Read-Only*).
  - **Admin**: **STRICTLY FORBIDDEN (HTTP 403 Forbidden)**. Admin **TIDAK PERNAH** memiliki akses ke isi rekam medis pasien individual. Setiap percobaan di-audit dengan label `UNAUTHORIZED_MEDICAL_RECORD_ACCESS`.

---

###  Phase 3: Video Call Telemedicine (LiveKit Cloud)
- **Fitur Utama**: Konsultasi tatap muka online WebRTC langsung di browser, pembuatan room otomatis saat janji temu dikonfirmasi, kontrol mic/kamera/screen-share, indikator status room (`waiting`, `active`, `completed`).
- **Endpoint API**:
  - `POST /api/appointments/[id]/video-token` — Penjanaan token WebRTC LiveKit.
  - `GET /api/appointments/[id]/video-room` — Ambil metadata & status room video call.
- **Model Database**: `Appointment` (Menyimpan `videoRoomId` & `videoRoomStatus`)
- **Aturan Otorisasi**: Token WebRTC HANYA diberikan kepada Pasien pemilik atau Dokter penanggung jawab. Admin ditolak (**HTTP 403 Forbidden**).

---

###  Phase 4: AI Symptom Checker (Google Gemini API)
- **Fitur Utama**: Skrining gejala awal mandiri pasien berbasis interaksi form/chat, dianalisis oleh engine AI **Google Gemini 3.5** (`gemini-3.5-flash`). Menghasilkan:
  - Daftar kemungkinan kondisi medis (beserta tingkat probabilitas).
  - Tingkat keparahan / triase (*Ringan*, *Sedang*, *Berat / Darurat Medis*).
  - Peringatan Medis Darurat Medis (*Red-Flag Alert Box*) jika terdeteksi serangan jantung, stroke, atau sesak berat.
  - Rekomendasi dokter spesialis yang relevan untuk dikonsultasikan.
- **Endpoint API**:
  - `POST /api/symptom-check` — Pasien mengirimkan gejala untuk dianalisis Gemini AI.
  - `GET /api/symptom-check` — Ambil riwayat skrining AI pasien.
- **Model Database**: `SymptomCheck`
- **Aturan Otorisasi**: Pasien membaca riwayat miliknya. Dokter membaca riwayat skrining pasien yang memiliki janji temu dengannya. Admin ditolak (**HTTP 403 Forbidden**).

---

###  Phase 5: Digital Prescriptions & PDF Report Generation
- **Fitur Utama**: Penerbitan Resep Obat Digital oleh Dokter (array item obat: nama, dosis, frekuensi, durasi, catatan), pembuatan & *downloading* Laporan Rekam Medis berformat PDF ber-Kop RS TeleMedika secara *server-side buffer stream*.
- **Endpoint API**:
  - `POST /api/prescriptions` — Dokter menerbitkan/memperbarui resep digital (Audit: `CREATE_PRESCRIPTION` & `UPDATE_PRESCRIPTION`).
  - `GET /api/prescriptions/[medicalRecordId]` — Baca resep obat digital (Pasien/Dokter). Admin ditolak (**403**).
  - `GET /api/medical-records/[id]/report-pdf` — Generasi & *streaming* file PDF (`Content-Type: application/pdf`). Audit: `DOWNLOAD_MEDICAL_REPORT_PDF`.
- **Model Database**: `Prescription`
- **Aturan Otorisasi**: Pasien pemilik & Dokter pembuat berhak mengunduh PDF. Dokter lain dan Admin ditolak (**HTTP 403 Forbidden**).

---

###  Phase 6: Hospital Analytics Dashboard (Admin Only)
- **Fitur Utama**: Dashboard analitik operasional rumah sakit khusus Admin berbasis grafik responsif (**Recharts**). Menampilkan: Total Pasien, Total Dokter, Total Sesi Konsultasi, Breakdown Status Janji Temu, Top 5 Dokter Teraktif, Tren Konsultasi harian, dan Agregat Diagnosa Penyakit Terbanyak.
- **Endpoint API**:
  - `GET /api/admin/analytics` — Mengembalikan seluruh payload statistik agregat dalam 1 *round-trip*. Audit: `VIEW_ANALYTICS_DASHBOARD`.
- **Model Database**: Mengagregasi data dari `Patient`, `Doctor`, `Appointment`, `MedicalRecord`, `SymptomCheck`.
- **Aturan Privasi Ketat**:
  - Data statistik diagnosa diagregasi murni di level MongoDB via `$group` (`{ diagnosis: string, count: number }`). Data mentah per-pasien **TIDAK PERNAH** dikirim ke client.
  - Akses endpoint HANYA untuk Admin (`role === "admin"`). Pasien dan Dokter menerima **HTTP 403 Forbidden**.

---

##  4. Struktur Folder Project (`src/`)

```
sistem-telemedicine-rumah-sakit/
├── scripts/
│   ├── test-phase0.ts
│   ├── test-phase1.ts
│   ├── test-phase2.ts
│   ├── test-phase3.ts
│   ├── test-phase4.ts
│   ├── test-phase5.ts
│   └── test-phase6.ts
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── analytics/
│   │   │   │   │   └── route.ts
│   │   │   │   └── users/
│   │   │   │       └── route.ts
│   │   │   ├── appointments/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── video-room/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── video-token/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   ├── logout/
│   │   │   │   ├── me/
│   │   │   │   └── register/
│   │   │   ├── doctors/
│   │   │   │   ├── [id]/available-slots/
│   │   │   │   ├── schedule/
│   │   │   │   └── route.ts
│   │   │   ├── medical-records/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── report-pdf/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── prescriptions/
│   │   │   │   ├── [medicalRecordId]/
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   └── symptom-check/
│   │   │       └── route.ts
│   │   ├── dashboard/
│   │   │   ├── admin/
│   │   │   │   └── page.tsx
│   │   │   ├── dokter/
│   │   │   │   └── page.tsx
│   │   │   └── pasien/
│   │   │       └── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── analytics/
│   │   │   ├── AdminAnalyticsDashboard.tsx
│   │   │   ├── AnalyticsMetricCards.tsx
│   │   │   ├── ConsultationTrendChart.tsx
│   │   │   ├── DiagnosisAggregateChart.tsx
│   │   │   ├── StatusBreakdownChart.tsx
│   │   │   └── TopDoctorsChart.tsx
│   │   ├── booking/
│   │   │   ├── AppointmentList.tsx
│   │   │   ├── BookingWizardModal.tsx
│   │   │   └── DoctorScheduleForm.tsx
│   │   ├── medical-record/
│   │   │   ├── MedicalRecordDetailModal.tsx
│   │   │   ├── MedicalRecordFormModal.tsx
│   │   │   └── MedicalRecordList.tsx
│   │   ├── pdf/
│   │   │   └── DownloadReportButton.tsx
│   │   ├── prescription/
│   │   │   ├── PrescriptionFormModal.tsx
│   │   │   └── PrescriptionViewCard.tsx
│   │   ├── shell/
│   │   │   ├── Navbar.tsx
│   │   │   └── RoleShell.tsx
│   │   ├── symptom-checker/
│   │   │   ├── SymptomCheckerModal.tsx
│   │   │   └── SymptomHistoryModal.tsx
│   │   ├── ui/
│   │   │   ├── alert.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   └── toast.tsx
│   │   └── video/
│   │       └── VideoCallRoomModal.tsx
│   ├── hooks/
│   │   ├── useAdminAnalytics.ts
│   │   ├── useAppointments.ts
│   │   ├── useAuth.ts
│   │   ├── useDoctors.ts
│   │   ├── useMedicalRecords.ts
│   │   ├── usePrescription.ts
│   │   ├── useSymptomChecker.ts
│   │   └── useVideoCall.ts
│   ├── lib/
│   │   ├── pdf/
│   │   │   └── pdf-report.tsx
│   │   ├── validations/
│   │   │   ├── appointment.ts
│   │   │   ├── auth.ts
│   │   │   ├── medicalRecord.ts
│   │   │   ├── prescription.ts
│   │   │   └── symptomCheck.ts
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── gemini.ts
│   │   └── livekit.ts
│   └── models/
│       ├── Appointment.ts
│       ├── AuditLog.ts
│       ├── Doctor.ts
│       ├── DoctorSchedule.ts
│       ├── MedicalRecord.ts
│       ├── Patient.ts
│       ├── Prescription.ts
│       ├── SymptomCheck.ts
│       └── User.ts
├── .env.local
├── package.json
└── tsconfig.json
```

---

##  5. Daftar Environment Variables (`.env.local`)

Variabel lingkungan yang wajib dikonfigurasi di file `.env.local` sebelum menjalankan project:

| Nama Variabel | Keterangan & Fungsi |
| :--- | :--- |
| `MONGODB_URI` | Connection String URI untuk database MongoDB Atlas Cloud |
| `JWT_SECRET` | Secret key unik untuk enkripsi dan verifikasi JSON Web Token session cookie |
| `GEMINI_API_KEY` | API Key resmi dari Google AI Studio untuk mengakses Google Gemini API |
| `GEMINI_MODEL` | (Opsional) Nama model Gemini yang digunakan (Default: `gemini-3.5-flash`) |
| `LIVEKIT_URL` | WebSocket URL server WebRTC LiveKit Cloud (`wss://...livekit.cloud`) |
| `LIVEKIT_API_KEY` | API Key resmi dari dashboard LiveKit Cloud |
| `LIVEKIT_API_SECRET` | API Secret resmi dari dashboard LiveKit Cloud untuk membuat token room |

---

##  6. Prinsip Keamanan & Privasi Sisi Sistem

Sistem RS TeleMedika menerapkan standar keamanan dan privasi medis terbaik:

1. **Otorisasi Sisi API (API Route Level Enforcement)**:
   Otorisasi peran (`pasien`, `dokter`, `admin`) dan pengecekan kepemilikan data (*ownership check*) **SELALU** dienkapsulasi dan diverifikasi pada level Route Handler backend Next.js, bukan sekadar menyembunyikan tombol di UI frontend.

2. **Perlindungan Privasi Medis Absolut untuk Admin**:
   Sesuai prinsip kerahasiaan medis, role Admin **SAMA SEKALI TIDAK DIIZINKAN** mengakses isi diagnosis rekam medis individual, catatan konsultasi, resep obat per-pasien, maupun file PDF laporan medis. Setiap upaya penyerobotan akan ditolak dengan **HTTP 403 Forbidden** dan langsung dicatat ke `AuditLog`.

3. **Agregasi Statistik Sisi Database (Zero Patient PII Leakage)**:
   Pada Dashboard Analytics Admin (Phase 6), seluruh statistik diagnosa penyakit dihitung murni di sisi server database MongoDB menggunakan aggregation pipeline (`$group`, `$facet`). Data mentah pasien tidak pernah dikirim ke client browser admin.

4. **Pencatatan Audit Log Lengkap (Audit Trail)**:
   Aksi-aksi sensitif sistem seperti `CREATE_MEDICAL_RECORD`, `VIEW_MEDICAL_RECORD`, `CREATE_PRESCRIPTION`, `UPDATE_PRESCRIPTION`, `DOWNLOAD_MEDICAL_REPORT_PDF`, `VIEW_ANALYTICS_DASHBOARD`, dan `UNAUTHORIZED_ACCESS` dicatat secara permanen di koleksi `AuditLog` MongoDB.

5. **Penyimpanan Token Sesi Aman (HttpOnly Cookies)**:
   JSON Web Token (JWT) disimpan di dalam cookie berlabel `HttpOnly`, `SameSite=Lax`, dan `Secure` (pada HTTPS), mencegah serangan pencurian token melalui Cross-Site Scripting (XSS).

---

##  7. Cara Menjalankan Project Dari Awal

Ikuti langkah-langkah di bawah ini untuk menjalankan project ini di lingkungan lokal Anda:

### Step 1: Clone & Install Dependencies
```bash
# Clone repository ini (atau buka folder project)
cd "sistem telemedicine rumah sakit + AI symptom checker"

# Install seluruh dependensi paket
npm install
```

### Step 2: Konfigurasi Environment Variables
Buat file `.env.local` pada root direktori project dan isi dengan variabel yang dibutuhkan:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/telemedicine?retryWrites=true&w=majority
JWT_SECRET=rahasia_jwt_secret_key_anda_minimal_32_karakter
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-3.5-flash
LIVEKIT_URL=wss://telemedicine-app-xxxx.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxx
LIVEKIT_API_SECRET=Secretxxxxxxxxx
```

### Step 3: Jalankan Dev Server
```bash
npm run dev
```
Buka browser Anda dan akses aplikasi di: `http://localhost:3000`.

### Step 4: Login & Pengujian Sistem
- **Akun Pasien**: Anda dapat melakukan pendaftaran akun pasien baru secara mandiri melalui menu **Register**.
- **Akun Dokter & Admin**: Setelah login sebagai Admin, buat akun Dokter baru melalui menu **Buat Dokter / Admin Baru** di Dashboard Admin.

---

##  8. Status Verifikasi Akhir Codebase

Seluruh codebase telah melalui verifikasi ketat sebelum rilis final:

- **TypeScript Static Analysis (`npx tsc --noEmit`)**:
  `STATUS: 0 ERRORS (CLEAN)` 
- **Next.js Production Build (`npm run build`)**:
  `STATUS: SUCCESSFUL (100%)` 
  - Total **15 Static Pages** & **18 Dynamic API Routes** berhasil di-compile tanpa warning/error.
