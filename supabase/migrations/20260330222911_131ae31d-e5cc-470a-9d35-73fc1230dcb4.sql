-- Adicionar campos de integração estoque-ecommerce nos produtos
ALTER TABLE public.produtos 
  ADD COLUMN IF NOT EXISTS estoque_id uuid REFERENCES public.estoque(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bloquear_sem_estoque boolean NOT NULL DEFAULT false;

-- Adicionar campo de referência OP nas movimentações (já existe referencia_id, vamos usar)
-- Adicionar coluna valor_total_mov para registrar valor financeiro da movimentação
ALTER TABLE public.estoque_movimentacoes
  ADD COLUMN IF NOT EXISTS valor_total numeric NOT NULL DEFAULT 0;

-- Adicionar campo para vincular estoque ao fornecedor de forma mais clara
-- (já existe fornecedor_id na tabela estoque, ok)

COMMENT ON COLUMN public.produtos.estoque_id IS 'Vincula o produto a um item de estoque para controle automático';
COMMENT ON COLUMN public.produtos.bloquear_sem_estoque IS 'Se true, bloqueia o produto na loja quando estoque zerado';