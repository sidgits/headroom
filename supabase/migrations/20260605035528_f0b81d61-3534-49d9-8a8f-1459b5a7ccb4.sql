
-- 1. Tighten subscribers SELECT: remove email-based JWT claim matching
DROP POLICY IF EXISTS "Users view own subscription" ON public.subscribers;
CREATE POLICY "Users view own subscription"
ON public.subscribers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2. Tighten assessment_completions SELECT: remove email-based JWT claim matching
DROP POLICY IF EXISTS "Users can view their own completions" ON public.assessment_completions;
CREATE POLICY "Users can view their own completions"
ON public.assessment_completions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3. Lock down writes on assessment_completions (only service_role/edge functions write)
REVOKE INSERT, UPDATE, DELETE ON public.assessment_completions FROM anon, authenticated;

-- 4. Revoke EXECUTE on internal email queue SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;

-- 5. Set immutable search_path on the email queue functions
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
