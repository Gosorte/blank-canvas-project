import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "./use-tenant";

export interface Grupo {
  id: string;
  tenant_id: string;
  nome: string;
  descricao: string | null;
  permissoes: string[];
  created_at: string;
}

/** @deprecated Use Grupo instead */
export type Cargo = Grupo;

// All available permission keys matching sidebar group titles
export const PERMISSOES_DISPONIVEIS = [
  { key: "dashboard", label: "Dashboard", modulo: "erp" },
  { key: "vendas", label: "Vendas", modulo: "erp" },
  { key: "financeiro", label: "Financeiro", modulo: "erp" },
  { key: "estoque", label: "Estoque", modulo: "erp" },
  { key: "offset", label: "Offset", modulo: "erp" },
  { key: "digital", label: "Digital", modulo: "erp" },
  { key: "comunicacao_visual", label: "Comunicação Visual", modulo: "erp" },
  { key: "cadastros", label: "Cadastros Gerais", modulo: "erp" },
  { key: "relatorios", label: "Relatórios", modulo: "erp" },
  { key: "configuracoes", label: "Configurações", modulo: "erp" },
  { key: "crm", label: "CRM", modulo: "crm" },
  { key: "ecommerce", label: "E-commerce", modulo: "ecommerce" },
] as const;

export type PermissaoKey = typeof PERMISSOES_DISPONIVEIS[number]["key"];

export function useGrupos() {
  const { activeTenantId } = useTenant();
  return useQuery({
    queryKey: ["grupos", activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cargos" as any)
        .select("*")
        .eq("tenant_id", activeTenantId!)
        .order("nome");
      if (error) throw error;
      return (data || []) as unknown as Grupo[];
    },
    enabled: !!activeTenantId,
  });
}

/** @deprecated Use useGrupos */
export const useCargos = useGrupos;

export function useCreateGrupo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (grupo: { tenant_id: string; nome: string; descricao?: string; permissoes: string[] }) => {
      const { data, error } = await supabase
        .from("cargos" as any)
        .insert(grupo)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["grupos"] }),
  });
}

/** @deprecated Use useCreateGrupo */
export const useCreateCargo = useCreateGrupo;

export function useUpdateGrupo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; nome?: string; descricao?: string; permissoes?: string[] }) => {
      const { error } = await supabase
        .from("cargos" as any)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["grupos"] }),
  });
}

/** @deprecated Use useUpdateGrupo */
export const useUpdateCargo = useUpdateGrupo;

export function useDeleteGrupo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cargos" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["grupos"] }),
  });
}

/** @deprecated Use useDeleteGrupo */
export const useDeleteCargo = useDeleteGrupo;
