
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

-- RLS para produtos
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de produtos" ON public.produtos FOR SELECT USING (true);
CREATE POLICY "Escrita pública de produtos" ON public.produtos FOR INSERT WITH CHECK (true);
CREATE POLICY "Update produtos" ON public.produtos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Delete produtos" ON public.produtos FOR DELETE USING (true);
