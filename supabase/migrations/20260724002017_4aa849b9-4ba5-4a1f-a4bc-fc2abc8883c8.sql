-- MIGRATION 20260325003642_755a7ae6-8f86-4532-b758-e332132a2797.sql

CREATE TABLE public.recebimentos_parciais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  conta_receber_id uuid NOT NULL REFERENCES public.contas_receber(id) ON DELETE CASCADE,
  valor numeric NOT NULL DEFAULT 0,
  forma_pagamento text,
  data_recebimento date NOT NULL DEFAULT CURRENT_DATE,
  observacoes text,
  registrado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recebimentos_parciais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read recebimentos_parciais" ON public.recebimentos_parciais
  FOR SELECT TO authenticated USING (is_approved(auth.uid()));

CREATE POLICY "Operador insert recebimentos_parciais" ON public.recebimentos_parciais
  FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Superadmin manage recebimentos_parciais" ON public.recebimentos_parciais
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recebimentos_parciais TO authenticated;
GRANT ALL ON public.recebimentos_parciais TO service_role;

-- MIGRATION 20260325013253_b3366c8a-d494-47d1-8f3f-1287333807d2.sql

CREATE SEQUENCE IF NOT EXISTS pdv_vendas_numero_venda_seq;

ALTER TABLE public.pdv_vendas 
ADD COLUMN IF NOT EXISTS numero_venda integer NOT NULL DEFAULT nextval('pdv_vendas_numero_venda_seq');

CREATE UNIQUE INDEX IF NOT EXISTS idx_pdv_vendas_tenant_numero 
ON public.pdv_vendas (tenant_id, numero_venda);
