"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/validations/auth";
import { useLogin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Building2, Loader2, AlertCircle, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput, e?: React.BaseSyntheticEvent) => {
    setServerError(null);

    // Ensure DOM input values are synchronized to prevent browser autofill race condition on 1st submit
    let email = data.email ? data.email.trim() : "";
    let password = data.password || "";

    if (e?.target) {
      const form = e.target as HTMLFormElement;
      const emailEl = form.elements.namedItem("email") as HTMLInputElement | null;
      const passEl = form.elements.namedItem("password") as HTMLInputElement | null;

      if (emailEl && emailEl.value) {
        email = emailEl.value.trim();
        setValue("email", email);
      }
      if (passEl && passEl.value) {
        password = passEl.value;
        setValue("password", password);
      }
    }

    const payload: LoginInput = { email, password };
    console.log("[LoginPage Submit] Executing 1st-click login with payload:", {
      email: payload.email,
      passwordLen: payload.password?.length,
    });

    try {
      const response = await loginMutation.mutateAsync(payload);
      if (response.success && response.user) {
        // Redirection to respective role dashboard
        router.push(`/dashboard/${response.user.role}`);
      }
    } catch (err: any) {
      setServerError(err.message || "Email atau password yang Anda masukkan salah.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">RS TeleMedika AI</h1>
          <p className="text-sm text-muted-foreground">Portal Layanan Telemedicine & Diagnosis AI</p>
        </div>

        <Card className="shadow-lg border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Masuk ke Akun Anda</CardTitle>
            <CardDescription>
              Silakan masukkan email dan password terdaftar (Pasien, Dokter, atau Admin).
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Server Error Alert Banner */}
              {serverError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Gagal Login</AlertTitle>
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Alamat Email</label>
                <Input
                  type="email"
                  placeholder="nama@email.com"
                  {...register("email")}
                  disabled={loginMutation.isPending}
                  className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={loginMutation.isPending}
                  className={errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full font-semibold" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  "Masuk Sistem"
                )}
              </Button>

              <div className="text-center text-xs text-muted-foreground pt-2">
                Pasien baru belum punya akun?{" "}
                <Link href="/register" className="text-primary font-semibold hover:underline">
                  Daftar sebagai Pasien
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Informational Security Badge */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Sistem Otorisasi Multi-Role & JWT Terenkripsi (Phase 0)</span>
        </div>
      </div>
    </div>
  );
}
