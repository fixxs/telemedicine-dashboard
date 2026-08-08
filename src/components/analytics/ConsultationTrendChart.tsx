"use client";

import React from "react";
import { ConsultationTrendStat } from "@/hooks/useAdminAnalytics";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Calendar } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface ConsultationTrendChartProps {
  data: ConsultationTrendStat[];
}

export function ConsultationTrendChart({ data }: ConsultationTrendChartProps) {
  const formattedData = data.map((d) => {
    const dateObj = new Date(d.date);
    const label = dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    return {
      ...d,
      displayDate: label,
    };
  });

  return (
    <Card className="border-border shadow-md">
      <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Tren Jumlah Konsultasi Telemedicine
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Grafik pertumbuhan volume konsultasi harian (Total vs Selesai vs Dibatalkan)
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {formattedData.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/20 text-xs text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Belum ada histori data tren janji temu.
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="displayDate" tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#38bdf8" }}
                />

                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total Sesi"
                  stroke="#0d9488"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Konsultasi Selesai"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
