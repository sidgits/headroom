// Review access: lets an app reviewer (e.g. Google OAuth verification team) reach
// the calendar + coach features without payment, using a shared access code passed
// as ?review=CODE. The code is validated server-side by the edge functions.

const KEY = "headroom_review_code";

/** Identity used when a reviewer opens the app with ?review=CODE and is not signed in. */
export const REVIEW_EMAIL = "appreview@headroomapp.co";

(function capture() {
  if (typeof window === "undefined") return;
  try {
    const code = new URLSearchParams(window.location.search).get("review");
    if (code) localStorage.setItem(KEY, code);
  } catch {
    /* ignore */
  }
})();

export function getReviewCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return new URLSearchParams(window.location.search).get("review") || localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function isReviewMode(): boolean {
  return !!getReviewCode();
}

/** The browser's IANA timezone, used so the backend buckets days and core hours locally. */
export function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Adds the review code + the user's timezone to an edge function request body. */
export function withReview<T extends Record<string, unknown>>(
  body: T,
): T & { reviewCode?: string; timeZone: string } {
  const code = getReviewCode();
  const withTz = { ...body, timeZone: localTimeZone() };
  return code ? { ...withTz, reviewCode: code } : withTz;
}
