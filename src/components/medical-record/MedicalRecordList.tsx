"use client";

import React, { useState, useMemo } from "react";
import { useMedicalRecords, MedicalRecordItem } from "@/hooks/useMedicalRecords";
import { MedicalRecordCard } from "./MedicalRecordCard";
import { MedicalRecordDetailModal } from "./MedicalRecordDetailModal";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { FileText, Search, Loader2, AlertCircle, ShieldAlert, Lock, CheckCircle2 } from "lucide-react";

interface MedicalRecordListProps {
  role: "pasien" | "dokter" | "admin";
  onEditRecord?: (record: MedicalRecordItem) => void;
}

export function MedicalRecordList({ role, onEditRecord }: MedicalRecordListProps) {
  const { data: records, isLoading, error } = useMedicalRecords();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Filtered records based on search query
  const filteredRecords = useMemo(() => {
    if (!records) return [];
    if (!searchQuery.trim()) return records;

    const query = searchQuery.toLowerCase();
    return records.filter((r) => {
      const docName = r.doctor?.name?.toLowerCase() || "";
      const patientName = r.patient?.name?.toLowerCase() || "";
      const diagnosis = r.diagnosis?.toLowerCase() || "";
      const complaint = r.chiefComplaint?.toLowerCase() || "";
      return (
        docName.includes(query) ||
        patientName.includes(query) ||
        diagnosis.includes(query) ||
        complaint.includes(query)
      );
    });
  }, [records, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Header & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {role === "pasien"
              ? "Riwayat Rekam Medis Konsultasi Anda"
              : role === "dokter"
              ? "Daftar Rekam Medis Dibuat"
              : "Audit Metadata Rekam Medis Sistem"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {role === "pasien"
              ? "Daftar seluruh rekam medis digital hasil konsultasi dokter Anda."
              : role === "dokter"
              ? "Rekam medis pasien yang pernah Anda periksa dan buat di sistem."
              : "Ringkasan audit metadata rekam medis sistem (Konten medis terproteksi)."}
          </p>
        </div>

        {/* Search Input for Patient & Doctor */}
        {role !== "admin" && (
          <div className="relative w-full sm:w-64">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari diagnosis / dokter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        )}
      </div>

      {/* ADMIN PRIVACY NOTICE BANNER */}
      {role === "admin" && (
        <Alert variant="default" className="border-amber-500/30 bg-amber-50 dark:bg-amber-950/20">
          <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5">
            Privasi Terproteksi HIPAA (Health Insurance Portability and Accountability Act)
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
            Sesuai prinsip keandalan medis & kebijakan privasi pasien, Admin hanya berhak melihat metadata audit (ID, Dokter, Pasien, Tanggal). Isi detail medis (keluhan, diagnosis, catatan) secara ketat disembunyikan dari peran Admin.
          </AlertDescription>
        </Alert>
      )}

      {/* LOADING STATE */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Memuat data rekam medis...</span>
        </div>
      )}

      {/* ERROR STATE */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Gagal Memuat Rekam Medis</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* EMPTY STATE */}
      {!isLoading && !error && filteredRecords.length === 0 && (
        <div className="text-center py-12 border border-dashed rounded-xl space-y-2 bg-muted/20">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground/60" />
          <h4 className="text-sm font-semibold">Belum Ada Rekam Medis</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {role === "pasien"
              ? "Anda belum memiliki riwayat rekam medis dari konsultasi dokter."
              : role === "dokter"
              ? "Anda belum membuat rekam medis untuk pasien. Silakan isi rekam medis dari daftar janji temu pasien."
              : "Belum ada rekam medis yang tercatat di sistem."}
          </p>
        </div>
      )}

      {/* PATIENT & DOCTOR VIEW: Interactive Cards */}
      {!isLoading && !error && filteredRecords.length > 0 && role !== "admin" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map((rec) => (
            <MedicalRecordCard
              key={rec.id}
              record={rec}
              role={role}
              onViewDetail={(id) => setSelectedRecordId(id)}
              onEdit={role === "dokter" ? onEditRecord : undefined}
            />
          ))}
        </div>
      )}

      {/* ADMIN VIEW: Static Metadata Table (NO DETAIL BUTTONS OR CLICK TRIGGERS) */}
      {!isLoading && !error && filteredRecords.length > 0 && role === "admin" && (
        <div className="border rounded-xl overflow-hidden shadow-sm bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3">ID Rekam Medis</th>
                  <th className="p-3">Dokter Pemeriksa</th>
                  <th className="p-3">Nama Pasien</th>
                  <th className="p-3">Tanggal Dibuat</th>
                  <th className="p-[12px] text-center">Status Proteksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-mono font-medium text-foreground">{rec.id}</td>
                    <td className="p-3">
                      <div className="font-bold text-foreground">{rec.doctor?.name}</div>
                      <div className="text-[11px] text-muted-foreground">{rec.doctor?.specialization}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-foreground">{rec.patient?.name}</div>
                      <div className="text-[11px] text-muted-foreground">Gol: {rec.patient?.bloodType || "-"}</div>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(rec.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })} WIB
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400">
                        <Lock className="h-3 w-3" /> Isi Medis Terproteksi
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL FOR PATIENT & DOCTOR */}
      {selectedRecordId && (
        <MedicalRecordDetailModal
          recordId={selectedRecordId}
          onClose={() => setSelectedRecordId(null)}
        />
      )}
    </div>
  );
}
