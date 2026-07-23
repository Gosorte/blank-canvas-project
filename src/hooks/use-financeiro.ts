import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContaPagar {
  id: string;
  tenant_id: string;
  fornecedor_id: string | null;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  categoria: string | null;
  forma_pagamento: string | null;
  observacoes: string | null;
  created_at: string;
}

export interface ContaReceber {
  id: string;
  tenant_id: string;
  cliente_id: string | null;
  op_id: string | null;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_recebimento: string | null;
  status: string;
  forma_pagamento: string | null;
  observacoes: string | null;
  created_at: string;
}

export function useContasPagar(tenantId?: string) {
  return useQuery({
    queryKey: ["contas-pagar", tenantId],
    queryFn: async () => {
      let query = supabase.from("contas_pagar").select("*, fornecedores(razao_social)").order("data_vencimento");
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useContasReceber(tenantId?: string) {
  return useQuery({
    queryKey: ["contas-receber", tenantId],
    queryFn: async () => {
      let query = supabase.from("contas_receber").select("*, clientes(nome)").order("data_vencimento");
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useAllContasPagar() {
  return useQuery({
    queryKey: ["contas-pagar-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contas_pagar")
        .select("*, fornecedores(razao_social), tenants(nome_grafica)")
        .order("data_vencimento");
      if (error) throw error;
      return data;
    },
  });
}

export function useAllContasReceber() {
  return useQuery({
    queryKey: ["contas-receber-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contas_receber")
        .select("*, clientes(nome), tenants(nome_grafica)")
        .order("data_vencimento");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateContaPagar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Omit<ContaPagar, "id" | "created_at">) => {
      const { data, error } = await supabase.from("contas_pagar").insert(c).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contas-pagar"] });
      qc.invalidateQueries({ queryKey: ["contas-pagar-all"] });
    },
  });
}

export function useCreateContaReceber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Omit<ContaReceber, "id" | "created_at">) => {
      const { data, error } = await supabase.from("contas_receber").insert(c).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contas-receber"] });
      qc.invalidateQueries({ queryKey: ["contas-receber-all"] });
    },
  });
}

export function useUpdateContaPagar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContaPagar> & { id: string }) => {
      const { data, error } = await supabase.from("contas_pagar").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contas-pagar"] });
      qc.invalidateQueries({ queryKey: ["contas-pagar-all"] });
    },
  });
}

export function useUpdateContaReceber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContaReceber> & { id: string }) => {
      const { data, error } = await supabase.from("contas_receber").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contas-receber"] });
      qc.invalidateQueries({ queryKey: ["contas-receber-all"] });
    },
  });
}
