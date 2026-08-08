"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  ShieldCheck,
  Stethoscope,
  LogOut,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface SidebarProps {
  role: "admin" | "dokter" | "pasien";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "analytics";
  const router = useRouter();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.push("/login");
  };

  const adminLinks = [
    { label: "Dashboard Analytics", href: "/dashboard/admin?tab=analytics", tab: "analytics", icon: BarChart3 },
    { label: "Kelola User", href: "/dashboard/admin?tab=users", tab: "users", icon: Users },
    { label: "Set Jadwal Dokter", href: "/dashboard/admin?tab=schedule", tab: "schedule", icon: Calendar },
    { label: "Monitoring Janji Temu", href: "/dashboard/admin?tab=appointments", tab: "appointments", icon: ShieldCheck },
    { label: "Audit Metadata Medis", href: "/dashboard/admin?tab=medical-records", tab: "medical-records", icon: FileText },
  ];

  const dokterLinks = [
    { label: "Dashboard Dokter", href: "/dashboard/dokter", icon: LayoutDashboard },
    { label: "Jadwal Praktik", href: "/dashboard/dokter#schedule", icon: Calendar },
    { label: "Monitoring Sesi", href: "/dashboard/dokter#appointments", icon: Stethoscope },
    { label: "Rekam Medis & Resep", href: "/dashboard/dokter#records", icon: FileText },
  ];

  const links = role === "admin" ? adminLinks : dokterLinks;

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-card h-screen sticky top-0">
      {/* Sidebar Header */}
      <div className="flex items-center gap-3 p-6 border-b border-border">
        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
          🏥
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-tight leading-tight">TeleMedika AI</h2>
          <p className="text-[11px] text-muted-foreground capitalize">Portal {role}</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            role === "admin"
              ? pathname === "/dashboard/admin" && currentTab === (link as any).tab
              : pathname === link.href;

          return (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 text-xs font-bold"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4" />
          <span>{logoutMutation.isPending ? "Keluar..." : "Logout Sesi"}</span>
        </Button>
      </div>
    </aside>
  );
}
