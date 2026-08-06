"use client";

import React, { useState, useMemo } from "react";
import { useAppointments, AppointmentItem } from "@/hooks/useAppointments";
import { AppointmentCard } from "./AppointmentCard";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Calendar, Loader2, RefreshCw } from "lucide-react";

interface AppointmentListProps {
  userRole: "admin" | "dokter" | "pasien";
  onFillMedicalRecord?: (appointment: AppointmentItem) => void;
  onJoinVideoCall?: (appointment: AppointmentItem) => void;
}

export function AppointmentList({
  userRole,
  onFillMedicalRecord,
  onJoinVideoCall,
}: AppointmentListProps) {
  const { data: appointments, isLoading, isError, refetch } = useAppointments();
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];
    if (filterStatus === "all") return appointments;
    return appointments.filter((app) => app.status === filterStatus);
  }, [appointments, filterStatus]);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Daftar Janji Temu Konsultasi
          </CardTitle>
          <CardDescription>
            {userRole === "pasien"
              ? "Riwayat dan status pengajuan janji temu Anda."
              : userRole === "dokter"
              ? "Daftar pengajuan janji temu dari pasien yang membutuhkan persetujuan Anda."
              : "Monitoring semua data janji temu dalam sistem."}
          </CardDescription>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="gap-1 text-xs shrink-0">
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-1.5 pb-2 border-b">
          {[
            { id: "all", label: "Semua Status" },
            { id: "pending", label: "Pending" },
            { id: "confirmed", label: "Disetujui" },
            { id: "completed", label: "Selesai" },
            { id: "cancelled", label: "Dibatalkan" },
          ].map((f) => (
            <Button
              key={f.id}
              variant={filterStatus === f.id ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setFilterStatus(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Content Matrix */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Memuat data janji temu...
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-sm text-destructive">
            Gagal mengambil daftar janji temu. Silakan coba lagi.
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground border border-dashed rounded-lg p-6">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="font-medium">Belum ada janji temu untuk kategori ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAppointments.map((app) => (
              <AppointmentCard
                key={app.id}
                appointment={app}
                userRole={userRole}
                onFillMedicalRecord={onFillMedicalRecord}
                onJoinVideoCall={onJoinVideoCall}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
