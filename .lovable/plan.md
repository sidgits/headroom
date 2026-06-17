# Paid Features: Calendar Integration + AI Productivity Coach

Both features unlock after Stripe subscription becomes active. Locked tiles on the dashboard get replaced with full functional tabs.

## 1. Prerequisites you'll need to provide

- **OpenAI API key** — I'll request via secret prompt as `OPENAI_API_KEY`.
- **Google OAuth credentials** — you create them in Google Cloud Console (Calendar API enabled, scope `https://www.googleapis.com/auth/calendar.readonly`, redirect URI = our edge function callback). I'll give you the exact redirect URL once the function is deployed. You'll add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

## 2. Database (new tables)

- `calendar_connections` — user email, provider (`google` | `ics`), encrypted tokens / ics_url, last_synced_at.
- `calendar_events` — connection_id, external_id, title, start, end, attendee_count, is_recurring, source.
- `clt_analyses` — email, date, daily_load_score (0–100), intrinsic/extraneous/germane breakdown, recommendations JSON.
- `coach_conversations` + `coach_messages` — per-email threads with role/content/parts, indexed by email.

All gated by `has_active_subscription` via email lookup in `subscribers`. Edge functions use service role.

## 3. Edge functions

- `google-oauth-start` — returns auth URL with state.
- `google-oauth-callback` — exchanges code, stores refresh token, triggers initial sync.
- `sync-google-calendar` — pulls next 14 days of events using refresh token.
- `ingest-ics` — accepts ICS URL or pasted text, parses with `ical.js`, stores events.
- `analyze-clt` — runs the Sweller-CLT orchestration over events for a date range:
  - **Intrinsic load**: estimated task complexity from event titles + duration.
  - **Extraneous load**: context-switch count, back-to-back meetings, fragmented deep-work gaps, after-hours overflow.
  - **Germane load**: focus blocks ≥ 90min, learning/review blocks, single-topic streaks.
  - Returns daily score + per-block tips (add buffer, batch, chunk, switch modality, defer).
- `coach-chat` — OpenAI Chat Completions (`gpt-4o-mini` default). System prompt injects: user's name, archetype, today's CLT analysis, upcoming events. Supports tool calls: `propose_schedule_edit({event_id, action, rationale})` returned to UI for user accept/reject. Verifies subscription on every call.

## 4. Frontend

- **Dashboard gating**: when `isSubscribed`, the two locked tiles become live cards linking to `/dashboard/calendar` and `/dashboard/coach`.
- **`/dashboard/calendar`**:
  - Connect modal: "Connect Google Calendar" button + "Upload .ics file / Paste subscription URL" tab.
  - Daily strip (next 7 days) with color-coded load score (warm palette — amber/orange/red, no green per project rules; low load = soft cream).
  - Day detail: timeline of events, each with a CLT tip chip; daily summary card with the three load components and top 3 recommendations.
- **`/dashboard/coach`**:
  - Chat UI built with AI Elements (`conversation`, `message`, `prompt-input`, `tool`, `shimmer`).
  - Header: "{FirstName}'s Personalized AI Productivity Coach" with a custom generated coach avatar (not Sparkles).
  - Messages stored per email in `coach_messages`; one rolling conversation (matches existing one-conversation pattern in the app).
  - Tool-call cards: when coach proposes a schedule edit, render an inline card with Accept / Dismiss; Accept marks the suggestion (calendar write-back is out of scope for v1 — read-only + suggestion only).
  - Textarea stays focused; streaming via `streamText` + `toUIMessageStreamResponse`.

## 5. Stripe webhook update

`stripe-webhook` already sets `subscribers.status`. No change needed — dashboard re-queries on mount.

## 6. Out of scope for v1 (call out)

- Writing edits back to Google Calendar (suggestions only).
- Outlook / Apple Calendar (can add later).
- Multi-thread coach history.

## 7. Build order

1. Secrets (`OPENAI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
2. Migration: 4 new tables + RLS + grants.
3. Edge functions: oauth pair, sync, ingest-ics, analyze-clt, coach-chat.
4. Dashboard routes + components, unlock logic.
5. Smoke test: connect ICS → see CLT scores → chat with coach → receive a tool-call suggestion.

Reply **approve** to start, or tell me what to change (e.g. skip Google for now, use Lovable AI instead of OpenAI direct, single coach model only).
