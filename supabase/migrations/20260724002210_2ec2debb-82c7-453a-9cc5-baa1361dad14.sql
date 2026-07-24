-- MIGRATION 20260331015902_a662a946-4903-4e35-9833-0c2279cbc552.sql

CREATE OR REPLACE FUNCTION public.is_tenant_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

DROP POLICY IF EXISTS "Operador update profiles same tenant" ON public.profiles;
CREATE POLICY "Admin update profiles same tenant"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  (is_tenant_admin(auth.uid()) OR has_role(auth.uid(), 'superadmin'::app_role)) AND
  tenant_id = (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid())
)
WITH CHECK (
  (is_tenant_admin(auth.uid()) OR has_role(auth.uid(), 'superadmin'::app_role)) AND
  tenant_id = (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid())
);

DROP POLICY IF EXISTS "Operador insert user_roles same tenant" ON public.user_roles;
CREATE POLICY "Admin insert user_roles same tenant"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  (is_tenant_admin(auth.uid()) OR has_role(auth.uid(), 'superadmin'::app_role)) AND
  user_id IN (SELECT p.id FROM public.profiles p WHERE p.tenant_id = (SELECT p2.tenant_id FROM public.profiles p2 WHERE p2.id = auth.uid()))
);

DROP POLICY IF EXISTS "Operador delete user_roles same tenant" ON public.user_roles;
CREATE POLICY "Admin delete user_roles same tenant"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  (is_tenant_admin(auth.uid()) OR has_role(auth.uid(), 'superadmin'::app_role)) AND
  user_id IN (SELECT p.id FROM public.profiles p WHERE p.tenant_id = (SELECT p2.tenant_id FROM public.profiles p2 WHERE p2.id = auth.uid()))
);

-- MIGRATION 20260331020453_8b3345b3-d09f-4136-ba0c-96a9f5d60e5a.sql

CREATE TABLE public.cargos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  permissoes text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read cargos"
ON public.cargos FOR SELECT TO authenticated
USING (is_approved(auth.uid()));

CREATE POLICY "Admin manage cargos"
ON public.cargos FOR ALL TO authenticated
USING (is_tenant_admin(auth.uid()) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (is_tenant_admin(auth.uid()) OR has_role(auth.uid(), 'superadmin'::app_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cargos TO authenticated;
GRANT ALL ON public.cargos TO service_role;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cargo_id uuid REFERENCES public.cargos(id) ON DELETE SET NULL;

-- MIGRATION 20260407225510_125b8e87-307d-49ad-9779-3611b5dc994e.sql

CREATE TABLE public.transportadoras (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cnpj text,
  telefone text,
  email text,
  contato_nome text,
  cidade text,
  estado text,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transportadoras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read transportadoras"
  ON public.transportadoras FOR SELECT TO authenticated
  USING (is_approved(auth.uid()));

CREATE POLICY "Admin manage transportadoras"
  ON public.transportadoras FOR ALL TO authenticated
  USING (is_tenant_admin(auth.uid()) OR has_role(auth.uid(), 'superadmin'::app_role))
  WITH CHECK (is_tenant_admin(auth.uid()) OR has_role(auth.uid(), 'superadmin'::app_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transportadoras TO authenticated;
GRANT ALL ON public.transportadoras TO service_role;

CREATE TABLE public.vendedores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text,
  telefone text,
  comissao_percentual numeric NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read vendedores"
  ON public.vendedores FOR SELECT TO authenticated
  USING (is_approved(auth.uid()));

CREATE POLICY "Admin manage vendedores"
  ON public.vendedores FOR ALL TO authenticated
  USING (is_tenant_admin(auth.uid()) OR has_role(auth.uid(), 'superadmin'::app_role))
  WITH CHECK (is_tenant_admin(auth.uid()) OR has_role(auth.uid(), 'superadmin'::app_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendedores TO authenticated;
GRANT ALL ON public.vendedores TO service_role;
