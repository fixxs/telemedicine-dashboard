"use client";

import React from "react";
import { usePrescription } from "@/hooks/usePrescription";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pill, Clock, FileText, Loader2, Edit3, CheckCircle2, AlertCircle } from "lucide-react";

interface PrescriptionViewCardProps {
  medicalRecordId: string;
  patientName?: string;
  role: "pasien" | "dokter";
  onEditPrescription?: () => void;
}

export function PrescriptionViewCard({
  medicalRecordId,
  patientName,
  role,
  onEditPrescription,
}: PrescriptionViewCardProps) {
  const { prescription, isLoadingPrescription, fetchError } = usePrescription(medicalRecordId);

  if (isLoadingPrescription) {
    return (
      <div className="p-4 border border-border rounded-xl bg-muted/20 flex items-center justify-center text-xs text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
        Memuat resep digital...
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-3 border border-rose-500/30 rounded-xl bg-rose-500/5 text-xs text-rose-600 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Gagal mengambil resep: {fetchError.message}</span>
      </div>
    );
  }

  if (!prescription || prescription.medicines.length === 0) {
    return (
      <div className="p-4 border border-dashed border-border rounded-xl bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <Pill className="h-4 w-4 opacity-50 text-teal-500" />
          <span>Belum ada resep obat digital yang diterbitkan untuk rekam medis ini.</span>
        </div>

        {role === "dokter" && onEditPrescription && (
          <Button
            size="sm"
            onClick={onEditPrescription}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-1 text-[11px] h-7 shrink-0"
          >
            <Pill className="h-3 w-3" />
            + Buat Resep Obat
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="border border-teal-500/30 rounded-xl bg-card overflow-hidden shadow-sm space-y-3 p-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
            <Pill className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
              Resep Obat Digital Resmi
              <Badge variant="outline" className="text-[10px] bg-teal-500/10 text-teal-600 border-teal-500/30">
                {prescription.medicines.length} Item Obat
              </Badge>
            </h4>
            <span className="text-[11px] text-muted-foreground">
              Diterbitkan pada {new Date(prescription.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>

        {role === "dokter" && onEditPrescription && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEditPrescription}
            className="text-xs gap-1 h-7 border-teal-500/30 text-teal-600 hover:bg-teal-500/10"
          >
            <Edit3 className="h-3 w-3" />
            Edit Resep
          </Button>
        )}
      </div>

      {/* Medicines Table List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
              <th className="p-2 w-8 text-center">#</th>
              <th className="p-2">Nama Obat</th>
              <th className="p-2">Dosis</th>
              <th className="p-2">Aturan & Durasi</th>
              <th className="p-2">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {prescription.medicines.map((med, i) => (
              <tr key={i} className="hover:bg-muted/20 transition-colors">
                <td className="p-2 text-center text-muted-foreground font-medium">{i + 1}</td>
                <td className="p-2 font-bold text-foreground">{med.name}</td>
                <td className="p-2 text-muted-foreground">{med.dosage}</td>
                <td className="p-2 text-teal-600 dark:text-teal-400 font-semibold">
                  {med.frequency} ({med.duration})
                </td>
                <td className="p-2 text-muted-foreground italic">{med.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* General Notes if any */}
      {prescription.generalNotes && (
        <div className="p-2.5 bg-teal-500/5 border border-teal-500/20 rounded-lg text-xs text-muted-foreground space-y-1">
          <span className="font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            Catatan Tambahan Dokter:
          </span>
          <p className="text-[11px] leading-relaxed">{prescription.generalNotes}</p>
        </div>
      )}
    </div>
  );
}
