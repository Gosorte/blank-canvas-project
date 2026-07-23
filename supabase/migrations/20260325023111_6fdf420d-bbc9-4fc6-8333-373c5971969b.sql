-- Sequência global de OS para todo o ecossistema (PDV, ERP, CRM e Loja)
CREATE SEQUENCE IF NOT EXISTS public.os_global_seq;

-- Sincroniza a sequência com o maior número atual entre todos os módulos relevantes
DO $$
DECLARE
  v_max bigint;
BEGIN
  SELECT GREATEST(
    COALESCE((SELECT MAX(numero_venda)::bigint FROM public.pdv_vendas), 0),
    COALESCE((SELECT MAX(numero)::bigint FROM public.erp_orcamentos), 0),
    COALESCE((SELECT MAX(numero)::bigint FROM public.erp_pedidos), 0),
    COALESCE((SELECT MAX(numero)::bigint FROM public.crm_orcamentos), 0),
    COALESCE((SELECT MAX(numero_pedido)::bigint FROM public.loja_pedidos), 0)
  ) INTO v_max;

  IF v_max < 1 THEN
    PERFORM setval('public.os_global_seq', 1, false);
  ELSE
    PERFORM setval('public.os_global_seq', v_max, true);
  END IF;
END $$;

-- Reatribui OS duplicadas históricas entre PDV/ERP/CRM/Loja
-- Mantém o registro mais antigo de cada OS e renumera os demais
CREATE TEMP TABLE tmp_global_os_reassign AS
WITH all_os AS (
  SELECT 'pdv_vendas'::text AS origem, id, numero_venda::bigint AS os, created_at
  FROM public.pdv_vendas
  WHERE numero_venda IS NOT NULL

  UNION ALL

  SELECT 'erp_orcamentos'::text AS origem, id, numero::bigint AS os, created_at
  FROM public.erp_orcamentos
  WHERE numero IS NOT NULL

  UNION ALL

  SELECT 'erp_pedidos'::text AS origem, id, numero::bigint AS os, created_at
  FROM public.erp_pedidos
  WHERE numero IS NOT NULL

  UNION ALL

  SELECT 'crm_orcamentos'::text AS origem, id, numero::bigint AS os, created_at
  FROM public.crm_orcamentos
  WHERE numero IS NOT NULL

  UNION ALL

  SELECT 'loja_pedidos'::text AS origem, id, numero_pedido::bigint AS os, created_at
  FROM public.loja_pedidos
  WHERE numero_pedido IS NOT NULL
), ranked AS (
  SELECT
    origem,
    id,
    os,
    COUNT(*) OVER (PARTITION BY os) AS cnt,
    ROW_NUMBER() OVER (
      PARTITION BY os
      ORDER BY created_at, origem, id
    ) AS rn
  FROM all_os
)
SELECT
  origem,
  id,
  nextval('public.os_global_seq')::bigint AS new_os
FROM ranked
WHERE cnt > 1
  AND rn > 1;

UPDATE public.pdv_vendas p
SET numero_venda = t.new_os
FROM tmp_global_os_reassign t
WHERE t.origem = 'pdv_vendas'
  AND p.id = t.id;

UPDATE public.erp_orcamentos o
SET numero = t.new_os
FROM tmp_global_os_reassign t
WHERE t.origem = 'erp_orcamentos'
  AND o.id = t.id;

UPDATE public.erp_pedidos p
SET numero = t.new_os
FROM tmp_global_os_reassign t
WHERE t.origem = 'erp_pedidos'
  AND p.id = t.id;

UPDATE public.crm_orcamentos c
SET numero = t.new_os
FROM tmp_global_os_reassign t
WHERE t.origem = 'crm_orcamentos'
  AND c.id = t.id;

UPDATE public.loja_pedidos l
SET numero_pedido = t.new_os
FROM tmp_global_os_reassign t
WHERE t.origem = 'loja_pedidos'
  AND l.id = t.id;

DROP TABLE IF EXISTS tmp_global_os_reassign;

-- Defaults unificados para novas inserções
ALTER TABLE public.pdv_vendas
  ALTER COLUMN numero_venda SET DEFAULT nextval('public.os_global_seq');

ALTER TABLE public.erp_orcamentos
  ALTER COLUMN numero SET DEFAULT nextval('public.os_global_seq');

ALTER TABLE public.erp_pedidos
  ALTER COLUMN numero SET DEFAULT nextval('public.os_global_seq');

ALTER TABLE public.crm_orcamentos
  ALTER COLUMN numero SET DEFAULT nextval('public.os_global_seq');

ALTER TABLE public.loja_pedidos
  ALTER COLUMN numero_pedido SET DEFAULT nextval('public.os_global_seq');

-- Índices de unicidade por tabela
CREATE UNIQUE INDEX IF NOT EXISTS ux_pdv_vendas_numero_venda
  ON public.pdv_vendas (numero_venda)
  WHERE numero_venda IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_erp_orcamentos_numero
  ON public.erp_orcamentos (numero)
  WHERE numero IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_erp_pedidos_numero
  ON public.erp_pedidos (numero)
  WHERE numero IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_crm_orcamentos_numero
  ON public.crm_orcamentos (numero)
  WHERE numero IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_loja_pedidos_numero_pedido
  ON public.loja_pedidos (numero_pedido)
  WHERE numero_pedido IS NOT NULL;

-- Regra de unicidade GLOBAL
CREATE OR REPLACE FUNCTION public.enforce_global_os_unique()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_os bigint;
BEGIN
  IF TG_TABLE_NAME = 'pdv_vendas' THEN
    v_os := NEW.numero_venda;
  ELSIF TG_TABLE_NAME = 'erp_orcamentos' THEN
    v_os := NEW.numero;
  ELSIF TG_TABLE_NAME = 'erp_pedidos' THEN
    v_os := NEW.numero;
  ELSIF TG_TABLE_NAME = 'crm_orcamentos' THEN
    v_os := NEW.numero;
  ELSIF TG_TABLE_NAME = 'loja_pedidos' THEN
    v_os := NEW.numero_pedido;
  ELSE
    RETURN NEW;
  END IF;

  IF v_os IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.pdv_vendas p
    WHERE p.numero_venda = v_os
      AND (TG_TABLE_NAME <> 'pdv_vendas' OR p.id <> NEW.id)
  ) OR EXISTS (
    SELECT 1
    FROM public.erp_orcamentos o
    WHERE o.numero = v_os
      AND (TG_TABLE_NAME <> 'erp_orcamentos' OR o.id <> NEW.id)
  ) OR EXISTS (
    SELECT 1
    FROM public.erp_pedidos pe
    WHERE pe.numero = v_os
      AND (TG_TABLE_NAME <> 'erp_pedidos' OR pe.id <> NEW.id)
  ) OR EXISTS (
    SELECT 1
    FROM public.crm_orcamentos co
    WHERE co.numero = v_os
      AND (TG_TABLE_NAME <> 'crm_orcamentos' OR co.id <> NEW.id)
  ) OR EXISTS (
    SELECT 1
    FROM public.loja_pedidos lp
    WHERE lp.numero_pedido = v_os
      AND (TG_TABLE_NAME <> 'loja_pedidos' OR lp.id <> NEW.id)
  ) THEN
    RAISE EXCEPTION 'OS % já está em uso no sistema', v_os
      USING ERRCODE = '23505';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_global_os_pdv ON public.pdv_vendas;
CREATE TRIGGER trg_enforce_global_os_pdv
BEFORE INSERT OR UPDATE OF numero_venda ON public.pdv_vendas
FOR EACH ROW
EXECUTE FUNCTION public.enforce_global_os_unique();

DROP TRIGGER IF EXISTS trg_enforce_global_os_orcamentos ON public.erp_orcamentos;
CREATE TRIGGER trg_enforce_global_os_orcamentos
BEFORE INSERT OR UPDATE OF numero ON public.erp_orcamentos
FOR EACH ROW
EXECUTE FUNCTION public.enforce_global_os_unique();

DROP TRIGGER IF EXISTS trg_enforce_global_os_pedidos ON public.erp_pedidos;
CREATE TRIGGER trg_enforce_global_os_pedidos
BEFORE INSERT OR UPDATE OF numero ON public.erp_pedidos
FOR EACH ROW
EXECUTE FUNCTION public.enforce_global_os_unique();

DROP TRIGGER IF EXISTS trg_enforce_global_os_crm_orcamentos ON public.crm_orcamentos;
CREATE TRIGGER trg_enforce_global_os_crm_orcamentos
BEFORE INSERT OR UPDATE OF numero ON public.crm_orcamentos
FOR EACH ROW
EXECUTE FUNCTION public.enforce_global_os_unique();

DROP TRIGGER IF EXISTS trg_enforce_global_os_loja_pedidos ON public.loja_pedidos;
CREATE TRIGGER trg_enforce_global_os_loja_pedidos
BEFORE INSERT OR UPDATE OF numero_pedido ON public.loja_pedidos
FOR EACH ROW
EXECUTE FUNCTION public.enforce_global_os_unique();

-- Função consumida no PDV
CREATE OR REPLACE FUNCTION public.nextval_pdv_os()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT nextval('public.os_global_seq');
$function$;