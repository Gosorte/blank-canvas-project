-- 1) Coluna de idempotência
ALTER TABLE public.notificacoes_pendentes
  ADD COLUMN IF NOT EXISTS chave_idempotente text;

-- 2) Índice único parcial: impede duplicatas pendentes/enviadas com mesma chave por tenant+canal
CREATE UNIQUE INDEX IF NOT EXISTS uq_notif_idempotencia
  ON public.notificacoes_pendentes (tenant_id, canal, chave_idempotente)
  WHERE chave_idempotente IS NOT NULL AND status IN ('pendente','enviado');

-- 3) Atualiza trigger da loja para gerar chave_idempotente
CREATE OR REPLACE FUNCTION public.enqueue_notif_loja_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_destino text;
  v_email text;
  v_msg text;
  v_chave text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.cliente_id IS NOT NULL THEN
    SELECT whatsapp, email INTO v_destino, v_email FROM clientes WHERE id = NEW.cliente_id;
    v_msg := 'Olá! Seu pedido #' || NEW.numero_pedido || ' está agora com status: ' || NEW.status;
    v_chave := 'pedido_loja:' || NEW.id::text || ':' || NEW.status;

    IF v_destino IS NOT NULL THEN
      INSERT INTO notificacoes_pendentes (tenant_id, cliente_id, canal, destinatario, mensagem, contexto, referencia_id, chave_idempotente)
      VALUES (NEW.tenant_id, NEW.cliente_id, 'whatsapp', v_destino, v_msg, 'pedido_loja', NEW.id, v_chave)
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_email IS NOT NULL THEN
      INSERT INTO notificacoes_pendentes (tenant_id, cliente_id, canal, destinatario, assunto, mensagem, contexto, referencia_id, chave_idempotente)
      VALUES (NEW.tenant_id, NEW.cliente_id, 'email', v_email, 'Atualização do pedido #' || NEW.numero_pedido, v_msg, 'pedido_loja', NEW.id, v_chave)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 4) Atualiza trigger de OP para gerar chave_idempotente
CREATE OR REPLACE FUNCTION public.enqueue_notif_op_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_destino text;
  v_msg text;
  v_chave text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.cliente_id IS NOT NULL THEN
    SELECT whatsapp INTO v_destino FROM clientes WHERE id = NEW.cliente_id;
    v_msg := 'Atualização da produção: ' || COALESCE(NEW.produto_nome, 'seu pedido') || ' - Status: ' || NEW.status;
    v_chave := 'op_status:' || NEW.id::text || ':' || NEW.status;

    IF v_destino IS NOT NULL THEN
      INSERT INTO notificacoes_pendentes (tenant_id, cliente_id, canal, destinatario, mensagem, contexto, referencia_id, chave_idempotente)
      VALUES (NEW.tenant_id, NEW.cliente_id, 'whatsapp', v_destino, v_msg, 'op_status', NEW.id, v_chave)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;