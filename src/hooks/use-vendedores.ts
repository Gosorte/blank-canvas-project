import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "./use-tenant";

export interface Vendedor {
  id: string;
  tenant_id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  comissao_percentual: number;
  ativo: boolean;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export function useVendedores() {
  const { activeTenantId } = useTenant();
  return useQuery({
    queryKey: ["vendedores", activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendedores")
        .select("*")
        .eq("tenant_id", activeTenantId!)
        .order("nome");
      if (error) throw error;
      return data as Vendedor[];
    },
    enabled: !!activeTenantId,
  });
}

export function useCreateVendedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: Omit<Vendedor, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("vendedores").insert(v).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendedores"] }),
  });
}

export function useUpdateVendedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Vendedor> & { id: string }) => {
      const { data, error } = await supabase.from("vendedores").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendedores"] }),
  });
}

export function useDeleteVendedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendedores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendedores"] }),
  });
}
