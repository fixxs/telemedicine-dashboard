import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PrescriptionInput, MedicineItemInput } from "@/lib/validations/prescription";

export interface IPrescriptionItem {
  id: string;
  medicalRecordId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  medicines: MedicineItemInput[];
  generalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export function usePrescription(medicalRecordId?: string) {
  const queryClient = useQueryClient();

  const {
    data: prescription,
    isLoading: isLoadingPrescription,
    error: fetchError,
    refetch: refetchPrescription,
  } = useQuery({
    queryKey: ["prescription", medicalRecordId],
    queryFn: async () => {
      if (!medicalRecordId) return null;
      const res = await fetch(`/api/prescriptions/${medicalRecordId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal mengambil data resep obat.");
      }
      return data.prescription as IPrescriptionItem | null;
    },
    enabled: !!medicalRecordId,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: PrescriptionInput) => {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal menyimpan resep obat.");
      }
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["prescription", variables.medicalRecordId] });
      queryClient.invalidateQueries({ queryKey: ["medicalRecords"] });
    },
  });

  const downloadPdfReport = async (recordId: string, patientName?: string) => {
    try {
      const res = await fetch(`/api/medical-records/${recordId}/report-pdf`, {
        method: "GET",
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Gagal mengunduh laporan PDF medis.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Laporan-Medis-${patientName ? patientName.replace(/\s+/g, "_") : recordId.slice(-6)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      throw err;
    }
  };

  return {
    prescription,
    isLoadingPrescription,
    fetchError,
    refetchPrescription,
    savePrescription: saveMutation.mutateAsync,
    isSavingPrescription: saveMutation.isPending,
    saveError: saveMutation.error,
    downloadPdfReport,
  };
}
