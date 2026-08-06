import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateAppointmentInput, UpdateAppointmentStatusInput } from "@/lib/validations/booking";

export interface AppointmentItem {
  id: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
  doctor: {
    id: string;
    name: string;
    email: string;
    specialization: string;
  };
  patient: {
    id: string;
    name: string;
    email: string;
    gender: string;
    bloodType: string;
  };
}

async function fetchAppointments(): Promise<AppointmentItem[]> {
  const res = await fetch("/api/appointments");
  if (!res.ok) throw new Error("Gagal mengambil daftar janji temu");
  const data = await res.json();
  return data.appointments || [];
}

export function useAppointments() {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: fetchAppointments,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateAppointmentInput) => {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal membuat janji temu");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["availableSlots"] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: UpdateAppointmentStatusInput["status"] }) => {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal memperbarui status janji temu");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["availableSlots"] });
    },
  });
}
