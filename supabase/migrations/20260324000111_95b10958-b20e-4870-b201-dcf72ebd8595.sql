
-- Tabela de avaliações de atendimento
CREATE TABLE public.crm_avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  conversa_id uuid NOT NULL REFERENCES public.crm_conversas(id),
  contato_id uuid REFERENCES public.crm_contatos(id),
  atendente_id uuid,
  nota integer NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.crm_avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read crm_avaliacoes" ON public.crm_avaliacoes
  FOR SELECT TO authenticated USING (is_approved(auth.uid()));

CREATE POLICY "Operador insert crm_avaliacoes" ON public.crm_avaliacoes
  FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Superadmin manage crm_avaliacoes" ON public.crm_avaliacoes
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Index for performance
CREATE INDEX idx_crm_avaliacoes_tenant ON public.crm_avaliacoes(tenant_id);
CREATE INDEX idx_crm_avaliacoes_conversa ON public.crm_avaliacoes(conversa_id);
