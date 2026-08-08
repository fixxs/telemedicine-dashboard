import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldCheck, Clock, Flame } from "lucide-react";

interface UrgencyBadgeProps {
  level: "low" | "medium" | "high" | "emergency";
  className?: string;
}

export function UrgencyBadge({ level, className = "" }: UrgencyBadgeProps) {
  switch (level) {
    case "low":
      return (
        <Badge
          variant="outline"
          className={`bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400 gap-1.5 py-1 px-2.5 text-xs font-semibold ${className}`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Rendah / Konsultasi Biasa
        </Badge>
      );
    case "medium":
      return (
        <Badge
          variant="outline"
          className={`bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400 gap-1.5 py-1 px-2.5 text-xs font-semibold ${className}`}
        >
          <Clock className="h-3.5 w-3.5" />
          Sedang / Perlu Terjadwal
        </Badge>
      );
    case "high":
      return (
        <Badge
          variant="outline"
          className={`bg-orange-500/10 text-orange-600 border-orange-500/30 dark:text-orange-400 gap-1.5 py-1 px-2.5 text-xs font-semibold ${className}`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Tinggi / Segera Konsultasi
        </Badge>
      );
    case "emergency":
      return (
        <Badge
          variant="destructive"
          className={`bg-rose-500/20 text-rose-600 border-rose-500/40 dark:text-rose-400 gap-1.5 py-1 px-2.5 text-xs font-bold animate-pulse ${className}`}
        >
          <Flame className="h-3.5 w-3.5 text-rose-500" />
          ⚠️ DARURAT MEDIS / SEGERA KE IGD
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={className}>
          Sedang
        </Badge>
      );
  }
}
