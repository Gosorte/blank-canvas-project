
ALTER TABLE public.customer_credits
  ADD COLUMN IF NOT EXISTS credit_limit numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cashback_percent numeric NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS cashback_release_days integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS cashback_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_vip boolean NOT NULL DEFAULT false;
