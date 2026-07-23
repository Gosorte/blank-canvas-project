import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "./use-tenant";

export interface Transportadora {
  id: string;
  tenant_id: string;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  contato_nome: string | null;
  cidade: string | null;
  estado: string | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export function useTransportadoras() {
  const { activeTenantId } = useTenant();
  return useQuery({
    queryKey: ["transportadoras", activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transportadoras")
        .select("*")
        .eq("tenant_id", activeTenantId!)
        .order("nome");
      if (error) throw error;
      return data as Transportadora[];
    },
    enabled: !!activeTenantId,
  });
}

export function useCreateTransportadora() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Omit<Transportadora, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("transportadoras").insert(t).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transportadoras"] }),
  });
}

export function useUpdateTransportadora() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transportadora> & { id: string }) => {
      const { data, error } = await supabase.from("transportadoras").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transportadoras"] }),
  });
}

export function useDeleteTransportadora() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transportadoras").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transportadoras"] }),
  });
}
