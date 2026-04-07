
CREATE TABLE public.assessment_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL,
  archetype_id TEXT NOT NULL,
  archetype_name TEXT NOT NULL,
  ip_address TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assessment_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON public.assessment_completions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous reads" ON public.assessment_completions
  FOR SELECT USING (true);
