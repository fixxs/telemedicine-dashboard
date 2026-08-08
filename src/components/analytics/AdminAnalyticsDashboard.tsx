"use client";

import React from "react";
import { useAdminAnalytics } from "@/hooks/useAdminAnalytics";
import { AnalyticsMetricCards } from "./AnalyticsMetricCards";
import { ConsultationTrendChart } from "./ConsultationTrendChart";
import { StatusBreakdownChart } from "./StatusBreakdownChart";
import { TopDoctorsChart } from "./TopDoctorsChart";
import { DiagnosisAggregateChart } from "./DiagnosisAggregateChart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Loader2, AlertCircle, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminAnalyticsDashboard() {
  const { data, isLoading, error, refetch, isRefetching } = useAdminAnalytics();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-sm text-muted-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-400" />
        <span className="font-semibold text-foreground">Menghitung Agregasi Analytics Rumah Sakit...</span>
        <span className="text-xs text-muted-foreground">Proses kalkulasi statistik database MongoDB sedang berjalan.</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Gagal Memuat Analytics</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{error.message}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs gap-1">
            <RefreshCw className="h-3 w-3" /> Coba Lagi
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Top Title & Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              Dashboard Analytics Hospital & Agregat Klinis
            </h2>
            <Badge variant="outline" className="text-[10px] bg-teal-500/10 text-teal-600 border-teal-500/30">
              Read-Only Admin Mode
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Laporan statistik operasional rumah sakit dan tren pelayanan medis dalam satu tampilan terpadu.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="text-xs gap-1.5 self-start sm:self-auto h-8"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
          Segarkan Data
        </Button>
      </div>

      {/* Metric Summary Cards */}
      <AnalyticsMetricCards summary={data.summary} />

      {/* Grid Row 1: Consultation Trend & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ConsultationTrendChart data={data.consultationTrends} />
        </div>
        <div>
          <StatusBreakdownChart stats={data.summary.appointmentStats} />
        </div>
      </div>

      {/* Grid Row 2: Top Active Doctors & Common Diagnoses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopDoctorsChart doctors={data.topDoctors} />
        <DiagnosisAggregateChart diagnoses={data.topDiagnoses} />
      </div>
    </div>
  );
}
