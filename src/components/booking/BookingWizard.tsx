"use client";

import React, { useState, useMemo } from "react";
import { useDoctors, useAvailableSlots, DoctorItem } from "@/hooks/useDoctors";
import { useCreateAppointment } from "@/hooks/useAppointments";
import { SlotPicker } from "./SlotPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Calendar, Clock, CheckCircle2, AlertCircle, Loader2, ArrowRight, ArrowLeft } from "lucide-react";

export function BookingWizard() {
  const { data: doctorsList, isLoading: loadingDoctors } = useDoctors();
  const createAppointmentMutation = useCreateAppointment();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("All");
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorItem | null>(null);

  // Default date to tomorrow (YYYY-MM-DD format)
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(tomorrowStr);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Available slots for selected doctor and date
  const { data: slotData, isLoading: loadingSlots } = useAvailableSlots(
    selectedDoctor?.id || "",
    selectedDate
  );

  // Extract unique specializations
  const specializations = useMemo(() => {
    if (!doctorsList) return [];
    const specs = Array.from(new Set(doctorsList.map((d) => d.specialization || "Dokter Umum")));
    return ["All", ...specs];
  }, [doctorsList]);

  // Filtered doctors list
  const filteredDoctors = useMemo(() => {
    if (!doctorsList) return [];
    if (selectedSpecialization === "All") return doctorsList;
    return doctorsList.filter((d) => d.specialization === selectedSpecialization);
  }, [doctorsList, selectedSpecialization]);

  const handleDoctorSelect = (doc: DoctorItem) => {
    setSelectedDoctor(doc);
    setSelectedTimeSlot(null);
    setStep(2);
  };

  const handleBookingSubmit = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTimeSlot) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await createAppointmentMutation.mutateAsync({
        doctorId: selectedDoctor.id,
        date: selectedDate,
        time: selectedTimeSlot,
      });

      if (response.success) {
        setSuccessMessage("🎉 Janji temu berhasil dibuat! Menunggu konfirmasi dari dokter.");
        setStep(3);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal membuat janji temu.");
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedDoctor(null);
    setSelectedTimeSlot(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return (
    <Card className="border-border shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="pasien">Alur Booking Pasien</Badge>
          <span className="text-xs font-semibold text-muted-foreground">Langkah {step} dari 3</span>
        </div>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Buat Janji Temu Konsultasi
        </CardTitle>
        <CardDescription>
          Pilih dokter spesialis, tentukan tanggal, dan pilih slot waktu yang tersedia.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Booking Gagal / Konkurensi</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* STEP 1: SELECT DOCTOR */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Filter Specialization */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Filter Spesialisasi Dokter</label>
              <div className="flex flex-wrap gap-1.5">
                {specializations.map((spec) => (
                  <Button
                    key={spec}
                    type="button"
                    variant={selectedSpecialization === spec ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setSelectedSpecialization(spec)}
                  >
                    {spec === "All" ? "Semua Spesialisasi" : spec}
                  </Button>
                ))}
              </div>
            </div>

            {/* Doctors Grid */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 text-primary" />
                Pilih Dokter Praktik ({filteredDoctors.length} Dokter)
              </label>

              {loadingDoctors ? (
                <div className="flex items-center justify-center py-12 gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  Memuat daftar dokter...
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg border-dashed">
                  Belum ada dokter terdaftar untuk spesialisasi ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredDoctors.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => handleDoctorSelect(doc)}
                      className={`p-4 border rounded-xl cursor-pointer transition-all hover:border-primary hover:shadow-sm ${
                        selectedDoctor?.id === doc.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-card"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shrink-0">
                          <Stethoscope className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold truncate">{doc.name}</h4>
                          <p className="text-xs text-primary font-medium">{doc.specialization}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">STR: {doc.licenseNumber}</p>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t pt-1.5">
                            <span>{doc.schedule?.length || 0} Hari Praktik</span>
                            <span className="text-primary font-semibold flex items-center gap-0.5">
                              Pilih <ArrowRight className="h-3 w-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: SELECT DATE & TIME SLOT */}
        {step === 2 && selectedDoctor && (
          <div className="space-y-5">
            {/* Selected Doctor Summary Card */}
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  👨‍⚕️
                </div>
                <div>
                  <div className="text-sm font-bold">{selectedDoctor.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedDoctor.specialization}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-xs gap-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                Ganti Dokter
              </Button>
            </div>

            {/* Date Picker Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Pilih Tanggal Konsultasi *
              </label>
              <Input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTimeSlot(null);
                }}
                className="h-11 min-h-[44px] text-sm"
              />
            </div>

            {/* Schedule Status Banner */}
            {slotData && !slotData.hasSchedule && (
              <Alert variant="default" className="border-amber-500/30 bg-amber-50 dark:bg-amber-950/20">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 dark:text-amber-400">Tidak Ada Jadwal Praktik</AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300 text-xs">
                  {selectedDoctor.name} tidak memiliki jadwal praktik pada tanggal ini ({selectedDate}). Silakan pilih tanggal lain.
                </AlertDescription>
              </Alert>
            )}

            {/* Slot Picker Component */}
            {slotData && slotData.hasSchedule && (
              <SlotPicker
                slots={slotData.slots || []}
                selectedSlot={selectedTimeSlot}
                onSelectSlot={(time) => setSelectedTimeSlot(time)}
                isLoading={loadingSlots}
              />
            )}
          </div>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION */}
        {step === 3 && (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Booking Berhasil Dikirim!</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Janji temu Anda telah terdaftar sebagai <Badge variant="warning">pending</Badge>. Dokter akan memverifikasi jadwal Anda segera.
            </p>
            <div className="p-4 bg-muted/40 rounded-xl border text-left max-w-md mx-auto space-y-2 text-xs">
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Dokter:</span>
                <span className="font-semibold">{selectedDoctor?.name}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Spesialisasi:</span>
                <span className="font-semibold">{selectedDoctor?.specialization}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Tanggal:</span>
                <span className="font-semibold">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jam Praktik:</span>
                <span className="font-semibold text-primary">{selectedTimeSlot} WIB</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-4">
        {step === 1 && <span className="text-xs text-muted-foreground">Pilih dokter untuk melanjutkan</span>}

        {step === 2 && (
          <>
            <Button variant="outline" onClick={() => setStep(1)} className="gap-1 text-xs">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <Button
              onClick={handleBookingSubmit}
              disabled={!selectedTimeSlot || createAppointmentMutation.isPending}
              className="gap-1 font-semibold text-xs"
            >
              {createAppointmentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses Booking...
                </>
              ) : (
                <>
                  Konfirmasi Booking <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </>
        )}

        {step === 3 && (
          <Button onClick={handleReset} className="w-full font-semibold">
            Buat Janji Temu Lainnya
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
