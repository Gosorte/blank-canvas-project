
-- 1) Allow operators to update their own tenant
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

-- 2) Allow operators to update profiles in their own tenant
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

-- 3) Allow operators to manage user_roles for users in their tenant
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

-- 4) LGPD consent tracking table
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

-- Anyone can insert consent (including anonymous visitors)
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

-- Authenticated operators can read
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
