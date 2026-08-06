"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useAuth";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Loader2 } from "lucide-react";

interface RoleShellProps {
  children: React.ReactNode;
  allowedRole: "admin" | "dokter" | "pasien";
}

export function RoleShell({ children, allowedRole }: RoleShellProps) {
  const { data: user, isLoading, isError } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== allowedRole) {
        // Redirection if trying to access dashboard of different role
        router.push(`/dashboard/${user.role}`);
      }
    }
  }, [user, isLoading, allowedRole, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Memuat Sesi Pengguna RS TeleMedika...</p>
      </div>
    );
  }

  if (isError || !user || user.role !== allowedRole) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Sidebar for Doctor & Admin on desktop */}
      {user.role !== "pasien" && <Sidebar role={user.role} />}

      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} />

        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-y-auto">
          {children}
        </main>

        {/* Bottom Nav for Patient on mobile */}
        {user.role === "pasien" && <BottomNav />}
      </div>
    </div>
  );
}
