
-- =====================================================
-- MÓDULO VENDAS: Tabelas para ERP Sales Management
-- =====================================================

-- 1. Grupos de Produtos (para PDV e Produto Simples)
CREATE TABLE public.product_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  nome text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read product_groups" ON public.product_groups FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage product_groups" ON public.product_groups FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- 2. Produtos Simples (PDV / Vendas - diferente dos produtos de produção)
CREATE TABLE public.produtos_simples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  grupo_id uuid REFERENCES public.product_groups(id),
  codigo text NOT NULL,
  nome text NOT NULL,
  descricao text,
  preco_unitario integer NOT NULL DEFAULT 0,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.produtos_simples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read produtos_simples" ON public.produtos_simples FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage produtos_simples" ON public.produtos_simples FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- 3. Orçamentos ERP (vendas)
CREATE TABLE public.erp_orcamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  numero serial,
  cliente_id uuid REFERENCES public.clientes(id),
  cliente_nome text NOT NULL,
  contato_nome text,
  contato_telefone text,
  contato_email text,
  origem text,
  vendedor text,
  parceiros text,
  valor_total integer NOT NULL DEFAULT 0,
  data_entrega date,
  hora_entrega text,
  tipo_entrega text DEFAULT 'retirada',
  transportadora text,
  status text NOT NULL DEFAULT 'Aberto',
  categoria text NOT NULL DEFAULT 'digital',
  forma_pagamento text,
  observacoes text,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_orcamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read erp_orcamentos" ON public.erp_orcamentos FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Operador insert erp_orcamentos" ON public.erp_orcamentos FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Operador update erp_orcamentos" ON public.erp_orcamentos FOR UPDATE TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage erp_orcamentos" ON public.erp_orcamentos FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- 4. Itens de Orçamento ERP
CREATE TABLE public.erp_orcamento_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid NOT NULL REFERENCES public.erp_orcamentos(id) ON DELETE CASCADE,
  produto_id uuid REFERENCES public.produtos(id),
  produto_simples_id uuid REFERENCES public.produtos_simples(id),
  descricao text NOT NULL,
  quantidade numeric NOT NULL DEFAULT 1,
  preco_unitario integer NOT NULL DEFAULT 0,
  subtotal integer NOT NULL DEFAULT 0,
  categoria text,
  especificacoes jsonb DEFAULT '{}'::jsonb,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_orcamento_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read erp_orcamento_itens" ON public.erp_orcamento_itens FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Operador insert erp_orcamento_itens" ON public.erp_orcamento_itens FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Operador update erp_orcamento_itens" ON public.erp_orcamento_itens FOR UPDATE TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Operador delete erp_orcamento_itens" ON public.erp_orcamento_itens FOR DELETE TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage erp_orcamento_itens" ON public.erp_orcamento_itens FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- 5. Pedidos ERP (vendas confirmadas)
CREATE TABLE public.erp_pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  numero serial,
  orcamento_id uuid REFERENCES public.erp_orcamentos(id),
  cliente_id uuid REFERENCES public.clientes(id),
  cliente_nome text NOT NULL,
  contato_nome text,
  contato_telefone text,
  contato_email text,
  origem text,
  vendedor text,
  parceiros text,
  valor_total integer NOT NULL DEFAULT 0,
  data_entrega date,
  hora_entrega text,
  tipo_entrega text DEFAULT 'retirada',
  transportadora text,
  status text NOT NULL DEFAULT 'Aguardando',
  categoria text NOT NULL DEFAULT 'digital',
  forma_pagamento text,
  observacoes text,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read erp_pedidos" ON public.erp_pedidos FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Operador insert erp_pedidos" ON public.erp_pedidos FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Operador update erp_pedidos" ON public.erp_pedidos FOR UPDATE TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage erp_pedidos" ON public.erp_pedidos FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- 6. Tarefas
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  criado_por uuid,
  titulo text NOT NULL,
  descricao text,
  prioridade text NOT NULL DEFAULT 'media',
  status text NOT NULL DEFAULT 'pendente',
  categoria text NOT NULL DEFAULT 'geral',
  data_vencimento timestamptz,
  hora_vencimento text,
  alarme_ativo boolean NOT NULL DEFAULT false,
  alarme_minutos integer DEFAULT 15,
  pedido_id uuid REFERENCES public.erp_pedidos(id),
  orcamento_id uuid REFERENCES public.erp_orcamentos(id),
  atribuido_para uuid,
  atribuido_por uuid,
  concluido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read tasks" ON public.tasks FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Operador insert tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Operador update tasks" ON public.tasks FOR UPDATE TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Operador delete tasks" ON public.tasks FOR DELETE TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage tasks" ON public.tasks FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- 7. Checklist de Tarefas
CREATE TABLE public.task_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  concluido boolean NOT NULL DEFAULT false,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read task_checklist_items" ON public.task_checklist_items FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Operador manage task_checklist_items" ON public.task_checklist_items FOR ALL TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));

-- 8. Eventos de Calendário
CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  criado_por uuid,
  titulo text NOT NULL,
  descricao text,
  data_evento date NOT NULL,
  hora_inicio text,
  hora_fim text,
  local text,
  categoria text NOT NULL DEFAULT 'geral',
  prioridade text NOT NULL DEFAULT 'media',
  status text NOT NULL DEFAULT 'agendado',
  cor text DEFAULT '#3b82f6',
  concluido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read calendar_events" ON public.calendar_events FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Operador insert calendar_events" ON public.calendar_events FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Operador update calendar_events" ON public.calendar_events FOR UPDATE TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Operador delete calendar_events" ON public.calendar_events FOR DELETE TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage calendar_events" ON public.calendar_events FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- 9. Orçamento Inteligente (Smart Quotes)
CREATE TABLE public.smart_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  criado_por uuid,
  categoria text NOT NULL DEFAULT 'digital',
  cliente_nome text,
  custo_producao numeric NOT NULL DEFAULT 0,
  markup_percentual numeric NOT NULL DEFAULT 50,
  preco_venda numeric NOT NULL DEFAULT 0,
  lucro_liquido numeric NOT NULL DEFAULT 0,
  observacoes text,
  status text NOT NULL DEFAULT 'rascunho',
  -- Digital
  digital_quantidade integer,
  digital_custo_papel numeric,
  digital_custo_clique numeric,
  digital_tipo_clique text,
  digital_lados integer,
  digital_poses integer,
  -- Offset
  offset_tiragem integer,
  offset_custo_ctp numeric,
  offset_tempo_setup numeric,
  offset_custo_hora numeric,
  offset_custo_papel numeric,
  offset_tempo_rodagem numeric,
  -- Comunicação Visual
  cv_largura numeric,
  cv_altura numeric,
  cv_custo_material_m2 numeric,
  cv_custo_acabamento numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.smart_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read smart_quotes" ON public.smart_quotes FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Operador insert smart_quotes" ON public.smart_quotes FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage smart_quotes" ON public.smart_quotes FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- 10. Créditos/Cashback de Clientes
CREATE TABLE public.customer_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id),
  saldo_cashback numeric NOT NULL DEFAULT 0,
  desconto_max_percentual numeric NOT NULL DEFAULT 5,
  total_creditos_usados numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, cliente_id)
);

ALTER TABLE public.customer_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read customer_credits" ON public.customer_credits FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage customer_credits" ON public.customer_credits FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- 11. Autorizações de Desconto (PDV)
CREATE TABLE public.discount_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  codigo text NOT NULL,
  autorizado_por uuid,
  desconto_percentual numeric,
  cliente_id uuid REFERENCES public.clientes(id),
  status text NOT NULL DEFAULT 'pending',
  usado_por uuid,
  usado_em timestamptz,
  valor_desconto numeric DEFAULT 0,
  valor_venda numeric DEFAULT 0,
  expira_em timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_authorizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read discount_authorizations" ON public.discount_authorizations FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Operador insert discount_authorizations" ON public.discount_authorizations FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Operador update discount_authorizations" ON public.discount_authorizations FOR UPDATE TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage discount_authorizations" ON public.discount_authorizations FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Indexes
CREATE INDEX idx_erp_orcamentos_tenant ON public.erp_orcamentos(tenant_id);
CREATE INDEX idx_erp_pedidos_tenant ON public.erp_pedidos(tenant_id);
CREATE INDEX idx_tasks_tenant ON public.tasks(tenant_id);
CREATE INDEX idx_calendar_events_tenant ON public.calendar_events(tenant_id);
CREATE INDEX idx_smart_quotes_tenant ON public.smart_quotes(tenant_id);
CREATE INDEX idx_produtos_simples_tenant ON public.produtos_simples(tenant_id);
CREATE INDEX idx_customer_credits_tenant ON public.customer_credits(tenant_id);
