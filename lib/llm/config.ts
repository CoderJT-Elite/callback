export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

export function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || "";
  const isPlaceholder = apiKey === "" || apiKey === "PASTE_YOUR_GOOGLE_AI_STUDIO_KEY_HERE";
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

  return {
    apiKey: isPlaceholder ? null : apiKey,
    model,
    hasKey: !isPlaceholder,
  };
}

export function hasGeminiKey(): boolean {
  return getGeminiConfig().hasKey;
}
