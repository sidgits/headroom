
CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_lookup
  ON public.rate_limit_events (action, identifier, created_at DESC);

GRANT ALL ON public.rate_limit_events TO service_role;

ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;

-- Lock down: no client access at all; only service_role (which bypasses RLS) reads/writes.
CREATE POLICY "Block all client access to rate_limit_events"
ON public.rate_limit_events FOR ALL
TO anon, authenticated
USING (false) WITH CHECK (false);
