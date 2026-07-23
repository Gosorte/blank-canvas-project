-- Add unified cadastro columns to clientes
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS roles text[] NOT NULL DEFAULT '{cliente}'::text[],
  ADD COLUMN IF NOT EXISTS origem text DEFAULT 'balcao',
  ADD COLUMN IF NOT EXISTS segmento text,
  ADD COLUMN IF NOT EXISTS razao_social text,
  ADD COLUMN IF NOT EXISTS contato_nome text;

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  credit_account_id uuid NOT NULL REFERENCES public.customer_credits(id) ON DELETE CASCADE,
  tipo_transacao text NOT NULL DEFAULT 'credito',
  valor numeric NOT NULL DEFAULT 0,
  descricao text,
  saldo_apos numeric NOT NULL DEFAULT 0,
  usuario_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read credit_transactions"
  ON public.credit_transactions FOR SELECT TO authenticated
  USING (is_approved(auth.uid()));

CREATE POLICY "Operador insert credit_transactions"
  ON public.credit_transactions FOR INSERT TO authenticated
  WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Superadmin manage credit_transactions"
  ON public.credit_transactions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Create recommendation_rules table
CREATE TABLE IF NOT EXISTS public.recommendation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tipo_regra text NOT NULL DEFAULT 'history',
  produto_origem text,
  produto_sugerido text NOT NULL,
  segmento text,
  prioridade integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recommendation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read recommendation_rules"
  ON public.recommendation_rules FOR SELECT TO authenticated
  USING (is_approved(auth.uid()));

CREATE POLICY "Admin manage recommendation_rules"
  ON public.recommendation_rules FOR ALL TO authenticated
  USING (is_tenant_admin(auth.uid()) OR has_role(auth.uid(), 'superadmin'::app_role))
  WITH CHECK (is_tenant_admin(auth.uid()) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_clientes_roles ON public.clientes USING GIN(roles);
CREATE INDEX IF NOT EXISTS idx_clientes_origem ON public.clientes(origem);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_cliente ON public.credit_transactions(cliente_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_account ON public.credit_transactions(credit_account_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_rules_tenant ON public.recommendation_rules(tenant_id);