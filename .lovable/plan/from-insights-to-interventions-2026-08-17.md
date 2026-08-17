# From insights to interventions

Today the calendar analysis produces per-day scores, per-block tips and a few generic "Today's moves" strings. Nothing is trackable, nothing persists, and nothing tells the user *which specific meeting* to act on. This plan turns the analysis into a small set of concrete, dated, dismissible actions plus a weekly intervention report.

## What the user gets

**1. Action Center (top of the calendar workspace)**
A prioritized list of at most 5 live actions, each tied to a real event or day, each with a one-tap outcome:

- *Defend focus* — "Your only 2h open window on Wed is about to be the 3rd day running with no deep work. Block 10:00–11:30." → Add to calendar (downloads a single-event .ics) / Snooze / Dismiss.
- *Decline candidate* — "Thu 15:00 'Weekly Ops Sync' — 8 people, recurring, 60 min, routine agenda. Highest-cost low-value block this week." → Copy decline note (pre-written, polite) / Keep it / Dismiss.
- *Add buffer* — "Tue has 4 back-to-back blocks; the 14:00 handoff has zero reset time." → Add 10-min buffer (.ics) / Dismiss.
- *Shorten / make async* — routine syncs over 30 min, 2h+ multi-person blocks.
- *Pattern alert* — "3rd consecutive week where Toxic Load rose and deep work fell. Last time this pattern ran 4 weeks, your load hit 78." → View trend / Acknowledge.

Each action shows: severity chip (high / moderate), the evidence line (the actual numbers behind it), and the expected effect ("~12 points off Thursday's load").

**2. Pattern watch**
A compact band showing streaks the day view can't reveal: consecutive fragmented days, meeting-hours trend vs. the user's own baseline, deep-work minutes per week, after-hours creep. A pattern only fires as an alert when it's been true for 2+ consecutive weeks — that's the "notice it before it becomes a bad month" signal.

**3. Weekly Intervention Report (PDF)**
One button, "Download this week's plan". Contains: the week's load profile, the 3–5 interventions with rationale, what changed since last week, and the pattern watch. Heady can also produce it in chat — the existing report tool is reused, fed with the same intervention data so the coach and the dashboard never disagree.

**4. Heady acts on the same list**
The coach's system prompt receives the open interventions, so "what should I do about Thursday?" answers with the exact action already on the dashboard, and accepting a suggestion in chat marks the matching intervention done.

## Scope note on calendar writes

Google access is read-only (`calendar.readonly`), which is the scope Google approved. So actions do not silently edit the calendar. Instead each action ends in something the user can do in one click: download a ready-made .ics block, copy a pre-written decline/shorten message, or mark it handled. This keeps the approved scope intact — no re-verification needed.

## Technical plan

**Database** — new `public.interventions` table: `id, email, user_id, kind, severity, target_event_id, target_date, title, evidence, action_label, payload jsonb, expected_delta int, status ('open'|'done'|'dismissed'|'snoozed'), snoozed_until, created_at, resolved_at`, unique on `(email, kind, target_event_id, target_date)` so re-analysis updates rather than duplicates. GRANTs for `authenticated` (select/update own rows by `user_id`/email) and `service_role`; RLS policies scoped to the signed-in user; inserts stay service-role only.

**Engine** — new `supabase/functions/_shared/interventions.ts`, pure functions over the same `EventRow[]` + `DayAnalysis[]` the CLT engine already builds:
- `focusDefense(days)` — finds the best open ≥90-min window on high-intrinsic/low-germane days.
- `declineCandidates(events)` — scores recurring, large, routine, long blocks; returns the single worst per week.
- `bufferGaps(days)` — back-to-back chains with zero reset.
- `patterns(historyDays)` — week-over-week trends on toxic load, deep-work minutes, after-hours count, fragmentation; fires only on 2+ week streaks.
Ranking picks the top 5 by `severity × expected_delta`.

**Wiring**
- `analyze-clt` calls the engine after persisting day rows and upserts interventions, preserving `dismissed`/`snoozed` state for matching keys and expiring stale `open` rows whose event vanished.
- `get-coach-data` returns `interventions` (open + snoozed-due) and `patterns` alongside existing payload.
- New `resolve-intervention` edge function (paid-access guarded) for done / dismiss / snooze.
- `coach-chat` system prompt gains an "Open interventions" block; `propose_schedule_edit` acceptance resolves the matching row.

**Frontend**
- New `src/components/dashboard/ActionCenter.tsx` (action cards + resolve calls + optimistic state) and `src/components/dashboard/PatternWatch.tsx`.
- `src/pages/CalendarPage.tsx`: Action Center becomes the first block under the command bar; "Today's moves" in the right rail becomes day-specific detail rather than the primary surface.
- New `src/lib/icsBlock.ts` — builds a single-event .ics for focus blocks and buffers, client-side download, no new backend.
- Weekly report reuses `src/lib/generateCoachPDF.ts` with an intervention section.

Existing scores, terminology (Core / Toxic / Growth Load), 90-day window and longitudinal view are unchanged.
