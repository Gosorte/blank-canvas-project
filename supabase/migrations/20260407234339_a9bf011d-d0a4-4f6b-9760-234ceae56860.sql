-- Allow approved operators to insert clientes
CREATE POLICY "Operador insert clientes"
ON public.clientes
FOR INSERT
TO authenticated
WITH CHECK (is_approved(auth.uid()));

-- Allow approved operators to update clientes
CREATE POLICY "Operador update clientes"
ON public.clientes
FOR UPDATE
TO authenticated
USING (is_approved(auth.uid()))
WITH CHECK (is_approved(auth.uid()));

-- Allow approved operators to delete clientes
CREATE POLICY "Operador delete clientes"
ON public.clientes
FOR DELETE
TO authenticated
USING (is_approved(auth.uid()));

-- Allow approved operators to insert/update customer_credits
CREATE POLICY "Operador insert customer_credits"
ON public.customer_credits
FOR INSERT
TO authenticated
WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Operador update customer_credits"
ON public.customer_credits
FOR UPDATE
TO authenticated
USING (is_approved(auth.uid()))
WITH CHECK (is_approved(auth.uid()));