ALTER TABLE public.assessment_completions ADD COLUMN IF NOT EXISTS name text;

CREATE TABLE IF NOT EXISTS public.dashboard_checkins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.dashboard_checkins TO authenticated;
GRANT ALL ON public.dashboard_checkins TO service_role;

ALTER TABLE public.dashboard_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checkins"
ON public.dashboard_checkins
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checkins"
ON public.dashboard_checkins
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_dashboard_checkins_user_created
ON public.dashboard_checkins(user_id, created_at DESC);