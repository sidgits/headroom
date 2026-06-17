import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, CheckCircle2, Copy, Loader2, RefreshCw, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProfileBadge from "@/components/auth/ProfileBadge";

interface EventRow {
  id: string; title: string; starts_at: string; ends_at: string;
  attendee_count: number; is_recurring: boolean; location: string | null; source: string;
}
interface CltDay {
  analysis_date: string; daily_load_score: number;
  intrinsic_load: number; extraneous_load: number; germane_load: number;
  per_block_tips: { event_id: string; category: string; action: string; tip: string }[];
  recommendations: string[]; summary: string;
}
interface Connection { id: string; provider: string; last_synced_at: string | null }

export default function CalendarPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [clt, setClt] = useState<CltDay[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [icsUrl, setIcsUrl] = useState("");
  const [redirectUri, setRedirectUri] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      let e = session?.user?.email ?? null;
      if (!e) { try { e = localStorage.getItem("headroom_assessment_email"); } catch { /**/ } }
      if (!e) { navigate("/"); return; }
      setEmail(e);
      await refresh(e);
      // Handle return from Google
      const p = new URLSearchParams(window.location.search);
      const g = p.get("google");
      if (g === "connected") { toast.success("Google Calendar connected!"); await runSync(e); }
      if (g === "error") toast.error("Google connection failed. Try again.");
      if (g) {
        const url = new URL(window.location.href);
        url.searchParams.delete("google");
        window.history.replaceState({}, "", url.toString());
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async (e: string) => {
    const { data, error } = await supabase.functions.invoke("get-coach-data", { body: { email: e } });
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
  };

  const runSync = async (e?: string) => {
    const em = e ?? email; if (!em) return;
    setBusy("sync");
    try {
      const { error } = await supabase.functions.invoke("sync-calendar", { body: { email: em } });
      if (error) throw error;
      await supabase.functions.invoke("analyze-clt", { body: { email: em } });
      await refresh(em);
      toast.success("Calendar synced.");
    } catch (err) {
      console.error(err); toast.error("Sync failed.");
    } finally { setBusy(null); }
  };

  const connectGoogle = async () => {
    if (!email) return;
    setBusy("google");
    try {
      const { data, error } = await supabase.functions.invoke("google-oauth-start", {
        body: { email, redirectOrigin: window.location.origin },
      });
      if (error) throw error;
      if (data?.redirectUri) setRedirectUri(data.redirectUri);
      if (data?.url) window.location.href = data.url;
    } catch {
      toast.error("Could not start Google connection. Make sure Google credentials are configured.");
      setBusy(null);
    }
  };

  const submitIcs = async () => {
    if (!email) return;
    if (!icsUrl) { toast.error("Paste an .ics URL or upload a file."); return; }
    setBusy("ics");
    try {
      const { error } = await supabase.functions.invoke("ingest-ics", {
        body: { email, icsUrl },
      });
      if (error) throw error;
      setIcsUrl("");
      await runSync();
    } catch { toast.error("ICS import failed."); }
    finally { setBusy(null); }
  };

  const uploadIcsFile = async (file: File) => {
    if (!email) return;
    setBusy("ics");
    try {
      const text = await file.text();
      const { error } = await supabase.functions.invoke("ingest-ics", { body: { email, icsContent: text } });
      if (error) throw error;
      await runSync();
    } catch { toast.error("Upload failed."); }
    finally { setBusy(null); }
  };

  const groupedByDay = (() => {
    const map = new Map<string, EventRow[]>();
    for (const ev of events) {
      const d = ev.starts_at.slice(0, 10);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(ev);
    }
    return Array.from(map.entries());
  })();

  const cltByDay = new Map(clt.map((d) => [d.analysis_date, d]));

  if (loading) return <div className="h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Calendar — Headroom</title><meta name="robots" content="noindex" /></Helmet>
      <ProfileBadge />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-3 pb-12 space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <button onClick={() => runSync()} disabled={!!busy} className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-border hover:bg-secondary">
            {busy === "sync" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Re-sync
          </button>
        </div>

        <header className="space-y-1">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">Real-time Cognitive Load</p>
          <h1 className="text-2xl sm:text-3xl font-bold">Your Week in Load</h1>
          <p className="text-sm text-muted-foreground">Daily scores and per-block tips, orchestrated through Sweller's Cognitive Load Theory.</p>
        </header>

        {connections.length === 0 ? (
          <div className="rounded-2xl border border-primary/30 bg-card/60 p-5 sm:p-6 space-y-5">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary mt-1" />
              <div>
                <h2 className="text-lg font-semibold">Connect your calendar</h2>
                <p className="text-sm text-muted-foreground">Pick one — change anytime.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <button onClick={connectGoogle} disabled={!!busy}
                className="rounded-xl border border-border bg-background hover:border-primary/50 p-4 text-left transition-colors">
                <div className="font-semibold">Google Calendar</div>
                <p className="text-xs text-muted-foreground mt-1">Read-only access to your primary calendar.</p>
                {busy === "google" && <Loader2 className="w-4 h-4 animate-spin mt-2" />}
              </button>
              <div className="rounded-xl border border-border bg-background p-4 space-y-3">
                <div className="font-semibold">ICS file or URL</div>
                <input type="url" placeholder="https://…/calendar.ics" value={icsUrl} onChange={(e) => setIcsUrl(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background" />
                <div className="flex gap-2">
                  <button onClick={submitIcs} disabled={!!busy} className="text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground font-semibold">Use URL</button>
                  <button onClick={() => fileRef.current?.click()} disabled={!!busy}
                    className="text-xs inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-border">
                    <Upload className="w-3 h-3" /> Upload .ics
                  </button>
                  <input ref={fileRef} type="file" accept=".ics,text/calendar" className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadIcsFile(e.target.files[0])} />
                </div>
              </div>
            </div>
            {redirectUri && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs space-y-2">
                <p className="font-semibold text-foreground">Google setup tip</p>
                <p className="text-muted-foreground">In Google Cloud Console → OAuth client, add this as an Authorized redirect URI:</p>
                <div className="flex items-center gap-2 bg-background border border-border rounded p-2 font-mono text-[11px] break-all">
                  <span className="flex-1">{redirectUri}</span>
                  <button onClick={() => { navigator.clipboard.writeText(redirectUri); toast.success("Copied"); }}>
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card/40 p-3 text-xs text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Connected via {connections[0].provider === "google" ? "Google Calendar" : "ICS"}.
            {connections[0].last_synced_at && <> Last synced {new Date(connections[0].last_synced_at).toLocaleString()}.</>}
          </div>
        )}

        {/* 7-day strip */}
        {clt.length > 0 && (
          <div className="grid grid-cols-7 gap-2">
            {clt.slice(0, 7).map((d) => (
              <DayChip key={d.analysis_date} day={d} />
            ))}
          </div>
        )}

        {/* Per-day timelines */}
        {groupedByDay.length === 0 && connections.length > 0 && (
          <div className="text-sm text-muted-foreground italic">No upcoming events found in the next 14 days.</div>
        )}
        {groupedByDay.map(([date, evs]) => {
          const day = cltByDay.get(date);
          return (
            <motion.section key={date} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card/40 p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold">
                  {new Date(date).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}
                </h3>
                {day && <LoadBadge score={day.daily_load_score} label={day.summary} />}
              </div>

              {day && (
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <LoadBar label="Intrinsic" value={day.intrinsic_load} color="bg-[hsl(var(--golden))]" />
                  <LoadBar label="Extraneous" value={day.extraneous_load} color="bg-[hsl(var(--warm-red))]" />
                  <LoadBar label="Germane" value={day.germane_load} color="bg-[hsl(var(--deep-orange))]" />
                </div>
              )}

              <div className="divide-y divide-border/40">
                {evs.map((ev) => {
                  const tip = day?.per_block_tips.find((t) => t.event_id === ev.id);
                  const start = new Date(ev.starts_at);
                  const end = new Date(ev.ends_at);
                  const mins = Math.round((end.getTime() - start.getTime()) / 60000);
                  return (
                    <div key={ev.id} className="py-2.5 flex flex-col sm:flex-row sm:items-start gap-2">
                      <div className="text-xs text-muted-foreground font-mono w-28 shrink-0">
                        {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        <span className="text-muted-foreground/60"> · {mins}m</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{ev.title}</div>
                        {ev.attendee_count > 0 && <div className="text-[11px] text-muted-foreground">{ev.attendee_count} attendees</div>}
                        {tip && (
                          <div className="mt-1.5 text-[11px] px-2 py-1 rounded-md bg-primary/10 border border-primary/20 text-foreground inline-block max-w-full">
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
            </motion.section>
          );
        })}
      </div>
    </div>
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

function DayChip({ day }: { day: CltDay }) {
  const d = new Date(day.analysis_date);
  const color =
    day.daily_load_score >= 70 ? "border-[hsl(var(--warm-red)/0.5)] bg-[hsl(var(--warm-red)/0.1)]"
    : day.daily_load_score >= 50 ? "border-[hsl(var(--deep-orange)/0.5)] bg-[hsl(var(--deep-orange)/0.1)]"
    : day.daily_load_score >= 30 ? "border-[hsl(var(--golden)/0.5)] bg-[hsl(var(--golden)/0.1)]"
    : "border-border bg-card/40";
  return (
    <div className={`rounded-xl border p-2 text-center ${color}`}>
      <div className="text-[10px] uppercase text-muted-foreground">{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
      <div className="text-sm font-bold">{d.getDate()}</div>
      <div className="text-[11px] font-semibold mt-0.5">{day.daily_load_score}</div>
    </div>
  );
}
