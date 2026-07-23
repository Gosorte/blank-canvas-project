import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Fornecedor {
  id: string;
  tenant_id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  contato_nome: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  categorias: string[] | null;
  condicao_pagamento: string | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
}

export function useFornecedores(tenantId?: string) {
  return useQuery({
    queryKey: ["fornecedores", tenantId],
    queryFn: async () => {
      let query = supabase.from("fornecedores").select("*").order("razao_social");
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Fornecedor[];
    },
    enabled: !!tenantId,
  });
}

export function useAllFornecedores() {
  return useQuery({
    queryKey: ["fornecedores-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("*, tenants(nome_grafica)")
        .order("razao_social");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateFornecedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (f: Omit<Fornecedor, "id" | "created_at">) => {
      const { data, error } = await supabase.from("fornecedores").insert(f).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fornecedores"] });
      qc.invalidateQueries({ queryKey: ["fornecedores-all"] });
    },
  });
}

export function useDeleteFornecedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fornecedores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fornecedores"] });
      qc.invalidateQueries({ queryKey: ["fornecedores-all"] });
    },
  });
}
