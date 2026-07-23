
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

-- Create pdv_vendas table to track sales
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
