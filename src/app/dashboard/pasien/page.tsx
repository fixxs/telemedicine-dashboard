"use client";

import React, { useState } from "react";
import { RoleShell } from "@/components/shell/RoleShell";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { AppointmentList } from "@/components/booking/AppointmentList";
import { MedicalRecordList } from "@/components/medical-record/MedicalRecordList";
import { VideoCallModal } from "@/components/video/VideoCallModal";
import { SymptomCheckerModal } from "@/components/symptom-checker/SymptomCheckerModal";
import { SymptomCheckHistory } from "@/components/symptom-checker/SymptomCheckHistory";
import { getGeminiEngineLabel } from "@/lib/gemini-config";
import { AppointmentItem } from "@/hooks/useAppointments";
import { useVideoRoom } from "@/hooks/useVideoRoom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useCurrentUser } from "@/hooks/useAuth";
import { HeartPulse, Sparkles, Activity, FileText, Loader2, AlertCircle } from "lucide-react";

export default function PasienDashboard() {
  const { data: user } = useCurrentUser();
  const { joinVideoCall, isJoining } = useVideoRoom();

  const [isSymptomCheckerOpen, setIsSymptomCheckerOpen] = useState(false);

  const [activeCallSession, setActiveCallSession] = useState<{
    serverUrl?: string;
    token?: string;
    roomName?: string;
    patientName?: string;
    doctorName?: string;
  } | null>(null);

  const [callError, setCallError] = useState<string | null>(null);

  const handleJoinVideoCall = async (app: AppointmentItem) => {
    setCallError(null);
    try {
      const response = await joinVideoCall(app.id);
      if (response.success && response.token) {
        setActiveCallSession({
          serverUrl: response.serverUrl,
          token: response.token,
          roomName: response.roomName,
          patientName: app.patient.name,
          doctorName: app.doctor.name,
        });
      }
    } catch (err: any) {
      setCallError(err.message || "Gagal masuk ke ruang video call LiveKit.");
    }
  };

  const handleBookSpecialistFromAI = (specialization: string) => {
    // Scroll smoothly to booking wizard
    const bookingSection = document.getElementById("booking-wizard-section");
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <RoleShell allowedRole="pasien">
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Welcome Header Banner */}
        <div className="bg-gradient-to-r from-sky-500/10 via-teal-500/10 to-primary/10 border border-sky-500/20 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="pasien">Pasien RS TeleMedika</Badge>
              <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold bg-teal-500/10 px-2 py-0.5 rounded">
                Phase 4 Active: AI Symptom Checker ({getGeminiEngineLabel()})
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Selamat Datang, {user?.name}!</h1>
            <p className="text-sm text-muted-foreground">
              Portal kesehatan pribadi Anda. Layanan booking, rekam medis digital, videocall, dan AI Symptom Checker telah aktif.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsSymptomCheckerOpen(true)}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold gap-2 text-xs sm:text-sm py-2.5 px-4 shadow-lg shadow-teal-500/20"
            >
              <Sparkles className="h-4 w-4" />
              Cek Gejala AI
            </Button>
            <div className="h-12 w-12 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold shrink-0">
              <HeartPulse className="h-7 w-7" />
            </div>
          </div>
        </div>

        {/* Video Call Error Alert Feedback */}
        {callError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Gagal Menghubungkan Video Call</AlertTitle>
            <AlertDescription>{callError}</AlertDescription>
          </Alert>
        )}

        {/* Loading Overlay when generating room/token */}
        {isJoining && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-sm text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
            <Loader2 className="h-5 w-5 animate-spin" />
            Menyiapkan token otorisasi dan ruang video call LiveKit...
          </div>
        )}

        {/* Phase 4 Active AI Symptom Checker History List */}
        <SymptomCheckHistory role="pasien" onBookSpecialist={handleBookSpecialistFromAI} />

        {/* Phase 1 Booking Wizard Component */}
        <div id="booking-wizard-section">
          <BookingWizard />
        </div>

        {/* Phase 2 Patient Medical Records List */}
        <MedicalRecordList role="pasien" />

        {/* Phase 1 & 3 Patient Appointment List with Video Call Trigger */}
        <AppointmentList userRole="pasien" onJoinVideoCall={handleJoinVideoCall} />

        {/* Phase 4 Interactive AI Symptom Checker Modal */}
        {isSymptomCheckerOpen && (
          <SymptomCheckerModal
            onClose={() => setIsSymptomCheckerOpen(false)}
            onBookSpecialist={handleBookSpecialistFromAI}
          />
        )}

        {/* Phase 3 Embedded Video Call Modal */}
        {activeCallSession && (
          <VideoCallModal
            serverUrl={activeCallSession.serverUrl}
            token={activeCallSession.token}
            roomName={activeCallSession.roomName}
            patientName={activeCallSession.patientName}
            doctorName={activeCallSession.doctorName}
            onClose={() => setActiveCallSession(null)}
          />
        )}

        {/* Future Phase Placeholders */}
        <div className="pt-4 space-y-3">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Fitur Fase Mendatang</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-border opacity-70">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Detail E-Resep Obat
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-base font-bold text-foreground">Sistem E-Resep Terpisah</div>
                <p className="text-xs text-muted-foreground mt-1">Manajemen resep & tebus obat langsung</p>
                <span className="inline-block mt-3 text-[10px] bg-muted px-2 py-0.5 rounded font-medium text-muted-foreground">
                  Tersedia di Phase 5
                </span>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleShell>
  );
}
