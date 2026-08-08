"use client";

import React, { useState, useEffect } from "react";
import { usePrescription, IPrescriptionItem } from "@/hooks/usePrescription";
import { MedicineItemInput } from "@/lib/validations/prescription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Pill,
  Plus,
  Trash2,
  X,
  Loader2,
  Save,
  AlertCircle,
  FileText,
  CheckCircle2,
} from "lucide-react";

interface PrescriptionFormModalProps {
  medicalRecordId: string;
  patientName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PrescriptionFormModal({
  medicalRecordId,
  patientName,
  onClose,
  onSuccess,
}: PrescriptionFormModalProps) {
  const { prescription, isLoadingPrescription, savePrescription, isSavingPrescription } =
    usePrescription(medicalRecordId);

  const [medicines, setMedicines] = useState<MedicineItemInput[]>([
    { name: "", dosage: "", frequency: "", duration: "", notes: "" },
  ]);
  const [generalNotes, setGeneralNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (prescription && prescription.medicines.length > 0) {
      setMedicines(
        prescription.medicines.map((m) => ({
          name: m.name || "",
          dosage: m.dosage || "",
          frequency: m.frequency || "",
          duration: m.duration || "",
          notes: m.notes || "",
        }))
      );
      setGeneralNotes(prescription.generalNotes || "");
    }
  }, [prescription]);

  const handleAddRow = () => {
    setMedicines([...medicines, { name: "", dosage: "", frequency: "", duration: "", notes: "" }]);
  };

  const handleRemoveRow = (index: number) => {
    if (medicines.length === 1) {
      setFormError("Resep obat harus memuat setidaknya 1 item obat.");
      return;
    }
    setFormError(null);
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, field: keyof MedicineItemInput, value: string) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    // Validate that medicine fields are filled
    for (let i = 0; i < medicines.length; i++) {
      const item = medicines[i];
      if (!item.name.trim()) {
        setFormError(`Baris #${i + 1}: Nama obat tidak boleh kosong.`);
        return;
      }
      if (!item.dosage.trim()) {
        setFormError(`Baris #${i + 1}: Dosis obat tidak boleh kosong (misal: 1 tablet).`);
        return;
      }
      if (!item.frequency.trim()) {
        setFormError(`Baris #${i + 1}: Aturan minum wajib diisi (misal: 3x1 sehari sesudah makan).`);
        return;
      }
      if (!item.duration.trim()) {
        setFormError(`Baris #${i + 1}: Durasi wajib diisi (misal: 5 hari).`);
        return;
      }
    }

    try {
      const result = await savePrescription({
        medicalRecordId,
        medicines,
        generalNotes,
      });

      if (result.success) {
        setSuccessMessage(result.message || "Resep obat berhasil disimpan.");
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan resep obat.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden my-auto max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-primary/10 border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  {prescription ? "Edit Resep Digital Pasien" : "Terbitkan Resep Digital Baru"}
                </h3>
                <Badge variant="outline" className="text-[10px] bg-teal-500/10 text-teal-600 border-teal-500/30">
                  Pasien: {patientName}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Tambahkan rincian obat, dosis, aturan minum, dan durasi pengobatan resmi.
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Modal Body Form */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {isLoadingPrescription ? (
            <div className="flex items-center justify-center p-12 text-sm text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
              Memuat data resep...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Kesalahan Form Resep</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Berhasil!</AlertTitle>
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              {/* Medicine Dynamic List Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Pill className="h-4 w-4 text-teal-500" />
                    Daftar Item Obat Resep ({medicines.length})
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddRow}
                    className="text-xs gap-1 h-8 text-teal-600 border-teal-500/30 hover:bg-teal-500/10"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Obat
                  </Button>
                </div>

                <div className="space-y-3">
                  {medicines.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 border border-border rounded-xl bg-muted/20 space-y-3 relative transition-all hover:border-teal-500/30"
                    >
                      <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                          Obat #{idx + 1}
                        </span>
                        {medicines.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRow(idx)}
                            className="h-6 px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 text-xs gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Hapus
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Name */}
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Nama Obat *
                          </label>
                          <Input
                            placeholder="Misal: Parasetamol 500mg"
                            value={item.name}
                            onChange={(e) => handleMedicineChange(idx, "name", e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>

                        {/* Dosage */}
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Dosis *
                          </label>
                          <Input
                            placeholder="Misal: 1 tablet / 5 ml"
                            value={item.dosage}
                            onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>

                        {/* Frequency */}
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Aturan Minum *
                          </label>
                          <Input
                            placeholder="Misal: 3x1 sehari sesudah makan"
                            value={item.frequency}
                            onChange={(e) => handleMedicineChange(idx, "frequency", e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>

                        {/* Duration */}
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Durasi Minum *
                          </label>
                          <Input
                            placeholder="Misal: 5 hari / sampai habis"
                            value={item.duration}
                            onChange={(e) => handleMedicineChange(idx, "duration", e.target.value)}
                            className="text-xs h-8"
                          />
                        </div>
                      </div>

                      {/* Optional Notes */}
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Catatan Tambahan Obat (Opsional)
                        </label>
                        <Input
                          placeholder="Misal: Bila demam saja / simpan di lemari es..."
                          value={item.notes || ""}
                          onChange={(e) => handleMedicineChange(idx, "notes", e.target.value)}
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* General Prescription Notes */}
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="text-xs font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Catatan Umum Tebus Obat (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan dokter untuk apotek/pasien (misal: Obat diminum secara teratur, hindari minum kopi saat mengonsumsi obat)..."
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={onClose} className="text-xs">
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingPrescription}
                  className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold gap-2 text-xs py-2 px-5 shadow-lg shadow-teal-500/20"
                >
                  {isSavingPrescription ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan Resep...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Simpan Resep Digital
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
