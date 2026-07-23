import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LojaPedido {
  id: string;
  tenant_id: string;
  cliente_id: string | null;
  numero_pedido: number;
  status: string;
  valor_total: number;
  forma_pagamento: string | null;
  observacoes: string | null;
  op_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LojaPedidoItem {
  id: string;
  pedido_id: string;
  produto_id: string | null;
  produto_nome: string;
  quantidade: number;
  especificacoes: Record<string, unknown>;
  valor_unitario: number;
  valor_total: number;
  arquivo_url: string | null;
  status_arquivo: string;
  created_at: string;
}

const PEDIDO_STATUS = [
  { id: "pendente", label: "Pendente", color: "bg-yellow-500" },
  { id: "pago", label: "Pago", color: "bg-blue-500" },
  { id: "em_producao", label: "Em Produção", color: "bg-orange-500" },
  { id: "pronto", label: "Pronto", color: "bg-green-500" },
  { id: "entregue", label: "Entregue", color: "bg-emerald-600" },
  { id: "cancelado", label: "Cancelado", color: "bg-red-500" },
];

export { PEDIDO_STATUS };

export function usePedidosLoja(tenantId?: string) {
  return useQuery({
    queryKey: ["loja_pedidos", tenantId],
    queryFn: async () => {
      let query = supabase.from("loja_pedidos" as any).select("*").order("created_at", { ascending: false });
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as LojaPedido[];
    },
  });
}

export function usePedidoItens(pedidoId?: string) {
  return useQuery({
    queryKey: ["loja_pedido_itens", pedidoId],
    enabled: !!pedidoId,
    queryFn: async () => {
      const { data, error } = await supabase.from("loja_pedido_itens" as any).select("*").eq("pedido_id", pedidoId!);
      if (error) throw error;
      return (data || []) as unknown as LojaPedidoItem[];
    },
  });
}

export function useUpdatePedidoStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("loja_pedidos" as any).update({ status, updated_at: new Date().toISOString() } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loja_pedidos"] });
      toast.success("Status atualizado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
