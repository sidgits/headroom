CREATE TABLE public.interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  user_id uuid,
  kind text NOT NULL,
  severity text NOT NULL DEFAULT 'moderate',
  target_event_id uuid,
  target_date date,
  title text NOT NULL,
  evidence text NOT NULL DEFAULT '',
  action_label text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  expected_delta integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  snoozed_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE UNIQUE INDEX interventions_dedupe_idx
  ON public.interventions (email, kind, COALESCE(target_event_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(target_date, '1970-01-01'::date));

CREATE INDEX interventions_email_status_idx ON public.interventions (email, status);

GRANT SELECT, UPDATE ON public.interventions TO authenticated;
GRANT ALL ON public.interventions TO service_role;

ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own interventions"
  ON public.interventions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

CREATE POLICY "Users update their own interventions"
  ON public.interventions FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  WITH CHECK (user_id = auth.uid() OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

CREATE POLICY "Block client inserts to interventions"
  ON public.interventions FOR INSERT TO anon, authenticated WITH CHECK (false);

CREATE POLICY "Block client deletes from interventions"
  ON public.interventions FOR DELETE TO anon, authenticated USING (false);

CREATE TRIGGER set_interventions_updated_at
  BEFORE UPDATE ON public.interventions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();