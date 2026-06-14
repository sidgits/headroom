CREATE OR REPLACE FUNCTION public.admin_revoke_non_payer_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  affected integer := 0;
BEGIN
  WITH paid AS (
    SELECT user_id FROM public.subscribers
    WHERE status IN ('active','trialing')
      AND (current_period_end IS NULL OR current_period_end > now())
  ),
  del_sessions AS (
    DELETE FROM auth.sessions
    WHERE user_id NOT IN (SELECT user_id FROM paid WHERE user_id IS NOT NULL)
    RETURNING 1
  )
  SELECT count(*) INTO affected FROM del_sessions;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_revoke_non_payer_sessions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_non_payer_sessions() TO service_role;