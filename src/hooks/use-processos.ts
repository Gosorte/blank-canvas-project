import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/use-tenant";

export function useProcessos(tipoModulo?: string) {
  const { activeTenantId } = useTenant();
  return useQuery({
    queryKey: ["processos_producao", activeTenantId, tipoModulo],
    enabled: !!activeTenantId,
    queryFn: async () => {
      let q = supabase.from("processos_producao").select("*, maquinas(nome)").eq("tenant_id", activeTenantId!);
      if (tipoModulo) q = q.eq("tipo_modulo", tipoModulo);
      const { data, error } = await q.order("ordem", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateProcesso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      const { data, error } = await supabase.from("processos_producao").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["processos_producao"] }),
  });
}

export function useUpdateProcesso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: any) => {
      const { data, error } = await supabase.from("processos_producao").update(values).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["processos_producao"] }),
  });
}

export function useDeleteProcesso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("processos_producao").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["processos_producao"] }),
  });
}
