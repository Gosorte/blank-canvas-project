
-- =====================
-- CRM TABLES
-- =====================

-- Leads / Oportunidades
CREATE TABLE public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  cliente_id uuid REFERENCES public.clientes(id),
  nome text NOT NULL,
  email text,
  telefone text,
  whatsapp text,
  origem text NOT NULL DEFAULT 'balcao',
  tipo text NOT NULL DEFAULT 'balcao',
  setor text,
  status_funil text NOT NULL DEFAULT 'novo',
  valor_estimado numeric NOT NULL DEFAULT 0,
  motivo_perda text,
  observacoes text,
  responsavel_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Atividades do CRM
CREATE TABLE public.crm_atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  descricao text NOT NULL,
  data_agendamento timestamptz,
  concluida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Arquivos aprovados do cliente (histórico de ativos para reimpressão)
CREATE TABLE public.crm_arquivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id),
  nome_arquivo text NOT NULL,
  arquivo_url text NOT NULL,
  tipo_produto text,
  especificacoes jsonb DEFAULT '{}'::jsonb,
  aprovado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- E-COMMERCE TABLES
-- =====================

-- Pedidos da loja virtual
CREATE TABLE public.loja_pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  cliente_id uuid REFERENCES public.clientes(id),
  numero_pedido serial,
  status text NOT NULL DEFAULT 'pendente',
  valor_total numeric NOT NULL DEFAULT 0,
  forma_pagamento text,
  observacoes text,
  op_id uuid REFERENCES public.ordens_producao(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Itens do pedido
CREATE TABLE public.loja_pedido_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.loja_pedidos(id) ON DELETE CASCADE,
  produto_id uuid REFERENCES public.produtos(id),
  produto_nome text NOT NULL,
  quantidade integer NOT NULL DEFAULT 1,
  especificacoes jsonb DEFAULT '{}'::jsonb,
  valor_unitario numeric NOT NULL DEFAULT 0,
  valor_total numeric NOT NULL DEFAULT 0,
  arquivo_url text,
  status_arquivo text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- RLS POLICIES
-- =====================

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_arquivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loja_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loja_pedido_itens ENABLE ROW LEVEL SECURITY;

-- CRM Leads
CREATE POLICY "Authenticated read crm_leads" ON public.crm_leads FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage crm_leads" ON public.crm_leads FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- CRM Atividades
CREATE POLICY "Authenticated read crm_atividades" ON public.crm_atividades FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage crm_atividades" ON public.crm_atividades FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- CRM Arquivos
CREATE POLICY "Authenticated read crm_arquivos" ON public.crm_arquivos FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage crm_arquivos" ON public.crm_arquivos FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Loja Pedidos
CREATE POLICY "Authenticated read loja_pedidos" ON public.loja_pedidos FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage loja_pedidos" ON public.loja_pedidos FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Loja Pedido Itens
CREATE POLICY "Authenticated read loja_pedido_itens" ON public.loja_pedido_itens FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage loja_pedido_itens" ON public.loja_pedido_itens FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Storage bucket for CRM files
INSERT INTO storage.buckets (id, name, public) VALUES ('crm-arquivos', 'crm-arquivos', true);

-- Storage policies for crm-arquivos bucket
CREATE POLICY "Authenticated users can view crm files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'crm-arquivos' AND (SELECT is_approved(auth.uid())));
CREATE POLICY "Superadmin can upload crm files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'crm-arquivos' AND (SELECT has_role(auth.uid(), 'superadmin'::app_role)));
CREATE POLICY "Superadmin can delete crm files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'crm-arquivos' AND (SELECT has_role(auth.uid(), 'superadmin'::app_role)));
