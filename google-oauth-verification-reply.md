# Headroom — Google OAuth Verification: response & reviewer instructions

Project: headroom-494601
App: Headroom (https://www.headroomapp.co)
Requested scope: `https://www.googleapis.com/auth/calendar.readonly` (plus `openid`, `email`, `profile`)

---

## 1. Test credentials / reviewer access

Headroom normally requires a paid subscription for the calendar feature. We have created a
dedicated **reviewer access link** that removes every blocker — no sign-up, no password,
no payment, no phone or credit-card verification:

**Reviewer link:** `https://www.headroomapp.co/reviewer?code=googlecal-verify-2026`

No other credentials are needed. The reviewer identity used by the app is
`appreview@headroomapp.co` (created and maintained by us; you never need to log into it).

You may connect **any** Google account you like at the consent screen — the app only reads
calendar events for the account that grants consent.

## 2. Step-by-step navigation

1. Open `https://www.headroomapp.co/reviewer?code=googlecal-verify-2026` in a normal (non-incognito)
   Chrome window.
2. Click **Enter review mode**. You land on the Calendar Analysis screen.
3. Click **Connect Google Calendar**.
4. Google's account chooser appears → pick a Google account.
5. The **OAuth consent screen** appears, showing the Headroom app name, the developer email,
   and the requested permission: *"See and download any calendar you can access using your
   Google Calendar"* (`calendar.readonly`). Click **Continue / Allow**.
6. You are redirected back to Headroom's Calendar Analysis screen, which now shows
   "Connected via Google".
7. Headroom immediately reads the events in the connected calendar (90-day window: 60 days
   back, 30 days ahead) and renders:
   - a daily **Cognitive Load score** for each day,
   - a per-meeting breakdown into **Core Load / Toxic Load / Growth Load**,
   - burnout-risk pills and per-block recommendations.
8. Open **AI Coach** from the dashboard to see the same calendar-derived data used to answer
   questions about the user's week.
9. Click **Disconnect** on the calendar screen at any time to revoke the stored tokens.

## 3. Scope justification (how each scope is used)

| Scope | Use in Headroom |
| --- | --- |
| `openid`, `email`, `profile` | Identify which Headroom account the calendar belongs to, so events are scored against the right user. |
| `.../auth/calendar.readonly` | Read event start/end times, duration, recurrence, attendee count and location to compute cognitive load and burnout risk. **Read-only** — Headroom never creates, edits or deletes events. |

Limited Use compliance: calendar data is used **only** to provide the user-facing cognitive
load features described above. It is never sold, never transferred to third parties for
advertising, and **never used to train, fine-tune or improve any AI/ML model** (our AI coach
calls are made with model-provider training/retention disabled). Users can disconnect at any
time, which deletes the stored tokens and calendar data.

---

## 4. Demo video — shot-by-shot script (must show the consent screen)

Record at 1280×720 or larger, screen recording of a real browser, no cuts across the OAuth
steps. Total ~90 seconds.

1. **0:00–0:08** — Show the browser address bar with `www.headroomapp.co` clearly visible.
   Say/caption: "This is Headroom, the app requesting verification for project
   headroom-494601."
2. **0:08–0:18** — Open `https://www.headroomapp.co/reviewer?code=googlecal-verify-2026` and click
   **Enter review mode**. Show the Calendar Analysis screen.
3. **0:18–0:25** — Click **Connect Google Calendar**. Keep recording continuously.
4. **0:25–0:35** — **Google account chooser** on `accounts.google.com` — keep it on screen
   for at least 3 seconds; the URL bar must be visible.
5. **0:35–0:55** — **OAuth consent screen**. This is the critical shot. Hold it still for at
   least 8 seconds so that the app name, the developer email, and the requested permission
   line ("See and download any calendar you can access using your Google Calendar") are
   fully legible. Scroll the permission list if it is cut off. Then click **Continue**.
6. **0:55–1:05** — Show the redirect back to Headroom and the "Connected via Google" state.
7. **1:05–1:25** — Scroll through the calendar analysis: daily load scores, per-meeting
   Core/Toxic/Growth breakdown, burnout risk pills — narrating that this is the calendar data
   read via `calendar.readonly`.
8. **1:25–1:35** — Open **AI Coach**, ask "How heavy is my week?", show the answer derived
   from calendar events.
9. **1:35–1:40** — Return to the calendar screen and click **Disconnect** to show revocation.

Recording tips:
- Use the desktop Chrome browser signed out of all other Google accounts; recording the
  consent screen inside a normal Chrome window avoids the "this browser may not be secure"
  block that appears in automated/embedded browsers.
- Do not blur or cut the consent screen; Google requires it in full.
- Upload the video as unlisted on YouTube and paste the link in the verification form.
