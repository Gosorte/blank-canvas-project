
-- =============================================
-- CATÁLOGOS BASE DO ERP
-- =============================================

-- Catálogo de papéis (Offset + Digital)
CREATE TABLE public.papeis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL, -- ex: 'Couchê 150g', 'Offset 75g'
  tipo text NOT NULL DEFAULT 'offset', -- 'offset', 'digital'
  gramatura integer NOT NULL DEFAULT 75, -- g/m²
  formato text, -- ex: '66x96', 'SRA3', 'A3'
  largura_cm numeric DEFAULT 0,
  altura_cm numeric DEFAULT 0,
  custo_folha numeric NOT NULL DEFAULT 0, -- custo por folha
  custo_kg numeric DEFAULT 0, -- alternativa: custo por kg
  estoque_atual numeric DEFAULT 0, -- folhas ou kg disponíveis
  estoque_minimo numeric DEFAULT 0, -- alerta
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.papeis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read papeis" ON public.papeis FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage papeis" ON public.papeis FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Catálogo de substratos (Comunicação Visual)
CREATE TABLE public.substratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL, -- ex: 'Lona 440g', 'Adesivo Vinil', 'Tecido', 'Backlight'
  custo_m2 numeric NOT NULL DEFAULT 0,
  largura_max_m numeric DEFAULT 0, -- largura máxima da bobina
  estoque_m2 numeric DEFAULT 0,
  estoque_minimo_m2 numeric DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.substratos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read substratos" ON public.substratos FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage substratos" ON public.substratos FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Catálogo de acabamentos (todos os módulos)
CREATE TABLE public.acabamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL, -- ex: 'Laminação Fosca', 'Verniz UV', 'Ilhós', 'Corte/Vinco'
  tipo_modulo text NOT NULL, -- 'offset', 'digital', 'visual'
  tipo_cobranca text NOT NULL DEFAULT 'unidade', -- 'unidade', 'folha', 'metro_linear', 'm2', 'fixo'
  custo_unitario numeric NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.acabamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read acabamentos" ON public.acabamentos FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage acabamentos" ON public.acabamentos FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- =============================================
-- CADASTROS ERP
-- =============================================

CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo_pessoa text NOT NULL DEFAULT 'fisica', -- 'fisica', 'juridica'
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

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read clientes" ON public.clientes FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage clientes" ON public.clientes FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

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
  categorias text[], -- ex: ['papel','tinta','substrato']
  condicao_pagamento text, -- ex: '30/60/90'
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read fornecedores" ON public.fornecedores FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage fornecedores" ON public.fornecedores FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- =============================================
-- ESTOQUE UNIFICADO DE INSUMOS
-- =============================================

CREATE TABLE public.estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  categoria text NOT NULL, -- 'papel', 'substrato', 'tinta', 'ilhos', 'chapa', 'outros'
  unidade text NOT NULL DEFAULT 'un', -- 'un', 'folha', 'kg', 'm', 'm2', 'litro'
  quantidade numeric NOT NULL DEFAULT 0,
  quantidade_minima numeric NOT NULL DEFAULT 0,
  custo_unitario numeric NOT NULL DEFAULT 0,
  fornecedor_id uuid REFERENCES public.fornecedores(id),
  localizacao text, -- ex: 'Prateleira A3'
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read estoque" ON public.estoque FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage estoque" ON public.estoque FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Movimentações de estoque (entradas/saídas)
CREATE TABLE public.estoque_movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  estoque_id uuid NOT NULL REFERENCES public.estoque(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- 'entrada', 'saida', 'ajuste'
  quantidade numeric NOT NULL,
  motivo text, -- 'compra', 'producao', 'perda', 'ajuste_inventario'
  referencia_id uuid, -- OP ou compra que originou
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estoque_movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read movimentacoes" ON public.estoque_movimentacoes FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage movimentacoes" ON public.estoque_movimentacoes FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- =============================================
-- ORDENS DE PRODUÇÃO
-- =============================================

CREATE TABLE public.ordens_producao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  numero_op serial,
  cliente_id uuid REFERENCES public.clientes(id),
  setor text NOT NULL, -- 'offset', 'digital', 'visual'
  status text NOT NULL DEFAULT 'aguardando', -- 'aguardando', 'arte', 'aprovado', 'producao', 'acabamento', 'pronto', 'entregue', 'cancelado'
  prioridade text NOT NULL DEFAULT 'normal', -- 'baixa', 'normal', 'alta', 'urgente'
  produto_nome text NOT NULL,
  especificacoes jsonb DEFAULT '{}', -- detalhes técnicos flexíveis
  quantidade integer NOT NULL DEFAULT 1,
  valor_total numeric NOT NULL DEFAULT 0,
  data_entrega date,
  observacoes text,
  arquivo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ordens_producao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read OPs" ON public.ordens_producao FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage OPs" ON public.ordens_producao FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Histórico de status da OP (para rastreio e notificações)
CREATE TABLE public.op_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id uuid NOT NULL REFERENCES public.ordens_producao(id) ON DELETE CASCADE,
  status_anterior text,
  status_novo text NOT NULL,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.op_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read op_historico" ON public.op_historico FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage op_historico" ON public.op_historico FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- =============================================
-- FINANCEIRO
-- =============================================

CREATE TABLE public.contas_pagar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  fornecedor_id uuid REFERENCES public.fornecedores(id),
  descricao text NOT NULL,
  valor numeric NOT NULL DEFAULT 0,
  data_vencimento date NOT NULL,
  data_pagamento date,
  status text NOT NULL DEFAULT 'pendente', -- 'pendente', 'pago', 'vencido', 'cancelado'
  categoria text, -- 'insumos', 'aluguel', 'salarios', 'equipamentos', 'outros'
  forma_pagamento text, -- 'boleto', 'pix', 'cartao', 'transferencia', 'dinheiro'
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read contas_pagar" ON public.contas_pagar FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage contas_pagar" ON public.contas_pagar FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

CREATE TABLE public.contas_receber (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id),
  op_id uuid REFERENCES public.ordens_producao(id),
  descricao text NOT NULL,
  valor numeric NOT NULL DEFAULT 0,
  data_vencimento date NOT NULL,
  data_recebimento date,
  status text NOT NULL DEFAULT 'pendente', -- 'pendente', 'recebido', 'vencido', 'cancelado'
  forma_pagamento text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read contas_receber" ON public.contas_receber FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage contas_receber" ON public.contas_receber FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- =============================================
-- ATUALIZAR PRODUTOS: adicionar campos faltantes
-- =============================================

ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS cores_frente integer DEFAULT 0;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS cores_verso integer DEFAULT 0;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS papel_id uuid REFERENCES public.papeis(id);
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS substrato_id uuid REFERENCES public.substratos(id);
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS dpi integer DEFAULT 720;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS area_minima_m2 numeric DEFAULT 0;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS pecas_por_folha integer DEFAULT 1;

-- Realtime para OPs (acompanhamento em tempo real)
ALTER PUBLICATION supabase_realtime ADD TABLE public.ordens_producao;
ALTER PUBLICATION supabase_realtime ADD TABLE public.estoque;
