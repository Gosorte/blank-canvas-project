-- Adicionar campos de configuração do tenant
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS cor_primaria text DEFAULT '#3b82f6',
  ADD COLUMN IF NOT EXISTS cor_secundaria text DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS descricao text,
  ADD COLUMN IF NOT EXISTS notif_email_pedido boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_whatsapp_status boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notif_email_orcamento boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

COMMENT ON COLUMN public.tenants.cnpj IS 'CNPJ da gráfica';
COMMENT ON COLUMN public.tenants.cor_primaria IS 'Cor primária para personalização da loja';
COMMENT ON COLUMN public.tenants.notif_email_pedido IS 'Enviar e-mail ao cliente quando status do pedido mudar';
COMMENT ON COLUMN public.tenants.notif_whatsapp_status IS 'Enviar WhatsApp ao cliente quando status do pedido mudar';