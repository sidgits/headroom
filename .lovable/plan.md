

# Headroom -- Full Product Build Plan

A mobile-first cognitive load assessment platform with user accounts, check-ins, calendar integration, payments, email, and analytics. 8 phases.

---

## Phase 1: Foundation + Landing + Quiz Flow

- **Brand setup**: Primary #2D6A4F, secondary #E8F5F0, accent #1B4332, Inter font, CSS variables in index.css
- **Landing page**: Hero with headline, vignettes (Sarah/James/Aisha), two CTAs, mobile-first at 390px
- **Role selector**: 5 full-width options, 56px min height, tap advances
- **Disclaimer screen**: Centered paragraph + Start CTA
- **Quiz flow**: 6 questions one-at-a-time, progress bar, 300ms answer feedback, conditional Sprinter check (Q4=B AND Q6=A)
- **State machine**: React state drives screen transitions, no URL routing for quiz

## Phase 2: Scoring Engine + Archetype Content

- **`src/lib/scoring.ts`**: Exact scoring matrix from doc, normalisation formula `(raw - 6) / 12 * 10`
- **`src/lib/archetypes.ts`**: 11 classification rules in priority order, Sprinter first, Conductor fallback
- **`src/lib/burnout.ts`**: 7 burnout risk rules (HIGH/MODERATE/LOW with named patterns)
- **`src/data/archetypeContent.ts`**: All 8 archetypes with full 7-layer content: reveal tagline, mirror paragraphs, dimension descriptions, shadow archetype, one unlock, burnout risk content, share card text, return hooks. Role-to-template mapping for output language.

## Phase 3: Result Screen (7-Layer Architecture)

- Layer 1 -- The Reveal (archetype name 40px+, tagline)
- Layer 2 -- The Mirror (3 paragraphs: at your best / working against you / pattern)
- Layer 3 -- Dimension Bars (E, I, G with score/10 + interpretation)
- Layer 4 -- Shadow Archetype (light green card)
- Layer 5 -- One Unlock (dark green card, white text)
- Layer 6 -- Burnout Risk Signal (color-coded: red HIGH, amber MODERATE, green LOW)
- Layer 7 -- Share + Return hooks

## Phase 4: User Accounts + Supabase

- Enable Lovable Cloud / Supabase
- **Auth**: Email/password signup + login, with protected routes
- **Profiles table**: `id`, `user_id` (FK auth.users), `display_name`, `avatar_url`, `role`, `current_archetype`, `created_at`
- **quiz_responses table**: `id`, `user_id`, `email`, `answers`, `role`, `scores`, `archetype`, `burnout_risk`, `created_at`
- **Email capture screen**: Shown post-quiz, pre-results. Stores to quiz_responses. If logged in, links to user_id.
- Auth pages: Login, Signup, Forgot Password, Reset Password

## Phase 5: Dashboard + Check-In System

- **Daily Pulse**: Single-tap screen (5 options: Full/Good/Stretched/Empty/Disconnected), stores to `daily_pulses` table with timestamp + user_id
- **Weekly Reflection**: 2 questions every Friday, stores to `weekly_reflections` table
- **Monthly Depth Question**: Rotating question, stores to `monthly_reflections` table
- **Dashboard page**: 
  - Current archetype card
  - Headroom trend line (daily pulse history, 7/30 day view)
  - Burnout risk trajectory (longitudinal alerts: 3+ consecutive red/black)
  - Weekly reflection summary
  - Archetype history (retake assessment)
- **Longitudinal burnout alerts**: Flag patterns per doc rules (3+ consecutive Stretched/Empty, 4+ Disconnected)

## Phase 6: Email + Calendar Integration

- **Email (Lovable built-in)**:
  - Set up email domain via Lovable Cloud
  - Result delivery email (archetype summary after quiz)
  - Check-in reminder emails (daily pulse end-of-day, weekly reflection Friday)
  - Burnout alert emails (triggered by longitudinal patterns)
- **Google Calendar**: OAuth via connector gateway, read calendar events, calculate deep work vs meetings ratio, show on dashboard
- **Outlook Calendar**: OAuth via connector gateway, same analysis as Google
- Calendar analysis: Reactive vs intentional time, fragmentation score, mapped per archetype recommendations

## Phase 7: Payments (Stripe) + Premium Features

- Enable Stripe integration
- **Free tier**: Assessment, daily pulse, weekly reflection, share card
- **Premium tier**: Calendar integration, detailed analytics, archetype-specific interventions, historical trend analysis
- Pricing page with toggle, gated features behind subscription check
- Pricing model TBD by user -- Stripe wired with subscription infrastructure ready

## Phase 8: Analytics + Share Card + Polish

- **PostHog**: Quiz funnel tracking (start/complete/drop-off per question), share rate, archetype distribution, D7/D30 retention, free-to-paid conversion
- **Share card**: Fixed 600x400 div, html2canvas PNG download, Web Share API on mobile / copy-link on desktop
- **Mobile QA pass**: 390px width, 56px tap targets, comfortable line heights, keyboard handling, smooth 300ms transitions
- Typography and spacing polish across all screens

---

## Technical Details

- **Routing**: React Router for pages (landing, auth, dashboard, settings). Quiz flow uses React state machine within Index page.
- **Tables**: profiles, quiz_responses, daily_pulses, weekly_reflections, monthly_reflections (all with RLS)
- **User roles table**: Standard pattern per Lovable security rules if admin features needed later
- **Key dependencies**: `html2canvas`, PostHog JS SDK
- **Calendar OAuth**: Google + Outlook via connector gateway (Edge Functions proxy calendar API calls)
- **Email**: Lovable built-in transactional email (no Resend needed despite doc mentioning it)
- **File structure**:

```text
src/
  lib/scoring.ts
  lib/archetypes.ts
  lib/burnout.ts
  data/archetypeContent.ts
  pages/Index.tsx (landing + quiz state machine)
  pages/Auth.tsx (login/signup)
  pages/Dashboard.tsx
  pages/Settings.tsx
  pages/ResetPassword.tsx
  components/
    landing/ (LandingHero, Vignettes)
    quiz/ (RoleSelector, Disclaimer, QuizQuestion, SprintCheck)
    results/ (RevealLayer, MirrorLayer, DimensionBars, ShadowCard, UnlockCard, BurnoutCard, ShareCard)
    checkin/ (DailyPulse, WeeklyReflection, MonthlyDepth)
    dashboard/ (TrendChart, ArchetypeCard, BurnoutTrajectory, CalendarInsights)
    shared/ (ProtectedRoute, Navbar)
```

