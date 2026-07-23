
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

-- Tabela de Configuração de Módulos
CREATE TABLE public.module_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  has_offset BOOLEAN NOT NULL DEFAULT false,
  has_digital BOOLEAN NOT NULL DEFAULT true,
  has_visual BOOLEAN NOT NULL DEFAULT false,
  has_crm_advanced BOOLEAN NOT NULL DEFAULT false
);

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
