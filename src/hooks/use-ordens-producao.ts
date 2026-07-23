import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OrdemProducao {
  id: string;
  tenant_id: string;
  numero_op: number;
  cliente_id: string | null;
  setor: string;
  status: string;
  prioridade: string;
  produto_nome: string;
  especificacoes: Record<string, any>;
  quantidade: number;
  valor_total: number;
  data_entrega: string | null;
  observacoes: string | null;
  arquivo_url: string | null;
  created_at: string;
  updated_at: string;
}

export const OP_STATUS = [
  { value: "aguardando", label: "Aguardando", color: "bg-muted text-muted-foreground" },
  { value: "arte", label: "Arte/Criação", color: "bg-blue-500/10 text-blue-600" },
  { value: "aprovado", label: "Aprovado", color: "bg-cyan-500/10 text-cyan-600" },
  { value: "producao", label: "Em Produção", color: "bg-amber-500/10 text-amber-600" },
  { value: "acabamento", label: "Acabamento", color: "bg-purple-500/10 text-purple-600" },
  { value: "pronto", label: "Pronto", color: "bg-emerald-500/10 text-emerald-600" },
  { value: "entregue", label: "Entregue", color: "bg-green-500/10 text-green-700" },
  { value: "cancelado", label: "Cancelado", color: "bg-destructive/10 text-destructive" },
];

export const PRIORIDADES = [
  { value: "baixa", label: "Baixa", color: "text-muted-foreground" },
  { value: "normal", label: "Normal", color: "text-foreground" },
  { value: "alta", label: "Alta", color: "text-amber-600" },
  { value: "urgente", label: "Urgente", color: "text-destructive" },
];

export function useOrdensProducao(tenantId?: string) {
  return useQuery({
    queryKey: ["ordens-producao", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("ordens_producao")
        .select("*, clientes(nome)")
        .order("created_at", { ascending: false });
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useAllOrdensProducao() {
  return useQuery({
    queryKey: ["ordens-producao-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordens_producao")
        .select("*, clientes(nome), tenants(nome_grafica)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateOrdemProducao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (op: Omit<OrdemProducao, "id" | "numero_op" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("ordens_producao").insert(op).select().single();
      if (error) throw error;
      // Registrar histórico
      await supabase.from("op_historico").insert({
        op_id: data.id,
        status_novo: op.status,
        observacao: "OP criada",
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ordens-producao"] });
      qc.invalidateQueries({ queryKey: ["ordens-producao-all"] });
    },
  });
}

export function useUpdateOrdemProducao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OrdemProducao> & { id: string }) => {
      const { data: current } = await supabase.from("ordens_producao").select("status").eq("id", id).single();
      const { data, error } = await supabase
        .from("ordens_producao")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      // Registrar mudança de status
      if (updates.status && current && current.status !== updates.status) {
        await supabase.from("op_historico").insert({
          op_id: id,
          status_anterior: current.status,
          status_novo: updates.status,
        });
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ordens-producao"] });
      qc.invalidateQueries({ queryKey: ["ordens-producao-all"] });
    },
  });
}

export function useDeleteOrdemProducao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ordens_producao").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ordens-producao"] });
      qc.invalidateQueries({ queryKey: ["ordens-producao-all"] });
    },
  });
}
