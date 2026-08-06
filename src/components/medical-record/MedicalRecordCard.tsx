"use client";

import React from "react";
import { MedicalRecordItem } from "@/hooks/useMedicalRecords";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Stethoscope, Calendar, ArrowRight, Activity, Edit3, User } from "lucide-react";

interface MedicalRecordCardProps {
  record: MedicalRecordItem;
  role: "pasien" | "dokter" | "admin";
  onViewDetail?: (id: string) => void;
  onEdit?: (record: MedicalRecordItem) => void;
}

export function MedicalRecordCard({
  record,
  role,
  onViewDetail,
  onEdit,
}: MedicalRecordCardProps) {
  const formattedDate = new Date(record.createdAt).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              {role === "pasien" ? (
                <>
                  <CardTitle className="text-sm font-bold truncate flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-primary shrink-0" />
                    {record.doctor?.name}
                  </CardTitle>
                  <p className="text-xs text-primary font-medium">{record.doctor?.specialization}</p>
                </>
              ) : (
                <>
                  <CardTitle className="text-sm font-bold truncate flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary shrink-0" />
                    Pasien: {record.patient?.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Gol. Darah: {record.patient?.bloodType || "-"}</p>
                </>
              )}
            </div>
          </div>

          <Badge variant="success" className="text-[10px] shrink-0">
            Selesai
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 text-xs">
        {/* Diagnosis */}
        <div className="p-2.5 bg-muted/40 rounded-lg border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Diagnosis
          </span>
          <p className="font-bold text-foreground line-clamp-1">{record.diagnosis || "-"}</p>
        </div>

        {/* Keluhan Ringkas */}
        <div>
          <span className="text-[10px] font-semibold text-muted-foreground block">Keluhan Utama:</span>
          <p className="text-foreground line-clamp-2 text-xs leading-relaxed">
            {record.chiefComplaint || "-"}
          </p>
        </div>

        {/* Vital Signs Summary */}
        {record.vitalSigns && (record.vitalSigns.bloodPressure || record.vitalSigns.temperature) && (
          <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
            <Activity className="h-3 w-3 text-primary shrink-0" />
            {record.vitalSigns.bloodPressure && (
              <span>TD: <strong className="text-foreground">{record.vitalSigns.bloodPressure}</strong></span>
            )}
            {record.vitalSigns.temperature && (
              <span>Suhu: <strong className="text-foreground">{record.vitalSigns.temperature}°C</strong></span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1 text-[11px]">
          <Calendar className="h-3 w-3" />
          {formattedDate}
        </span>

        <div className="flex items-center gap-1.5">
          {role === "dokter" && onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(record)}
              className="h-7 text-xs gap-1"
            >
              <Edit3 className="h-3 w-3" /> Edit
            </Button>
          )}

          {onViewDetail && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onViewDetail(record.id)}
              className="h-7 text-xs gap-1 font-semibold"
            >
              Detail <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
