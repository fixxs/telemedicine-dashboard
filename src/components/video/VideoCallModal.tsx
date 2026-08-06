"use client";

import React, { useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Video, X, ShieldCheck, PhoneOff, AlertCircle } from "lucide-react";

interface VideoCallModalProps {
  serverUrl?: string;
  token?: string;
  roomName?: string;
  patientName?: string;
  doctorName?: string;
  onClose: () => void;
}

export function VideoCallModal({
  serverUrl,
  token,
  roomName,
  patientName,
  doctorName,
  onClose,
}: VideoCallModalProps) {
  const [isDisconnected, setIsDisconnected] = useState(false);

  const targetServerUrl =
    serverUrl ||
    process.env.NEXT_PUBLIC_LIVEKIT_URL ||
    "wss://rumahsakit-telemedika-4hslm0d0.livekit.cloud";

  const handleDisconnected = () => {
    setIsDisconnected(true);
    onClose();
  };

  if (!token) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <Alert variant="destructive" className="max-w-md bg-card">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-sm font-bold">Token Video Call Tidak Valid</AlertTitle>
          <AlertDescription className="text-xs mt-1">
            Gagal mendapatkan otorisasi token untuk bergabung ke kamar videocall.
            <div className="mt-4 flex justify-end">
              <Button size="sm" variant="outline" onClick={onClose}>
                Tutup
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4">
      <div className="w-full max-w-5xl h-[88vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="bg-muted/40 border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">Kamar Konsultasi Virtual LiveKit</h3>
                <Badge variant="success" className="text-[10px] gap-1 py-0 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  Sesi Aktif
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {doctorName ? `Dokter: ${doctorName}` : ""}{" "}
                {patientName ? `| Pasien: ${patientName}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={onClose}
              className="gap-1.5 text-xs font-semibold"
            >
              <PhoneOff className="h-3.5 w-3.5" />
              Keluar Sesi
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* LiveKit Video Conference Container */}
        <div className="relative flex-1 bg-zinc-950 overflow-hidden" data-lk-theme="default">
          <LiveKitRoom
            serverUrl={targetServerUrl}
            token={token}
            connect={!isDisconnected}
            video={true}
            audio={true}
            onDisconnected={handleDisconnected}
            className="w-full h-full"
          >
            <VideoConference />
          </LiveKitRoom>
        </div>

        {/* Footer Security Notice */}
        <div className="bg-muted/30 border-t border-border px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground shrink-0">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Enkripsi Sesi Telemedika HIPAA Compliant via LiveKit Cloud Engine
          </span>
          <span className="hidden sm:inline">Tekan "Keluar Sesi" setelah selesai berkonsultasi</span>
        </div>
      </div>
    </div>
  );
}
