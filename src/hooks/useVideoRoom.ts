import { useMutation } from "@tanstack/react-query";

interface VideoTokenResponse {
  success: boolean;
  token?: string;
  roomName?: string;
  serverUrl?: string;
  message?: string;
}

export function useVideoRoom() {
  const joinVideoCallMutation = useMutation<VideoTokenResponse, Error, string>({
    mutationFn: async (appointmentId: string) => {
      const res = await fetch(`/api/appointments/${appointmentId}/video-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal mendapatkan token akses video call LiveKit.");
      }

      return data;
    },
  });

  return {
    joinVideoCall: joinVideoCallMutation.mutateAsync,
    isJoining: joinVideoCallMutation.isPending,
    error: joinVideoCallMutation.error,
  };
}
