UPDATE public.assessment_completions ac SET user_id = u.id
FROM auth.users u WHERE ac.user_id IS NULL AND lower(ac.email) = lower(u.email);

UPDATE public.dashboard_checkins dc SET user_id = u.id
FROM auth.users u WHERE dc.user_id IS NULL AND lower(dc.email) = lower(u.email);

UPDATE public.subscribers s SET user_id = u.id
FROM auth.users u WHERE s.user_id IS NULL AND lower(s.email) = lower(u.email);