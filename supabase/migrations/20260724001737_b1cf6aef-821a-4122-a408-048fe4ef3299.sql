-- MIGRATION 20260319085429_7eab05cc-f120-4948-ae13-00b99653fc99.sql

-- Catálogo de papéis (Offset + Digital)
CREATE TABLE public.papeis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'offset',
  gramatura integer NOT NULL DEFAULT 75,
  formato text,
  largura_cm numeric DEFAULT 0,
  altura_cm numeric DEFAULT 0,
  custo_folha numeric NOT NULL DEFAULT 0,
  custo_kg numeric DEFAULT 0,
  estoque_atual numeric DEFAULT 0,
  estoque_minimo numeric DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.papeis TO authenticated;
GRANT ALL ON public.papeis TO service_role;
ALTER TABLE public.papeis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read papeis" ON public.papeis FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage papeis" ON public.papeis FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Catálogo de substratos (Comunicação Visual)
CREATE TABLE public.substratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  custo_m2 numeric NOT NULL DEFAULT 0,
  largura_max_m numeric DEFAULT 0,
  estoque_m2 numeric DEFAULT 0,
  estoque_minimo_m2 numeric DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.substratos TO authenticated;
GRANT ALL ON public.substratos TO service_role;
ALTER TABLE public.substratos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read substratos" ON public.substratos FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage substratos" ON public.substratos FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Catálogo de acabamentos (todos os módulos)
CREATE TABLE public.acabamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo_modulo text NOT NULL,
  tipo_cobranca text NOT NULL DEFAULT 'unidade',
  custo_unitario numeric NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acabamentos TO authenticated;
GRANT ALL ON public.acabamentos TO service_role;
ALTER TABLE public.acabamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read acabamentos" ON public.acabamentos FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage acabamentos" ON public.acabamentos FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Clientes
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo_pessoa text NOT NULL DEFAULT 'fisica',
  cpf_cnpj text,
  email text,
  telefone text,
  whatsapp text,
  endereco text,
  cidade text,
  estado text,
  cep text,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read clientes" ON public.clientes FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage clientes" ON public.clientes FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Fornecedores
CREATE TABLE public.fornecedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  razao_social text NOT NULL,
  nome_fantasia text,
  cnpj text,
  email text,
  telefone text,
  contato_nome text,
  endereco text,
  cidade text,
  estado text,
  categorias text[],
  condicao_pagamento text,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedores TO authenticated;
GRANT ALL ON public.fornecedores TO service_role;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read fornecedores" ON public.fornecedores FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage fornecedores" ON public.fornecedores FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Estoque unificado
CREATE TABLE public.estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  categoria text NOT NULL,
  unidade text NOT NULL DEFAULT 'un',
  quantidade numeric NOT NULL DEFAULT 0,
  quantidade_minima numeric NOT NULL DEFAULT 0,
  custo_unitario numeric NOT NULL DEFAULT 0,
  fornecedor_id uuid REFERENCES public.fornecedores(id),
  localizacao text,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque TO authenticated;
GRANT ALL ON public.estoque TO service_role;
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read estoque" ON public.estoque FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage estoque" ON public.estoque FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Movimentações de estoque
CREATE TABLE public.estoque_movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  estoque_id uuid NOT NULL REFERENCES public.estoque(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  quantidade numeric NOT NULL,
  motivo text,
  referencia_id uuid,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque_movimentacoes TO authenticated;
GRANT ALL ON public.estoque_movimentacoes TO service_role;
ALTER TABLE public.estoque_movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read movimentacoes" ON public.estoque_movimentacoes FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage movimentacoes" ON public.estoque_movimentacoes FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Ordens de produção
CREATE TABLE public.ordens_producao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  numero_op serial,
  cliente_id uuid REFERENCES public.clientes(id),
  setor text NOT NULL,
  status text NOT NULL DEFAULT 'aguardando',
  prioridade text NOT NULL DEFAULT 'normal',
  produto_nome text NOT NULL,
  especificacoes jsonb DEFAULT '{}',
  quantidade integer NOT NULL DEFAULT 1,
  valor_total numeric NOT NULL DEFAULT 0,
  data_entrega date,
  observacoes text,
  arquivo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordens_producao TO authenticated;
GRANT ALL ON public.ordens_producao TO service_role;
ALTER TABLE public.ordens_producao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read OPs" ON public.ordens_producao FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage OPs" ON public.ordens_producao FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Histórico de status da OP
CREATE TABLE public.op_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id uuid NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
  status_anterior text,
  status_novo text NOT NULL,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.op_historico TO authenticated;
GRANT ALL ON public.op_historico TO service_role;
ALTER TABLE public.op_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read op_historico" ON public.op_historico FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage op_historico" ON public.op_historico FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Contas a pagar
CREATE TABLE public.contas_pagar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  fornecedor_id uuid REFERENCES public.fornecedores(id),
  descricao text NOT NULL,
  valor numeric NOT NULL DEFAULT 0,
  data_vencimento date NOT NULL,
  data_pagamento date,
  status text NOT NULL DEFAULT 'pendente',
  categoria text,
  forma_pagamento text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contas_pagar TO authenticated;
GRANT ALL ON public.contas_pagar TO service_role;
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read contas_pagar" ON public.contas_pagar FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage contas_pagar" ON public.contas_pagar FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Contas a receber
CREATE TABLE public.contas_receber (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id),
  op_id uuid REFERENCES public.ordens_producao(id),
  descricao text NOT NULL,
  valor numeric NOT NULL DEFAULT 0,
  data_vencimento date NOT NULL,
  data_recebimento date,
  status text NOT NULL DEFAULT 'pendente',
  forma_pagamento text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contas_receber TO authenticated;
GRANT ALL ON public.contas_receber TO service_role;
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read contas_receber" ON public.contas_receber FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage contas_receber" ON public.contas_receber FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Campos adicionais em produtos
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS cores_frente integer DEFAULT 0;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS cores_verso integer DEFAULT 0;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS papel_id uuid REFERENCES public.papeis(id);
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS substrato_id uuid REFERENCES public.substratos(id);
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS dpi integer DEFAULT 720;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS area_minima_m2 numeric DEFAULT 0;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS pecas_por_folha integer DEFAULT 1;

-- Realtime para OPs e estoque
ALTER PUBLICATION supabase_realtime ADD TABLE public.ordens_producao;
ALTER PUBLICATION supabase_realtime ADD TABLE public.estoque;

-- MIGRATION 20260319092232_0a3966aa-d4d1-4276-a340-9068f2e74e13.sql

-- CRM Leads
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_leads TO authenticated;
GRANT ALL ON public.crm_leads TO service_role;

-- CRM Atividades
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_atividades TO authenticated;
GRANT ALL ON public.crm_atividades TO service_role;

-- CRM Arquivos
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_arquivos TO authenticated;
GRANT ALL ON public.crm_arquivos TO service_role;

-- Loja Pedidos
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loja_pedidos TO authenticated;
GRANT ALL ON public.loja_pedidos TO service_role;

-- Loja Pedido Itens
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loja_pedido_itens TO authenticated;
GRANT ALL ON public.loja_pedido_itens TO service_role;

-- RLS Policies CRM / Loja
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_arquivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loja_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loja_pedido_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read crm_leads" ON public.crm_leads FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage crm_leads" ON public.crm_leads FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Authenticated read crm_atividades" ON public.crm_atividades FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage crm_atividades" ON public.crm_atividades FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Authenticated read crm_arquivos" ON public.crm_arquivos FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage crm_arquivos" ON public.crm_arquivos FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Authenticated read loja_pedidos" ON public.loja_pedidos FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage loja_pedidos" ON public.loja_pedidos FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Authenticated read loja_pedido_itens" ON public.loja_pedido_itens FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage loja_pedido_itens" ON public.loja_pedido_itens FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));
