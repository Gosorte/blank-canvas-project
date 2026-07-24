-- MIGRATION 20260325231851_fb3d1285-3526-4930-b0a1-19b97fb6587e.sql

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

-- MIGRATION 20260326002733_e404e262-959f-4e01-bd96-2d7af73cd3ce.sql

CREATE TABLE public.pdv_caixa (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  aberto_por uuid NOT NULL,
  aberto_em timestamp with time zone NOT NULL DEFAULT now(),
  fechado_por uuid,
  fechado_em timestamp with time zone,
  valor_abertura numeric NOT NULL DEFAULT 0,
  valor_fechamento numeric,
  total_vendas numeric DEFAULT 0,
  total_recebido numeric DEFAULT 0,
  observacoes_abertura text,
  observacoes_fechamento text,
  status text NOT NULL DEFAULT 'aberto',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pdv_caixa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read pdv_caixa" ON public.pdv_caixa
  FOR SELECT TO authenticated USING (is_approved(auth.uid()));

CREATE POLICY "Operador insert pdv_caixa" ON public.pdv_caixa
  FOR INSERT TO authenticated WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Operador update pdv_caixa" ON public.pdv_caixa
  FOR UPDATE TO authenticated USING (is_approved(auth.uid())) WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Superadmin manage pdv_caixa" ON public.pdv_caixa
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role)) WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdv_caixa TO authenticated;
GRANT ALL ON public.pdv_caixa TO service_role;

-- MIGRATION 20260326012147_95276b07-1b78-4623-a17b-d25a7a094fee.sql

UPDATE recebimentos_parciais 
SET conta_receber_id = '219d6f24-0275-46f3-b45e-dca0a8e91dd4'
WHERE conta_receber_id = 'bd0235d1-8ac3-4204-847c-5f50588e484c';

DELETE FROM contas_receber WHERE id = 'bd0235d1-8ac3-4204-847c-5f50588e484c';

-- MIGRATION 20260330222911_131ae31d-e5cc-470a-9d35-73fc1230dcb4.sql

ALTER TABLE public.produtos 
  ADD COLUMN IF NOT EXISTS estoque_id uuid REFERENCES public.estoque(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bloquear_sem_estoque boolean NOT NULL DEFAULT false;

ALTER TABLE public.estoque_movimentacoes
  ADD COLUMN IF NOT EXISTS valor_total numeric NOT NULL DEFAULT 0;
