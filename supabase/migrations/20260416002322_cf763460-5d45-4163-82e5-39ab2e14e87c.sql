-- Remove the non-functional SELECT policy on assessment_completions
-- (service_role bypasses RLS entirely, so this policy targeting 'public' role with auth.role()='service_role' never works)
DROP POLICY IF EXISTS "Service role reads only" ON public.assessment_completions;