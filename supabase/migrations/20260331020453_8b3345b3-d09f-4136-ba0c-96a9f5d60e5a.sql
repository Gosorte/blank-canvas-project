
-- Cargos per tenant
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

-- Add cargo_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cargo_id uuid REFERENCES public.cargos(id) ON DELETE SET NULL;
