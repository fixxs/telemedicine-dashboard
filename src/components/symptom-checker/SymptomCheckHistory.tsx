"use client";

import React, { useState } from "react";
import { useSymptomCheck, SymptomCheckItem } from "@/hooks/useSymptomCheck";
import { UrgencyBadge } from "./UrgencyBadge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Sparkles,
  Clock,
  ChevronRight,
  Stethoscope,
  ShieldAlert,
  Loader2,
  CalendarCheck,
} from "lucide-react";

interface SymptomCheckHistoryProps {
  role: "pasien" | "dokter";
  patientId?: string;
  appointmentId?: string;
  onBookSpecialist?: (specialization: string) => void;
}

export function SymptomCheckHistory({
  role,
  patientId,
  appointmentId,
  onBookSpecialist,
}: SymptomCheckHistoryProps) {
  const { history, isLoadingHistory } = useSymptomCheck({
    patientId,
    appointmentId,
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Card className="border-border shadow-md">
      <CardHeader className="bg-muted/30 border-b border-border p-4 sm:p-5 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              {role === "pasien"
                ? "Riwayat Skrining Gejala AI Anda"
                : "Referensi Skrining Gejala AI Pasien"}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {role === "pasien"
                ? "Daftar analisis awal gejala yang pernah Anda periksa"
                : "Informasi awal gejala mandiri pasien sebelum konsultasi"}
            </p>
          </div>
        </div>

        <Badge variant="outline" className="text-xs bg-teal-500/10 text-teal-600 border-teal-500/30">
          {history.length} Catatan
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center p-8 text-sm text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
            Memuat riwayat skrining AI...
          </div>
        ) : history.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-border rounded-xl bg-muted/20">
            <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-foreground">
              {role === "pasien"
                ? "Belum ada riwayat skrining gejala AI"
                : "Pasien belum pernah menjalankan skrining gejala AI"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {role === "pasien"
                ? 'Klik tombol "Cek Gejala AI" di atas untuk mulai skrining awal.'
                : "Informasi ini akan muncul jika pasien telah melakukan pemeriksaan mandiri."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item: SymptomCheckItem) => {
              const isExpanded = expandedId === item.id;
              const dateStr = new Date(item.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={item.id}
                  className="border border-border rounded-xl bg-card overflow-hidden transition-all hover:border-teal-500/30 shadow-sm"
                >
                  {/* Item Summary Bar */}
                  <div
                    onClick={() => toggleExpand(item.id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <UrgencyBadge level={item.aiResponse?.urgencyLevel || "medium"} />
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {dateStr}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {item.symptoms.slice(0, 3).map((sym, i) => (
                          <Badge key={i} variant="secondary" className="text-[11px] font-normal">
                            {sym}
                          </Badge>
                        ))}
                        {item.symptoms.length > 3 && (
                          <span className="text-[11px] text-muted-foreground font-medium">
                            +{item.symptoms.length - 3} lainnya
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                        {isExpanded ? "Tutup Detail" : "Lihat Detail"}
                      </span>
                      <ChevronRight
                        className={`h-4 w-4 text-muted-foreground transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expanded Detail Body */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 bg-muted/20 border-t border-border space-y-4 text-xs">
                      {/* Emergency Warning Notice if present */}
                      {item.aiResponse?.emergencyWarning && (
                        <div className="bg-rose-950/80 border border-rose-600 text-rose-100 rounded-lg p-3 font-semibold">
                          ⚠️ {item.aiResponse.emergencyWarning}
                        </div>
                      )}

                      {/* Summary & Recommended Specialist */}
                      <div className="space-y-2">
                        <span className="font-bold text-foreground block">Ringkasan Analisis AI:</span>
                        <p className="text-muted-foreground leading-relaxed">
                          {item.aiResponse?.summaryText}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="bg-card border border-border p-3 rounded-lg">
                          <span className="font-bold text-foreground block mb-1">
                            Kemungkinan Kondisi:
                          </span>
                          <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                            {item.aiResponse?.possibleConditions?.map((cond, i) => (
                              <li key={i}>{cond}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-card border border-border p-3 rounded-lg flex flex-col justify-between">
                          <div>
                            <span className="font-bold text-foreground block mb-1">
                              Rekomendasi Spesialisasi:
                            </span>
                            <span className="font-extrabold text-teal-600 dark:text-teal-400">
                              {item.aiResponse?.recommendedSpecialization}
                            </span>
                          </div>

                          {role === "pasien" && onBookSpecialist && (
                            <Button
                              size="sm"
                              onClick={() => onBookSpecialist(item.aiResponse.recommendedSpecialization)}
                              className="mt-3 bg-teal-600 hover:bg-teal-700 text-white font-bold gap-1 text-[11px] h-7 w-full"
                            >
                              <CalendarCheck className="h-3 w-3" />
                              Jadwalkan Konsultasi
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Medical Disclaimer */}
                      <div className="text-[11px] text-muted-foreground italic border-t border-border pt-2">
                        {item.aiResponse?.disclaimer}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
