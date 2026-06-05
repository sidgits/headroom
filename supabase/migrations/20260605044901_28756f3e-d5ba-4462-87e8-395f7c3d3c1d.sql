ALTER TABLE public.assessment_completions
ADD COLUMN IF NOT EXISTS result_data jsonb;