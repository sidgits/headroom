ALTER TABLE public.calendar_connections
  ADD COLUMN IF NOT EXISTS outlook_refresh_token text,
  ADD COLUMN IF NOT EXISTS outlook_access_token text,
  ADD COLUMN IF NOT EXISTS outlook_token_expires_at timestamptz;