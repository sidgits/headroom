// Personalized AI Productivity Coach — OpenAI Chat Completions with calendar/CLT context.
// Supports a `propose_schedule_edit` tool call that the UI renders as an action card.
import { corsHeaders, normalizeEmail, serviceClient, isActiveSubscriber } from "../_shared/subscription.ts";

interface ChatMessage { role: "user" | "assistant" | "system" | "tool"; content: string; tool_calls?: unknown; tool_call_id?: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { email, message } = await req.json();
    const e = normalizeEmail(email);
    if (!e) return j({ error: "Invalid email" }, 400);
    if (!message || typeof message !== "string") return j({ error: "Missing message" }, 400);

    const sb = serviceClient();
    if (!(await isActiveSubscriber(sb, e))) return j({ error: "Subscription required" }, 402);

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return j({ error: "OpenAI not configured" }, 500);

    // Persist user message
    await sb.from("coach_messages").insert({ email: e, role: "user", content: message });

    // Build context
    const [profileRes, todayClt, eventsRes, histRes] = await Promise.all([
      sb.from("assessment_completions").select("name, archetype_name, result_data").ilike("email", e).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      sb.from("clt_analyses").select("*").ilike("email", e).order("analysis_date", { ascending: true }).limit(7),
      sb.from("calendar_events").select("id, title, starts_at, ends_at, attendee_count").ilike("email", e).gte("starts_at", new Date().toISOString()).order("starts_at").limit(40),
      sb.from("coach_messages").select("role, content").ilike("email", e).order("created_at", { ascending: false }).limit(20),
    ]);

    const name = (profileRes.data?.name as string)?.split(" ")[0] ?? "there";
    const archetype = profileRes.data?.archetype_name ?? "your archetype";
    const upcoming = (eventsRes.data ?? []).slice(0, 20).map((ev) => ({
      id: ev.id, title: ev.title,
      when: new Date(ev.starts_at).toLocaleString(),
      mins: Math.round((new Date(ev.ends_at).getTime() - new Date(ev.starts_at).getTime()) / 60000),
      people: ev.attendee_count,
    }));
    const clt = (todayClt.data ?? []).map((d) => ({
      date: d.analysis_date, score: d.daily_load_score, intrinsic: d.intrinsic_load,
      extraneous: d.extraneous_load, germane: d.germane_load, summary: d.summary, top: (d.recommendations as string[])?.slice(0, 3),
    }));

    const system = `You are ${name}'s Personalized AI Productivity Coach.

Coaching frame: Sweller's Cognitive Load Theory (intrinsic, extraneous, germane). Be warm, concise, specific. Reference ${name}'s actual schedule and load scores when relevant. Their dominant archetype is "${archetype}".

When recommending a concrete schedule change (defer/shorten/batch/chunk a meeting, add a buffer, protect a focus block), call the tool propose_schedule_edit so the UI can offer an Accept button. Otherwise respond in plain text.

Today: ${new Date().toISOString().slice(0,10)}.

Upcoming events (id, title, when, mins, people):\n${upcoming.map((e) => `- ${e.id} | ${e.title} | ${e.when} | ${e.mins}m | ${e.people}p`).join("\n") || "(none)"}\n
Daily CLT analysis (next 7 days):\n${clt.map((d) => `- ${d.date}: score ${d.score}/100 (${d.summary}); I=${d.intrinsic} E=${d.extraneous} G=${d.germane}; top: ${(d.top || []).join("; ")}`).join("\n") || "(none yet — ask user to connect calendar)"}\n`;

    const history = (histRes.data ?? []).reverse().map((m) => ({ role: m.role, content: m.content })) as ChatMessage[];

    const messages: ChatMessage[] = [
      { role: "system", content: system },
      ...history,
      { role: "user", content: message },
    ];

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-5.5",
        messages,
        tools: [{
          type: "function",
          function: {
            name: "propose_schedule_edit",
            description: "Propose a concrete schedule change the user can accept.",
            parameters: {
              type: "object",
              properties: {
                event_id: { type: "string", description: "ID of the event to change, or 'new' for a new block." },
                action: { type: "string", enum: ["defer", "shorten", "batch", "chunk", "add_buffer", "protect_focus", "make_async", "new_focus_block"] },
                title: { type: "string", description: "Short title for the proposed change." },
                rationale: { type: "string", description: "One-sentence CLT-grounded reason." },
              },
              required: ["event_id", "action", "title", "rationale"],
            },
          },
        }],
        tool_choice: "auto",
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      console.error("openai error", r.status, t);
      return j({ error: "Coach is unavailable. Try again shortly." }, 502);
    }
    const data = await r.json();
    const choice = data.choices?.[0]?.message;
    const reply = choice?.content ?? "";
    const toolCalls = choice?.tool_calls ?? [];

    // Persist assistant reply
    await sb.from("coach_messages").insert({
      email: e, role: "assistant", content: reply,
      parts: toolCalls.length ? { tool_calls: toolCalls } : null,
    });

    return j({
      reply,
      suggestions: toolCalls.map((tc: { function: { arguments: string } }) => {
        try { return JSON.parse(tc.function.arguments); } catch { return null; }
      }).filter(Boolean),
    });
  } catch (err) {
    console.error("coach-chat", err);
    return j({ error: (err as Error).message }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
