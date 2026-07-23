import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FormaPagamento {
  id: string;
  tenant_id: string;
  nome: string;
  tipo: string;
  icone: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
}

export function useFormasPagamento(tenantId?: string) {
  return useQuery({
    queryKey: ["formas-pagamento", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formas_pagamento" as any)
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("ativo", true)
        .order("ordem");
      if (error) throw error;
      return (data || []) as unknown as FormaPagamento[];
    },
    enabled: !!tenantId,
  });
}

export function useAllFormasPagamento(tenantId?: string) {
  return useQuery({
    queryKey: ["formas-pagamento-all", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formas_pagamento" as any)
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("ordem");
      if (error) throw error;
      return (data || []) as unknown as FormaPagamento[];
    },
    enabled: !!tenantId,
  });
}

export function useCreateFormaPagamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fp: Omit<FormaPagamento, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("formas_pagamento" as any)
        .insert(fp as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["formas-pagamento"] });
      qc.invalidateQueries({ queryKey: ["formas-pagamento-all"] });
    },
  });
}

export function useUpdateFormaPagamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FormaPagamento> & { id: string }) => {
      const { data, error } = await supabase
        .from("formas_pagamento" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["formas-pagamento"] });
      qc.invalidateQueries({ queryKey: ["formas-pagamento-all"] });
    },
  });
}

export function useDeleteFormaPagamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("formas_pagamento" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["formas-pagamento"] });
      qc.invalidateQueries({ queryKey: ["formas-pagamento-all"] });
    },
  });
}
