DROP POLICY "Allow anonymous reads" ON assessment_completions;

CREATE POLICY "Service role reads only" ON assessment_completions
  FOR SELECT USING (auth.role() = 'service_role');