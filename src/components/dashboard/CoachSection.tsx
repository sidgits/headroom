import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import coachAvatar from "@/assets/coach-avatar.jpg";

interface Msg {
  id: string; role: "user" | "assistant" | "system" | "tool";
  content: string | null;
  parts: { tool_calls?: { function: { arguments: string; name: string } }[] } | null;
  created_at: string;
}
interface Suggestion { event_id: string; action: string; title: string; rationale: string }

export default function CoachSection({ email, firstName }: { email: string; firstName: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.functions.invoke("get-coach-data", { body: { email } });
      if (!error) setMessages(data?.messages ?? []);
      setLoading(false);
    })();
  }, [email]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    const optimistic: Msg = { id: `tmp-${Date.now()}`, role: "user", content: text, parts: null, created_at: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);
    setInput("");
    try {
      const { data, error } = await supabase.functions.invoke("coach-chat", { body: { email, message: text } });
      if (error) throw error;
      const reply: Msg = {
        id: `a-${Date.now()}`, role: "assistant",
        content: data?.reply ?? "",
        parts: data?.suggestions?.length ? { tool_calls: data.suggestions.map((s: Suggestion) => ({ function: { name: "propose_schedule_edit", arguments: JSON.stringify(s) } })) } : null,
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, reply]);
    } catch (err) {
      console.error(err);
      toast.error("Coach is unavailable. Try again.");
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
    } finally {
      setSending(false);
      setTimeout(() => taRef.current?.focus(), 50);
    }
  };

  return (
    <section className="rounded-2xl border border-primary/20 bg-card/40 p-4 sm:p-6 space-y-4">
      <header className="flex items-center gap-3 pb-3 border-b border-border">
        <img src={coachAvatar} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/40" />
        <div>
          <p className="text-[11px] uppercase tracking-widest text-primary font-semibold">AI Productivity Coach</p>
          <h2 className="text-lg sm:text-xl font-bold">{firstName}'s Personalized Coach</h2>
        </div>
      </header>

      <div className="max-h-[420px] overflow-y-auto space-y-3 pr-1">
        {loading ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Loading coach…</div>
        ) : messages.length === 0 ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
            Hi {firstName} — I read your archetype, schedule, and Cognitive Load scores. Ask me anything about your week, energy, or a specific meeting.
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} msg={m} />)
        )}
        {sending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="pt-3 border-t border-border">
        <div className="flex items-end gap-2">
          <textarea
            ref={taRef} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={2}
            placeholder="Ask about today's load, a meeting, or how to protect deep work…"
            className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button onClick={send} disabled={sending || !input.trim()}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </section>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  const suggestions: Suggestion[] = msg.parts?.tool_calls?.map((tc) => {
    try { return JSON.parse(tc.function.arguments) as Suggestion; } catch { return null; }
  }).filter(Boolean) as Suggestion[] ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] space-y-2 ${isUser ? "" : "w-full"}`}>
        {msg.content && (
          <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5"
              : "text-foreground"
          }`}>
            {msg.content}
          </div>
        )}
        {suggestions.map((s, i) => <SuggestionCard key={i} s={s} />)}
      </div>
    </motion.div>
  );
}

function SuggestionCard({ s }: { s: Suggestion }) {
  const [accepted, setAccepted] = useState<null | boolean>(null);
  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-3 space-y-2">
      <div className="flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-primary font-bold">Suggested change · {s.action.replace(/_/g, " ")}</p>
          <p className="text-sm font-semibold text-foreground">{s.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{s.rationale}</p>
        </div>
      </div>
      {accepted === null ? (
        <div className="flex gap-2">
          <button onClick={() => { setAccepted(true); toast.success("Saved — apply it in your calendar."); }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground">Accept</button>
          <button onClick={() => setAccepted(false)} className="text-xs px-3 py-1.5 rounded-lg border border-border">Dismiss</button>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground italic">{accepted ? "Accepted." : "Dismissed."}</p>
      )}
    </div>
  );
}
