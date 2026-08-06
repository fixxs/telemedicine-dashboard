"use client";

import React from "react";
import { useMedicalRecordDetail } from "@/hooks/useMedicalRecords";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { FileText, Stethoscope, User, Calendar, Activity, Loader2, AlertCircle, X, ShieldCheck } from "lucide-react";

interface MedicalRecordDetailModalProps {
  recordId: string;
  onClose: () => void;
}

export function MedicalRecordDetailModal({ recordId, onClose }: MedicalRecordDetailModalProps) {
  const { data: record, isLoading, error } = useMedicalRecordDetail(recordId);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Detail Rekam Medis Digital
                <Badge variant="success" className="text-[10px] gap-1">
                  <ShieldCheck className="h-3 w-3" /> Terverifikasi
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">ID Rekam Medis: <span className="font-mono text-foreground">{recordId}</span></p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Memuat detail rekam medis terenkripsi...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Akses Dibatasi / Gagal Memuat</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          ) : !record ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Data rekam medis tidak ditemukan.
            </div>
          ) : (
            <>
              {/* Doctor & Patient Metadata Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-muted/40 rounded-xl border text-xs">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Stethoscope className="h-3.5 w-3.5 text-primary" /> Dokter Pemeriksa:
                  </span>
                  <p className="font-bold text-foreground text-sm">{record.doctor?.name}</p>
                  <p className="text-[11px] text-primary">{record.doctor?.specialization}</p>
                  <p className="text-[10px] text-muted-foreground">STR: {record.doctor?.licenseNumber || "-"}</p>
                </div>

                <div className="space-y-1 border-t sm:border-t-0 sm:border-l sm:pl-3 pt-2 sm:pt-0">
                  <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-primary" /> Pasien:
                  </span>
                  <p className="font-bold text-foreground text-sm">{record.patient?.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Jenis Kelamin: {record.patient?.gender || "-"} | Gol. Darah: {record.patient?.bloodType || "-"}
                  </p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {new Date(record.createdAt).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })} WIB
                  </p>
                </div>
              </div>

              {/* Diagnosis Box */}
              <div className="p-3.5 bg-teal-500/10 border border-teal-500/20 rounded-xl space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                  Diagnosis Utama Dokter
                </span>
                <p className="text-base font-bold text-foreground">{record.diagnosis}</p>
              </div>

              {/* Keluhan Utama */}
              <div className="space-y-1.5 p-3.5 border rounded-xl bg-card">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Keluhan Utama Pasien
                </span>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {record.chiefComplaint}
                </p>
              </div>

              {/* Hasil Pemeriksaan & Catatan */}
              {record.notes && (
                <div className="space-y-1.5 p-3.5 border rounded-xl bg-card">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Hasil Pemeriksaan & Catatan Dokter
                  </span>
                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                    {record.notes}
                  </p>
                </div>
              )}

              {/* Tanda Vital Dasar */}
              {record.vitalSigns && (
                <div className="space-y-2 p-3.5 border rounded-xl bg-card">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-primary" /> Tanda Vital (Vital Signs)
                  </span>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-muted/30 rounded-lg border">
                      <span className="text-[10px] text-muted-foreground block">Tekanan Darah</span>
                      <span className="text-xs font-bold text-foreground">
                        {record.vitalSigns.bloodPressure || "-"}
                      </span>
                    </div>

                    <div className="p-2 bg-muted/30 rounded-lg border">
                      <span className="text-[10px] text-muted-foreground block">Suhu Tubuh</span>
                      <span className="text-xs font-bold text-foreground">
                        {record.vitalSigns.temperature ? `${record.vitalSigns.temperature} °C` : "-"}
                      </span>
                    </div>

                    <div className="p-2 bg-muted/30 rounded-lg border">
                      <span className="text-[10px] text-muted-foreground block">Denyut Nadi</span>
                      <span className="text-xs font-bold text-foreground">
                        {record.vitalSigns.heartRate ? `${record.vitalSigns.heartRate} bpm` : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t bg-muted/30 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
