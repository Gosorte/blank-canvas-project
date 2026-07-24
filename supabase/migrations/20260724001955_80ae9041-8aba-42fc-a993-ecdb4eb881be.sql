-- MIGRATION 20260324095223_5e4c7c3d-8c88-4c60-91cf-f22c00212fef.sql

UPDATE erp_pedidos SET status = 'aguardando' WHERE status = 'Aguardando';
UPDATE erp_pedidos SET status = 'arte' WHERE status = 'Arte';
UPDATE erp_pedidos SET status = 'digital' WHERE status = 'Digital';
UPDATE erp_pedidos SET status = 'com_visual' WHERE status = 'Com. Visual';
UPDATE erp_pedidos SET status = 'pronto' WHERE status = 'Pronto';
UPDATE erp_pedidos SET status = 'balcao' WHERE status = 'Balcão';
UPDATE erp_pedidos SET status = 'offset' WHERE status = 'Offset';
UPDATE erp_pedidos SET status = 'cancelado' WHERE status = 'Cancelado';

-- MIGRATION 20260325000948_231b44bd-ca78-46e2-b9e1-8374d9e0176d.sql

CREATE TABLE public.formas_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'outros',
  icone TEXT DEFAULT 'banknote',
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.formas_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read formas_pagamento" ON public.formas_pagamento
  FOR SELECT TO authenticated USING (is_approved(auth.uid()));

CREATE POLICY "Superadmin manage formas_pagamento" ON public.formas_pagamento
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Operador insert formas_pagamento" ON public.formas_pagamento
  FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Operador update formas_pagamento" ON public.formas_pagamento
  FOR UPDATE TO authenticated
  USING (is_approved(auth.uid()))
  WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Operador delete formas_pagamento" ON public.formas_pagamento
  FOR DELETE TO authenticated USING (is_approved(auth.uid()));

CREATE TABLE public.pdv_vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id),
  usuario_id UUID,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  desconto NUMERIC NOT NULL DEFAULT 0,
  cashback_usado NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  forma_pagamento TEXT NOT NULL,
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pdv_vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read pdv_vendas" ON public.pdv_vendas
  FOR SELECT TO authenticated USING (is_approved(auth.uid()));

CREATE POLICY "Operador insert pdv_vendas" ON public.pdv_vendas
  FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Superadmin manage pdv_vendas" ON public.pdv_vendas
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.formas_pagamento TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdv_vendas TO authenticated;
GRANT ALL ON public.formas_pagamento TO service_role;
GRANT ALL ON public.pdv_vendas TO service_role;
