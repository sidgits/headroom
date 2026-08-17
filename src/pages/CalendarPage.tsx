import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Clock, FileDown, Loader2, RefreshCw, Upload, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { withReview, isReviewMode, REVIEW_EMAIL } from "@/lib/reviewAccess";
import { toast } from "sonner";
import ProfileBadge from "@/components/auth/ProfileBadge";
import LongitudinalTrend, { type Longitudinal } from "@/components/dashboard/LongitudinalTrend";
import ActionCenter, { type Intervention } from "@/components/dashboard/ActionCenter";
import PatternWatch, { type PatternWeek } from "@/components/dashboard/PatternWatch";
import { generateCoachPDF, type CoachReport } from "@/lib/generateCoachPDF";

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

/** Calendar entries that carry no real name — we shouldn't infer what they are. */
const UNTITLED_RE = /^(busy|tentative|free|blocked?|hold|private|no title|untitled|ooo|out of office)?$/i;
const isUntitled = (title: string | null | undefined) => UNTITLED_RE.test((title ?? "").trim());


export default function CalendarPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [clt, setClt] = useState<CltDay[]>([]);
  const [longitudinal, setLongitudinal] = useState<Longitudinal | null>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [patternWeeks, setPatternWeeks] = useState<PatternWeek[]>([]);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [stripOffset, setStripOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [icsUrl, setIcsUrl] = useState("");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      let e = session?.user?.email ?? null;
      if (!e) { try { e = localStorage.getItem("headroom_assessment_email"); } catch { /**/ } }
      // App-review mode: reviewers get a dedicated identity, no sign-in or payment needed.
      if (!e && isReviewMode()) e = REVIEW_EMAIL;
      if (!e) { navigate("/login", { replace: true }); return; }
      setEmail(e);
      await refresh(e);
      setLoading(false);
      // Auto-sync when returning from a successful Google OAuth connection.
      const params = new URLSearchParams(window.location.search);
      if (params.get("calendar") === "connected") {
        window.history.replaceState({}, "", window.location.pathname);
        await runSync(e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async (e: string) => {
    const { data, error } = await supabase.functions.invoke("get-coach-data", { body: withReview({ email: e }) });
    if (error) {
      if ((error as { context?: { status?: number } }).context?.status === 402) {
        toast.error("Subscription required.");
        navigate("/dashboard");
      }
      return;
    }
    setConnections(data?.connections ?? []);
    setEvents(data?.events ?? []);
    setClt(data?.clt ?? []);
    setLongitudinal((data?.longitudinal as Longitudinal) ?? null);
    setInterventions((data?.interventions as Intervention[]) ?? []);
    setPatternWeeks((data?.patterns as PatternWeek[]) ?? []);
    setResolvedCount((data?.resolvedCount as number) ?? 0);
  };

  const downloadWeekPlan = async () => {
    const week = clt.slice(0, 7);
    const avg = week.length ? Math.round(week.reduce((s, d) => s + d.daily_load_score, 0) / week.length) : 0;
    const heaviest = week.reduce<typeof week[number] | null>((a, b) => (!a || b.daily_load_score > a.daily_load_score ? b : a), null);
    const report: CoachReport = {
      title: "Your Week of Action",
      summary: week.length
        ? `Average load across the next ${week.length} days is ${avg}/100${heaviest ? `, peaking on ${dayLabel(heaviest.analysis_date)} at ${heaviest.daily_load_score}` : ""}. ${interventions.length} intervention${interventions.length === 1 ? "" : "s"} are open — each one is a specific change to your calendar, not a general tip.`
        : "No analyzed days yet — run a sync to score your schedule.",
      sections: [
        {
          heading: "Actions to take",
          body: interventions.length
            ? interventions.map((i, n) => `${n + 1}. ${i.title}\n   Why: ${i.evidence}\n   Do: ${i.action_label}`).join("\n\n")
            : "Nothing needs intervening this week — your schedule is defensible as it stands.",
        },
        {
          heading: "Day by day",
          body: week.length
            ? week.map((d) => `${dayLabel(d.analysis_date)} — load ${d.daily_load_score}/100 (Core ${d.intrinsic_load}, Toxic ${d.extraneous_load}, Growth ${d.germane_load}). ${d.summary ?? ""}`).join("\n\n")
            : "No data.",
        },
        {
          heading: "Pattern watch",
          body: patternWeeks.length >= 2
            ? patternWeeks.slice(-6).map((w) => `Week of ${w.label}: load ${w.score}, Toxic ${w.toxic}, Growth ${w.growth}`).join("\n")
            : "Not enough history yet — patterns appear after about three weeks of tracking.",
        },
      ],
    };
    await generateCoachPDF(report);
    toast.success("Action plan downloaded.");
  };



  const runSync = async (e?: string) => {
    const em = e ?? email; if (!em) return;
    setBusy("sync");
    try {
      const { data, error } = await supabase.functions.invoke("sync-calendar", { body: withReview({ email: em }) });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const errors: string[] = data?.errors ?? [];
      if (errors.length) throw new Error(errors[0]);
      await supabase.functions.invoke("analyze-clt", { body: withReview({ email: em }) });
      await refresh(em);
      toast.success("Calendar synced.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed.";
      console.error(err); setSyncError(message); toast.error(message);
    } finally { setBusy(null); }
  };

  const connectGoogle = async () => {
    if (!email) return;
    setBusy("google");
    try {
      const { data, error } = await supabase.functions.invoke("google-oauth-start", {
        body: withReview({ email, redirectTo: `${window.location.origin}/dashboard/calendar` }),
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) { window.location.href = data.url; return; }
      throw new Error("Could not start Google authorization.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google connection failed.");
      setBusy(null);
    }
  };

  const submitIcs = async () => {
    if (!email) return;
    if (!icsUrl) { toast.error("Paste an .ics URL or upload a file."); return; }
    setBusy("ics");
    setSyncError(null);
    setImportMessage("Importing calendar…");
    try {
      const { data, error } = await supabase.functions.invoke("ingest-ics", {
        body: withReview({ email, icsUrl }),
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setIcsUrl("");
      await runSync();
      setImportMessage("Calendar imported.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "ICS import failed.";
      setImportMessage(null); setSyncError(message); toast.error(message);
    }
    finally { setBusy(null); }
  };

  const uploadIcsFile = async (file: File) => {
    if (!email) return;
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
      setImportMessage(null); setSyncError(message); toast.error(message);
    }
    finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const ev of events) {
      const d = localDateKey(ev.starts_at);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(ev);
    }
    for (const list of map.values()) list.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    return map;
  }, [events]);

  const cltByDay = useMemo(() => new Map(clt.map((d) => [d.analysis_date, d])), [clt]);
  const todayKey = new Date().toLocaleDateString("en-CA");
  const todayIdx = clt.findIndex((d) => d.analysis_date >= todayKey);
  const baseStart = todayIdx === -1 ? Math.max(0, clt.length - 7) : todayIdx;
  const maxStart = Math.max(0, clt.length - 7);
  const stripStart = Math.min(maxStart, Math.max(0, baseStart + stripOffset * 7));
  const visibleClt = clt.slice(stripStart, stripStart + 7);
  const canPageBack = stripStart > 0;
  const canPageForward = stripStart < maxStart;

  // Default the focused day to today (or the nearest analyzed day).
  const activeDate = selectedDate ?? clt[baseStart]?.analysis_date ?? clt[clt.length - 1]?.analysis_date ?? null;
  const activeDay = activeDate ? cltByDay.get(activeDate) ?? null : null;
  const activeEvents = activeDate ? eventsByDay.get(activeDate) ?? [] : [];
  const busyMinutes = activeEvents.reduce(
    (acc, ev) => acc + Math.max(0, Math.round((new Date(ev.ends_at).getTime() - new Date(ev.starts_at).getTime()) / 60000)),
    0,
  );
  const peopleCount = activeEvents.reduce((acc, ev) => acc + (ev.attendee_count || 0), 0);
  const weekAvg = visibleClt.length
    ? Math.round(visibleClt.reduce((a, d) => a + d.daily_load_score, 0) / visibleClt.length)
    : 0;

  if (loading) return <div className="h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-background">
      <ProfileBadge />

      {/* Full-bleed sticky command bar */}
      <div className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 py-3 flex flex-wrap items-center gap-3">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="hidden sm:block h-5 w-px bg-border" />
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold leading-tight truncate">Your Schedule in Load</h1>
            <p className="hidden sm:block text-[11px] text-muted-foreground">Real-time cognitive load, block by block.</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {connections.length > 0 && (
              <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-muted-foreground px-2.5 py-1.5 rounded-full border border-border bg-card/50">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                {providerLabel(connections[0]?.provider)}
                {connections[0]?.last_synced_at && <> · {new Date(connections[0].last_synced_at).toLocaleDateString()}</>}
              </span>
            )}
            <button onClick={() => runSync()} disabled={!!busy} className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-60">
              {busy === "sync" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Re-sync
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 py-6 space-y-6">
        {importMessage && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm flex items-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <CheckCircle2 className="w-4 h-4 text-primary" />}
            {importMessage}
          </div>
        )}
        {syncError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
            <span>{syncError}</span>
          </div>
        )}

        {connections.length === 0 ? (
          <div className="rounded-2xl border border-primary/30 bg-card/60 p-5 sm:p-8 space-y-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary mt-1" />
              <div>
                <h2 className="text-xl font-semibold">Connect your calendar</h2>
                <p className="text-sm text-muted-foreground">Score your real schedule — upload an .ics file, paste a calendar URL, or link Google.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-background p-5 space-y-3">
                <div className="font-semibold">ICS file or URL</div>
                <input type="url" placeholder="https://…/calendar.ics" value={icsUrl} onChange={(e) => setIcsUrl(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background" />
                <div className="flex gap-2">
                  <button onClick={submitIcs} disabled={!!busy} className="text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground font-semibold">Use URL</button>
                  <button onClick={() => fileRef.current?.click()} disabled={!!busy}
                    className="text-xs inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-border">
                    {busy === "ics" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload .ics
                  </button>
                  <input ref={fileRef} type="file" accept=".ics,text/calendar" className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadIcsFile(e.target.files[0])} />
                </div>
              </div>
              <div className="rounded-xl border border-primary/30 bg-background p-5 space-y-2">
                <div className="font-semibold">Google Calendar</div>
                <p className="text-xs text-muted-foreground">Connect your Google Calendar (read-only) to score your real schedule.</p>
                <button onClick={connectGoogle} disabled={!!busy}
                  className="text-xs inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-60">
                  {busy === "google" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Calendar className="w-3 h-3" />}
                  Connect Google Calendar
                </button>
                <p className="text-[11px] text-muted-foreground">Outlook integration coming soon.</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Interventions first — what to actually do */}
            {email && (
              <ActionCenter
                items={interventions}
                email={email}
                resolvedCount={resolvedCount}
                onResolved={(id, status) => {
                  setInterventions((list) => (status === "open" ? list : list.filter((i) => i.id !== id)));
                  if (status === "done") setResolvedCount((c) => c + 1);
                }}
              />
            )}

            {/* Week strip — full width */}
            {clt.length > 0 && (
              <div className="rounded-2xl border border-border bg-card/40 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <button type="button" onClick={() => setStripOffset((o) => o - 1)} disabled={!canPageBack}
                    aria-label="Earlier dates"
                    className="p-1.5 rounded-lg border border-border hover:bg-secondary disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="text-center">
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">{rangeLabel(visibleClt)}</div>
                    <div className="text-[11px] text-muted-foreground">Week average load · <span className="font-semibold text-foreground">{weekAvg}/100</span></div>
                  </div>
                  <button type="button" onClick={() => setStripOffset((o) => o + 1)} disabled={!canPageForward}
                    aria-label="Later dates"
                    className="p-1.5 rounded-lg border border-border hover:bg-secondary disabled:opacity-30">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {visibleClt.map((d) => (
                    <DayChip key={d.analysis_date} day={d}
                      active={d.analysis_date === activeDate}
                      count={(eventsByDay.get(d.analysis_date) ?? []).length}
                      onSelect={setSelectedDate} />
                  ))}
                </div>
              </div>
            )}

            {/* Two-pane workspace */}
            <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
              <div className="space-y-5 min-w-0">
                {activeDate ? (
                  <motion.div key={activeDate} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    {/* Day hero */}
                    <section className="rounded-2xl border border-border bg-card/50 p-5 sm:p-7">
                      <div className="flex flex-wrap items-center gap-6">
                        <ScoreDial score={activeDay?.daily_load_score ?? 0} />
                        <div className="min-w-0 flex-1">
                          <h2 className="text-xl sm:text-2xl font-bold">{dayLabel(activeDate)}</h2>
                          <p className="text-sm text-muted-foreground mt-1">{activeDay?.summary ?? "No analysis for this day yet."}</p>
                          <div className="flex flex-wrap gap-2 mt-3 text-[11px]">
                            <Stat icon={<Calendar className="w-3 h-3" />} label={`${activeEvents.length} blocks`} />
                            <Stat icon={<Clock className="w-3 h-3" />} label={`${Math.round(busyMinutes / 6) / 10}h booked`} />
                            <Stat icon={<Users className="w-3 h-3" />} label={`${peopleCount} attendees`} />
                          </div>
                        </div>
                        {activeDay && (
                          <div className="w-full lg:w-auto lg:min-w-[300px] space-y-2">
                            <div className="grid grid-cols-3 gap-3">
                              <LoadBar label="Core" value={activeDay.intrinsic_load} color="bg-[hsl(var(--golden))]" />
                              <LoadBar label="Toxic" value={activeDay.extraneous_load} color="bg-[hsl(var(--warm-red))]" />
                              <LoadBar label="Growth" value={activeDay.germane_load} color="bg-[hsl(var(--deep-orange))]" />
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              Each is its own 0–100 marker — they don't sum to the daily load.
                            </p>
                          </div>
                        )}

                      </div>
                    </section>

                    {/* Timeline as cards, wide grid */}
                    {activeEvents.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                        Nothing scheduled on this day.
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-3">
                        {activeEvents.flatMap((ev, idx) => {
                          const tip = activeDay?.per_block_tips.find((t) => t.event_id === ev.id);
                          const start = new Date(ev.starts_at);
                          const end = new Date(ev.ends_at);
                          const mins = Math.round((end.getTime() - start.getTime()) / 60000);
                          const unnamed = isUntitled(ev.title);
                          const nodes: React.ReactNode[] = [];

                          // The open stretch before this block is often the most useful
                          // thing on the day — show it instead of hiding it.
                          const prev = activeEvents[idx - 1];
                          if (prev) {
                            const gapMins = Math.round((start.getTime() - new Date(prev.ends_at).getTime()) / 60000);
                            if (gapMins >= 30) {
                              nodes.push(
                                <div key={`gap-${ev.id}`}
                                  className="rounded-xl border border-dashed border-primary/30 bg-primary/[0.04] p-4 flex flex-col justify-center gap-1">
                                  <div className="text-[11px] font-mono text-muted-foreground">
                                    {new Date(prev.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                  <div className="text-sm font-semibold text-primary">
                                    {gapMins >= 60 ? `${Math.floor(gapMins / 60)}h ${gapMins % 60}m` : `${gapMins}m`} open
                                  </div>
                                  <p className="text-[11px] text-muted-foreground">
                                    {gapMins >= 90 ? "Long enough for real focus work — the best slot to defend today." : "Recovery gap — worth keeping unbooked."}
                                  </p>
                                </div>,
                              );
                            }
                          }

                          nodes.push(
                            <article key={ev.id} className="rounded-xl border border-border bg-card/40 p-4 flex flex-col gap-2 hover:border-primary/40 transition-colors">
                              <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground font-mono">
                                <span>
                                  {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                <span>{mins}m</span>
                              </div>
                              <h4 className="text-sm font-semibold leading-snug">
                                {unnamed ? `${mins}-minute block` : ev.title}
                                {unnamed && <span className="ml-2 text-[10px] font-normal text-muted-foreground">no title</span>}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2">
                                {tip && typeof tip.load === "number" && tip.risk && <BlockRisk load={tip.load} risk={tip.risk} />}
                                {ev.attendee_count > 0 && (
                                  <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                                    <Users className="w-3 h-3" />{ev.attendee_count}
                                  </span>
                                )}
                              </div>
                              {tip && (
                                <div className="mt-auto text-[11px] px-2.5 py-2 rounded-lg bg-primary/10 border border-primary/20">
                                  <span className="font-semibold text-primary uppercase tracking-wider mr-1">{tip.action.replace(/_/g, " ")}:</span>
                                  {tip.tip}
                                </div>
                              )}
                            </article>,
                          );
                          return nodes;
                        })}
                      </div>
                    )}

                  </motion.div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">No analyzed days yet — run a sync to score your schedule.</div>
                )}
              </div>

              {/* Right rail */}
              <aside className="space-y-4 xl:sticky xl:top-24">
                {activeDay && activeDay.recommendations.length > 0 && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">Today's moves</div>
                    <ul className="space-y-1.5 text-xs text-foreground">
                      {activeDay.recommendations.map((r) => (
                        <li key={r} className="flex gap-2"><span className="text-primary">•</span><span>{r}</span></li>
                      ))}
                    </ul>
                  </div>
                )}

                <PatternWatch weeks={patternWeeks} />

                <LongitudinalTrend data={longitudinal} />

                <button type="button" onClick={downloadWeekPlan}
                  className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2.5 rounded-xl border border-primary/40 bg-primary/10 text-primary hover:bg-primary/15">
                  <FileDown className="w-3.5 h-3.5" /> Download this week's action plan
                </button>

                <div className="rounded-2xl border border-border bg-card/40 p-4 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Upcoming days</div>
                  <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                    {clt.slice(baseStart, baseStart + 21).map((d) => (
                      <button key={d.analysis_date} type="button" onClick={() => setSelectedDate(d.analysis_date)}
                        className={`w-full flex items-center justify-between gap-2 text-xs px-2.5 py-2 rounded-lg border transition-colors ${
                          d.analysis_date === activeDate ? "border-primary/50 bg-primary/10" : "border-transparent hover:bg-secondary"
                        }`}>
                        <span className="truncate">{shortDay(d.analysis_date)}</span>
                        <span className="font-semibold shrink-0">{d.daily_load_score}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-background/60 text-muted-foreground">
      {icon}{label}
    </span>
  );
}

function ScoreDial({ score }: { score: number }) {
  const tone =
    score >= 70 ? "hsl(var(--warm-red))"
    : score >= 50 ? "hsl(var(--deep-orange))"
    : score >= 30 ? "hsl(var(--golden))"
    : "hsl(var(--muted-foreground))";
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="relative w-24 h-24 shrink-0 rounded-full grid place-items-center"
      style={{ background: `conic-gradient(${tone} ${pct * 3.6}deg, hsl(var(--secondary)) 0deg)` }}>
      <div className="w-[76px] h-[76px] rounded-full bg-card grid place-items-center">
        <div className="text-xl font-bold leading-none" style={{ color: tone }}>{score}</div>
        <div className="text-[8px] uppercase tracking-widest text-muted-foreground mt-1 text-center leading-tight">
          Load<br />lower is better
        </div>
      </div>
    </div>
  );
}


function LoadBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-[11px]">
      <div className="flex justify-between text-muted-foreground"><span>{label}</span><span className="font-semibold text-foreground">{value}</span></div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-1"><div className={`h-full ${color}`} style={{ width: `${Math.min(100, value)}%` }} /></div>
    </div>
  );
}

function DayChip({ day, active, count, onSelect }: { day: CltDay; active?: boolean; count?: number; onSelect?: (date: string) => void }) {
  const d = new Date(day.analysis_date + "T00:00:00");
  const color =
    day.daily_load_score >= 70 ? "border-[hsl(var(--warm-red)/0.5)] bg-[hsl(var(--warm-red)/0.1)]"
    : day.daily_load_score >= 50 ? "border-[hsl(var(--deep-orange)/0.5)] bg-[hsl(var(--deep-orange)/0.1)]"
    : day.daily_load_score >= 30 ? "border-[hsl(var(--golden)/0.5)] bg-[hsl(var(--golden)/0.1)]"
    : "border-border bg-card/40";
  return (
    <button type="button" onClick={() => onSelect?.(day.analysis_date)}
      className={`w-full rounded-xl border p-2 text-center transition-all hover:border-primary/60 ${color} ${active ? "ring-2 ring-primary/60 scale-[1.02]" : ""}`}>
      <div className="text-[10px] uppercase text-muted-foreground">{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
      <div className="text-sm font-bold">{d.getDate()}</div>
      <div className="text-[11px] font-semibold mt-0.5">{day.daily_load_score}</div>
      {typeof count === "number" && <div className="text-[9px] text-muted-foreground">{count} blk</div>}
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

function providerLabel(provider?: string) {
  return provider === "google" ? "Google Calendar" : provider === "outlook" ? "Outlook" : "ICS";
}

function dayLabel(date: string) {
  const d = new Date(date + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  const base = d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
  return diff === 0 ? `Today · ${base}` : diff === 1 ? `Tomorrow · ${base}` : base;
}

function shortDay(date: string) {
  const d = new Date(date + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  const base = d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  return diff === 0 ? `Today · ${base}` : base;
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
