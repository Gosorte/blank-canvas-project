import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientePerfil {
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
  created_at: string;
}

export interface PedidoResumido {
  id: string;
  numero_pedido: number;
  valor_total: number;
  status: string;
  created_at: string;
}

export interface ProdutoFrequente {
  produto_nome: string;
  total_quantidade: number;
  total_pedidos: number;
}

export interface OrdemResumida {
  id: string;
  numero_op: number;
  produto_nome: string;
  status: string;
  setor: string;
  created_at: string;
}

export function useClienteFromContato(contatoId: string | null | undefined) {
  return useQuery({
    queryKey: ["cliente-from-contato", contatoId],
    queryFn: async () => {
      if (!contatoId) return null;
      const { data: contato } = await supabase
        .from("crm_contatos")
        .select("cliente_id")
        .eq("id", contatoId)
        .single();
      if (!contato?.cliente_id) return null;
      const { data } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", contato.cliente_id)
        .single();
      return data as ClientePerfil | null;
    },
    enabled: !!contatoId,
  });
}

export function useClientePedidos(clienteId: string | null | undefined) {
  return useQuery({
    queryKey: ["cliente-pedidos", clienteId],
    queryFn: async () => {
      const { data } = await supabase
        .from("loja_pedidos")
        .select("id, numero_pedido, valor_total, status, created_at")
        .eq("cliente_id", clienteId!)
        .order("created_at", { ascending: false })
        .limit(10);
      return (data ?? []) as PedidoResumido[];
    },
    enabled: !!clienteId,
  });
}

export function useClienteProdutosFrequentes(clienteId: string | null | undefined) {
  return useQuery({
    queryKey: ["cliente-produtos-frequentes", clienteId],
    queryFn: async () => {
      const { data: pedidos } = await supabase
        .from("loja_pedidos")
        .select("id")
        .eq("cliente_id", clienteId!);
      if (!pedidos?.length) return [] as ProdutoFrequente[];
      const pedidoIds = pedidos.map((p) => p.id);
      const { data: itens } = await supabase
        .from("loja_pedido_itens")
        .select("produto_nome, quantidade")
        .in("pedido_id", pedidoIds);
      if (!itens?.length) return [] as ProdutoFrequente[];
      const map = new Map<string, { total_quantidade: number; total_pedidos: number }>();
      for (const item of itens) {
        const existing = map.get(item.produto_nome) || { total_quantidade: 0, total_pedidos: 0 };
        existing.total_quantidade += item.quantidade;
        existing.total_pedidos += 1;
        map.set(item.produto_nome, existing);
      }
      return Array.from(map.entries())
        .map(([produto_nome, stats]) => ({ produto_nome, ...stats }))
        .sort((a, b) => b.total_pedidos - a.total_pedidos)
        .slice(0, 5) as ProdutoFrequente[];
    },
    enabled: !!clienteId,
  });
}

export function useClienteOrdens(clienteId: string | null | undefined) {
  return useQuery({
    queryKey: ["cliente-ordens", clienteId],
    queryFn: async () => {
      const { data } = await supabase
        .from("ordens_producao")
        .select("id, numero_op, produto_nome, status, setor, created_at")
        .eq("cliente_id", clienteId!)
        .order("created_at", { ascending: false })
        .limit(5);
      return (data ?? []) as OrdemResumida[];
    },
    enabled: !!clienteId,
  });
}

export function useClienteOrcamentos(clienteId: string | null | undefined) {
  return useQuery({
    queryKey: ["cliente-orcamentos", clienteId],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_orcamentos")
        .select("id, numero, total, status, created_at")
        .eq("cliente_id", clienteId!)
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!clienteId,
  });
}

export function useContatoInfo(contatoId: string | null | undefined) {
  return useQuery({
    queryKey: ["contato-info", contatoId],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_contatos")
        .select("*")
        .eq("id", contatoId!)
        .single();
      return data;
    },
    enabled: !!contatoId,
  });
}
