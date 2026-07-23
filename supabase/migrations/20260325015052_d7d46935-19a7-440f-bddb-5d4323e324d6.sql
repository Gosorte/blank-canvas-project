CREATE OR REPLACE FUNCTION public.nextval_pdv_os()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT nextval('pdv_vendas_numero_venda_seq');
$$;