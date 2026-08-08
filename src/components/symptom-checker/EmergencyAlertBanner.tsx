import React from "react";
import { Siren, PhoneCall, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmergencyAlertBannerProps {
  warningMessage?: string | null;
  warning?: string | null;
}

export function EmergencyAlertBanner({ warningMessage, warning }: EmergencyAlertBannerProps) {
  const message = warningMessage || warning;
  if (!message) return null;

  return (
    <div className="bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 border-2 border-rose-600 rounded-2xl p-4 sm:p-5 text-rose-100 shadow-2xl animate-pulse my-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-rose-500/30 border border-rose-400 flex items-center justify-center shrink-0 mt-0.5">
            <Siren className="h-6 w-6 text-rose-200 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-extrabold tracking-wide text-rose-100 uppercase">
                ⚠️ Peringatan Kondisi Darurat Medis
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-rose-200 mt-1 font-medium leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <a href="tel:119" className="w-full sm:w-auto">
            <Button
              variant="destructive"
              size="sm"
              className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2 text-xs border border-rose-400 shadow-lg shadow-rose-900/50"
            >
              <PhoneCall className="h-4 w-4" />
              Hubungi IGD 119
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
