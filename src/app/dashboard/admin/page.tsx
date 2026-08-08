"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RoleShell } from "@/components/shell/RoleShell";
import { DoctorScheduleForm } from "@/components/booking/DoctorScheduleForm";
import { AppointmentList } from "@/components/booking/AppointmentList";
import { MedicalRecordList } from "@/components/medical-record/MedicalRecordList";
import { AdminAnalyticsDashboard } from "@/components/analytics/AdminAnalyticsDashboard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useCurrentUser, useCreateManagedUser, useAdminUsers } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createManagedUserSchema, CreateManagedUserInput } from "@/lib/validations/auth";
import { ShieldCheck, UserPlus, Users, Loader2, CheckCircle2, AlertCircle, Calendar, FileText, BarChart3 } from "lucide-react";

function AdminDashboardContent() {
  const { data: user } = useCurrentUser();
  const { data: usersList, isLoading: loadingUsers, refetch } = useAdminUsers();
  const createManagedUserMutation = useCreateManagedUser();

  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as "analytics" | "users" | "schedule" | "appointments" | "medical-records" | null;

  const [activeTab, setActiveTab] = useState<"analytics" | "users" | "schedule" | "appointments" | "medical-records">("analytics");
  const [showModal, setShowModal] = useState(false);
  const [serverMessage, setServerMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (tabParam && ["analytics", "users", "schedule", "appointments", "medical-records"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateManagedUserInput>({
    resolver: zodResolver(createManagedUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "dokter",
      specialization: "Dokter Umum",
      licenseNumber: "",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: CreateManagedUserInput) => {
    setServerMessage(null);
    try {
      const response = await createManagedUserMutation.mutateAsync(data);
      if (response.success) {
        setServerMessage({ type: "success", text: response.message });
        reset();
        setShowModal(false);
        refetch();
      }
    } catch (err: any) {
      setServerMessage({ type: "error", text: err.message || "Gagal membuat akun." });
    }
  };

  return (
    <RoleShell allowedRole="admin">
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-primary/10 border border-indigo-500/20 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="admin">Admin System</Badge>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                System Status: Phase 0-6 Complete & Production Active
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Panel Administrasi RS TeleMedika</h1>
            <p className="text-sm text-muted-foreground">
              Dashboard analytics operasional rumah sakit, kelola pengguna, jadwal dokter, dan monitoring janji temu.
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} className="gap-2 shrink-0 font-semibold">
            <UserPlus className="h-4 w-4" />
            Buat Dokter / Admin Baru
          </Button>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex border-b border-border space-x-2 overflow-x-auto">
          <Button
            variant={activeTab === "analytics" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("analytics")}
            className="gap-2 text-xs font-semibold rounded-b-none border-b-2 border-transparent"
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard Analytics Hospital
          </Button>
          <Button
            variant={activeTab === "users" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("users")}
            className="gap-2 text-xs font-semibold rounded-b-none border-b-2 border-transparent"
          >
            <Users className="h-4 w-4" />
            Kelola Pengguna ({usersList?.length || 0})
          </Button>
          <Button
            variant={activeTab === "schedule" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("schedule")}
            className="gap-2 text-xs font-semibold rounded-b-none border-b-2 border-transparent"
          >
            <Calendar className="h-4 w-4" />
            Set Jadwal Dokter
          </Button>
          <Button
            variant={activeTab === "appointments" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("appointments")}
            className="gap-2 text-xs font-semibold rounded-b-none border-b-2 border-transparent"
          >
            <ShieldCheck className="h-4 w-4" />
            Monitoring Janji Temu
          </Button>
          <Button
            variant={activeTab === "medical-records" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("medical-records")}
            className="gap-2 text-xs font-semibold rounded-b-none border-b-2 border-transparent"
          >
            <FileText className="h-4 w-4" />
            Audit Metadata Medis
          </Button>
        </div>

        {/* Global Feedback Alert */}
        {serverMessage && (
          <Alert variant={serverMessage.type === "error" ? "destructive" : "success"}>
            {serverMessage.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <AlertTitle>{serverMessage.type === "error" ? "Peringatan" : "Berhasil"}</AlertTitle>
            <AlertDescription>{serverMessage.text}</AlertDescription>
          </Alert>
        )}

        {/* TAB 0: HOSPITAL ANALYTICS DASHBOARD (DEFAULT ACTIVE TAB) */}
        {activeTab === "analytics" && <AdminAnalyticsDashboard />}

        {/* TAB 1: USERS LIST */}
        {activeTab === "users" && (
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Daftar Pengguna Sistem (Database Atlas)
                </CardTitle>
                <CardDescription>
                  Semua akun pengguna yang terdaftar di koleksi User (Pasien, Dokter, Admin).
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loadingUsers}>
                {loadingUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
              </Button>
            </CardHeader>

            <CardContent>
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  Memuat data pengguna...
                </div>
              ) : !usersList || usersList.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">Belum ada pengguna.</div>
              ) : (
                <div className="overflow-x-auto border border-border rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-4 py-3">Nama</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Tanggal Dibuat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {usersList.map((u: any) => (
                        <tr key={u._id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                          <td className="px-4 py-3">
                            <Badge variant={u.role} className="capitalize text-xs">
                              {u.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 2: DOCTOR SCHEDULE CONFIG (ADMIN MODE) */}
        {activeTab === "schedule" && <DoctorScheduleForm isAdmin={true} />}

        {/* TAB 3: APPOINTMENT MONITORING */}
        {activeTab === "appointments" && <AppointmentList userRole="admin" />}

        {/* TAB 4: MEDICAL RECORDS METADATA AUDIT */}
        {activeTab === "medical-records" && <MedicalRecordList role="admin" />}

        {/* Modal Create Dokter / Admin */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md bg-card shadow-2xl border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Buat Akun Terkelola Baru
                </CardTitle>
                <CardDescription>Akun dokter & admin hanya dapat dibuat oleh akun Admin terdaftar.</CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Tipe Akun (Role)</label>
                    <select
                      {...register("role")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="dokter">Dokter</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Nama Lengkap *</label>
                    <Input
                      type="text"
                      placeholder="dr. Ahmad Hidayat, Sp.PD"
                      {...register("name")}
                      disabled={createManagedUserMutation.isPending}
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Email Resmi *</label>
                    <Input
                      type="email"
                      placeholder="dokter.ahmad@hospital.com"
                      {...register("email")}
                      disabled={createManagedUserMutation.isPending}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Password *</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...register("password")}
                      disabled={createManagedUserMutation.isPending}
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                  </div>

                  {selectedRole === "dokter" && (
                    <>
                      <div className="space-y-1 pt-1 border-t border-border">
                        <label className="text-xs font-semibold">Spesialisasi Dokter</label>
                        <Input
                          type="text"
                          placeholder="Dokter Spesialis Penyakit Dalam"
                          {...register("specialization")}
                          disabled={createManagedUserMutation.isPending}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Nomor STR</label>
                        <Input
                          type="text"
                          placeholder="STR-3129849204"
                          {...register("licenseNumber")}
                          disabled={createManagedUserMutation.isPending}
                        />
                      </div>
                    </>
                  )}
                </CardContent>

                <div className="flex items-center justify-end gap-2 p-6 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    disabled={createManagedUserMutation.isPending}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={createManagedUserMutation.isPending}>
                    {createManagedUserMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Akun"
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </RoleShell>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Memuat Admin Dashboard...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
