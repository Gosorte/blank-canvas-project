
-- Tabela de Transportadoras
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

-- Tabela de Vendedores / Representantes
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
