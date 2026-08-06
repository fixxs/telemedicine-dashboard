"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, User, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Beranda", href: "/dashboard/pasien", icon: Home },
    { label: "Janji Temu", href: "/dashboard/pasien#appointment", icon: Calendar, disabled: true },
    { label: "Symptom AI", href: "/dashboard/pasien#symptom", icon: Activity, disabled: true },
    { label: "Profil", href: "/dashboard/pasien#profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.label}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground",
                item.disabled && "opacity-40 cursor-not-allowed"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-1", isActive && "scale-110 transition-transform")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
