import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/use-tenant";

export function useMaquinas(tipoModulo?: string) {
  const { activeTenantId } = useTenant();
  return useQuery({
    queryKey: ["maquinas", activeTenantId, tipoModulo],
    enabled: !!activeTenantId,
    queryFn: async () => {
      let q = supabase.from("maquinas").select("*").eq("tenant_id", activeTenantId!);
      if (tipoModulo) q = q.eq("tipo_modulo", tipoModulo);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateMaquina() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      const { data, error } = await supabase.from("maquinas").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maquinas"] }),
  });
}

export function useUpdateMaquina() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: any) => {
      const { data, error } = await supabase.from("maquinas").update(values).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maquinas"] }),
  });
}

export function useDeleteMaquina() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("maquinas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maquinas"] }),
  });
}
