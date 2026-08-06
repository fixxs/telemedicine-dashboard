/**
 * Server-side REST Client Helper for Daily.co Video API
 * API Docs: https://docs.daily.co/reference/rest-api
 */

const DAILY_API_KEY = process.env.DAILY_API_KEY || "";
const DAILY_DOMAIN = process.env.DAILY_DOMAIN || "";

interface DailyRoomResponse {
  id: string;
  name: string;
  url: string;
  created_at: string;
  config: {
    exp?: number;
  };
}

interface DailyMeetingTokenResponse {
  token: string;
}

/**
 * Creates or retrieves a Daily.co video room for a given appointment.
 * Room names are deterministic based on appointment ID (telemed-room-<appointmentId>).
 */
export async function createOrGetDailyRoom(
  appointmentId: string,
  expTimestampSec: number
): Promise<{ roomUrl: string; roomName: string }> {
  const roomName = `telemed-room-${appointmentId}`;

  // Fallback check if Daily credentials are not provided
  if (!DAILY_API_KEY) {
    console.warn("[Daily.co Warning] DAILY_API_KEY is not configured in .env.local. Using fallback room URL.");
    const fallbackDomain = DAILY_DOMAIN || "telemedika.daily.co";
    return {
      roomUrl: `https://${fallbackDomain}/${roomName}`,
      roomName: roomName,
    };
  }

  // 1. Check if room already exists via Daily REST API
  try {
    const getRes = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (getRes.ok) {
      const data: DailyRoomResponse = await getRes.json();
      return {
        roomUrl: data.url,
        roomName: data.name,
      };
    }
  } catch (err) {
    console.warn(`[Daily.co] Error checking room ${roomName}:`, err);
  }

  // 2. Room does not exist yet; create a new room with expiry date
  const createRes = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: roomName,
      privacy: "private", // Access requires meeting token
      properties: {
        exp: expTimestampSec,
        eject_at_room_exp: true,
        enable_chat: true,
        enable_knocking: true,
        enable_screenshare: true,
      },
    }),
  });

  if (!createRes.ok) {
    const errorBody = await createRes.text();
    console.error(`[Daily.co API Error] Failed to create room: ${createRes.status} ${errorBody}`);
    
    // If room already exists conflict (409), try fetching or constructing fallback
    if (createRes.status === 409) {
      const fallbackDomain = DAILY_DOMAIN || "telemedika.daily.co";
      return {
        roomUrl: `https://${fallbackDomain}/${roomName}`,
        roomName: roomName,
      };
    }

    throw new Error(`Gagal membuat ruangan video call di Daily.co (${createRes.status})`);
  }

  const data: DailyRoomResponse = await createRes.json();
  return {
    roomUrl: data.url,
    roomName: data.name,
  };
}

/**
 * Generates a Daily.co meeting token for a specific user and room.
 */
export async function createDailyMeetingToken(params: {
  roomName: string;
  userId: string;
  userName: string;
  isOwner?: boolean;
}): Promise<string> {
  if (!DAILY_API_KEY) {
    console.warn("[Daily.co Warning] DAILY_API_KEY missing. Returning dummy client token for preview.");
    return `fallback_token_${params.userId}_${Date.now()}`;
  }

  // Token valid for 3 hours
  const expTimestampSec = Math.floor(Date.now() / 1000) + 3 * 3600;

  const res = await fetch("https://api.daily.co/v1/meeting-tokens", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: params.roomName,
        user_name: params.userName,
        user_id: params.userId,
        is_owner: params.isOwner ?? false,
        exp: expTimestampSec,
        enable_screenshare: true,
      },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`[Daily.co API Error] Failed to create meeting token: ${res.status} ${errorBody}`);
    throw new Error(`Gagal membuat token akses video call (${res.status})`);
  }

  const data: DailyMeetingTokenResponse = await res.json();
  return data.token;
}
