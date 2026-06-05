
-- assessment_completions: writes only via edge functions (service role). Deny client inserts explicitly.
CREATE POLICY "Block client inserts to assessment_completions"
ON public.assessment_completions
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

-- share_clicks: writes only via edge functions (service role). Deny client inserts explicitly.
CREATE POLICY "Block client inserts to share_clicks"
ON public.share_clicks
FOR INSERT
TO anon, authenticated
WITH CHECK (false);
