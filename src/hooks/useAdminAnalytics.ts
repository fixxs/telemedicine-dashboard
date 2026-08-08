import { useQuery } from "@tanstack/react-query";

export interface AnalyticsSummary {
  totalPatients: number;
  totalDoctors: number;
  totalSymptomChecks: number;
  appointmentStats: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    total: number;
  };
}

export interface DoctorSpecializationStat {
  specialization: string;
  count: number;
}

export interface TopDoctorStat {
  doctorId: string;
  doctorName: string;
  specialization: string;
  completedCount: number;
}

export interface ConsultationTrendStat {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
}

export interface TopDiagnosisStat {
  diagnosis: string;
  count: number;
}

export interface HospitalAnalyticsData {
  summary: AnalyticsSummary;
  doctorsPerSpecialization: DoctorSpecializationStat[];
  topDoctors: TopDoctorStat[];
  consultationTrends: ConsultationTrendStat[];
  topDiagnoses: TopDiagnosisStat[];
}

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ["adminAnalytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal mengambil data analytics hospital.");
      }
      return data.analytics as HospitalAnalyticsData;
    },
    staleTime: 60 * 1000, // 1 minute cache
  });
}
