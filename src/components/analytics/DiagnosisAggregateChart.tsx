"use client";

import React from "react";
import { TopDiagnosisStat } from "@/hooks/useAdminAnalytics";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ShieldCheck } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

interface DiagnosisAggregateChartProps {
  diagnoses: TopDiagnosisStat[];
}

export function DiagnosisAggregateChart({ diagnoses }: DiagnosisAggregateChartProps) {
  return (
    <Card className="border-border shadow-md">
      <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Agregat Tren Diagnosa Penyakit Terbanyak
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Statistik frekuensi penanganan indikasi penyakit secara anonim
            </p>
          </div>
        </div>

        <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-600 border-sky-500/30 self-start sm:self-auto gap-1">
          <ShieldCheck className="h-3 w-3" /> Privasi Terproteksi (Agregat DB)
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {diagnoses.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/20 text-xs text-muted-foreground">
            Belum ada rekam medis & diagnosa yang tercatat.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Recharts Bar Chart */}
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={diagnoses} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="diagnosis" tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "8px",
                      color: "#f8fafc",
                      fontSize: "12px",
                    }}
                    formatter={(val: any) => [`${val} Kasus Ditangani`, "Jumlah"]}
                  />
                  <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Agregat Table Summary */}
            <div className="border border-border rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-2.5 w-10 text-center">#</th>
                    <th className="p-2.5">Diagnosa Medis Agregat</th>
                    <th className="p-2.5 text-right">Frekuensi Kasus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {diagnoses.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                      <td className="p-2.5 text-center font-bold text-sky-600 dark:text-sky-400">
                        {idx + 1}
                      </td>
                      <td className="p-2.5 font-bold text-foreground">{item.diagnosis}</td>
                      <td className="p-2.5 text-right font-extrabold text-sky-600 dark:text-sky-400">
                        {item.count} Kasus
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-muted-foreground italic border-t border-border pt-2">
              * Data diagnosa di atas dihitung murni di level database via MongoDB aggregation ($group). Tidak ada data pribadi pasien yang terekspos ke dashboard admin.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
