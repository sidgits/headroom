// Personalized AI Productivity Coach — OpenAI Chat Completions with calendar/CLT context.
// Supports a `propose_schedule_edit` tool call that the UI renders as an action card.
import { corsHeaders, normalizeEmail, serviceClient, hasPaidAccess } from "../_shared/subscription.ts";
import { safeTz, tzDateKey, tzFormat, tzStartOfToday } from "../_shared/tz.ts";

interface ChatMessage { role: "user" | "assistant" | "system" | "tool"; content: string; tool_calls?: unknown; tool_call_id?: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { email, message, reviewCode, timeZone } = await req.json();
    const tz = safeTz(timeZone);
    const e = normalizeEmail(email);
    if (!e) return j({ error: "Invalid email" }, 400);
    if (!message || typeof message !== "string") return j({ error: "Missing message" }, 400);

    const sb = serviceClient();
    if (!(await hasPaidAccess(sb, e, reviewCode))) return j({ error: "Subscription required" }, 402);

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return j({ error: "OpenAI not configured" }, 500);

    // Persist user message
    await sb.from("coach_messages").insert({ email: e, role: "user", content: message });

    // Build context
    const [profileRes, todayClt, eventsRes, histRes] = await Promise.all([
      sb.from("assessment_completions").select("name, archetype_name, result_data").ilike("email", e).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      sb.from("clt_analyses").select("*").ilike("email", e).gte("analysis_date", tzDateKey(new Date(), tz)).order("analysis_date", { ascending: true }).limit(7),
      sb.from("calendar_events").select("id, title, starts_at, ends_at, attendee_count").ilike("email", e).gte("starts_at", tzStartOfToday(tz).toISOString()).order("starts_at").limit(40),
      sb.from("coach_messages").select("role, content").ilike("email", e).order("created_at", { ascending: false }).limit(20),
    ]);

    const name = (profileRes.data?.name as string)?.split(" ")[0] ?? "there";
    const archetype = profileRes.data?.archetype_name ?? "your archetype";
    const upcoming = (eventsRes.data ?? []).slice(0, 20).map((ev) => ({
      id: ev.id, title: ev.title,
      when: tzFormat(ev.starts_at, tz),
      mins: Math.round((new Date(ev.ends_at).getTime() - new Date(ev.starts_at).getTime()) / 60000),
      people: ev.attendee_count,
    }));
    const clt = (todayClt.data ?? []).map((d) => ({
      date: d.analysis_date, score: d.daily_load_score, intrinsic: d.intrinsic_load,
      extraneous: d.extraneous_load, germane: d.germane_load, summary: d.summary, top: (d.recommendations as string[])?.slice(0, 3),
    }));

    const system = `You are ${name}'s Personalized AI Productivity Coach.

Coaching frame: Sweller's Cognitive Load Theory, renamed for users as Core Load (intrinsic), Toxic Load (extraneous) and Growth Load (germane). ALWAYS use the names "Core Load", "Toxic Load" and "Growth Load" in your replies and reports — never the words intrinsic, extraneous or germane. Be warm, concise, specific. Reference ${name}'s actual schedule and load scores when relevant. Their dominant archetype is "${archetype}".

When recommending a concrete schedule change (defer/shorten/batch/chunk a meeting, add a buffer, protect a focus block), call the tool propose_schedule_edit so the UI can offer an Accept button.

When the user asks for a report, PDF, document, written plan or a shareable summary — or when your answer is a substantial multi-part analysis worth keeping — call the tool generate_pdf_report so the UI can offer a Download PDF button. Ground every section in ${name}'s real events and load scores. Keep your text reply short when you generate a report.

Otherwise respond in plain text.

Today: ${tzDateKey(new Date(), tz)} (all times below are in ${tz}, the user's local timezone — always answer in that timezone and never convert to UTC).

Upcoming events (id, title, when, mins, people):\n${upcoming.map((e) => `- ${e.id} | ${e.title} | ${e.when} | ${e.mins}m | ${e.people}p`).join("\n") || "(none)"}\n
Daily CLT analysis (next 7 days):\n${clt.map((d) => `- ${d.date}: score ${d.score}/100 (${d.summary}); Core=${d.intrinsic} Toxic=${d.extraneous} Growth=${d.germane}; top: ${(d.top || []).join("; ")}`).join("\n") || "(none yet — ask user to connect calendar)"}\n`;

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
        }, {
          type: "function",
          function: {
            name: "generate_pdf_report",
            description: "Generate a downloadable PDF coaching report. Call this whenever the user asks for a report, summary document, PDF, or a written plan they can keep or share, and also proactively when a substantial multi-part analysis would be better delivered as a document.",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Report title, e.g. 'Weekly Cognitive Load Review'." },
                summary: { type: "string", description: "One-paragraph executive summary grounded in the user's actual schedule and CLT scores." },
                sections: {
                  type: "array",
                  description: "Ordered report sections. Use 3-6 sections with concrete, data-grounded prose.",
                  items: {
                    type: "object",
                    properties: {
                      heading: { type: "string" },
                      body: { type: "string", description: "Plain prose or dash-prefixed bullet lines. No markdown syntax." },
                    },
                    required: ["heading", "body"],
                  },
                },
              },
              required: ["title", "summary", "sections"],
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

    type TC = { function: { name: string; arguments: string } };
    const parsed = (toolCalls as TC[]).map((tc) => {
      try { return { name: tc.function.name, args: JSON.parse(tc.function.arguments) }; } catch { return null; }
    }).filter(Boolean) as { name: string; args: Record<string, unknown> }[];

    return j({
      reply,
      suggestions: parsed.filter((p) => p.name === "propose_schedule_edit").map((p) => p.args),
      reports: parsed.filter((p) => p.name === "generate_pdf_report").map((p) => p.args),
    });
  } catch (err) {
    console.error("coach-chat", err);
    return j({ error: (err as Error).message }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
