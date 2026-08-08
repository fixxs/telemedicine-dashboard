"use client";

import React from "react";
import { AnalyticsSummary } from "@/hooks/useAdminAnalytics";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Stethoscope, CalendarCheck, Sparkles, CheckCircle2, XCircle, Clock } from "lucide-react";

interface AnalyticsMetricCardsProps {
  summary: AnalyticsSummary;
}

export function AnalyticsMetricCards({ summary }: AnalyticsMetricCardsProps) {
  const completionRate =
    summary.appointmentStats.total > 0
      ? ((summary.appointmentStats.completed / summary.appointmentStats.total) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Registered Patients */}
      <Card className="border-border shadow-sm bg-gradient-to-br from-sky-500/10 via-card to-card hover:shadow-md transition-shadow">
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Total Pasien Terdaftar
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {summary.totalPatients.toLocaleString("id-ID")}
            </div>
            <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">
              Pengguna Pasien RS TeleMedika
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Users className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      {/* Total Registered Doctors */}
      <Card className="border-border shadow-sm bg-gradient-to-br from-teal-500/10 via-card to-card hover:shadow-md transition-shadow">
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Total Dokter Terdaftar
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {summary.totalDoctors.toLocaleString("id-ID")}
            </div>
            <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
              Tenaga Medis Aktif
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Stethoscope className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      {/* Total Consultations */}
      <Card className="border-border shadow-sm bg-gradient-to-br from-emerald-500/10 via-card to-card hover:shadow-md transition-shadow">
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Total Sesi Konsultasi
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {summary.appointmentStats.total.toLocaleString("id-ID")}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {summary.appointmentStats.completed} Selesai ({completionRate}%)
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CalendarCheck className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      {/* AI Symptoms Screened */}
      <Card className="border-border shadow-sm bg-gradient-to-br from-amber-500/10 via-card to-card hover:shadow-md transition-shadow">
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Skrining AI Symptom Checker
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {summary.totalSymptomChecks.toLocaleString("id-ID")}
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Analisis Gejala Mandiri Pasien
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
