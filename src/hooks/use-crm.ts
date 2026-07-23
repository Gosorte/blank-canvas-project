import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CrmLead {
  id: string;
  tenant_id: string;
  cliente_id: string | null;
  nome: string;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  origem: string;
  tipo: string;
  setor: string | null;
  status_funil: string;
  valor_estimado: number;
  motivo_perda: string | null;
  observacoes: string | null;
  responsavel_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmAtividade {
  id: string;
  tenant_id: string;
  lead_id: string;
  tipo: string;
  descricao: string;
  data_agendamento: string | null;
  concluida: boolean;
  created_at: string;
}

export interface CrmArquivo {
  id: string;
  tenant_id: string;
  cliente_id: string;
  nome_arquivo: string;
  arquivo_url: string;
  tipo_produto: string | null;
  especificacoes: Record<string, unknown>;
  aprovado: boolean;
  created_at: string;
}

const FUNIL_STAGES = [
  { id: "novo", label: "Novo Lead", color: "bg-blue-500" },
  { id: "contato", label: "Primeiro Contato", color: "bg-yellow-500" },
  { id: "orcamento", label: "Orçamento Enviado", color: "bg-orange-500" },
  { id: "negociacao", label: "Negociação", color: "bg-purple-500" },
  { id: "ganho", label: "Fechado/Ganho", color: "bg-green-500" },
  { id: "perdido", label: "Fechado/Perdido", color: "bg-red-500" },
];

export { FUNIL_STAGES };

export function useLeads(tenantId?: string) {
  return useQuery({
    queryKey: ["crm_leads", tenantId],
    queryFn: async () => {
      let query = supabase.from("crm_leads" as any).select("*").order("created_at", { ascending: false });
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as CrmLead[];
    },
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lead: Partial<CrmLead>) => {
      const { data, error } = await supabase.from("crm_leads" as any).insert(lead as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm_leads"] });
      toast.success("Lead criado com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmLead> & { id: string }) => {
      const { error } = await supabase.from("crm_leads" as any).update({ ...updates, updated_at: new Date().toISOString() } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm_leads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_leads" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm_leads"] });
      toast.success("Lead removido!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAtividades(leadId?: string) {
  return useQuery({
    queryKey: ["crm_atividades", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_atividades" as any).select("*").eq("lead_id", leadId!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CrmAtividade[];
    },
  });
}

export function useCreateAtividade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (atividade: Partial<CrmAtividade>) => {
      const { error } = await supabase.from("crm_atividades" as any).insert(atividade as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm_atividades"] });
      toast.success("Atividade registrada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useArquivosCliente(clienteId?: string) {
  return useQuery({
    queryKey: ["crm_arquivos", clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_arquivos" as any).select("*").eq("cliente_id", clienteId!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CrmArquivo[];
    },
  });
}
