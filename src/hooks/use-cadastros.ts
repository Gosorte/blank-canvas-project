import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "./use-tenant";

export interface CadastroUnificado {
  id: string;
  tenant_id: string;
  nome: string;
  tipo_pessoa: string;
  cpf_cnpj: string | null;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  observacoes: string | null;
  ativo: boolean;
  roles: string[];
  origem: string | null;
  segmento: string | null;
  razao_social: string | null;
  contato_nome: string | null;
  created_at: string;
}

export const ROLE_OPTIONS = [
  { value: "cliente", label: "Cliente", color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  { value: "fornecedor", label: "Fornecedor", color: "bg-green-500/10 text-green-600 border-green-500/30" },
  { value: "vendedor", label: "Vendedor", color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  { value: "funcionario", label: "Funcionário", color: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
  { value: "parceiro", label: "Parceiro", color: "bg-pink-500/10 text-pink-600 border-pink-500/30" },
  { value: "transportadora", label: "Transportadora", color: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
] as const;

export const ROLE_COLORS: Record<string, string> = Object.fromEntries(
  ROLE_OPTIONS.map((r) => [r.value, r.color.split(" ").slice(0, 2).join(" ")])
);

export const ORIGENS = [
  "Indicação", "Site", "Instagram", "Facebook", "WhatsApp", "Telefone", "Visita", "Balcão", "Outro",
];

export const SEGMENTOS = [
  "Restaurante", "Imobiliária", "Loja", "Escritório", "Saúde",
  "Educação", "Eventos", "Construção", "Beleza", "Automotivo", "Outro",
];

export function useCadastros() {
  const { activeTenantId } = useTenant();
  return useQuery({
    queryKey: ["cadastros", activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("tenant_id", activeTenantId!)
        .order("nome");
      if (error) throw error;
      return data as unknown as CadastroUnificado[];
    },
    enabled: !!activeTenantId,
  });
}

export function useCadastroById(id: string | undefined) {
  return useQuery({
    queryKey: ["cadastro", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as CadastroUnificado;
    },
    enabled: !!id,
  });
}

export function useCreateCadastro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Omit<CadastroUnificado, "id" | "created_at">) => {
      const { data, error } = await supabase.from("clientes").insert(c as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cadastros"] });
      qc.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export function useUpdateCadastro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CadastroUnificado> & { id: string }) => {
      const { data, error } = await supabase.from("clientes").update(updates as any).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["cadastros"] });
      qc.invalidateQueries({ queryKey: ["cadastro", id] });
      qc.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export function useDeleteCadastro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cadastros"] });
      qc.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export async function checkDuplicate(
  field: "cpf_cnpj" | "telefone" | "whatsapp",
  value: string,
  tenantId: string,
  excludeId?: string
) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  let query = supabase.from("clientes").select("*").eq(field, trimmed).eq("tenant_id", tenantId);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query.limit(1);
  return data && data.length > 0 ? (data[0] as unknown as CadastroUnificado) : null;
}
