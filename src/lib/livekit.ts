import { AccessToken } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";

/**
 * Server-side helper to generate JWT Access Tokens for LiveKit Cloud rooms.
 * Tokens are signed using LIVEKIT_API_SECRET (never exposed to client).
 */
export async function generateLiveKitToken(params: {
  roomName: string;
  userId: string;
  userName: string;
  isDoctor?: boolean;
}): Promise<string> {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    console.error("[LiveKit Error] LIVEKIT_API_KEY or LIVEKIT_API_SECRET missing in environment.");
    throw new Error("Sistem videocall LiveKit belum dikonfigurasi dengan benar di server.");
  }

  // Create LiveKit AccessToken
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: params.userId,
    name: params.userName,
    ttl: "3h", // Token valid for 3 hours
  });

  // Add room grants: participant can join, publish audio/video, subscribe, and manage if doctor
  at.addGrant({
    roomJoin: true,
    room: params.roomName,
    canPublish: true,
    canSubscribe: true,
    roomAdmin: params.isDoctor ?? false,
  });

  return await at.toJwt();
}
