-- MIGRATION 20260319095712_2a85fee9-d157-419b-9395-6c655d2e0ae4.sql

-- Public (anon) SELECT on produtos for storefront
CREATE POLICY "Anon read active produtos"
ON public.produtos FOR SELECT TO anon
USING (ativo = true);
GRANT SELECT ON public.produtos TO anon;

-- Public (anon) SELECT on tenants for store info
CREATE POLICY "Anon read active tenants"
ON public.tenants FOR SELECT TO anon
USING (status = 'ativo');
GRANT SELECT ON public.tenants TO anon;

-- Public (anon) SELECT on acabamentos
CREATE POLICY "Anon read active acabamentos"
ON public.acabamentos FOR SELECT TO anon
USING (ativo = true);
GRANT SELECT ON public.acabamentos TO anon;

-- Public (anon) SELECT on papeis
CREATE POLICY "Anon read active papeis"
ON public.papeis FOR SELECT TO anon
USING (ativo = true);
GRANT SELECT ON public.papeis TO anon;

-- Public (anon) SELECT on substratos
CREATE POLICY "Anon read active substratos"
ON public.substratos FOR SELECT TO anon
USING (ativo = true);
GRANT SELECT ON public.substratos TO anon;

-- Public (anon) INSERT on loja_pedidos for checkout
CREATE POLICY "Anon insert loja_pedidos"
ON public.loja_pedidos FOR INSERT TO anon
WITH CHECK (true);
GRANT INSERT ON public.loja_pedidos TO anon;

-- Public (anon) INSERT on loja_pedido_itens for checkout
CREATE POLICY "Anon insert loja_pedido_itens"
ON public.loja_pedido_itens FOR INSERT TO anon
WITH CHECK (true);
GRANT INSERT ON public.loja_pedido_itens TO anon;

-- Public (anon) SELECT on loja_pedidos for order tracking
CREATE POLICY "Anon read own loja_pedidos"
ON public.loja_pedidos FOR SELECT TO anon
USING (true);
GRANT SELECT ON public.loja_pedidos TO anon;

-- Public (anon) SELECT on loja_pedido_itens for order tracking
CREATE POLICY "Anon read loja_pedido_itens"
ON public.loja_pedido_itens FOR SELECT TO anon
USING (true);
GRANT SELECT ON public.loja_pedido_itens TO anon;

-- Anon can upload to loja-arquivos
CREATE POLICY "Anon upload loja-arquivos"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'loja-arquivos');

-- Public read loja-arquivos
CREATE POLICY "Public read loja-arquivos"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'loja-arquivos');

-- MIGRATION 20260319153159_4c0f64f0-6dbc-49b4-8e5e-153864b7f40a.sql

-- Add auth_user_id to clientes to link store customers to auth accounts
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_auth_user_id ON public.clientes(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- RLS: Customers can read their own client record
CREATE POLICY "Customers can read own cliente"
ON public.clientes FOR SELECT TO authenticated
USING (auth_user_id = auth.uid());

-- RLS: Customers can read their own orders
CREATE POLICY "Customers can read own loja_pedidos"
ON public.loja_pedidos FOR SELECT TO authenticated
USING (cliente_id IN (SELECT id FROM public.clientes WHERE auth_user_id = auth.uid()));

-- RLS: Customers can read their own order items
CREATE POLICY "Customers can read own loja_pedido_itens"
ON public.loja_pedido_itens FOR SELECT TO authenticated
USING (pedido_id IN (SELECT id FROM public.loja_pedidos WHERE cliente_id IN (SELECT id FROM public.clientes WHERE auth_user_id = auth.uid())));

-- RLS: Customers can insert orders for themselves
CREATE POLICY "Customers can insert own loja_pedidos"
ON public.loja_pedidos FOR INSERT TO authenticated
WITH CHECK (cliente_id IN (SELECT id FROM public.clientes WHERE auth_user_id = auth.uid()));

-- RLS: Customers can insert order items for their orders
CREATE POLICY "Customers can insert own loja_pedido_itens"
ON public.loja_pedido_itens FOR INSERT TO authenticated
WITH CHECK (pedido_id IN (SELECT id FROM public.loja_pedidos WHERE cliente_id IN (SELECT id FROM public.clientes WHERE auth_user_id = auth.uid())));

-- RLS: Customers can read approved files linked to their client record
CREATE POLICY "Customers can read own crm_arquivos"
ON public.crm_arquivos FOR SELECT TO authenticated
USING (cliente_id IN (SELECT id FROM public.clientes WHERE auth_user_id = auth.uid()));

-- Function to auto-create cliente record on store signup
CREATE OR REPLACE FUNCTION public.handle_store_customer_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'tenant_id' IS NOT NULL THEN
    INSERT INTO public.clientes (tenant_id, auth_user_id, nome, email)
    VALUES (
      (NEW.raw_user_meta_data->>'tenant_id')::uuid,
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'nome', ''),
      NEW.email
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for store customer auto-creation
CREATE TRIGGER on_store_customer_signup
AFTER INSERT ON auth.users
FOR EACH ROW
WHEN (NEW.raw_user_meta_data->>'tenant_id' IS NOT NULL)
EXECUTE FUNCTION public.handle_store_customer_signup();
