"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createMedicalRecordSchema,
  CreateMedicalRecordInput,
} from "@/lib/validations/medical-record";
import {
  useCreateMedicalRecord,
  useUpdateMedicalRecord,
  MedicalRecordItem,
} from "@/hooks/useMedicalRecords";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { FileText, Activity, AlertCircle, Loader2, Save, X } from "lucide-react";

interface MedicalRecordFormProps {
  appointmentId: string;
  patientName: string;
  existingRecord?: MedicalRecordItem | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MedicalRecordForm({
  appointmentId,
  patientName,
  existingRecord,
  onClose,
  onSuccess,
}: MedicalRecordFormProps) {
  const createMutation = useCreateMedicalRecord();
  const updateMutation = useUpdateMedicalRecord();

  const isEditing = Boolean(existingRecord?.id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateMedicalRecordInput>({
    resolver: zodResolver(createMedicalRecordSchema),
    defaultValues: {
      appointmentId,
      chiefComplaint: existingRecord?.chiefComplaint || "",
      diagnosis: existingRecord?.diagnosis || "",
      notes: existingRecord?.notes || "",
      vitalSigns: {
        bloodPressure: existingRecord?.vitalSigns?.bloodPressure || "",
        temperature: existingRecord?.vitalSigns?.temperature || undefined,
        heartRate: existingRecord?.vitalSigns?.heartRate || undefined,
      },
    },
  });

  useEffect(() => {
    if (existingRecord) {
      reset({
        appointmentId,
        chiefComplaint: existingRecord.chiefComplaint || "",
        diagnosis: existingRecord.diagnosis || "",
        notes: existingRecord.notes || "",
        vitalSigns: {
          bloodPressure: existingRecord.vitalSigns?.bloodPressure || "",
          temperature: existingRecord.vitalSigns?.temperature || undefined,
          heartRate: existingRecord.vitalSigns?.heartRate || undefined,
        },
      });
    }
  }, [existingRecord, appointmentId, reset]);

  const [formError, setFormError] = React.useState<string | null>(null);

  const onSubmit = async (data: CreateMedicalRecordInput) => {
    setFormError(null);
    try {
      if (isEditing && existingRecord?.id) {
        await updateMutation.mutateAsync({
          id: existingRecord.id,
          data: {
            chiefComplaint: data.chiefComplaint,
            diagnosis: data.diagnosis,
            notes: data.notes,
            vitalSigns: data.vitalSigns,
          },
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan rekam medis.");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {isEditing ? "Edit Rekam Medis Pasien" : "Isi Rekam Medis Konsultasi"}
              </h3>
              <p className="text-xs text-muted-foreground">Pasien: <span className="font-semibold text-foreground">{patientName}</span></p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Gagal Menyimpan</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {/* Keluhan Utama */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Keluhan Utama Pasien *</span>
              <span className="text-[10px] text-muted-foreground font-normal">Wajib diisi</span>
            </label>
            <textarea
              {...register("chiefComplaint")}
              disabled={isPending}
              rows={2}
              placeholder="Contoh: Demam 3 hari naik turun, pusing hebat, nafsu makan turun"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.chiefComplaint && (
              <p className="text-xs text-destructive font-medium">{errors.chiefComplaint.message}</p>
            )}
          </div>

          {/* Diagnosis */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Diagnosis Dokter *</span>
              <span className="text-[10px] text-muted-foreground font-normal">Wajib diisi</span>
            </label>
            <Input
              type="text"
              {...register("diagnosis")}
              disabled={isPending}
              placeholder="Contoh: Febris ec Suspek Dengue / ISPA Acute"
              className="text-xs"
            />
            {errors.diagnosis && (
              <p className="text-xs text-destructive font-medium">{errors.diagnosis.message}</p>
            )}
          </div>

          {/* Catatan / Hasil Pemeriksaan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Hasil Pemeriksaan / Catatan Dokter (Opsional)</span>
              <span className="text-[10px] text-muted-foreground font-normal">Opsional</span>
            </label>
            <textarea
              {...register("notes")}
              disabled={isPending}
              rows={3}
              placeholder="Catatan terapi, saran istirahat, anjuran tes laboratorium, dsb."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Vital Signs (Opsional Grid) */}
          <div className="space-y-2 pt-2 border-t">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-primary" />
              Tanda Vital Dasar (Opsional)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Tekanan Darah</label>
                <Input
                  type="text"
                  placeholder="120/80 mmHg"
                  {...register("vitalSigns.bloodPressure")}
                  disabled={isPending}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Suhu (°C)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="36.6"
                  {...register("vitalSigns.temperature")}
                  disabled={isPending}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Nadi (bpm)</label>
                <Input
                  type="number"
                  placeholder="80"
                  {...register("vitalSigns.heartRate")}
                  disabled={isPending}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending} className="text-xs">
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isPending} className="text-xs font-semibold gap-1.5">
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  {isEditing ? "Simpan Perubahan" : "Simpan Rekam Medis"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
