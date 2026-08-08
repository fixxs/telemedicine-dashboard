"use client";

import React from "react";
import { AnalyticsSummary } from "@/hooks/useAdminAnalytics";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart as PieIcon } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

interface StatusBreakdownChartProps {
  stats: AnalyticsSummary["appointmentStats"];
}

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444"]; // pending, confirmed, completed, cancelled

export function StatusBreakdownChart({ stats }: StatusBreakdownChartProps) {
  const chartData = [
    { name: "Menunggu (Pending)", value: stats.pending },
    { name: "Terkonfirmasi", value: stats.confirmed },
    { name: "Selesai (Completed)", value: stats.completed },
    { name: "Dibatalkan", value: stats.cancelled },
  ].filter((item) => item.value > 0);

  return (
    <Card className="border-border shadow-md">
      <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
            <PieIcon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Breakdown Status Janji Temu
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Distribusi status seluruh sesi telemedicine pasien
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {chartData.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/20 text-xs text-muted-foreground">
            Belum ada janji temu tercatat.
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
