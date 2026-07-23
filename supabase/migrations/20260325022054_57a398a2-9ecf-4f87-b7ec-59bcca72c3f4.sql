-- Sequência global única de OS para PDV, Orçamentos e Pedidos
CREATE SEQUENCE IF NOT EXISTS public.os_global_seq;

-- Avança a sequência global para o maior número já existente no sistema
DO $$
DECLARE
  v_max bigint;
BEGIN
  SELECT GREATEST(
    COALESCE((SELECT MAX(numero_venda)::bigint FROM public.pdv_vendas), 0),
    COALESCE((SELECT MAX(numero)::bigint FROM public.erp_orcamentos), 0),
    COALESCE((SELECT MAX(numero)::bigint FROM public.erp_pedidos), 0)
  ) INTO v_max;

  IF v_max < 1 THEN
    PERFORM setval('public.os_global_seq', 1, false);
  ELSE
    PERFORM setval('public.os_global_seq', v_max, true);
  END IF;
END $$;

-- Todos os módulos passam a usar a mesma sequência de OS
ALTER TABLE public.pdv_vendas
  ALTER COLUMN numero_venda SET DEFAULT nextval('public.os_global_seq');

ALTER TABLE public.erp_orcamentos
  ALTER COLUMN numero SET DEFAULT nextval('public.os_global_seq');

ALTER TABLE public.erp_pedidos
  ALTER COLUMN numero SET DEFAULT nextval('public.os_global_seq');

-- Função usada no PDV passa a consumir a sequência global
CREATE OR REPLACE FUNCTION public.nextval_pdv_os()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT nextval('public.os_global_seq');
$function$;