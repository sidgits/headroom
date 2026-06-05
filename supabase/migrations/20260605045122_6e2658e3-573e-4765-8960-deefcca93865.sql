
-- assessment_completions: block UPDATE/DELETE for clients
CREATE POLICY "Block client updates to assessment_completions"
ON public.assessment_completions FOR UPDATE
TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Block client deletes from assessment_completions"
ON public.assessment_completions FOR DELETE
TO anon, authenticated USING (false);

-- signin_logs: block all client writes
CREATE POLICY "Block client inserts to signin_logs"
ON public.signin_logs FOR INSERT
TO anon, authenticated WITH CHECK (false);

CREATE POLICY "Block client updates to signin_logs"
ON public.signin_logs FOR UPDATE
TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Block client deletes from signin_logs"
ON public.signin_logs FOR DELETE
TO anon, authenticated USING (false);

-- subscribers: block all client writes
CREATE POLICY "Block client inserts to subscribers"
ON public.subscribers FOR INSERT
TO anon, authenticated WITH CHECK (false);

CREATE POLICY "Block client updates to subscribers"
ON public.subscribers FOR UPDATE
TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Block client deletes from subscribers"
ON public.subscribers FOR DELETE
TO anon, authenticated USING (false);
