"use client";

import React, { useState } from "react";
import { usePrescription } from "@/hooks/usePrescription";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Download, AlertCircle } from "lucide-react";

interface DownloadReportButtonProps {
  medicalRecordId: string;
  patientName?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function DownloadReportButton({
  medicalRecordId,
  patientName,
  className = "",
  variant = "outline",
  size = "sm",
}: DownloadReportButtonProps) {
  const { downloadPdfReport } = usePrescription();
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setErrorMessage(null);
    try {
      await downloadPdfReport(medicalRecordId, patientName);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal mengunduh laporan PDF medis.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleDownload}
        disabled={isDownloading}
        className={`font-semibold gap-1.5 transition-all border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 ${className}`}
      >
        {isDownloading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-500" />
            <span>Mengunduh Dokumen Medis...</span>
          </>
        ) : (
          <>
            <Download className="h-3.5 w-3.5" />
            <span>Unduh Laporan PDF</span>
          </>
        )}
      </Button>

      {errorMessage && (
        <span className="text-[11px] text-rose-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {errorMessage}
        </span>
      )}
    </div>
  );
}
