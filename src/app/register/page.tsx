"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerPatientSchema, RegisterPatientInput } from "@/lib/validations/auth";
import { useRegister } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Building2, Loader2, AlertCircle, UserCheck } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegister();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterPatientInput>({
    resolver: zodResolver(registerPatientSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      birthDate: "",
      gender: undefined,
      bloodType: undefined,
      allergies: "",
    },
  });

  const onSubmit = async (data: RegisterPatientInput) => {
    setServerError(null);
    try {
      const response = await registerMutation.mutateAsync(data);
      if (response.success) {
        router.push("/dashboard/pasien");
      }
    } catch (err: any) {
      setServerError(err.message || "Gagal melakukan registrasi.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg space-y-6 my-8">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Pendaftaran Pasien Baru</h1>
          <p className="text-sm text-muted-foreground">Buat akun pasien untuk mengakses layanan RS TeleMedika</p>
        </div>

        <Card className="shadow-lg border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Formulir Data Pasien</CardTitle>
            <CardDescription>
              Isi data diri Anda dengan akurat untuk kemudahan layanan medis.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {serverError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Pendaftaran Gagal</AlertTitle>
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}

              {/* Nama Lengkap */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nama Lengkap *</label>
                <Input
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  {...register("name")}
                  disabled={registerMutation.isPending}
                  className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.name && <p className="text-xs text-destructive font-medium">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Alamat Email *</label>
                <Input
                  type="email"
                  placeholder="budi@email.com"
                  {...register("email")}
                  disabled={registerMutation.isPending}
                  className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.email && <p className="text-xs text-destructive font-medium">{errors.email.message}</p>}
              </div>

              {/* Password & Confirm Password Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Password *</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    disabled={registerMutation.isPending}
                    className={errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Konfirmasi Password *</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                    disabled={registerMutation.isPending}
                    className={errors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive font-medium">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Data Medis Opsional Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Tanggal Lahir</label>
                  <Input type="date" {...register("birthDate")} disabled={registerMutation.isPending} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Jenis Kelamin</label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={registerMutation.isPending}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih Jenis Kelamin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                          <SelectItem value="Perempuan">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Golongan Darah</label>
                  <Controller
                    name="bloodType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={registerMutation.isPending}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih Golongan Darah" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">Golongan Darah A</SelectItem>
                          <SelectItem value="B">Golongan Darah B</SelectItem>
                          <SelectItem value="AB">Golongan Darah AB</SelectItem>
                          <SelectItem value="O">Golongan Darah O</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Riwayat Alergi (opsional)</label>
                  <Input
                    type="text"
                    placeholder="Contoh: Penisilin, Udang"
                    {...register("allergies")}
                    disabled={registerMutation.isPending}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full font-semibold" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mendaftarkan...
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Daftar Akun Pasien
                  </>
                )}
              </Button>

              <div className="text-center text-xs text-muted-foreground pt-1">
                Sudah punya akun?{" "}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  Masuk di sini
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
