INSERT INTO public.subscribers (email, status, current_period_end)
VALUES ('sid@headroomapp.co', 'active', '2030-01-01T00:00:00Z')
ON CONFLICT (email) DO UPDATE SET status = 'active', current_period_end = '2030-01-01T00:00:00Z', updated_at = now();