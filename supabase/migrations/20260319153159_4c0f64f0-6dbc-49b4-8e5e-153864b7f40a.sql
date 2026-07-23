
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
