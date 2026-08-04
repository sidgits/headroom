DROP POLICY IF EXISTS "Anyone can register early interest" ON public.early_interest_registrations;

CREATE POLICY "Public can submit valid early interest"
ON public.early_interest_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(name)) BETWEEN 1 AND 100
  AND length(btrim(company)) BETWEEN 1 AND 150
  AND length(btrim(email)) BETWEEN 5 AND 254
  AND email ~* '^[A-Za-z0-9._%%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND lower(split_part(email, '@', 2)) NOT IN (
    'gmail.com','yahoo.com','yahoo.co.in','hotmail.com','outlook.com','live.com',
    'aol.com','icloud.com','me.com','mac.com','proton.me','protonmail.com',
    'gmx.com','mail.com','yandex.com','zoho.com','rediffmail.com','msn.com',
    'ymail.com','googlemail.com','pm.me','tutanota.com','fastmail.com'
  )
);