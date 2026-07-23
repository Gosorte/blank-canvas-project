import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Metricas {
  gmv_total: number;
  total_pedidos: number;
  total_tenants_ativos: number;
  total_tenants: number;
  receita_recorrente: number;
  churn_rate: number;
  inadimplentes: number;
}

export function useMetricas() {
  return useQuery({
    queryKey: ["metricas"],
    queryFn: async () => {
      const { data: tenants } = await supabase
        .from("tenants")
        .select("status, pedidos_mes, gmv_mes, plano_id");

      const { data: planos } = await supabase
        .from("planos")
        .select("id, valor");

      const all = tenants ?? [];
      const ativos = all.filter((t) => t.status === "ativo");
      const inadimplentes = all.filter((t) => t.status === "inadimplente").length;

      const planoMap = new Map((planos ?? []).map((p) => [p.id, p.valor]));

      const receita_recorrente = all
        .filter((t) => t.status === "ativo" || t.status === "trial")
        .reduce((sum, t) => sum + (planoMap.get(t.plano_id) ?? 0), 0);

      return {
        gmv_total: all.reduce((s, t) => s + Number(t.gmv_mes), 0),
        total_pedidos: all.reduce((s, t) => s + t.pedidos_mes, 0),
        total_tenants_ativos: ativos.length,
        total_tenants: all.length,
        receita_recorrente,
        churn_rate: all.length > 0 ? Number(((inadimplentes / all.length) * 100).toFixed(1)) : 0,
        inadimplentes,
      } as Metricas;
    },
  });
}
