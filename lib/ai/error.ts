export function toUserFacingError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (lower.includes("401") || lower.includes("incorrect api key") || lower.includes("invalid api key")) {
    return "AI generation is not configured. Please contact support.";
  }
  if (lower.includes("429") || lower.includes("quota") || lower.includes("rate limit")) {
    return "AI is temporarily unavailable — usage limit reached. Please try again shortly.";
  }
  if (lower.includes("billing") || lower.includes("payment")) {
    return "AI generation is currently unavailable. Please contact support.";
  }
  if (lower.includes("503") || lower.includes("overloaded") || lower.includes("service unavailable")) {
    return "AI service is overloaded right now. Please try again in a moment.";
  }
  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("econnreset") || lower.includes("network")) {
    return "Request timed out. Please try again.";
  }
  if (lower.includes("content policy") || lower.includes("safety")) {
    return "The request was blocked by content policy. Try adjusting your description.";
  }

  return "Something went wrong. Please try again.";
}
