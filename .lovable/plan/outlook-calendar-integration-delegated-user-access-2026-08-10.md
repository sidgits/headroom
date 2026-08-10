# Outlook Calendar Integration (delegated user access)

Goal: paid users connect their own Microsoft work or personal account and get the same 60-days-back / 30-days-ahead load analysis the ICS path already produces. Delegated permissions only — no admin-consent-only application permissions.

## What already exists

- `calendar_connections` already has `outlook_access_token`, `outlook_refresh_token`, `outlook_token_expires_at` and a `provider` column.
- `sync-calendar` already contains a working `syncOutlook` (Graph `/me/calendarview`) plus refresh-token logic reading `OUTLOOK_CLIENT_ID` / `OUTLOOK_CLIENT_SECRET`.
- Missing: the OAuth start/callback functions, the secrets, the dashboard UI, and disconnect handling for Outlook.

## 1. Microsoft Entra app registration (your steps)

In the Entra admin center → App registrations → New registration:

- Supported account types: **Accounts in any organizational directory and personal Microsoft accounts** (multitenant + MSA). This is what lets users from any tenant sign in.
- Redirect URI (Web): the callback URL I will give you once the function is deployed — it will be the backend function endpoint `.../functions/v1/outlook-oauth-callback`.
- Certificates & secrets → new client secret (24 months), copy the value once.
- API permissions → Microsoft Graph → **Delegated**: `openid`, `profile`, `email`, `offline_access`, `Calendars.Read`. No admin consent required for these on most tenants; each user consents for themselves.
- Publisher verification: link the app registration to a verified Microsoft Partner Network account so the consent screen shows a verified publisher and tenants with "verified publishers only" policies allow it. (Some tenants still block all third-party consent — those users keep the ICS path.)

Then I request `OUTLOOK_CLIENT_ID` and `OUTLOOK_CLIENT_SECRET` via the secure secret form.

## 2. Backend

- New `outlook-oauth-start`: validates email + paid access (same `hasPaidAccess` helper as Google), builds the `login.microsoftonline.com/common/oauth2/v2.0/authorize` URL with the delegated scopes, `response_type=code`, `prompt=select_account`, and a base64 `state` carrying email / redirectTo / reviewCode.
- New `outlook-oauth-callback`: exchanges code at the `/common` token endpoint, upserts the `outlook` row in `calendar_connections` (preserving an existing refresh token when Microsoft omits one), then 302s back to the dashboard with `?calendar=connected|denied|error`.
- `sync-calendar` hardening for Outlook: follow `@odata.nextLink` pagination, add `Prefer: outlook.timezone="UTC"`, dedupe on `iCalUId`, skip cancelled events, and surface a clear "reconnect Outlook" message on 401/403 — matching what the Google path does.
- `disconnect-calendar`: allow provider `outlook` and clear its token columns.
- Both new functions are public (`verify_jwt = false`) like the Google pair, gated by paid access / review code.

## 3. Frontend

- On the calendar card, replace the "Google / Outlook coming soon" placeholder with a **Connect Outlook Calendar** tile (Microsoft mark, one-click, opens consent, returns to `/dashboard/calendar`).
- Google tile stays review-mode-only until Google verification lands.
- Handle `?calendar=` query params with the existing toast pattern; after `connected`, trigger sync + analyze automatically.
- Connected state shows "Connected via Outlook" with last-synced time and a Disconnect action.

## 4. Error handling for tenant blocks

If consent fails with `AADSTS65001` / `AADSTS90094` (admin consent required by tenant policy), the callback redirects with a specific flag and the UI shows: "Your organisation blocks third-party calendar apps — use the .ics upload instead", with a link to the ICS instructions.

## 5. Build order

1. You create the Entra app; I supply the exact redirect URI after step 2 deploys.
2. Deploy `outlook-oauth-start` + `outlook-oauth-callback` (they read the secrets).
3. Add secrets, harden `sync-calendar`, update `disconnect-calendar`.
4. Calendar page UI + query-param handling.
5. End-to-end test with a personal Microsoft account and, if you have one, a work account.
