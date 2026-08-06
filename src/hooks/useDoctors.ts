import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateDoctorScheduleInput } from "@/lib/validations/booking";

export interface DoctorScheduleItem {
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

export interface DoctorItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  specialization: string;
  licenseNumber: string;
  schedule: DoctorScheduleItem[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

async function fetchDoctors(): Promise<DoctorItem[]> {
  const res = await fetch("/api/doctors");
  if (!res.ok) throw new Error("Gagal mengambil daftar dokter");
  const data = await res.json();
  return data.doctors || [];
}

export function useDoctors() {
  return useQuery({
    queryKey: ["doctors"],
    queryFn: fetchDoctors,
  });
}

async function fetchAvailableSlots(doctorId: string, dateStr: string) {
  if (!doctorId || !dateStr) return { slots: [], hasSchedule: false, message: "" };
  const res = await fetch(`/api/doctors/${doctorId}/available-slots?date=${dateStr}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Gagal memuat slot waktu");
  }
  return res.json();
}

export function useAvailableSlots(doctorId: string, dateStr: string) {
  return useQuery({
    queryKey: ["availableSlots", doctorId, dateStr],
    queryFn: () => fetchAvailableSlots(doctorId, dateStr),
    enabled: Boolean(doctorId && dateStr),
  });
}

export function useUpdateDoctorSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateDoctorScheduleInput) => {
      const res = await fetch("/api/doctors/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal memperbarui jadwal");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["availableSlots"] });
    },
  });
}
