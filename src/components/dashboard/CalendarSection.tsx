import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Loader2, RefreshCw, Unplug, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { withReview, isReviewMode } from "@/lib/reviewAccess";
import { toast } from "sonner";

interface EventRow {
  id: string; title: string; starts_at: string; ends_at: string;
  attendee_count: number; is_recurring: boolean; location: string | null; source: string;
}
interface CltDay {
  analysis_date: string; daily_load_score: number;
  intrinsic_load: number; extraneous_load: number; germane_load: number;
  per_block_tips: { event_id: string; category: string; action: string; tip: string; load?: number; risk?: "low" | "moderate" | "high" }[];
  recommendations: string[]; summary: string;
}
interface Connection { id: string; provider: string; last_synced_at: string | null }

export default function CalendarSection({ email }: { email: string }) {
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [clt, setClt] = useState<CltDay[]>([]);
  const [stripOffset, setStripOffset] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [icsUrl, setIcsUrl] = useState("");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const refresh = async () => {
    const { data, error } = await supabase.functions.invoke("get-coach-data", { body: withReview({ email }) });
    if (error) {
      console.error("get-coach-data failed", error);
      setSyncError("We couldn't load your calendar data just now. Please refresh the page.");
      return;
    }
    setConnections(data?.connections ?? []);
    setEvents(data?.events ?? []);
    setClt(data?.clt ?? []);
  };


  const runSync = async () => {
    setBusy("sync");
    setSyncError(null);
    try {
      const { data, error } = await supabase.functions.invoke("sync-calendar", { body: withReview({ email }) });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const errs: string[] = data?.errors ?? [];
      if (errs.length) setSyncError(errs[0] ?? null);
      await supabase.functions.invoke("analyze-clt", { body: withReview({ email }) });
      await refresh();
      if (errs.length) toast.error(errs[0]);
      else toast.success(`Calendar synced — ${data?.events ?? 0} events.`);
    } catch (err) {
      console.error(err);
      setSyncError("Sync failed. Please try disconnecting and reconnecting.");
      toast.error("Sync failed.");
    } finally { setBusy(null); }
  };

  const connectGoogle = async () => {
    setBusy("google");
    try {
      const { data, error } = await supabase.functions.invoke("google-oauth-start", {
        body: withReview({ email, redirectTo: `${window.location.origin}/dashboard` }),
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) { window.location.href = data.url; return; }
      throw new Error("Could not start Google authorisation.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Google connection failed.");
      setBusy(null);
    }
  };

  const disconnect = async () => {
    setBusy("disconnect");
    try {
      const { error } = await supabase.functions.invoke("disconnect-calendar", { body: withReview({ email }) });
      if (error) throw error;
      setSyncError(null);
      setConnections([]); setEvents([]); setClt([]);
      await refresh();
      toast.success("Calendar disconnected.");
    } catch { toast.error("Could not disconnect."); }
    finally { setBusy(null); }
  };


  const submitIcs = async () => {
    if (!icsUrl) { toast.error("Paste an .ics URL or upload a file."); return; }
    setBusy("ics");
    setSyncError(null);
    setImportMessage("Importing calendar…");
    try {
      const { data, error } = await supabase.functions.invoke("ingest-ics", { body: withReview({ email, icsUrl }) });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setIcsUrl("");
      await runSync();
      setImportMessage("Calendar imported.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "ICS import failed.";
      setImportMessage(null);
      setSyncError(message);
      toast.error(message);
    }
    finally { setBusy(null); }
  };

  const uploadIcsFile = async (file: File) => {
    setBusy("ics");
    setSyncError(null);
    setImportMessage(`Importing ${file.name}…`);
    try {
      if (/\.zip$/i.test(file.name)) {
        throw new Error("That's a .zip export — unzip it first and upload the .ics file inside.");
      }
      const text = await file.text();
      if (!text.trim()) throw new Error("The selected file is empty.");
      if (!/BEGIN:VCALENDAR/i.test(text)) throw new Error("Please select a valid .ics calendar file.");
      if (!/BEGIN:VEVENT/i.test(text)) throw new Error("This calendar file has no events in it.");
      const { data, error } = await supabase.functions.invoke("ingest-ics", { body: withReview({ email, icsContent: text }) });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await runSync();
      setImportMessage(`${file.name} imported.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setImportMessage(null);
      setSyncError(message);
      toast.error(message);
    }
    finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const groupedByDay = (() => {
    const map = new Map<string, EventRow[]>();
    for (const ev of events) {
      const d = localDateKey(ev.starts_at);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(ev);
    }
    return Array.from(map.entries());
  })();

  const cltByDay = new Map(clt.map((d) => [d.analysis_date, d]));
  // Strip opens on today and can be paged back through history / forward.
  const todayKey = new Date().toLocaleDateString("en-CA");
  const todayIdx = clt.findIndex((d) => d.analysis_date >= todayKey);
  const baseStart = todayIdx === -1 ? Math.max(0, clt.length - 7) : todayIdx;
  const maxStart = Math.max(0, clt.length - 7);
  const stripStart = Math.min(maxStart, Math.max(0, baseStart + stripOffset * 7));
  const visibleClt = clt.slice(stripStart, stripStart + 7);
  const canPageBack = stripStart > 0;
  const canPageForward = stripStart < maxStart;
  // The strip pages week by week, but the cascade below always lists every
  // analysed day so users can just scroll through the whole window.
  const visibleDays = groupedByDay;
  const dayAnchorId = (date: string) => `sec-day-${date}`;
  const scrollToDay = (date: string) =>
    document.getElementById(dayAnchorId(date))?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <section className="rounded-2xl border border-border bg-card/40 p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-primary font-semibold">Real-time Cognitive Load</p>
          <h2 className="text-xl sm:text-2xl font-bold">Calendar & Today's Load</h2>
        </div>
        {connections.length > 0 && (
          <button onClick={() => runSync()} disabled={!!busy} className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-border hover:bg-secondary">
            {busy === "sync" ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Re-sync
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Loading calendar…</div>
      ) : connections.length === 0 ? (
        <div className="rounded-xl border border-primary/30 bg-background/60 p-4 sm:p-5 space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold">Connect your calendar</h3>
              <p className="text-xs text-muted-foreground">Upload an .ics file or paste a calendar URL.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-background p-3 space-y-2">
              <div className="font-semibold text-sm">ICS file or URL</div>
              <input type="url" placeholder="https://…/calendar.ics" value={icsUrl} onChange={(e) => setIcsUrl(e.target.value)}
                className="w-full text-xs px-2 py-1.5 rounded-lg border border-border bg-background" />
              <div className="flex gap-2">
                <button onClick={submitIcs} disabled={!!busy} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold">Use URL</button>
                <button onClick={() => fileRef.current?.click()} disabled={!!busy}
                  className="text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border">
                  {busy === "ics" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload .ics
                </button>
                <input ref={fileRef} type="file" accept=".ics,text/calendar" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadIcsFile(e.target.files[0])} />
              </div>
            </div>
            {isReviewMode() ? (
              <div className="rounded-xl border border-primary/30 bg-background p-3 space-y-2">
                <div className="font-semibold text-sm">Google Calendar</div>
                <p className="text-xs text-muted-foreground">
                  Connect your Google Calendar (read-only) to score your real schedule.
                </p>
                <button onClick={connectGoogle} disabled={!!busy}
                  className="text-xs inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-60">
                  {busy === "google" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Calendar className="w-3 h-3" />}
                  Connect Google Calendar
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-background/40 p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-muted-foreground">Google/Outlook Calendar Integration coming soon!</div>
                  <p className="text-xs text-muted-foreground mt-0.5">We're building direct, secure connections for Google Calendar and Outlook.</p>
                </div>
              </div>
            )}
          </div>

          {importMessage && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-foreground flex items-center gap-2">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
              {importMessage}
            </div>
          )}

        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-background/60 p-2.5 text-xs text-muted-foreground flex flex-wrap items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            <span className="flex-1 min-w-[180px]">
              Connected via ICS.
              {connections[0]?.last_synced_at && <> Last synced {new Date(connections[0].last_synced_at).toLocaleString()}.</>}
            </span>
            <button onClick={disconnect} disabled={!!busy}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:bg-secondary text-foreground">
              {busy === "disconnect" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unplug className="w-3 h-3" />} Disconnect
            </button>
          </div>

          {syncError && (
            <div className="rounded-xl border border-[hsl(var(--warm-red)/0.4)] bg-[hsl(var(--warm-red)/0.08)] p-3 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[hsl(var(--warm-red))] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">We couldn't pull your events</p>
                <p className="text-muted-foreground">{syncError}</p>
                <p className="text-muted-foreground">You can disconnect above and switch to an ICS link instead.</p>
              </div>
            </div>
          )}

          {clt.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setStripOffset((o) => o - 1)}
                disabled={!canPageBack}
                aria-label="Earlier dates"
                className="p-1.5 rounded-lg border border-border hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                {rangeLabel(visibleClt)}
              </span>
              <button
                type="button"
                onClick={() => setStripOffset((o) => o + 1)}
                disabled={!canPageForward}
                aria-label="Later dates"
                className="p-1.5 rounded-lg border border-border hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
              <div className="grid grid-cols-7 gap-2">
                {visibleClt.map((d) => <DayChip key={d.analysis_date} day={d} onSelect={scrollToDay} />)}
              </div>
            </div>
          )}

          {groupedByDay.length === 0 && !syncError && (
            <div className="rounded-xl border border-border bg-background/40 p-4 space-y-3">
              <p className="text-sm text-muted-foreground italic">No events found for today or the week ahead.</p>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Wrong calendar? Switch to an ICS link:</p>
                <div className="flex flex-wrap gap-2">
                  <input type="url" placeholder="https://…/calendar.ics" value={icsUrl} onChange={(e) => setIcsUrl(e.target.value)}
                    className="flex-1 min-w-[200px] text-xs px-2 py-1.5 rounded-lg border border-border bg-background" />
                  <button onClick={submitIcs} disabled={!!busy} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold">Use URL</button>
                  <button onClick={() => fileRef.current?.click()} disabled={!!busy}
                    className="text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border">
                    {busy === "ics" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload .ics
                  </button>
                  <input ref={fileRef} type="file" accept=".ics,text/calendar" className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadIcsFile(e.target.files[0])} />
                </div>
              </div>
            </div>
          )}


          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {visibleDays.map(([date, evs]) => {
              const day = cltByDay.get(date);
              return (
                <motion.div key={date} id={dayAnchorId(date)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="scroll-mt-2 rounded-xl border border-border bg-background/40 p-3 sm:p-4 space-y-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="font-semibold text-sm">
                      {dayLabel(date)}
                    </h4>
                    {day && <LoadBadge score={day.daily_load_score} label={day.summary} />}
                  </div>
                  {day && (
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <LoadBar label="Core" value={day.intrinsic_load} color="bg-[hsl(var(--golden))]" />
                      <LoadBar label="Toxic" value={day.extraneous_load} color="bg-[hsl(var(--warm-red))]" />
                      <LoadBar label="Growth" value={day.germane_load} color="bg-[hsl(var(--deep-orange))]" />
                    </div>
                  )}
                  <div className="divide-y divide-border/40">
                    {evs.map((ev) => {
                      const tip = day?.per_block_tips.find((t) => t.event_id === ev.id);
                      const start = new Date(ev.starts_at);
                      const end = new Date(ev.ends_at);
                      const mins = Math.round((end.getTime() - start.getTime()) / 60000);
                      return (
                        <div key={ev.id} className="py-2 flex flex-col sm:flex-row sm:items-start gap-2">
                          <div className="text-xs text-muted-foreground font-mono w-24 shrink-0">
                            {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            <span className="text-muted-foreground/60"> · {mins}m</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium truncate">{ev.title}</span>
                              {tip && typeof tip.load === "number" && tip.risk && <BlockRisk load={tip.load} risk={tip.risk} />}
                            </div>
                            {ev.attendee_count > 0 && <div className="text-[11px] text-muted-foreground">{ev.attendee_count} attendees</div>}
                            {tip && (
                              <div className="mt-1 text-[11px] px-2 py-1 rounded-md bg-primary/10 border border-primary/20 text-foreground inline-block max-w-full">
                                <span className="font-semibold text-primary uppercase tracking-wider mr-1">{tip.action.replace(/_/g, " ")}:</span>
                                {tip.tip}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {day && day.recommendations.length > 0 && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-1">
                      <div className="font-semibold uppercase tracking-wider text-primary">Top recommendations</div>
                      <ul className="space-y-0.5 list-disc list-inside text-foreground">
                        {day.recommendations.map((r) => <li key={r}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function LoadBadge({ score, label }: { score: number; label: string }) {
  const color =
    score >= 70 ? "bg-[hsl(var(--warm-red)/0.2)] text-[hsl(var(--warm-red))] border-[hsl(var(--warm-red)/0.4)]"
    : score >= 50 ? "bg-[hsl(var(--deep-orange)/0.2)] text-[hsl(var(--deep-orange))] border-[hsl(var(--deep-orange)/0.4)]"
    : score >= 30 ? "bg-[hsl(var(--golden)/0.2)] text-[hsl(var(--golden))] border-[hsl(var(--golden)/0.4)]"
    : "bg-muted text-muted-foreground border-border";
  return <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${color}`}>{label} · {score}/100</span>;
}

function LoadBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-muted-foreground"><span>{label}</span><span>{value}</span></div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-1"><div className={`h-full ${color}`} style={{ width: `${Math.min(100, value)}%` }} /></div>
    </div>
  );
}

function DayChip({ day, onSelect }: { day: CltDay; onSelect?: (date: string) => void }) {
  const d = new Date(day.analysis_date + "T00:00:00");
  const color =
    day.daily_load_score >= 70 ? "border-[hsl(var(--warm-red)/0.5)] bg-[hsl(var(--warm-red)/0.1)]"
    : day.daily_load_score >= 50 ? "border-[hsl(var(--deep-orange)/0.5)] bg-[hsl(var(--deep-orange)/0.1)]"
    : day.daily_load_score >= 30 ? "border-[hsl(var(--golden)/0.5)] bg-[hsl(var(--golden)/0.1)]"
    : "border-border bg-card/40";
  return (
    <button type="button" onClick={() => onSelect?.(day.analysis_date)}
      className={`w-full rounded-xl border p-2 text-center transition-colors hover:border-primary/60 ${color}`}>
      <div className="text-[10px] uppercase text-muted-foreground">{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
      <div className="text-sm font-bold">{d.getDate()}</div>
      <div className="text-[11px] font-semibold mt-0.5">{day.daily_load_score}</div>
    </button>
  );
}

function BlockRisk({ load, risk }: { load: number; risk: "low" | "moderate" | "high" }) {
  const style =
    risk === "high" ? "bg-[hsl(var(--warm-red)/0.15)] text-[hsl(var(--warm-red))] border-[hsl(var(--warm-red)/0.4)]"
    : risk === "moderate" ? "bg-[hsl(var(--deep-orange)/0.15)] text-[hsl(var(--deep-orange))] border-[hsl(var(--deep-orange)/0.4)]"
    : "bg-[hsl(var(--golden)/0.12)] text-[hsl(var(--golden))] border-[hsl(var(--golden)/0.35)]";
  const label = risk === "high" ? "High burnout risk" : risk === "moderate" ? "Moderate load" : "Low load";
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${style}`}>
      {label} · {load}
    </span>
  );
}

function dayLabel(date: string) {
  const d = new Date(date + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  const base = d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
  return diff === 0 ? `Today · ${base}` : diff === 1 ? `Tomorrow · ${base}` : base;
}

/** Local calendar date (YYYY-MM-DD) for an instant — never bucket on the UTC date. */
function localDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function rangeLabel(days: { analysis_date: string }[]) {
  if (days.length === 0) return "";
  const fmt = (k: string) => {
    const [y = 0, m = 1, d = 1] = k.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };
  const first = fmt(days[0]?.analysis_date ?? "");
  const last = fmt(days[days.length - 1]?.analysis_date ?? "");
  return first === last ? first : `${first} – ${last}`;
}
