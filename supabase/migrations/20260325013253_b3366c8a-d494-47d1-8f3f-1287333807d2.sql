
-- Add unique sequential sale number to pdv_vendas
CREATE SEQUENCE IF NOT EXISTS pdv_vendas_numero_venda_seq;

ALTER TABLE public.pdv_vendas 
ADD COLUMN IF NOT EXISTS numero_venda integer NOT NULL DEFAULT nextval('pdv_vendas_numero_venda_seq');

-- Create unique index to prevent reuse
CREATE UNIQUE INDEX IF NOT EXISTS idx_pdv_vendas_tenant_numero 
ON public.pdv_vendas (tenant_id, numero_venda);
