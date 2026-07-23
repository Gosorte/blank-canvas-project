
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
