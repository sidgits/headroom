-- Add user_id to assessment_completions for linking signed-in users to their results
ALTER TABLE public.assessment_completions
ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS idx_assessment_completions_user_id ON public.assessment_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_completions_email ON public.assessment_completions(lower(email));

-- Enable RLS so signed-in users can read their own completions (by user_id OR matching email)
ALTER TABLE public.assessment_completions ENABLE ROW LEVEL SECURITY;

-- Allow users to view completions linked to them by user_id or email
DROP POLICY IF EXISTS "Users can view their own completions" ON public.assessment_completions;
CREATE POLICY "Users can view their own completions"
ON public.assessment_completions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR (email IS NOT NULL AND lower(email) = lower((auth.jwt() ->> 'email')))
);