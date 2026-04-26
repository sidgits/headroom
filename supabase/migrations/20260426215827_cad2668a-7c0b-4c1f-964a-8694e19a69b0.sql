CREATE TABLE public.signin_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email text NOT NULL,
  provider text NOT NULL DEFAULT 'google',
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.signin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own signin logs"
ON public.signin_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_signin_logs_user_id ON public.signin_logs(user_id);
CREATE INDEX idx_signin_logs_email ON public.signin_logs(email);