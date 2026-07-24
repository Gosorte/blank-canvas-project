-- MIGRATION 20260322223312_3f0f6973-651c-4682-b2ae-c7e2303c6fa4.sql

CREATE TABLE public.crm_setores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  cor text NOT NULL DEFAULT '#3b82f6',
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_contatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id),
  nome text,
  numero text NOT NULL,
  email text,
  foto_url text,
  observacoes text,
  tags text[] DEFAULT '{}',
  ultima_conversa_at timestamptz,
  total_conversas integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  whatsapp_id text,
  contato_id uuid REFERENCES public.crm_contatos(id),
  nome_contato text,
  numero_contato text,
  foto_contato text,
  setor_id uuid REFERENCES public.crm_setores(id),
  atendente_id uuid,
  status text NOT NULL DEFAULT 'aguardando',
  ultima_mensagem text,
  ultima_mensagem_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversa_id uuid NOT NULL REFERENCES public.crm_conversas(id) ON DELETE CASCADE,
  whatsapp_msg_id text,
  conteudo text NOT NULL,
  tipo text NOT NULL DEFAULT 'texto',
  direcao text NOT NULL DEFAULT 'entrada',
  enviado_por uuid,
  lido boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_transferencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversa_id uuid NOT NULL REFERENCES public.crm_conversas(id) ON DELETE CASCADE,
  setor_origem_id uuid REFERENCES public.crm_setores(id),
  setor_destino_id uuid REFERENCES public.crm_setores(id),
  atendente_origem_id uuid,
  atendente_destino_id uuid,
  motivo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_mensagem_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  categoria text NOT NULL DEFAULT 'geral',
  conteudo text NOT NULL,
  variaveis text[] DEFAULT '{}',
  atalho text,
  ativo boolean NOT NULL DEFAULT true,
  uso_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_orcamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  numero serial,
  contato_id uuid REFERENCES public.crm_contatos(id),
  conversa_id uuid REFERENCES public.crm_conversas(id),
  cliente_id uuid REFERENCES public.clientes(id),
  criado_por uuid,
  status text NOT NULL DEFAULT 'rascunho',
  subtotal numeric NOT NULL DEFAULT 0,
  desconto_percentual numeric NOT NULL DEFAULT 0,
  desconto_valor numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  validade_dias integer NOT NULL DEFAULT 30,
  prazo_entrega text,
  observacoes text,
  condicoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_orcamento_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid NOT NULL REFERENCES public.crm_orcamentos(id) ON DELETE CASCADE,
  produto_id uuid REFERENCES public.produtos(id),
  descricao text NOT NULL,
  quantidade numeric NOT NULL DEFAULT 1,
  unidade text NOT NULL DEFAULT 'un',
  preco_unitario numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_ai_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  survey_emojis jsonb DEFAULT '[{"emoji":"😡","label":"Ruim","score":1},{"emoji":"😐","label":"Neutro","score":2},{"emoji":"😊","label":"Bom","score":3}]',
  analise_notas jsonb DEFAULT '[1,3]',
  saudacao text DEFAULT 'Olá! 👋 Bem-vindo ao nosso atendimento. Como posso ajudar você hoje?',
  prompt_classificacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

ALTER TABLE public.crm_setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_transferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_mensagem_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_orcamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_ai_config ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_setores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_contatos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_conversas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_mensagens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_transferencias TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_mensagem_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_orcamentos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_orcamento_itens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_ai_config TO authenticated;
GRANT ALL ON public.crm_setores TO service_role;
GRANT ALL ON public.crm_contatos TO service_role;
GRANT ALL ON public.crm_conversas TO service_role;
GRANT ALL ON public.crm_mensagens TO service_role;
GRANT ALL ON public.crm_transferencias TO service_role;
GRANT ALL ON public.crm_mensagem_templates TO service_role;
GRANT ALL ON public.crm_orcamentos TO service_role;
GRANT ALL ON public.crm_orcamento_itens TO service_role;
GRANT ALL ON public.crm_ai_config TO service_role;

CREATE POLICY "Superadmin manage crm_setores" ON public.crm_setores FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin')) WITH CHECK (has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmin manage crm_contatos" ON public.crm_contatos FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin')) WITH CHECK (has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmin manage crm_conversas" ON public.crm_conversas FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin')) WITH CHECK (has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmin manage crm_mensagens" ON public.crm_mensagens FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin')) WITH CHECK (has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmin manage crm_transferencias" ON public.crm_transferencias FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin')) WITH CHECK (has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmin manage crm_mensagem_templates" ON public.crm_mensagem_templates FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin')) WITH CHECK (has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmin manage crm_orcamentos" ON public.crm_orcamentos FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin')) WITH CHECK (has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmin manage crm_orcamento_itens" ON public.crm_orcamento_itens FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin')) WITH CHECK (has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmin manage crm_ai_config" ON public.crm_ai_config FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin')) WITH CHECK (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Authenticated read crm_setores" ON public.crm_setores FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Authenticated read crm_contatos" ON public.crm_contatos FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Authenticated read crm_conversas" ON public.crm_conversas FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Authenticated read crm_mensagens" ON public.crm_mensagens FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Authenticated read crm_transferencias" ON public.crm_transferencias FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Authenticated read crm_mensagem_templates" ON public.crm_mensagem_templates FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Authenticated read crm_orcamentos" ON public.crm_orcamentos FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Authenticated read crm_orcamento_itens" ON public.crm_orcamento_itens FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Authenticated read crm_ai_config" ON public.crm_ai_config FOR SELECT TO authenticated USING (is_approved(auth.uid()));

CREATE POLICY "Operador insert crm_conversas" ON public.crm_conversas FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Operador update crm_conversas" ON public.crm_conversas FOR UPDATE TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Operador insert crm_mensagens" ON public.crm_mensagens FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Operador update crm_mensagens" ON public.crm_mensagens FOR UPDATE TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Operador insert crm_transferencias" ON public.crm_transferencias FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Operador insert crm_orcamentos" ON public.crm_orcamentos FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Operador update crm_orcamentos" ON public.crm_orcamentos FOR UPDATE TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Operador insert crm_orcamento_itens" ON public.crm_orcamento_itens FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Operador update crm_orcamento_itens" ON public.crm_orcamento_itens FOR UPDATE TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Operador delete crm_orcamento_itens" ON public.crm_orcamento_itens FOR DELETE TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Operador insert crm_contatos" ON public.crm_contatos FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Operador update crm_contatos" ON public.crm_contatos FOR UPDATE TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Operador manage crm_mensagem_templates" ON public.crm_mensagem_templates FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));
CREATE POLICY "Operador update crm_mensagem_templates" ON public.crm_mensagem_templates FOR UPDATE TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_conversas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_mensagens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_contatos;

-- MIGRATION 20260322235829_17454c43-ffa9-4406-8b08-a6f819d30bbd.sql

CREATE TABLE public.maquinas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo_modulo text NOT NULL,
  marca text,
  modelo text,
  capacidade text,
  custo_hora numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ativa',
  localizacao text,
  observacoes text,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.processos_producao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo_modulo text NOT NULL,
  descricao text,
  ordem integer NOT NULL DEFAULT 0,
  tempo_estimado_min integer DEFAULT 0,
  custo_processo numeric NOT NULL DEFAULT 0,
  requer_maquina boolean NOT NULL DEFAULT false,
  maquina_id uuid REFERENCES public.maquinas(id),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.maquinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos_producao ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.maquinas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.processos_producao TO authenticated;
GRANT ALL ON public.maquinas TO service_role;
GRANT ALL ON public.processos_producao TO service_role;

CREATE POLICY "Authenticated read maquinas" ON public.maquinas FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage maquinas" ON public.maquinas FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Authenticated read processos" ON public.processos_producao FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage processos" ON public.processos_producao FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));
