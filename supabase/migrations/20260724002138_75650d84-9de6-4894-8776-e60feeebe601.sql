-- MIGRATION 20260330225810_7719a2b1-2285-486a-b7f8-0b762f2a2245.sql

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS cor_primaria text DEFAULT '#3b82f6',
  ADD COLUMN IF NOT EXISTS cor_secundaria text DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS descricao text,
  ADD COLUMN IF NOT EXISTS notif_email_pedido boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_whatsapp_status boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notif_email_orcamento boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

-- MIGRATION 20260331015434_2e6b49b7-b299-4ef2-8545-4a72c2032207.sql

CREATE POLICY "Operador update own tenant"
ON public.tenants
FOR UPDATE
TO authenticated
USING (
  is_approved(auth.uid()) AND
  id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
)
WITH CHECK (
  is_approved(auth.uid()) AND
  id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Operador update profiles same tenant"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  is_approved(auth.uid()) AND
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
)
WITH CHECK (
  is_approved(auth.uid()) AND
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Operador insert user_roles same tenant"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  is_approved(auth.uid()) AND
  user_id IN (SELECT id FROM public.profiles WHERE tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
);

CREATE POLICY "Operador delete user_roles same tenant"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  is_approved(auth.uid()) AND
  user_id IN (SELECT id FROM public.profiles WHERE tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
);

CREATE TABLE public.lgpd_consentimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  session_id text,
  tipo text NOT NULL DEFAULT 'cookies',
  aceito boolean NOT NULL DEFAULT false,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  revogado_em timestamptz
);

ALTER TABLE public.lgpd_consentimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon insert lgpd_consentimentos"
ON public.lgpd_consentimentos
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Auth insert lgpd_consentimentos"
ON public.lgpd_consentimentos
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated read lgpd_consentimentos"
ON public.lgpd_consentimentos
FOR SELECT
TO authenticated
USING (is_approved(auth.uid()));

CREATE POLICY "Superadmin manage lgpd_consentimentos"
ON public.lgpd_consentimentos
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lgpd_consentimentos TO authenticated;
GRANT SELECT, INSERT ON public.lgpd_consentimentos TO anon;
GRANT ALL ON public.lgpd_consentimentos TO service_role;
