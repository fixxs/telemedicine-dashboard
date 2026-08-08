"use client";

import React from "react";
import { TopDoctorStat } from "@/hooks/useAdminAnalytics";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Stethoscope } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

interface TopDoctorsChartProps {
  doctors: TopDoctorStat[];
}

const BAR_COLORS = ["#0d9488", "#0f766e", "#14b8a6", "#2dd4bf", "#5eead4"];

export function TopDoctorsChart({ doctors }: TopDoctorsChartProps) {
  return (
    <Card className="border-border shadow-md">
      <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Top 5 Dokter Teraktif (Sesi Selesai)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Peringkat dokter dengan jumlah konsultasi completed terbanyak
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {doctors.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/20 text-xs text-muted-foreground">
            <Stethoscope className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Belum ada data dokter yang menyelesaikan konsultasi.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Recharts Horizontal Bar Chart */}
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={doctors}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <XAxis type="number" allowDecimals={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis
                    type="category"
                    dataKey="doctorName"
                    width={130}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#0f172a", fontWeight: "bold" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "8px",
                      color: "#f8fafc",
                      fontSize: "12px",
                    }}
                    formatter={(value: any) => [`${value} Sesi Konsultasi Selesai`, "Total Completed"]}
                  />
                  <Bar dataKey="completedCount" radius={[0, 6, 6, 0]} barSize={20}>
                    {doctors.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Structured Table List */}
            <div className="border border-border rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-2.5 w-10 text-center">Peringkat</th>
                    <th className="p-2.5">Nama Dokter</th>
                    <th className="p-2.5">Spesialisasi</th>
                    <th className="p-2.5 text-right">Sesi Selesai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {doctors.map((doc, idx) => (
                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                      <td className="p-2.5 text-center font-bold text-teal-600 dark:text-teal-400">
                        #{idx + 1}
                      </td>
                      <td className="p-2.5 font-bold text-foreground">{doc.doctorName}</td>
                      <td className="p-2.5 text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] bg-teal-500/10 text-teal-600 border-teal-500/30">
                          {doc.specialization}
                        </Badge>
                      </td>
                      <td className="p-2.5 text-right font-extrabold text-teal-600 dark:text-teal-400">
                        {doc.completedCount} Sesi
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
