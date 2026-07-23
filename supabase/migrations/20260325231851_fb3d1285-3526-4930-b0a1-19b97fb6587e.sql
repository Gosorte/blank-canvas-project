-- Robustez da OS: atribuição automática + imutabilidade do número

CREATE OR REPLACE FUNCTION public.ensure_global_os_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_TABLE_NAME = 'pdv_vendas' THEN
    IF NEW.numero_venda IS NULL THEN
      NEW.numero_venda := nextval('public.os_global_seq');
    END IF;
  ELSIF TG_TABLE_NAME = 'erp_orcamentos' THEN
    IF NEW.numero IS NULL THEN
      NEW.numero := nextval('public.os_global_seq');
    END IF;
  ELSIF TG_TABLE_NAME = 'erp_pedidos' THEN
    IF NEW.numero IS NULL THEN
      NEW.numero := nextval('public.os_global_seq');
    END IF;
  ELSIF TG_TABLE_NAME = 'crm_orcamentos' THEN
    IF NEW.numero IS NULL THEN
      NEW.numero := nextval('public.os_global_seq');
    END IF;
  ELSIF TG_TABLE_NAME = 'loja_pedidos' THEN
    IF NEW.numero_pedido IS NULL THEN
      NEW.numero_pedido := nextval('public.os_global_seq');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.lock_os_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_old bigint;
  v_new bigint;
BEGIN
  IF TG_TABLE_NAME = 'pdv_vendas' THEN
    v_old := OLD.numero_venda;
    v_new := NEW.numero_venda;
  ELSIF TG_TABLE_NAME = 'erp_orcamentos' THEN
    v_old := OLD.numero;
    v_new := NEW.numero;
  ELSIF TG_TABLE_NAME = 'erp_pedidos' THEN
    v_old := OLD.numero;
    v_new := NEW.numero;
  ELSIF TG_TABLE_NAME = 'crm_orcamentos' THEN
    v_old := OLD.numero;
    v_new := NEW.numero;
  ELSIF TG_TABLE_NAME = 'loja_pedidos' THEN
    v_old := OLD.numero_pedido;
    v_new := NEW.numero_pedido;
  ELSE
    RETURN NEW;
  END IF;

  IF v_old IS DISTINCT FROM v_new THEN
    RAISE EXCEPTION 'Número de OS é imutável após criação (tabela: %)', TG_TABLE_NAME
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS aaa_assign_global_os_pdv ON public.pdv_vendas;
CREATE TRIGGER aaa_assign_global_os_pdv
BEFORE INSERT ON public.pdv_vendas
FOR EACH ROW
EXECUTE FUNCTION public.ensure_global_os_number();

DROP TRIGGER IF EXISTS aaa_assign_global_os_orcamentos ON public.erp_orcamentos;
CREATE TRIGGER aaa_assign_global_os_orcamentos
BEFORE INSERT ON public.erp_orcamentos
FOR EACH ROW
EXECUTE FUNCTION public.ensure_global_os_number();

DROP TRIGGER IF EXISTS aaa_assign_global_os_pedidos ON public.erp_pedidos;
CREATE TRIGGER aaa_assign_global_os_pedidos
BEFORE INSERT ON public.erp_pedidos
FOR EACH ROW
EXECUTE FUNCTION public.ensure_global_os_number();

DROP TRIGGER IF EXISTS aaa_assign_global_os_crm_orcamentos ON public.crm_orcamentos;
CREATE TRIGGER aaa_assign_global_os_crm_orcamentos
BEFORE INSERT ON public.crm_orcamentos
FOR EACH ROW
EXECUTE FUNCTION public.ensure_global_os_number();

DROP TRIGGER IF EXISTS aaa_assign_global_os_loja_pedidos ON public.loja_pedidos;
CREATE TRIGGER aaa_assign_global_os_loja_pedidos
BEFORE INSERT ON public.loja_pedidos
FOR EACH ROW
EXECUTE FUNCTION public.ensure_global_os_number();

DROP TRIGGER IF EXISTS trg_lock_os_pdv ON public.pdv_vendas;
CREATE TRIGGER trg_lock_os_pdv
BEFORE UPDATE OF numero_venda ON public.pdv_vendas
FOR EACH ROW
EXECUTE FUNCTION public.lock_os_number();

DROP TRIGGER IF EXISTS trg_lock_os_orcamentos ON public.erp_orcamentos;
CREATE TRIGGER trg_lock_os_orcamentos
BEFORE UPDATE OF numero ON public.erp_orcamentos
FOR EACH ROW
EXECUTE FUNCTION public.lock_os_number();

DROP TRIGGER IF EXISTS trg_lock_os_pedidos ON public.erp_pedidos;
CREATE TRIGGER trg_lock_os_pedidos
BEFORE UPDATE OF numero ON public.erp_pedidos
FOR EACH ROW
EXECUTE FUNCTION public.lock_os_number();

DROP TRIGGER IF EXISTS trg_lock_os_crm_orcamentos ON public.crm_orcamentos;
CREATE TRIGGER trg_lock_os_crm_orcamentos
BEFORE UPDATE OF numero ON public.crm_orcamentos
FOR EACH ROW
EXECUTE FUNCTION public.lock_os_number();

DROP TRIGGER IF EXISTS trg_lock_os_loja_pedidos ON public.loja_pedidos;
CREATE TRIGGER trg_lock_os_loja_pedidos
BEFORE UPDATE OF numero_pedido ON public.loja_pedidos
FOR EACH ROW
EXECUTE FUNCTION public.lock_os_number();