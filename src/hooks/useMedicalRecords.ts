import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateMedicalRecordInput, UpdateMedicalRecordInput } from "@/lib/validations/medical-record";

export interface VitalSignsItem {
  bloodPressure?: string;
  temperature?: number;
  heartRate?: number;
}

export interface MedicalRecordItem {
  id: string;
  appointmentId: string;
  chiefComplaint?: string;
  diagnosis?: string;
  notes?: string;
  vitalSigns?: VitalSignsItem;
  createdAt: string;
  updatedAt?: string;
  isSanitized?: boolean;
  doctor?: {
    id?: string;
    name: string;
    specialization: string;
    licenseNumber?: string;
  };
  patient?: {
    id?: string;
    name: string;
    gender?: string;
    bloodType?: string;
    allergies?: string;
  };
}

async function fetchMedicalRecords(): Promise<MedicalRecordItem[]> {
  const res = await fetch("/api/medical-records");
  if (!res.ok) throw new Error("Gagal mengambil daftar rekam medis");
  const data = await res.json();
  return data.records || [];
}

export function useMedicalRecords() {
  return useQuery({
    queryKey: ["medicalRecords"],
    queryFn: fetchMedicalRecords,
  });
}

async function fetchMedicalRecordDetail(id: string): Promise<MedicalRecordItem> {
  if (!id) throw new Error("ID Rekam Medis wajib diisi");
  const res = await fetch(`/api/medical-records/${id}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Gagal memuat detail rekam medis");
  }
  return data.medicalRecord;
}

export function useMedicalRecordDetail(id: string) {
  return useQuery({
    queryKey: ["medicalRecord", id],
    queryFn: () => fetchMedicalRecordDetail(id),
    enabled: Boolean(id),
  });
}

export function useCreateMedicalRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateMedicalRecordInput) => {
      const res = await fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal menyimpan rekam medis");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicalRecords"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useUpdateMedicalRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMedicalRecordInput }) => {
      const res = await fetch(`/api/medical-records/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Gagal memperbarui rekam medis");
      }
      return resData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["medicalRecords"] });
      queryClient.invalidateQueries({ queryKey: ["medicalRecord", variables.id] });
    },
  });
}
