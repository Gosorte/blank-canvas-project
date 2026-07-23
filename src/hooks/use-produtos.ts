import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Produto {
  id: string;
  tenant_id: string;
  tipo_modulo: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  preco_minimo: number;
  custo_clique: number;
  custo_acabamento: number;
  custo_chapa: number;
  custo_milheiro: number;
  custo_setup: number;
  escala_minima: number;
  custo_m2: number;
  substrato: string;
  custo_estrutura: number;
  markup: number;
  created_at: string;
}

export function useProdutos(tenantId?: string) {
  return useQuery({
    queryKey: ["produtos", tenantId],
    queryFn: async () => {
      let query = supabase.from("produtos").select("*").order("created_at", { ascending: false });
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Produto[];
    },
    enabled: !!tenantId,
  });
}

export function useAllProdutos() {
  return useQuery({
    queryKey: ["produtos-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*, tenants(nome_grafica)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (produto: Omit<Produto, "id" | "created_at">) => {
      const { data, error } = await supabase.from("produtos").insert(produto).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      queryClient.invalidateQueries({ queryKey: ["produtos-all"] });
    },
  });
}

export function useUpdateProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Produto> & { id: string }) => {
      const { data, error } = await supabase.from("produtos").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      queryClient.invalidateQueries({ queryKey: ["produtos-all"] });
    },
  });
}

export function useDeleteProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("produtos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      queryClient.invalidateQueries({ queryKey: ["produtos-all"] });
    },
  });
}

export function useCalcularPreco() {
  return useMutation({
    mutationFn: async (params: {
      tenant_id: string;
      produto_id: string;
      quantidade_folhas?: number;
      quantidade_milheiros?: number;
      num_chapas?: number;
      largura_m?: number;
      altura_m?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke("calcular-preco", {
        body: params,
      });
      if (error) throw error;
      return data;
    },
  });
}
