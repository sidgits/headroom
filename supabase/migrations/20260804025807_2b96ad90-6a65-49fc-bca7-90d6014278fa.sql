CREATE TABLE public.early_interest_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (email)
);

GRANT INSERT ON public.early_interest_registrations TO anon;
GRANT INSERT ON public.early_interest_registrations TO authenticated;
GRANT SELECT ON public.early_interest_registrations TO service_role;
GRANT ALL ON public.early_interest_registrations TO service_role;

ALTER TABLE public.early_interest_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register early interest"
ON public.early_interest_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Service role can view registrations"
ON public.early_interest_registrations
FOR SELECT
TO service_role
USING (true);