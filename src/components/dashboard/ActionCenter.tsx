import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CalendarPlus, CheckCircle2, ClipboardCopy, Clock, Shield, TrendingUp, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { copyText, downloadIcsBlock } from "@/lib/icsBlock";

export interface Intervention {
  id: string;
  kind: "defend_focus" | "decline" | "add_buffer" | "shorten" | "pattern";
  severity: "high" | "moderate";
  target_event_id: string | null;
  target_date: string | null;
  title: string;
  evidence: string;
  action_label: string;
  payload: Record<string, unknown>;
  expected_delta: number;
  status: string;
}

const ICONS: Record<Intervention["kind"], typeof Shield> = {
  defend_focus: Shield,
  decline: X,
  add_buffer: Clock,
  shorten: Zap,
  pattern: TrendingUp,
};

const KIND_LABEL: Record<Intervention["kind"], string> = {
  defend_focus: "Defend focus",
  decline: "Decline candidate",
  add_buffer: "Add buffer",
  shorten: "Shorten",
  pattern: "Pattern alert",
};

export default function ActionCenter({
  items, email, onResolved, resolvedCount = 0,
}: {
  items: Intervention[];
  email: string;
  onResolved: (id: string, status: string) => void;
  resolvedCount?: number;
}) {
  const [pending, setPending] = useState<string | null>(null);

  const resolve = async (item: Intervention, status: "done" | "dismissed" | "snoozed") => {
    setPending(item.id);
    onResolved(item.id, status); // optimistic
    const { error } = await supabase
      .from("interventions")
      .update({
        status,
        resolved_at: new Date().toISOString(),
        snoozed_until: status === "snoozed" ? new Date(Date.now() + 3 * 86400000).toISOString() : null,
      })
      .eq("id", item.id);
    setPending(null);
    if (error) {
      toast.error("Couldn't save that — try again.");
      onResolved(item.id, "open");
      return;
    }
    toast.success(status === "done" ? "Marked done." : status === "snoozed" ? "Snoozed for 3 days." : "Dismissed.");
  };

  const primary = async (item: Intervention) => {
    const p = item.payload ?? {};
    if (item.kind === "defend_focus" || item.kind === "add_buffer") {
      const start = p["start_iso"] as string | undefined;
      const end = p["end_iso"] as string | undefined;
      if (!start || !end) { toast.error("This block has no time attached."); return; }
      downloadIcsBlock(
        {
          title: (p["suggested_title"] as string) ?? "Headroom block",
          startIso: start, endIso: end,
          description: `${item.title}\n\n${item.evidence}\n\nCreated by Headroom.`,
        },
        item.kind === "defend_focus" ? "headroom-focus-block.ics" : "headroom-buffer.ics",
      );
      toast.success("Calendar block downloaded — open it to add it.");
      await resolve(item, "done");
      return;
    }
    if (item.kind === "decline" || item.kind === "shorten") {
      const note = (p["decline_note"] as string) ?? (p["message"] as string) ?? item.title;
      const ok = await copyText(note);
      toast[ok ? "success" : "error"](ok ? "Message copied — paste it to the organizer." : "Copy failed.");
      if (ok) await resolve(item, "done");
      return;
    }
    await resolve(item, "done");
  };

  if (!items.length) {
    return (
      <section className="rounded-2xl border border-border bg-card/40 p-5 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-primary" />
        <div>
          <div className="text-sm font-semibold">No interventions needed right now</div>
          <p className="text-xs text-muted-foreground">
            Your next two weeks look defensible{resolvedCount > 0 ? ` — ${resolvedCount} action${resolvedCount === 1 ? "" : "s"} handled so far.` : "."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card/60 to-transparent p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-primary">Action Center</span>
        <span className="text-[11px] text-muted-foreground">
          {items.length} action{items.length === 1 ? "" : "s"} worth taking this fortnight
        </span>
        {resolvedCount > 0 && (
          <span className="ml-auto text-[11px] text-muted-foreground inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-primary" /> {resolvedCount} handled
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-2 2xl:grid-cols-3 gap-3">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const Icon = ICONS[item.kind] ?? Shield;
            return (
              <motion.article key={item.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                className="rounded-xl border border-border bg-background/80 p-4 flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${
                    item.severity === "high"
                      ? "bg-[hsl(var(--warm-red))]/15 text-[hsl(var(--warm-red))]"
                      : "bg-primary/10 text-primary"
                  }`}>
                    <Icon className="w-3 h-3" /> {KIND_LABEL[item.kind] ?? item.kind}
                  </span>
                  {item.expected_delta > 0 && (
                    <span className="text-[10px] text-muted-foreground">~{item.expected_delta} pts off that day</span>
                  )}
                  {item.severity === "high" && <AlertTriangle className="w-3.5 h-3.5 text-[hsl(var(--warm-red))] ml-auto" />}
                </div>

                <h4 className="text-sm font-semibold leading-snug">{item.title}</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{item.evidence}</p>
                {typeof item.payload?.["local_time"] === "string" && (
                  <p className="text-[11px] font-mono text-foreground">{item.payload["local_time"] as string}</p>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                  <button type="button" disabled={pending === item.id} onClick={() => primary(item)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-60">
                    {item.kind === "defend_focus" || item.kind === "add_buffer"
                      ? <CalendarPlus className="w-3.5 h-3.5" />
                      : item.kind === "pattern" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                    {item.action_label}
                  </button>
                  {item.kind !== "pattern" && (
                    <button type="button" disabled={pending === item.id} onClick={() => resolve(item, "snoozed")}
                      className="text-xs px-2.5 py-2 rounded-lg border border-border hover:bg-secondary">Snooze</button>
                  )}
                  <button type="button" disabled={pending === item.id} onClick={() => resolve(item, "dismissed")}
                    className="text-xs px-2.5 py-2 rounded-lg text-muted-foreground hover:text-foreground">Dismiss</button>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Headroom reads your calendar but never edits it — focus blocks and buffers download as a calendar file you add yourself.
      </p>
      <span className="sr-only">{email}</span>
    </section>
  );
}
