"use client";

import React from "react";
import { AppointmentItem, useUpdateAppointmentStatus } from "@/hooks/useAppointments";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Stethoscope, CheckCircle2, XCircle, Loader2, FileText, Video } from "lucide-react";

interface AppointmentCardProps {
  appointment: AppointmentItem;
  userRole: "admin" | "dokter" | "pasien";
  onFillMedicalRecord?: (appointment: AppointmentItem) => void;
  onJoinVideoCall?: (appointment: AppointmentItem) => void;
}

export function AppointmentCard({
  appointment,
  userRole,
  onFillMedicalRecord,
  onJoinVideoCall,
}: AppointmentCardProps) {
  const updateStatusMutation = useUpdateAppointmentStatus();

  const handleStatusUpdate = async (status: "confirmed" | "cancelled") => {
    try {
      await updateStatusMutation.mutateAsync({ id: appointment.id, status });
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui status janji temu");
    }
  };

  const statusVariantMap = {
    pending: "warning",
    confirmed: "success",
    cancelled: "destructive",
    completed: "default",
  } as const;

  const statusLabelMap = {
    pending: "Menunggu Konfirmasi",
    confirmed: "Disetujui Dokter",
    cancelled: "Dibatalkan",
    completed: "Selesai",
  };

  // Evaluate time window for video call session
  const getCallWindowStatus = () => {
    try {
      // Parse appointment date & time
      const dateParts = appointment.date.split("-");
      if (dateParts.length < 3) return { canJoin: true, label: "Join Meeting" };

      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1;
      const day = parseInt(dateParts[2]);

      // Parse time string e.g. "09:00 AM" or "14:00"
      let hours = 0;
      let minutes = 0;

      const timeStr = appointment.time.toUpperCase();
      const isPM = timeStr.includes("PM");
      const isAM = timeStr.includes("AM");
      const cleanTime = timeStr.replace(/(AM|PM)/g, "").trim();
      const timeParts = cleanTime.split(":");

      if (timeParts.length >= 2) {
        hours = parseInt(timeParts[0]);
        minutes = parseInt(timeParts[1]);
        if (isPM && hours < 12) hours += 12;
        if (isAM && hours === 12) hours = 0;
      }

      const scheduledStart = new Date(year, month, day, hours, minutes);
      const windowStart = new Date(scheduledStart.getTime() - 15 * 60 * 1000); // 15 mins before
      const windowEnd = new Date(scheduledStart.getTime() + 2 * 60 * 60 * 1000); // 2 hours after
      const now = new Date();

      if (now < windowStart) {
        return {
          canJoin: false,
          label: `Konsultasi dimulai jam ${appointment.time}`,
        };
      }

      if (now > windowEnd) {
        return {
          canJoin: false,
          label: "Jadwal Konsultasi Telah Lewat",
        };
      }

      return { canJoin: true, label: "Join Meeting" };
    } catch {
      return { canJoin: true, label: "Join Meeting" };
    }
  };

  const windowStatus = getCallWindowStatus();

  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-foreground">{appointment.date}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium bg-muted px-2 py-0.5 rounded">
            <Clock className="h-3 w-3" />
            {appointment.time} WIB
          </span>
        </div>
        <Badge variant={statusVariantMap[appointment.status]} className="text-xs">
          {statusLabelMap[appointment.status]}
        </Badge>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-3">
        {/* Doctor Info */}
        <div className="flex items-start gap-2.5 p-2.5 bg-muted/30 rounded-lg border">
          <Stethoscope className="h-4 w-4 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1 text-xs">
            <div className="font-bold text-foreground truncate">{appointment.doctor.name}</div>
            <div className="text-muted-foreground">{appointment.doctor.specialization}</div>
          </div>
        </div>

        {/* Patient Info */}
        <div className="flex items-start gap-2.5 p-2.5 bg-muted/30 rounded-lg border">
          <User className="h-4 w-4 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1 text-xs">
            <div className="font-bold text-foreground truncate">{appointment.patient.name}</div>
            <div className="text-muted-foreground">
              {appointment.patient.email} | {appointment.patient.gender} (Gol: {appointment.patient.bloodType})
            </div>
          </div>
        </div>

        {/* VIDEO CALL JOIN BUTTON FOR CONFIRMED APPOINTMENTS */}
        {appointment.status === "confirmed" && onJoinVideoCall && (
          <div className="pt-1">
            <Button
              size="sm"
              variant={windowStatus.canJoin ? "default" : "outline"}
              disabled={!windowStatus.canJoin}
              onClick={() => onJoinVideoCall(appointment)}
              className={`w-full text-xs h-10 font-bold gap-2 shadow-sm ${
                windowStatus.canJoin
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              <Video className="h-4 w-4" />
              {windowStatus.label}
            </Button>
          </div>
        )}
      </CardContent>

      {/* Action Footer */}
      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        {/* DOCTOR ACTIONS FOR PENDING APPOINTMENTS */}
        {userRole === "dokter" && appointment.status === "pending" && (
          <div className="flex w-full gap-2">
            <Button
              size="sm"
              variant="default"
              className="flex-1 text-xs h-9 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              onClick={() => handleStatusUpdate("confirmed")}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Konfirmasi
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1 text-xs h-9 font-semibold gap-1"
              onClick={() => handleStatusUpdate("cancelled")}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  Tolak
                </>
              )}
            </Button>
          </div>
        )}

        {/* DOCTOR FILL MEDICAL RECORD ACTION FOR CONFIRMED OR COMPLETED APPOINTMENTS */}
        {userRole === "dokter" &&
          (appointment.status === "confirmed" || appointment.status === "completed") &&
          onFillMedicalRecord && (
            <Button
              size="sm"
              variant={appointment.status === "completed" ? "outline" : "default"}
              className="w-full text-xs h-9 font-semibold gap-1.5"
              onClick={() => onFillMedicalRecord(appointment)}
            >
              <FileText className="h-3.5 w-3.5 text-primary" />
              {appointment.status === "completed" ? "Lihat / Edit Rekam Medis" : "Isi Rekam Medis Konsultasi"}
            </Button>
          )}

        {/* PATIENT CANCEL ACTION */}
        {userRole === "pasien" && appointment.status === "pending" && (
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs h-9 text-destructive hover:bg-destructive/10 border-destructive/30 gap-1"
            onClick={() => handleStatusUpdate("cancelled")}
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5" />
                Batalkan Janji Temu
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
