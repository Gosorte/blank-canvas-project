
-- Public (anon) SELECT on produtos for storefront
CREATE POLICY "Anon read active produtos"
ON public.produtos FOR SELECT TO anon
USING (ativo = true);

-- Public (anon) SELECT on tenants for store info
CREATE POLICY "Anon read active tenants"
ON public.tenants FOR SELECT TO anon
USING (status = 'ativo');

-- Public (anon) SELECT on acabamentos
CREATE POLICY "Anon read active acabamentos"
ON public.acabamentos FOR SELECT TO anon
USING (ativo = true);

-- Public (anon) SELECT on papeis
CREATE POLICY "Anon read active papeis"
ON public.papeis FOR SELECT TO anon
USING (ativo = true);

-- Public (anon) SELECT on substratos
CREATE POLICY "Anon read active substratos"
ON public.substratos FOR SELECT TO anon
USING (ativo = true);

-- Public (anon) INSERT on loja_pedidos for checkout
CREATE POLICY "Anon insert loja_pedidos"
ON public.loja_pedidos FOR INSERT TO anon
WITH CHECK (true);

-- Public (anon) INSERT on loja_pedido_itens for checkout
CREATE POLICY "Anon insert loja_pedido_itens"
ON public.loja_pedido_itens FOR INSERT TO anon
WITH CHECK (true);

-- Public (anon) SELECT on loja_pedidos for order tracking
CREATE POLICY "Anon read own loja_pedidos"
ON public.loja_pedidos FOR SELECT TO anon
USING (true);

-- Public (anon) SELECT on loja_pedido_itens for order tracking
CREATE POLICY "Anon read loja_pedido_itens"
ON public.loja_pedido_itens FOR SELECT TO anon
USING (true);

-- Create storage bucket for customer file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('loja-arquivos', 'loja-arquivos', true)
ON CONFLICT (id) DO NOTHING;

-- Anon can upload to loja-arquivos
CREATE POLICY "Anon upload loja-arquivos"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'loja-arquivos');

-- Public read loja-arquivos
CREATE POLICY "Public read loja-arquivos"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'loja-arquivos');
