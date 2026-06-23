CREATE TABLE public.corporate_domains (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain text NOT NULL UNIQUE,
  company_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.corporate_domains TO anon;
GRANT SELECT ON public.corporate_domains TO authenticated;
GRANT ALL ON public.corporate_domains TO service_role;

ALTER TABLE public.corporate_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read corporate domains"
  ON public.corporate_domains
  FOR SELECT
  USING (true);

CREATE TRIGGER set_corporate_domains_updated_at
  BEFORE UPDATE ON public.corporate_domains
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper: returns true if an email's domain matches a contracted corporate domain
CREATE OR REPLACE FUNCTION public.is_corporate_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.corporate_domains
    WHERE lower(domain) = lower(split_part(_email, '@', 2))
  );
$$;