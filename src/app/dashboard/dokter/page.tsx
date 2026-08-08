"use client";

import React, { useState } from "react";
import { RoleShell } from "@/components/shell/RoleShell";
import { DoctorScheduleForm } from "@/components/booking/DoctorScheduleForm";
import { AppointmentList } from "@/components/booking/AppointmentList";
import { MedicalRecordList } from "@/components/medical-record/MedicalRecordList";
import { MedicalRecordForm } from "@/components/medical-record/MedicalRecordForm";
import { VideoCallModal } from "@/components/video/VideoCallModal";
import { SymptomCheckHistory } from "@/components/symptom-checker/SymptomCheckHistory";
import { AppointmentItem } from "@/hooks/useAppointments";
import { MedicalRecordItem } from "@/hooks/useMedicalRecords";
import { useVideoRoom } from "@/hooks/useVideoRoom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useCurrentUser } from "@/hooks/useAuth";
import { Stethoscope, FileSpreadsheet, Loader2, AlertCircle, X, Sparkles } from "lucide-react";

export default function DokterDashboard() {
  const { data: user } = useCurrentUser();
  const { joinVideoCall, isJoining } = useVideoRoom();

  // State for active medical record form modal
  const [activeFormTarget, setActiveFormTarget] = useState<{
    appointmentId: string;
    patientName: string;
    existingRecord?: MedicalRecordItem | null;
  } | null>(null);

  // State for active video call session modal
  const [activeCallSession, setActiveCallSession] = useState<{
    serverUrl?: string;
    token?: string;
    roomName?: string;
    patientName?: string;
    doctorName?: string;
  } | null>(null);

  // State for inspecting patient AI symptom check reference
  const [inspectSymptomCheckTarget, setInspectSymptomCheckTarget] = useState<{
    patientId: string;
    patientName: string;
  } | null>(null);

  const [callError, setCallError] = useState<string | null>(null);

  const handleFillFromAppointment = (app: AppointmentItem) => {
    setActiveFormTarget({
      appointmentId: app.id,
      patientName: app.patient.name,
      existingRecord: null,
    });
  };

  const handleEditRecord = (rec: MedicalRecordItem) => {
    setActiveFormTarget({
      appointmentId: rec.appointmentId,
      patientName: rec.patient?.name || "Pasien",
      existingRecord: rec,
    });
  };

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

  return (
    <RoleShell allowedRole="dokter">
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Welcome Header Banner */}
        <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-primary/10 border border-teal-500/20 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="dokter">Portal Dokter</Badge>
              <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold bg-teal-500/10 px-2 py-0.5 rounded">
                Phase 4 Active: Ref Skrining Gejala AI Pasien & Videocall
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Selamat Datang, {user?.name}!</h1>
            <p className="text-sm text-muted-foreground">
              Atur jadwal praktik Anda, gabung sesi videocall pasien, lihat referensi AI symptom check, dan isi rekam medis.
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shrink-0">
            <Stethoscope className="h-7 w-7" />
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

        {/* Doctor Schedule Configuration Form */}
        <DoctorScheduleForm />

        {/* Appointments List for Doctor */}
        <AppointmentList
          userRole="dokter"
          onFillMedicalRecord={handleFillFromAppointment}
          onJoinVideoCall={handleJoinVideoCall}
        />

        {/* Doctor Medical Records List */}
        <MedicalRecordList role="dokter" onEditRecord={handleEditRecord} />

        {/* Medical Record Form Modal */}
        {activeFormTarget && (
          <MedicalRecordForm
            appointmentId={activeFormTarget.appointmentId}
            patientName={activeFormTarget.patientName}
            existingRecord={activeFormTarget.existingRecord}
            onClose={() => setActiveFormTarget(null)}
          />
        )}

        {/* Embedded Video Call Modal */}
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

        {/* Doctor Patient Symptom Check Inspection Modal */}
        {inspectSymptomCheckTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-teal-500" />
                  Referensi Skrining AI: {inspectSymptomCheckTarget.patientName}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setInspectSymptomCheckTarget(null)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <SymptomCheckHistory
                role="dokter"
                patientId={inspectSymptomCheckTarget.patientId}
              />
            </div>
          </div>
        )}

        {/* Future Phase Placeholders */}
        <div className="pt-4 space-y-3">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Fitur Dokter Fase Mendatang</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-border opacity-70">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <FileSpreadsheet className="h-4 w-4" />
                  Detail E-Resep Obat Resmi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-base font-bold text-foreground">Resep Obat Terpisah</div>
                <p className="text-xs text-muted-foreground mt-1">Modul rincian & dosis obat resmi pasien</p>
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
