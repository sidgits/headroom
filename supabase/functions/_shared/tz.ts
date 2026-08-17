// Timezone helpers. Edge functions run in UTC, but every calendar judgment
// (which day an event belongs to, whether it is inside core hours, how a time
// is described to the coach) must happen in the *user's* calendar timezone.

export function safeTz(tz: unknown): string {
  if (typeof tz !== "string" || !tz.trim()) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

interface Parts { year: number; month: number; day: number; hour: number; minute: number }

export function tzParts(d: Date | string, tz: string): Parts {
  const date = typeof d === "string" ? new Date(d) : d;
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    }).formatToParts(date).map((x) => [x.type, x.value]),
  ) as Record<string, string>;
  return {
    year: +p.year, month: +p.month, day: +p.day,
    hour: +p.hour % 24, minute: +p.minute,
  };
}

/** Local calendar date (YYYY-MM-DD) of an instant, in the given timezone. */
export function tzDateKey(d: Date | string, tz: string): string {
  const p = tzParts(d, tz);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Local hour (0-23) of an instant, in the given timezone. */
export function tzHour(d: Date | string, tz: string): number {
  return tzParts(d, tz).hour;
}

/** The UTC instant corresponding to 00:00 local time today in the given timezone. */
export function tzStartOfToday(tz: string, now = new Date()): Date {
  return tzStartOfDay(tzDateKey(now, tz), tz);
}

/** The UTC instant corresponding to 00:00 local time on a YYYY-MM-DD date. */
export function tzStartOfDay(dateKey: string, tz: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const wall = Date.UTC(y, m - 1, d, 0, 0, 0);
  // Two passes handle DST boundaries.
  let guess = new Date(wall);
  for (let i = 0; i < 2; i++) {
    const p = tzParts(guess, tz);
    const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    guess = new Date(guess.getTime() + (wall - asUTC));
  }
  return guess;
}

/** Human-readable local time, e.g. "Mon, Aug 10, 8:45 AM". */
export function tzFormat(d: Date | string, tz: string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz, weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  }).format(date);
}

/** The UTC instant of 00:00 local Monday of the week containing `now`. */
export function tzStartOfWeek(tz: string, now = new Date()): Date {
  const start = tzStartOfToday(tz, now);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(start);
  const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const idx = Math.max(0, order.indexOf(weekday));
  return new Date(start.getTime() - idx * 24 * 3600 * 1000);
}
