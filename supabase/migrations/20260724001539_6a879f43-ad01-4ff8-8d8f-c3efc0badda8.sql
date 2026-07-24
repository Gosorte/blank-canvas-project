-- MIGRATION 20260319020246_7c1130e4-c288-4657-8ff4-cbb896b25f43.sql

-- Tabela de Planos
CREATE TABLE public.planos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL DEFAULT 0,
  has_digital BOOLEAN NOT NULL DEFAULT true,
  has_visual BOOLEAN NOT NULL DEFAULT false,
  has_offset BOOLEAN NOT NULL DEFAULT false,
  has_crm_advanced BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planos TO authenticated;
GRANT ALL ON public.planos TO service_role;

-- Tabela de Tenants (Gráficas Assinantes)
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_grafica TEXT NOT NULL,
  plano_id UUID REFERENCES public.planos(id),
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('ativo', 'inadimplente', 'trial', 'suspenso')),
  dominio TEXT,
  pedidos_mes INTEGER NOT NULL DEFAULT 0,
  gmv_mes DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;

-- Tabela de Configuração de Módulos
CREATE TABLE public.module_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  has_offset BOOLEAN NOT NULL DEFAULT false,
  has_digital BOOLEAN NOT NULL DEFAULT true,
  has_visual BOOLEAN NOT NULL DEFAULT false,
  has_crm_advanced BOOLEAN NOT NULL DEFAULT false
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_config TO authenticated;
GRANT ALL ON public.module_config TO service_role;

-- Tabela de Insumos e Preços
CREATE TABLE public.insumos_precos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tipo_modulo TEXT NOT NULL CHECK (tipo_modulo IN ('offset', 'digital', 'visual')),
  nome_insumo TEXT NOT NULL,
  custo_base DECIMAL(10,2) NOT NULL DEFAULT 0,
  markup_padrao DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insumos_precos TO authenticated;
GRANT ALL ON public.insumos_precos TO service_role;

-- RLS: Por enquanto leitura pública para o painel admin (auth será implementado depois)
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insumos_precos ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública temporária (serão restringidas com auth)
CREATE POLICY "Leitura pública de planos" ON public.planos FOR SELECT USING (true);
CREATE POLICY "Leitura pública de tenants" ON public.tenants FOR SELECT USING (true);
CREATE POLICY "Leitura pública de module_config" ON public.module_config FOR SELECT USING (true);
CREATE POLICY "Leitura pública de insumos" ON public.insumos_precos FOR SELECT USING (true);

-- Políticas de escrita pública temporária
CREATE POLICY "Escrita pública de planos" ON public.planos FOR INSERT WITH CHECK (true);
CREATE POLICY "Escrita pública de tenants" ON public.tenants FOR INSERT WITH CHECK (true);
CREATE POLICY "Escrita pública de module_config" ON public.module_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Escrita pública de insumos" ON public.insumos_precos FOR INSERT WITH CHECK (true);

CREATE POLICY "Update planos" ON public.planos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Update tenants" ON public.tenants FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Update module_config" ON public.module_config FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Update insumos" ON public.insumos_precos FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Delete tenants" ON public.tenants FOR DELETE USING (true);
CREATE POLICY "Delete module_config" ON public.module_config FOR DELETE USING (true);
CREATE POLICY "Delete insumos" ON public.insumos_precos FOR DELETE USING (true);

-- MIGRATION 20260319060417_d880417a-ac40-4e28-bec1-386a744c5229.sql

-- Tabela de produtos configuráveis por tenant e módulo
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tipo_modulo TEXT NOT NULL, -- 'digital', 'offset', 'visual'
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  
  -- Configurações comuns
  preco_minimo NUMERIC NOT NULL DEFAULT 0,
  
  -- Digital: custo por clique/folha
  custo_clique NUMERIC DEFAULT 0,
  custo_acabamento NUMERIC DEFAULT 0,
  
  -- Offset: custo por milheiro, chapas, setup
  custo_chapa NUMERIC DEFAULT 0,
  custo_milheiro NUMERIC DEFAULT 0,
  custo_setup NUMERIC DEFAULT 0,
  escala_minima INTEGER DEFAULT 1000,
  
  -- Visual: custo por m², substrato
  custo_m2 NUMERIC DEFAULT 0,
  substrato TEXT DEFAULT '',
  custo_estrutura NUMERIC DEFAULT 0,
  
  -- Margem
  markup NUMERIC NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT ALL ON public.produtos TO service_role;

-- RLS para produtos
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de produtos" ON public.produtos FOR SELECT USING (true);
CREATE POLICY "Escrita pública de produtos" ON public.produtos FOR INSERT WITH CHECK (true);
CREATE POLICY "Update produtos" ON public.produtos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Delete produtos" ON public.produtos FOR DELETE USING (true);
