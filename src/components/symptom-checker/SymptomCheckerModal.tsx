"use client";

import React, { useState } from "react";
import { useSymptomCheck } from "@/hooks/useSymptomCheck";
import { IAiResponse } from "@/models/SymptomCheck";
import { UrgencyBadge } from "./UrgencyBadge";
import { EmergencyAlertBanner } from "./EmergencyAlertBanner";
import { getGeminiEngineLabel } from "@/lib/gemini-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Activity,
  X,
  Plus,
  Loader2,
  Sparkles,
  Stethoscope,
  ShieldAlert,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

interface SymptomCheckerModalProps {
  onClose: () => void;
  onBookSpecialist?: (specialization: string) => void;
}

const COMMON_SYMPTOMS = [
  "Demam / Panas Tinggi",
  "Batuk Kering",
  "Batuk Berdahak",
  "Flu & Hidung Tersumbat",
  "Nyeri Kepala / Pusing",
  "Sesak Napas",
  "Nyeri Dada",
  "Mual & Muntah",
  "Diare / Nyeri Perut",
  "Lemah & Badan Pegal",
  "Nyeri Tenggorokan",
  "Ruam / Bintik Kulit",
];

export function SymptomCheckerModal({
  onClose,
  onBookSpecialist,
}: SymptomCheckerModalProps) {
  const { submitSymptoms, isSubmitting } = useSymptomCheck();

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptomInput, setCustomSymptomInput] = useState("");
  const [duration, setDuration] = useState("1-3 hari");
  const [severity, setSeverity] = useState<"ringan" | "sedang" | "berat">("sedang");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [analysisResult, setAnalysisResult] = useState<IAiResponse | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleAddCustomSymptom = () => {
    const trimmed = customSymptomInput.trim();
    if (trimmed && !selectedSymptoms.includes(trimmed)) {
      setSelectedSymptoms([...selectedSymptoms, trimmed]);
      setCustomSymptomInput("");
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    let finalSymptoms = [...selectedSymptoms];
    if (customSymptomInput.trim() && !finalSymptoms.includes(customSymptomInput.trim())) {
      finalSymptoms.push(customSymptomInput.trim());
    }

    if (finalSymptoms.length === 0) {
      setFormError("Pilih atau ketik setidaknya satu gejala yang Anda rasakan.");
      return;
    }

    try {
      const response = await submitSymptoms({
        symptoms: finalSymptoms,
        duration,
        severity,
        additionalNotes,
      });

      if (response.success && response.symptomCheck) {
        setAnalysisResult(response.symptomCheck.aiResponse);
      }
    } catch (err: any) {
      setFormError(err.message || "Gagal menghubungi AI Symptom Checker. Silakan coba lagi.");
    }
  };

  const handleResetForm = () => {
    setAnalysisResult(null);
    setFormError(null);
    setSelectedSymptoms([]);
    setCustomSymptomInput("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden my-auto max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-sky-500/10 via-teal-500/10 to-emerald-500/10 border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">AI Symptom Checker RS TeleMedika</h3>
                <Badge variant="outline" className="text-[10px] bg-teal-500/10 text-teal-600 border-teal-500/30">
                  {getGeminiEngineLabel()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Skrining awal gejala berbasis AI cerdas & rekomendasi dokter spesialis
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

        {/* Modal Body Container */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Kesalahan Input</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {!analysisResult ? (
            /* STEP 1: Symptom Selection Form */
            <form onSubmit={handleSubmitForm} className="space-y-6">
              {/* Section 1: Common Symptoms Multi-Select */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground block">
                  1. Pilih Gejala yang Dirasakan (Multi-Select):
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SYMPTOMS.map((symptom) => {
                    const isSelected = selectedSymptoms.includes(symptom);
                    return (
                      <button
                        key={symptom}
                        type="button"
                        onClick={() => toggleSymptom(symptom)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-medium border transition-all ${
                          isSelected
                            ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-500/20"
                            : "bg-muted/40 border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        {isSelected && "✓ "}
                        {symptom}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Custom Symptom Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Tambah Gejala Lainnya (opsional):
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ketik gejala tambahan (misal: mata merah, nyeri telinga)..."
                    value={customSymptomInput}
                    onChange={(e) => setCustomSymptomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomSymptom();
                      }
                    }}
                    className="text-xs h-9"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddCustomSymptom}
                    className="h-9 px-3 text-xs gap-1 shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah
                  </Button>
                </div>
              </div>

              {/* Active Selected Symptoms Pills */}
              {selectedSymptoms.length > 0 && (
                <div className="p-3 bg-teal-500/5 border border-teal-500/20 rounded-xl space-y-1.5">
                  <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 block">
                    Gejala Dipilih ({selectedSymptoms.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSymptoms.map((sym) => (
                      <Badge
                        key={sym}
                        variant="secondary"
                        className="text-xs bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30 gap-1"
                      >
                        {sym}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-rose-500"
                          onClick={() => toggleSymptom(sym)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 3: Duration & Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground block">
                    2. Berapa Lama Gejala Dirasakan?
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Kurang dari 24 jam">Kurang dari 24 jam</option>
                    <option value="1-3 hari">1-3 hari</option>
                    <option value="4-7 hari">4-7 hari</option>
                    <option value="Lebih dari 1 minggu">Lebih dari 1 minggu</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground block">
                    3. Tingkat Keparahan Menurut Anda:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["ringan", "sedang", "berat"] as const).map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverity(sev)}
                        className={`text-xs py-2 rounded-lg font-bold capitalize border transition-all ${
                          severity === sev
                            ? sev === "berat"
                              ? "bg-rose-600 text-white border-rose-600"
                              : sev === "sedang"
                              ? "bg-amber-600 text-white border-amber-600"
                              : "bg-emerald-600 text-white border-emerald-600"
                            : "bg-muted/30 border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 4: Additional Free Text Notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground block">
                  4. Catatan Tambahan Gejala (Opsional):
                </label>
                <textarea
                  rows={3}
                  placeholder="Ceritakan detail tambahan keluhan Anda (misal: batuk berdahak kuning, nyeri tenggorokan makin parah saat menelan)..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose} className="text-xs">
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || selectedSymptoms.length === 0}
                  className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold gap-2 text-xs py-2 px-5 shadow-lg shadow-teal-500/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memproses Analisis AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Analisis Gejala Sekarang
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            /* STEP 2: AI Structured Results View */
            <div className="space-y-6">
              {/* Emergency Banner if urgency = emergency */}
              {analysisResult.urgencyLevel === "emergency" && (
                <EmergencyAlertBanner warning={analysisResult.emergencyWarning} />
              )}

              {/* AI Analysis Summary */}
              <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-sky-500/10 border border-teal-500/30 rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    <h4 className="text-sm font-bold text-foreground">Ringkasan Skrining AI</h4>
                  </div>
                  <UrgencyBadge level={analysisResult.urgencyLevel} />
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  {analysisResult.summaryText}
                </p>
              </div>

              {/* Grid: Possible Conditions & Recommended Specialist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Possible Conditions Card */}
                <div className="border border-border rounded-xl p-4 bg-card space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-amber-500" />
                    <h5 className="text-xs font-bold text-foreground">Estimasi Indikasi Kondisi</h5>
                  </div>
                  <ul className="space-y-1.5">
                    {analysisResult.possibleConditions.map((condition, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-500 shrink-0 mt-0.5" />
                        <span>{condition}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Specialist Card */}
                <div className="border border-teal-500/30 bg-teal-500/5 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Stethoscope className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      <h5 className="text-xs font-bold text-foreground">Rekomendasi Spesialisasi Dokter</h5>
                    </div>
                    <p className="text-sm font-extrabold text-teal-600 dark:text-teal-400">
                      {analysisResult.recommendedSpecialization}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Disarankan untuk melakukan pemesanan jadwal konsultasi sesuai spesialisasi di atas.
                    </p>
                  </div>

                  {onBookSpecialist && (
                    <Button
                      onClick={() => {
                        onBookSpecialist(analysisResult.recommendedSpecialization);
                        onClose();
                      }}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-2 text-xs w-full h-8"
                    >
                      <CalendarCheck className="h-3.5 w-3.5" />
                      Jadwalkan Dokter Ini
                    </Button>
                  )}
                </div>
              </div>

              {/* Medical Disclaimer Banner */}
              <div className="bg-muted/40 border border-border rounded-xl p-3 flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                  {analysisResult.disclaimer}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetForm}
                  className="text-xs gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Cek Gejala Lain
                </Button>

                <Button type="button" onClick={onClose} className="text-xs px-5 font-bold">
                  Selesai
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
