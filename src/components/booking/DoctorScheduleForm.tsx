"use client";

import React, { useState, useEffect } from "react";
import { useDoctors, useUpdateDoctorSchedule, DoctorScheduleItem } from "@/hooks/useDoctors";
import { useCurrentUser } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Calendar, Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";

const DAYS_OPTIONS = [
  { value: 1, name: "Senin" },
  { value: 2, name: "Selasa" },
  { value: 3, name: "Rabu" },
  { value: 4, name: "Kamis" },
  { value: 5, name: "Jumat" },
  { value: 6, name: "Sabtu" },
  { value: 0, name: "Minggu" },
];

interface DoctorScheduleFormProps {
  currentDoctorId?: string;
  isAdmin?: boolean;
}

export function DoctorScheduleForm({ currentDoctorId, isAdmin }: DoctorScheduleFormProps) {
  const { data: currentUser } = useCurrentUser();
  const { data: doctorsList, isLoading: loadingDoctors } = useDoctors();
  const updateScheduleMutation = useUpdateDoctorSchedule();

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(currentDoctorId || "");
  const [specialization, setSpecialization] = useState("Dokter Umum");
  const [licenseNumber, setLicenseNumber] = useState("-");
  const [schedules, setSchedules] = useState<DoctorScheduleItem[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Synchronize target doctor selection
  useEffect(() => {
    if (currentDoctorId) {
      setSelectedDoctorId(currentDoctorId);
    }
  }, [currentDoctorId]);

  // Automatically find and populate current doctor data from doctorsList
  useEffect(() => {
    if (!doctorsList || doctorsList.length === 0) return;

    let targetDoc;

    if (isAdmin) {
      if (selectedDoctorId) {
        targetDoc = doctorsList.find((d) => d.id === selectedDoctorId);
      }
    } else {
      // For doctor role: find doctor matching logged in user's userId or currentDoctorId
      targetDoc = doctorsList.find(
        (d) => d.userId === currentUser?.userId || d.id === selectedDoctorId
      );
    }

    if (targetDoc) {
      setSelectedDoctorId(targetDoc.id);
      setSpecialization(targetDoc.specialization || "Dokter Umum");
      setLicenseNumber(targetDoc.licenseNumber || "-");
      setSchedules(targetDoc.schedule || []);
    }
  }, [doctorsList, selectedDoctorId, currentUser, isAdmin]);

  const handleAddDay = () => {
    setSchedules([
      ...schedules,
      {
        dayOfWeek: 1,
        dayName: "Senin",
        startTime: "08:00",
        endTime: "12:00",
        slotDurationMinutes: 30,
      },
    ]);
  };

  const handleRemoveDay = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleScheduleChange = (index: number, field: keyof DoctorScheduleItem, value: any) => {
    const updated = [...schedules];
    if (field === "dayOfWeek") {
      const dayNum = Number(value);
      const dayOpt = DAYS_OPTIONS.find((d) => d.value === dayNum);
      updated[index].dayOfWeek = dayNum;
      updated[index].dayName = dayOpt ? dayOpt.name : "Senin";
    } else {
      (updated[index] as any)[field] = value;
    }
    setSchedules(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    try {
      const res = await updateScheduleMutation.mutateAsync({
        doctorId: isAdmin ? selectedDoctorId : selectedDoctorId || undefined,
        specialization,
        licenseNumber,
        schedule: schedules,
      });

      if (res.success) {
        setFeedback({ type: "success", text: "Jadwal praktik berhasil disimpan ke database!" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Gagal menyimpan jadwal." });
    }
  };

  return (
    <Card className="border-border shadow-sm w-full max-w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Pengaturan Jadwal Praktik Dokter
        </CardTitle>
        <CardDescription>
          Tentukan hari praktik, jam operasional, dan durasi slot (30 menit) untuk penerimaan booking pasien.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {feedback && (
            <Alert variant={feedback.type === "error" ? "destructive" : "success"}>
              {feedback.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              <AlertTitle>{feedback.type === "error" ? "Gagal" : "Berhasil"}</AlertTitle>
              <AlertDescription>{feedback.text}</AlertDescription>
            </Alert>
          )}

          {/* Admin selection for target doctor */}
          {isAdmin && (
            <div className="space-y-1.5 p-3 bg-muted/40 rounded-lg border">
              <label className="text-xs font-semibold">Pilih Dokter untuk Diatur Jadwalnya (Fitur Admin)</label>
              {loadingDoctors ? (
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 py-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  Memuat daftar dokter...
                </div>
              ) : (
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">-- Pilih Dokter --</option>
                  {doctorsList?.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.specialization})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Specialization & License Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Spesialisasi</label>
              <Input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="Spesialis Penyakit Dalam"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Nomor STR</label>
              <Input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="STR-12345678"
              />
            </div>
          </div>

          {/* Days Schedule List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Hari & Jam Operasional Praktik
              </label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddDay} className="h-8 text-xs gap-1">
                <Plus className="h-3.5 w-3.5" />
                Tambah Hari
              </Button>
            </div>

            {loadingDoctors ? (
              <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Memuat jadwal tersimpan...
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-lg text-xs text-muted-foreground">
                Belum ada hari praktik diatur. Klik "Tambah Hari" di atas.
              </div>
            ) : (
              <div className="space-y-3">
                {schedules.map((item, index) => (
                  <div
                    key={index}
                    className="p-3.5 border rounded-xl bg-card/80 space-y-3 shadow-sm"
                  >
                    {/* Header Row: Day Select, Duration, & Remove Button */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 max-w-[180px]">
                        <select
                          value={item.dayOfWeek}
                          onChange={(e) => handleScheduleChange(index, "dayOfWeek", e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-xs font-bold text-foreground"
                        >
                          {DAYS_OPTIONS.map((d) => (
                            <option key={d.value} value={d.value}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">Durasi Slot:</span>
                          <span className="text-[11px] text-muted-foreground font-medium sm:hidden">Slot:</span>
                          <select
                            value={item.slotDurationMinutes || 30}
                            onChange={(e) => handleScheduleChange(index, "slotDurationMinutes", Number(e.target.value))}
                            className="flex h-9 rounded-md border border-input bg-background px-2 text-xs font-medium"
                          >
                            <option value={15}>15 m</option>
                            <option value={30}>30 m</option>
                            <option value={45}>45 m</option>
                            <option value={60}>60 m</option>
                          </select>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDay(index)}
                          className="h-9 w-9 text-destructive hover:bg-destructive/10 p-0"
                          title="Hapus Hari"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Operational Hours Grid: Jam Mulai & Jam Selesai */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground block">Jam Mulai</label>
                        <Input
                          type="time"
                          value={item.startTime}
                          onChange={(e) => handleScheduleChange(index, "startTime", e.target.value)}
                          className="h-9 text-xs w-full px-2.5 cursor-pointer font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground block">Jam Selesai</label>
                        <Input
                          type="time"
                          value={item.endTime}
                          onChange={(e) => handleScheduleChange(index, "endTime", e.target.value)}
                          className="h-9 text-xs w-full px-2.5 cursor-pointer font-medium"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-2">
          <Button
            type="submit"
            className="w-full font-semibold"
            disabled={updateScheduleMutation.isPending || (isAdmin && !selectedDoctorId)}
          >
            {updateScheduleMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan Jadwal...
              </>
            ) : (
              "Simpan Perubahan Jadwal"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
