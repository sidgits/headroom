DROP POLICY IF EXISTS "Anyone can read corporate domains" ON public.corporate_domains;
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='corporate_domains' LOOP
    EXECUTE format('DROP POLICY %I ON public.corporate_domains', p.policyname);
  END LOOP;
END $$;
REVOKE ALL ON public.corporate_domains FROM anon;
REVOKE ALL ON public.corporate_domains FROM authenticated;
GRANT ALL ON public.corporate_domains TO service_role;
CREATE POLICY "service role only" ON public.corporate_domains FOR ALL TO service_role USING (true) WITH CHECK (true);