import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Plano {
  id: string;
  nome: string;
  valor: number;
  has_digital: boolean;
  has_visual: boolean;
  has_offset: boolean;
  has_crm_advanced: boolean;
  created_at: string;
  tenants_count?: number;
}

export function usePlanos() {
  return useQuery({
    queryKey: ["planos"],
    queryFn: async () => {
      const { data: planos, error } = await supabase
        .from("planos")
        .select("*")
        .order("valor", { ascending: true });
      if (error) throw error;

      // Count tenants per plan
      const { data: tenants } = await supabase
        .from("tenants")
        .select("plano_id");

      return (planos ?? []).map((p) => ({
        ...p,
        tenants_count: (tenants ?? []).filter((t) => t.plano_id === p.id).length,
      })) as Plano[];
    },
  });
}
