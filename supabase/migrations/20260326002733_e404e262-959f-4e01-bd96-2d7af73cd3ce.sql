
CREATE TABLE public.pdv_caixa (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  aberto_por uuid NOT NULL,
  aberto_em timestamp with time zone NOT NULL DEFAULT now(),
  fechado_por uuid,
  fechado_em timestamp with time zone,
  valor_abertura numeric NOT NULL DEFAULT 0,
  valor_fechamento numeric,
  total_vendas numeric DEFAULT 0,
  total_recebido numeric DEFAULT 0,
  observacoes_abertura text,
  observacoes_fechamento text,
  status text NOT NULL DEFAULT 'aberto',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pdv_caixa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read pdv_caixa" ON public.pdv_caixa
  FOR SELECT TO authenticated USING (is_approved(auth.uid()));

CREATE POLICY "Operador insert pdv_caixa" ON public.pdv_caixa
  FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Operador update pdv_caixa" ON public.pdv_caixa
  FOR UPDATE TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Superadmin manage pdv_caixa" ON public.pdv_caixa
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));
