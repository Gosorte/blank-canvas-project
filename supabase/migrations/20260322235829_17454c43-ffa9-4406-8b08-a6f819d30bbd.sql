
-- Tabela de Máquinas (equipamentos por tenant/setor)
CREATE TABLE public.maquinas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo_modulo text NOT NULL, -- 'digital', 'offset', 'visual'
  marca text,
  modelo text,
  capacidade text, -- Ex: "1000 folhas/hora", "2m largura"
  custo_hora numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ativa', -- 'ativa', 'manutencao', 'inativa'
  localizacao text,
  observacoes text,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.maquinas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read maquinas" ON public.maquinas
  FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage maquinas" ON public.maquinas
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Tabela de Processos de Produção
CREATE TABLE public.processos_producao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo_modulo text NOT NULL, -- 'digital', 'offset', 'visual'
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

ALTER TABLE public.processos_producao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read processos" ON public.processos_producao
  FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY "Superadmin manage processos" ON public.processos_producao
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));
