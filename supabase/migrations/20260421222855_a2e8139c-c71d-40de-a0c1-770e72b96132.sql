
-- ============================================
-- 1. LINKS CRM ↔ ERP
-- ============================================
ALTER TABLE public.crm_orcamentos
  ADD COLUMN IF NOT EXISTS erp_orcamento_id uuid REFERENCES public.erp_orcamentos(id) ON DELETE SET NULL;

ALTER TABLE public.erp_pedidos
  ADD COLUMN IF NOT EXISTS crm_orcamento_id uuid REFERENCES public.crm_orcamentos(id) ON DELETE SET NULL;

ALTER TABLE public.erp_orcamentos
  ADD COLUMN IF NOT EXISTS crm_orcamento_id uuid REFERENCES public.crm_orcamentos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_orcamentos_erp ON public.crm_orcamentos(erp_orcamento_id);
CREATE INDEX IF NOT EXISTS idx_erp_pedidos_crm ON public.erp_pedidos(crm_orcamento_id);

-- ============================================
-- 2. LINKS LOJA ↔ CRM
-- ============================================
ALTER TABLE public.loja_pedidos
  ADD COLUMN IF NOT EXISTS crm_conversa_id uuid REFERENCES public.crm_conversas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_loja_pedidos_crm_conversa ON public.loja_pedidos(crm_conversa_id);

-- ============================================
-- 3. LINKS OP ↔ PEDIDOS (balcão e loja)
-- ============================================
ALTER TABLE public.ordens_producao
  ADD COLUMN IF NOT EXISTS pedido_id uuid REFERENCES public.erp_pedidos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS loja_pedido_id uuid REFERENCES public.loja_pedidos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_op_pedido ON public.ordens_producao(pedido_id);
CREATE INDEX IF NOT EXISTS idx_op_loja_pedido ON public.ordens_producao(loja_pedido_id);

-- ============================================
-- 4. ARQUIVOS COMPARTILHADOS CRM ↔ LOJA
-- ============================================
ALTER TABLE public.loja_pedido_itens
  ADD COLUMN IF NOT EXISTS crm_arquivo_id uuid REFERENCES public.crm_arquivos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_loja_itens_crm_arquivo ON public.loja_pedido_itens(crm_arquivo_id);

-- ============================================
-- 5. SYNC ESTOQUE ↔ PRODUTOS DA LOJA
-- ============================================
CREATE TABLE IF NOT EXISTS public.produto_estoque_link (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  estoque_id uuid NOT NULL REFERENCES public.estoque(id) ON DELETE CASCADE,
  quantidade_por_unidade numeric NOT NULL DEFAULT 1,
  bloquear_se_zerado boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(produto_id, estoque_id)
);

ALTER TABLE public.produto_estoque_link ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read produto_estoque_link"
  ON public.produto_estoque_link FOR SELECT TO authenticated
  USING (is_approved(auth.uid()));

CREATE POLICY "Operador manage produto_estoque_link"
  ON public.produto_estoque_link FOR ALL TO authenticated
  USING (is_approved(auth.uid()))
  WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Superadmin manage produto_estoque_link"
  ON public.produto_estoque_link FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Adiciona coluna de disponibilidade automática em produtos (se não existir)
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS disponivel_loja boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS bloqueado_por_estoque boolean NOT NULL DEFAULT false;

-- Trigger: quando o estoque muda, bloqueia/libera produtos vinculados
CREATE OR REPLACE FUNCTION public.sync_produto_estoque()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link record;
BEGIN
  FOR v_link IN
    SELECT pel.produto_id, pel.bloquear_se_zerado
    FROM produto_estoque_link pel
    WHERE pel.estoque_id = NEW.id
  LOOP
    IF NEW.quantidade <= 0 AND v_link.bloquear_se_zerado THEN
      UPDATE produtos SET bloqueado_por_estoque = true WHERE id = v_link.produto_id;
    ELSIF NEW.quantidade > 0 THEN
      UPDATE produtos SET bloqueado_por_estoque = false WHERE id = v_link.produto_id;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_produto_estoque ON public.estoque;
CREATE TRIGGER trg_sync_produto_estoque
  AFTER UPDATE OF quantidade ON public.estoque
  FOR EACH ROW
  WHEN (OLD.quantidade IS DISTINCT FROM NEW.quantidade)
  EXECUTE FUNCTION public.sync_produto_estoque();

-- ============================================
-- 6. FILA DE NOTIFICAÇÕES (WhatsApp / Email)
-- ============================================
CREATE TABLE IF NOT EXISTS public.notificacoes_pendentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  canal text NOT NULL DEFAULT 'whatsapp', -- whatsapp | email | ambos
  destinatario text NOT NULL,
  assunto text,
  mensagem text NOT NULL,
  contexto text, -- 'pedido_loja' | 'pedido_erp' | 'op_status' | 'orcamento'
  referencia_id uuid,
  status text NOT NULL DEFAULT 'pendente', -- pendente | enviado | falhou
  tentativas int NOT NULL DEFAULT 0,
  enviado_em timestamptz,
  erro text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_pendentes_status ON public.notificacoes_pendentes(status, created_at);
CREATE INDEX IF NOT EXISTS idx_notif_pendentes_tenant ON public.notificacoes_pendentes(tenant_id);

ALTER TABLE public.notificacoes_pendentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read notificacoes_pendentes"
  ON public.notificacoes_pendentes FOR SELECT TO authenticated
  USING (is_approved(auth.uid()));

CREATE POLICY "Operador insert notificacoes_pendentes"
  ON public.notificacoes_pendentes FOR INSERT TO authenticated
  WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Operador update notificacoes_pendentes"
  ON public.notificacoes_pendentes FOR UPDATE TO authenticated
  USING (is_approved(auth.uid()))
  WITH CHECK (is_approved(auth.uid()));

CREATE POLICY "Superadmin manage notificacoes_pendentes"
  ON public.notificacoes_pendentes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Trigger: enfileira notificação quando status de pedido da loja muda
CREATE OR REPLACE FUNCTION public.enqueue_notif_loja_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_destino text;
  v_email text;
  v_msg text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.cliente_id IS NOT NULL THEN
    SELECT whatsapp, email INTO v_destino, v_email FROM clientes WHERE id = NEW.cliente_id;
    v_msg := 'Olá! Seu pedido #' || NEW.numero_pedido || ' está agora com status: ' || NEW.status;

    IF v_destino IS NOT NULL THEN
      INSERT INTO notificacoes_pendentes (tenant_id, cliente_id, canal, destinatario, mensagem, contexto, referencia_id)
      VALUES (NEW.tenant_id, NEW.cliente_id, 'whatsapp', v_destino, v_msg, 'pedido_loja', NEW.id);
    END IF;

    IF v_email IS NOT NULL THEN
      INSERT INTO notificacoes_pendentes (tenant_id, cliente_id, canal, destinatario, assunto, mensagem, contexto, referencia_id)
      VALUES (NEW.tenant_id, NEW.cliente_id, 'email', v_email, 'Atualização do pedido #' || NEW.numero_pedido, v_msg, 'pedido_loja', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notif_loja_status ON public.loja_pedidos;
CREATE TRIGGER trg_notif_loja_status
  AFTER UPDATE OF status ON public.loja_pedidos
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_notif_loja_status();

-- Trigger: notificação para mudança de status de OP
CREATE OR REPLACE FUNCTION public.enqueue_notif_op_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_destino text;
  v_msg text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.cliente_id IS NOT NULL THEN
    SELECT whatsapp INTO v_destino FROM clientes WHERE id = NEW.cliente_id;
    v_msg := 'Atualização da produção: ' || COALESCE(NEW.produto_nome, 'seu pedido') || ' - Status: ' || NEW.status;

    IF v_destino IS NOT NULL THEN
      INSERT INTO notificacoes_pendentes (tenant_id, cliente_id, canal, destinatario, mensagem, contexto, referencia_id)
      VALUES (NEW.tenant_id, NEW.cliente_id, 'whatsapp', v_destino, v_msg, 'op_status', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notif_op_status ON public.ordens_producao;
CREATE TRIGGER trg_notif_op_status
  AFTER UPDATE OF status ON public.ordens_producao
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_notif_op_status();

-- ============================================
-- 7. TRIGGER: gerar OP automática a partir de erp_pedidos (balcão)
-- ============================================
CREATE OR REPLACE FUNCTION public.gerar_op_from_erp_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_op_id uuid;
  v_item record;
  v_produto_nome text := '';
  v_quantidade int := 0;
  v_setor text;
  v_itens_count int := 0;
BEGIN
  -- Dispara quando status muda para "Aprovado" ou "Em Produção" e ainda não tem OP
  IF NEW.status IN ('Aprovado', 'Em Produção', 'aprovado', 'em_producao')
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND NOT EXISTS (SELECT 1 FROM ordens_producao WHERE pedido_id = NEW.id) THEN

    v_setor := COALESCE(NEW.categoria, 'digital');

    FOR v_item IN
      SELECT descricao, quantidade
      FROM erp_orcamento_itens
      WHERE orcamento_id = NEW.orcamento_id
    LOOP
      v_itens_count := v_itens_count + 1;
      IF v_itens_count = 1 THEN
        v_produto_nome := v_item.descricao;
      ELSE
        v_produto_nome := v_produto_nome || ' + ' || v_item.descricao;
      END IF;
      v_quantidade := v_quantidade + COALESCE(v_item.quantidade, 1)::int;
    END LOOP;

    IF v_itens_count = 0 THEN
      v_produto_nome := 'Pedido #' || NEW.numero;
      v_quantidade := 1;
    END IF;

    INSERT INTO ordens_producao (
      tenant_id, cliente_id, pedido_id, setor, status, prioridade,
      produto_nome, quantidade, valor_total, observacoes
    ) VALUES (
      NEW.tenant_id, NEW.cliente_id, NEW.id, v_setor, 'aguardando', 'normal',
      v_produto_nome, v_quantidade, NEW.valor_total::numeric / 100,
      'Gerada automaticamente do Pedido Balcão #' || NEW.numero
    )
    RETURNING id INTO v_op_id;

    INSERT INTO op_historico (op_id, status_novo, observacao)
    VALUES (v_op_id, 'aguardando', 'OP gerada do Pedido ERP #' || NEW.numero);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gerar_op_erp ON public.erp_pedidos;
CREATE TRIGGER trg_gerar_op_erp
  AFTER UPDATE OF status ON public.erp_pedidos
  FOR EACH ROW EXECUTE FUNCTION public.gerar_op_from_erp_pedido();

-- ============================================
-- 8. Atualizar loja_pedidos para também guardar loja_pedido_id na OP
-- ============================================
CREATE OR REPLACE FUNCTION public.gerar_op_from_pedido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
      tenant_id, cliente_id, loja_pedido_id, setor, status, prioridade,
      produto_nome, especificacoes, quantidade, valor_total,
      observacoes, arquivo_url
    ) VALUES (
      NEW.tenant_id, NEW.cliente_id, NEW.id, v_setor, 'aguardando', 'normal',
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
