// Builds a single-event .ics the user can drop straight into any calendar.
// Headroom only reads calendars (Google scope is calendar.readonly), so every
// action ends in a file the user adds themselves.

function icsTime(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export interface IcsBlockInput {
  title: string;
  startIso: string;
  endIso: string;
  description?: string;
}

export function buildIcsBlock({ title, startIso, endIso, description }: IcsBlockInput): string {
  const uid = `headroom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@headroomapp.co`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Headroom//Focus Block//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsTime(new Date().toISOString())}`,
    `DTSTART:${icsTime(startIso)}`,
    `DTEND:${icsTime(endIso)}`,
    `SUMMARY:${escapeText(title)}`,
    description ? `DESCRIPTION:${escapeText(description)}` : "",
    "TRANSP:OPAQUE",
    "BEGIN:VALARM",
    "TRIGGER:-PT5M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

export function downloadIcsBlock(input: IcsBlockInput, fileName = "headroom-block.ics"): void {
  const blob = new Blob([buildIcsBlock(input)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
