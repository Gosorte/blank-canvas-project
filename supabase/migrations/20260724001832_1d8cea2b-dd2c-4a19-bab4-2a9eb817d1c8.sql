-- MIGRATION 20260320042809_414a26fb-62c2-485d-a4f4-94492dcf413b.sql

CREATE OR REPLACE FUNCTION public.gerar_op_from_pedido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_op_id uuid;
  v_item record;
  v_produto_nome text := '';
  v_quantidade int := 0;
  v_setor text := 'digital';
  v_especificacoes jsonb := '{}'::jsonb;
  v_arquivo_url text := null;
  v_itens_count int := 0;
BEGIN
  IF NEW.status = 'pago' AND (OLD.status IS DISTINCT FROM 'pago') AND NEW.op_id IS NULL THEN
    FOR v_item IN 
      SELECT li.produto_nome, li.quantidade, li.especificacoes, li.arquivo_url, li.produto_id,
             COALESCE(p.tipo_modulo, 'digital') as tipo_modulo
      FROM loja_pedido_itens li
      LEFT JOIN produtos p ON p.id = li.produto_id
      WHERE li.pedido_id = NEW.id
    LOOP
      v_itens_count := v_itens_count + 1;
      IF v_itens_count = 1 THEN
        v_produto_nome := v_item.produto_nome;
        v_setor := v_item.tipo_modulo;
        v_especificacoes := COALESCE(v_item.especificacoes, '{}'::jsonb);
        v_arquivo_url := v_item.arquivo_url;
        v_quantidade := v_item.quantidade;
      ELSE
        v_produto_nome := v_produto_nome || ' + ' || v_item.produto_nome;
        v_quantidade := v_quantidade + v_item.quantidade;
      END IF;
    END LOOP;

    IF v_itens_count = 0 THEN
      RETURN NEW;
    END IF;

    INSERT INTO ordens_producao (
      tenant_id, cliente_id, setor, status, prioridade,
      produto_nome, especificacoes, quantidade, valor_total,
      observacoes, arquivo_url
    ) VALUES (
      NEW.tenant_id, NEW.cliente_id, v_setor, 'aguardando', 'normal',
      v_produto_nome, v_especificacoes, v_quantidade, NEW.valor_total,
      'Gerada automaticamente do Pedido #' || NEW.numero_pedido,
      v_arquivo_url
    )
    RETURNING id INTO v_op_id;

    NEW.op_id := v_op_id;

    INSERT INTO op_historico (op_id, status_novo, observacao)
    VALUES (v_op_id, 'aguardando', 'OP gerada automaticamente do Pedido Loja #' || NEW.numero_pedido);

  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_gerar_op_from_pedido ON loja_pedidos;
CREATE TRIGGER trigger_gerar_op_from_pedido
  BEFORE UPDATE ON loja_pedidos
  FOR EACH ROW
  EXECUTE FUNCTION gerar_op_from_pedido();

-- MIGRATION 20260320092930_7008b8da-d065-40ea-84d7-5da1a838941a.sql
ALTER TABLE public.profiles ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL DEFAULT NULL;
