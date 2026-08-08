export const ACTIVE_GEMINI_MODEL =
  process.env.NEXT_PUBLIC_GEMINI_MODEL || process.env.GEMINI_MODEL || "gemini-3.5-flash";

export function getGeminiEngineLabel(): string {
  const model = ACTIVE_GEMINI_MODEL.toLowerCase();
  if (model.includes("3.5")) return "Gemini 3.5 Flash Engine";
  if (model.includes("3.6")) return "Gemini 3.6 Flash Engine";
  if (model.includes("2.5")) return "Gemini 2.5 Engine";
  if (model.includes("2.0")) return "Gemini 2.0 Engine";

  // General formatter for any model name e.g. "gemini-3.5-flash" -> "Gemini 3.5 Flash Engine"
  const formatted = model
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return `${formatted} Engine`;
}
