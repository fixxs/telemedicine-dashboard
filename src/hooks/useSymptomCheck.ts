import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IAiResponse } from "@/models/SymptomCheck";

export interface SymptomCheckItem {
  id: string;
  symptoms: string[];
  duration: string;
  severity: string;
  additionalNotes: string;
  aiResponse: IAiResponse;
  createdAt: string;
}

export interface SubmitSymptomCheckInput {
  symptoms: string[];
  duration?: string;
  severity?: "ringan" | "sedang" | "berat";
  additionalNotes?: string;
}

interface SubmitSymptomCheckResponse {
  success: boolean;
  message: string;
  symptomCheck?: SymptomCheckItem;
}

interface SymptomCheckHistoryResponse {
  success: boolean;
  symptomChecks: SymptomCheckItem[];
  message?: string;
}

export function useSymptomCheck(params?: { patientId?: string; appointmentId?: string }) {
  const queryClient = useQueryClient();

  const historyQuery = useQuery<SymptomCheckHistoryResponse, Error>({
    queryKey: ["symptom-check-history", params?.patientId, params?.appointmentId],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.patientId) searchParams.append("patientId", params.patientId);
      if (params?.appointmentId) searchParams.append("appointmentId", params.appointmentId);

      const url = `/api/symptom-check?${searchParams.toString()}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal memuat riwayat symptom check.");
      }

      return data;
    },
  });

  const submitMutation = useMutation<SubmitSymptomCheckResponse, Error, SubmitSymptomCheckInput>({
    mutationFn: async (input) => {
      const res = await fetch("/api/symptom-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal memproses analisis gejala AI.");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["symptom-check-history"] });
    },
  });

  return {
    history: historyQuery.data?.symptomChecks || [],
    isLoadingHistory: historyQuery.isLoading,
    historyError: historyQuery.error,
    refetchHistory: historyQuery.refetch,
    submitSymptoms: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
    submitError: submitMutation.error,
  };
}
