import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTenantPublic(tenantId?: string) {
  return useQuery({
    queryKey: ["tenant-public", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, nome_grafica, dominio, status")
        .eq("id", tenantId!)
        .eq("status", "ativo")
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useProdutosPublic(tenantId?: string) {
  return useQuery({
    queryKey: ["produtos-public", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });
}

export function useProdutoPublic(produtoId?: string) {
  return useQuery({
    queryKey: ["produto-public", produtoId],
    enabled: !!produtoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("id", produtoId!)
        .eq("ativo", true)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useAcabamentosPublic(tenantId?: string, tipoModulo?: string) {
  return useQuery({
    queryKey: ["acabamentos-public", tenantId, tipoModulo],
    enabled: !!tenantId,
    queryFn: async () => {
      let q = supabase
        .from("acabamentos")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("ativo", true);
      if (tipoModulo) q = q.eq("tipo_modulo", tipoModulo);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function usePapeisPublic(tenantId?: string) {
  return useQuery({
    queryKey: ["papeis-public", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("papeis")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("ativo", true);
      if (error) throw error;
      return data;
    },
  });
}

export function useSubstratosPublic(tenantId?: string) {
  return useQuery({
    queryKey: ["substratos-public", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("substratos")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("ativo", true);
      if (error) throw error;
      return data;
    },
  });
}

export function useRastrearPedido(numeroPedido?: number, tenantId?: string) {
  return useQuery({
    queryKey: ["rastrear-pedido", numeroPedido, tenantId],
    enabled: !!numeroPedido && !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loja_pedidos")
        .select("*, loja_pedido_itens(*)")
        .eq("tenant_id", tenantId!)
        .eq("numero_pedido", numeroPedido!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
