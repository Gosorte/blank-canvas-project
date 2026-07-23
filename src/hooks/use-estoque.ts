import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ItemEstoque {
  id: string;
  tenant_id: string;
  nome: string;
  categoria: string;
  unidade: string;
  quantidade: number;
  quantidade_minima: number;
  custo_unitario: number;
  fornecedor_id: string | null;
  localizacao: string | null;
  observacoes: string | null;
  ativo: boolean;
  updated_at: string;
  created_at: string;
}

export interface Movimentacao {
  id: string;
  tenant_id: string;
  estoque_id: string;
  tipo: string;
  quantidade: number;
  motivo: string | null;
  referencia_id: string | null;
  observacoes: string | null;
  valor_total: number;
  created_at: string;
}

// Estoque filtrado por tenant ativo
export function useEstoque(tenantId?: string) {
  return useQuery({
    queryKey: ["estoque", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("estoque")
        .select("*, fornecedores(razao_social)")
        .eq("ativo", true)
        .order("nome");
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

// Todos os itens (master admin)
export function useAllEstoque() {
  return useQuery({
    queryKey: ["estoque-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estoque")
        .select("*, tenants(nome_grafica), fornecedores(razao_social)")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });
}

// Movimentações de um item específico
export function useMovimentacoes(estoqueId?: string) {
  return useQuery({
    queryKey: ["movimentacoes", estoqueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estoque_movimentacoes")
        .select("*")
        .eq("estoque_id", estoqueId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!estoqueId,
  });
}

// Movimentações do dia (para dashboard)
export function useMovimentacoesDia(tenantId?: string) {
  return useQuery({
    queryKey: ["movimentacoes-dia", tenantId],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];
      let query = supabase
        .from("estoque_movimentacoes")
        .select("*, estoque(nome, unidade)")
        .gte("created_at", `${hoje}T00:00:00`)
        .lte("created_at", `${hoje}T23:59:59`)
        .order("created_at", { ascending: false });
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

// Todas as movimentações com filtro de período
export function useMovimentacoesPeriodo(tenantId?: string, dataInicio?: string, dataFim?: string) {
  return useQuery({
    queryKey: ["movimentacoes-periodo", tenantId, dataInicio, dataFim],
    queryFn: async () => {
      let query = supabase
        .from("estoque_movimentacoes")
        .select("*, estoque(nome, unidade, categoria)")
        .order("created_at", { ascending: false });
      if (tenantId) query = query.eq("tenant_id", tenantId);
      if (dataInicio) query = query.gte("created_at", `${dataInicio}T00:00:00`);
      if (dataFim) query = query.lte("created_at", `${dataFim}T23:59:59`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

// Produtos vinculados ao estoque
export function useProdutosVinculados(tenantId?: string) {
  return useQuery({
    queryKey: ["produtos-vinculados-estoque", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("produtos")
        .select("id, nome, tipo_modulo, estoque_id, bloquear_sem_estoque, ativo")
        .eq("ativo", true);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useCreateItemEstoque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<ItemEstoque, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("estoque").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estoque"] });
      qc.invalidateQueries({ queryKey: ["estoque-all"] });
    },
  });
}

export function useUpdateItemEstoque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<ItemEstoque>) => {
      const { data, error } = await supabase
        .from("estoque")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estoque"] });
      qc.invalidateQueries({ queryKey: ["estoque-all"] });
    },
  });
}

export function useCreateMovimentacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mov: Omit<Movimentacao, "id" | "created_at">) => {
      const { data, error } = await supabase.from("estoque_movimentacoes").insert(mov).select().single();
      if (error) throw error;
      // Atualizar quantidade do item
      const { data: item } = await supabase.from("estoque").select("quantidade").eq("id", mov.estoque_id).single();
      if (item) {
        let novaQtd: number;
        if (mov.tipo === "entrada") {
          novaQtd = Number(item.quantidade) + mov.quantidade;
        } else if (mov.tipo === "ajuste") {
          novaQtd = mov.quantidade; // Ajuste define valor absoluto
        } else {
          novaQtd = Number(item.quantidade) - mov.quantidade;
        }
        await supabase.from("estoque").update({ quantidade: Math.max(0, novaQtd), updated_at: new Date().toISOString() }).eq("id", mov.estoque_id);
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estoque"] });
      qc.invalidateQueries({ queryKey: ["estoque-all"] });
      qc.invalidateQueries({ queryKey: ["movimentacoes"] });
      qc.invalidateQueries({ queryKey: ["movimentacoes-dia"] });
      qc.invalidateQueries({ queryKey: ["movimentacoes-periodo"] });
    },
  });
}

export function useDeleteItemEstoque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("estoque").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estoque"] });
      qc.invalidateQueries({ queryKey: ["estoque-all"] });
    },
  });
}

// Vincular/desvincular produto ao estoque
export function useVincularProdutoEstoque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ produtoId, estoqueId, bloquear }: { produtoId: string; estoqueId: string | null; bloquear: boolean }) => {
      const { error } = await supabase
        .from("produtos")
        .update({ estoque_id: estoqueId, bloquear_sem_estoque: bloquear } as any)
        .eq("id", produtoId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["produtos-vinculados-estoque"] });
      qc.invalidateQueries({ queryKey: ["produtos"] });
    },
  });
}
