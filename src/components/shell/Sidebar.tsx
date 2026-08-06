"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  ShieldCheck,
  Stethoscope,
  LogOut,
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
  const router = useRouter();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.push("/login");
  };

  const adminLinks = [
    { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
    { label: "Kelola User", href: "/dashboard/admin#users", icon: Users },
    { label: "Audit Log", href: "/dashboard/admin#audit", icon: ShieldCheck, disabled: true },
  ];

  const dokterLinks = [
    { label: "Overview", href: "/dashboard/dokter", icon: LayoutDashboard },
    { label: "Jadwal Praktik", href: "/dashboard/dokter#schedule", icon: Calendar, disabled: true },
    { label: "Daftar Pasien", href: "/dashboard/dokter#patients", icon: Stethoscope, disabled: true },
    { label: "Rekam Medis", href: "/dashboard/dokter#records", icon: FileText, disabled: true },
  ];

  const links = role === "admin" ? adminLinks : dokterLinks;

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-card h-screen sticky top-0">
      {/* Sidebar Header */}
      <div className="flex items-center gap-3 p-6 border-b">
        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
          🏥
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-tight leading-tight">TeleMedika AI</h2>
          <p className="text-[11px] text-muted-foreground capitalize">Portal {role}</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.label}
              href={link.disabled ? "#" : link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                link.disabled && "opacity-40 cursor-not-allowed"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{link.label}</span>
              {link.disabled && (
                <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  Phase 1+
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 text-sm"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4" />
          <span>{logoutMutation.isPending ? "Keluar..." : "Logout"}</span>
        </Button>
      </div>
    </aside>
  );
}
