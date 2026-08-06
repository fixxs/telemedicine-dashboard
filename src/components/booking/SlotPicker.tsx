"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { TimeSlot } from "@/hooks/useDoctors";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface SlotPickerProps {
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSelectSlot: (time: string) => void;
  isLoading?: boolean;
}

export function SlotPicker({ slots, selectedSlot, onSelectSlot, isLoading }: SlotPickerProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 py-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-11 min-h-[44px] bg-muted/60 animate-pulse rounded-md" />
        ))}
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground bg-muted/30 rounded-lg border border-dashed p-4">
        <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground/60" />
        <p>Tidak ada slot waktu tersedia untuk tanggal ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-primary" />
        Pilih Jam Praktik *
      </label>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {slots.map((slot) => {
          const isSelected = selectedSlot === slot.time;
          const isBooked = !slot.available;

          return (
            <Button
              key={slot.time}
              type="button"
              variant={isSelected ? "default" : "outline"}
              disabled={isBooked}
              onClick={() => onSelectSlot(slot.time)}
              className={cn(
                "h-11 min-h-[44px] min-w-[70px] text-xs font-medium transition-all flex flex-col justify-center items-center rounded-md border",
                isSelected && "ring-2 ring-primary ring-offset-1 font-bold shadow-sm",
                isBooked && "bg-muted text-muted-foreground/50 border-muted opacity-40 cursor-not-allowed line-through"
              )}
            >
              <span>{slot.time}</span>
              <span className="text-[9px] font-normal leading-none mt-0.5">
                {isBooked ? "Penuh" : isSelected ? "Terpilih" : "Tersedia"}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
