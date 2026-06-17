
-- 1) calendar_connections
CREATE TABLE public.calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('google','ics')),
  google_refresh_token text,
  google_access_token text,
  google_token_expires_at timestamptz,
  ics_url text,
  ics_content text,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX calendar_connections_email_idx ON public.calendar_connections (lower(email));
GRANT ALL ON public.calendar_connections TO service_role;
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON public.calendar_connections FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER set_updated_at_calendar_connections BEFORE UPDATE ON public.calendar_connections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) calendar_events
CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.calendar_connections(id) ON DELETE CASCADE,
  email text NOT NULL,
  external_id text,
  title text,
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  attendee_count integer NOT NULL DEFAULT 0,
  is_recurring boolean NOT NULL DEFAULT false,
  location text,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX calendar_events_email_starts_idx ON public.calendar_events (lower(email), starts_at);
CREATE INDEX calendar_events_connection_idx ON public.calendar_events (connection_id);
GRANT ALL ON public.calendar_events TO service_role;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON public.calendar_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3) clt_analyses
CREATE TABLE public.clt_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  analysis_date date NOT NULL,
  daily_load_score integer NOT NULL,
  intrinsic_load integer NOT NULL DEFAULT 0,
  extraneous_load integer NOT NULL DEFAULT 0,
  germane_load integer NOT NULL DEFAULT 0,
  per_block_tips jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, analysis_date)
);
CREATE INDEX clt_analyses_email_date_idx ON public.clt_analyses (lower(email), analysis_date);
GRANT ALL ON public.clt_analyses TO service_role;
ALTER TABLE public.clt_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON public.clt_analyses FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4) coach_messages
CREATE TABLE public.coach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system','tool')),
  content text,
  parts jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX coach_messages_email_created_idx ON public.coach_messages (lower(email), created_at);
GRANT ALL ON public.coach_messages TO service_role;
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON public.coach_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
