import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FaturamentoGeral {
  totalFaturado: number;
  totalOrcamentos: number;
  totalPedidos: number;
  ticketMedio: number;
  porModulo: { modulo: string; valor: number; qtd: number }[];
  porMes: { mes: string; label: string; valor: number }[];
  porOrigem: { origem: string; valor: number; qtd: number }[];
}

export interface VendasConversao {
  totalOrcamentos: number;
  orcamentosAprovados: number;
  taxaConversao: number;
  ticketMedio: number;
  rankingClientes: { nome: string; total: number; qtd: number }[];
  rankingVendedores: { nome: string; total: number; qtd: number }[];
  conversaoPorMes: { mes: string; label: string; total: number; aprovados: number; taxa: number }[];
}

export interface ProducaoOPs {
  totalOPs: number;
  opsConcluidas: number;
  opsEmAndamento: number;
  opsAguardando: number;
  porSetor: { setor: string; total: number; concluidas: number }[];
  porStatus: { status: string; qtd: number }[];
  porMes: { mes: string; label: string; qtd: number }[];
}

export interface EstoqueConsumo {
  totalItens: number;
  valorTotal: number;
  itensAlerta: number;
  totalMovimentacoes: number;
  maisConsumidos: { nome: string; categoria: string; quantidade: number; unidade: string }[];
  custoPorCategoria: { categoria: string; custo: number; itens: number }[];
  movimentacoesPorMes: { mes: string; label: string; entradas: number; saidas: number }[];
}

const mesesNome: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
};

function getDateRange(dias: number) {
  const fim = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - dias);
  return { inicio: inicio.toISOString(), fim: fim.toISOString() };
}

function getMesLabel(dateStr: string) {
  const [ano, mes] = dateStr.split('-');
  return `${mesesNome[mes] || mes}/${ano?.slice(2)}`;
}

export function useRelatorioFaturamento(tenantId?: string, dias = 90) {
  return useQuery({
    queryKey: ["relatorio-faturamento", tenantId, dias],
    queryFn: async (): Promise<FaturamentoGeral> => {
      const { inicio } = getDateRange(dias);

      // ERP orçamentos aprovados/fechados
      const { data: erpOrc } = await supabase
        .from("erp_orcamentos")
        .select("valor_total, categoria, created_at, cliente_nome, vendedor, origem")
        .eq("tenant_id", tenantId!)
        .in("status", ["Aprovado", "Fechado", "Entregue"])
        .gte("created_at", inicio);

      // PDV vendas
      const { data: pdvVendas } = await supabase
        .from("pdv_vendas" as any)
        .select("valor_total, created_at")
        .eq("tenant_id", tenantId!)
        .gte("created_at", inicio);

      // CRM orçamentos aprovados
      const { data: crmOrc } = await supabase
        .from("crm_orcamentos")
        .select("total, created_at")
        .eq("tenant_id", tenantId!)
        .eq("status", "aprovado")
        .gte("created_at", inicio);

      // Loja pedidos pagos
      const { data: lojaPed } = await supabase
        .from("loja_pedidos")
        .select("valor_total, created_at")
        .eq("tenant_id", tenantId!)
        .in("status", ["pago", "em_producao", "pronto", "entregue"])
        .gte("created_at", inicio);

      const erp = erpOrc ?? [];
      const pdv = (pdvVendas ?? []) as any[];
      const crm = crmOrc ?? [];
      const loja = lojaPed ?? [];

      // Por módulo
      const erpTotal = erp.reduce((s, o) => s + Number(o.valor_total || 0), 0);
      const pdvTotal = pdv.reduce((s, v) => s + Number(v.valor_total || 0), 0);
      const crmTotal = crm.reduce((s, o) => s + Number(o.total || 0), 0);
      const lojaTotal = loja.reduce((s, p) => s + Number(p.valor_total || 0), 0);

      const totalFaturado = erpTotal + pdvTotal + crmTotal + lojaTotal;
      const totalPedidos = erp.length + pdv.length + crm.length + loja.length;

      // Por mês (últimos 6 meses dos ERP)
      const mesMap = new Map<string, number>();
      [...erp, ...pdv, ...crm, ...loja].forEach((item: any) => {
        const mes = (item.created_at as string).slice(0, 7);
        const val = Number(item.valor_total || item.total || 0);
        mesMap.set(mes, (mesMap.get(mes) || 0) + val);
      });
      const porMes = Array.from(mesMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mes, valor]) => ({ mes, label: getMesLabel(mes), valor }));

      // Por categoria (offset, digital, visual)
      const catMap = new Map<string, { valor: number; qtd: number }>();
      erp.forEach(o => {
        const cat = o.categoria || 'digital';
        const cur = catMap.get(cat) || { valor: 0, qtd: 0 };
        catMap.set(cat, { valor: cur.valor + Number(o.valor_total || 0), qtd: cur.qtd + 1 });
      });

      // Por origem
      const origemMap = new Map<string, { valor: number; qtd: number }>();
      const addOrigem = (nome: string, val: number) => {
        const cur = origemMap.get(nome) || { valor: 0, qtd: 0 };
        origemMap.set(nome, { valor: cur.valor + val, qtd: cur.qtd + 1 });
      };
      erp.forEach(o => addOrigem("ERP", Number(o.valor_total || 0)));
      pdv.forEach(v => addOrigem("PDV", Number(v.valor_total || 0)));
      crm.forEach(o => addOrigem("CRM", Number(o.total || 0)));
      loja.forEach(p => addOrigem("Loja", Number(p.valor_total || 0)));

      return {
        totalFaturado,
        totalOrcamentos: erp.length + crm.length,
        totalPedidos,
        ticketMedio: totalPedidos > 0 ? totalFaturado / totalPedidos : 0,
        porModulo: [
          { modulo: "ERP", valor: erpTotal, qtd: erp.length },
          { modulo: "PDV", valor: pdvTotal, qtd: pdv.length },
          { modulo: "CRM", valor: crmTotal, qtd: crm.length },
          { modulo: "Loja", valor: lojaTotal, qtd: loja.length },
        ].filter(m => m.valor > 0),
        porMes,
        porOrigem: Array.from(origemMap.entries()).map(([origem, v]) => ({ origem, ...v })),
      };
    },
    enabled: !!tenantId,
  });
}

export function useRelatorioVendas(tenantId?: string, dias = 90) {
  return useQuery({
    queryKey: ["relatorio-vendas", tenantId, dias],
    queryFn: async (): Promise<VendasConversao> => {
      const { inicio } = getDateRange(dias);

      const { data: orcamentos } = await supabase
        .from("erp_orcamentos")
        .select("id, status, valor_total, cliente_nome, vendedor, created_at")
        .eq("tenant_id", tenantId!)
        .gte("created_at", inicio);

      const orc = orcamentos ?? [];
      const aprovados = orc.filter(o => ["Aprovado", "Fechado", "Entregue"].includes(o.status));
      const taxaConversao = orc.length > 0 ? (aprovados.length / orc.length) * 100 : 0;
      const totalAprovado = aprovados.reduce((s, o) => s + Number(o.valor_total || 0), 0);

      // Ranking clientes
      const clienteMap = new Map<string, { total: number; qtd: number }>();
      aprovados.forEach(o => {
        const nome = o.cliente_nome || 'Sem nome';
        const cur = clienteMap.get(nome) || { total: 0, qtd: 0 };
        clienteMap.set(nome, { total: cur.total + Number(o.valor_total || 0), qtd: cur.qtd + 1 });
      });
      const rankingClientes = Array.from(clienteMap.entries())
        .map(([nome, v]) => ({ nome, ...v }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      // Ranking vendedores
      const vendedorMap = new Map<string, { total: number; qtd: number }>();
      aprovados.forEach(o => {
        const nome = o.vendedor || 'Sem vendedor';
        const cur = vendedorMap.get(nome) || { total: 0, qtd: 0 };
        vendedorMap.set(nome, { total: cur.total + Number(o.valor_total || 0), qtd: cur.qtd + 1 });
      });
      const rankingVendedores = Array.from(vendedorMap.entries())
        .map(([nome, v]) => ({ nome, ...v }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      // Conversão por mês
      const mesMap = new Map<string, { total: number; aprovados: number }>();
      orc.forEach(o => {
        const mes = (o.created_at as string).slice(0, 7);
        const cur = mesMap.get(mes) || { total: 0, aprovados: 0 };
        cur.total++;
        if (["Aprovado", "Fechado", "Entregue"].includes(o.status)) cur.aprovados++;
        mesMap.set(mes, cur);
      });
      const conversaoPorMes = Array.from(mesMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mes, v]) => ({
          mes,
          label: getMesLabel(mes),
          total: v.total,
          aprovados: v.aprovados,
          taxa: v.total > 0 ? +((v.aprovados / v.total) * 100).toFixed(1) : 0,
        }));

      return {
        totalOrcamentos: orc.length,
        orcamentosAprovados: aprovados.length,
        taxaConversao: +taxaConversao.toFixed(1),
        ticketMedio: aprovados.length > 0 ? totalAprovado / aprovados.length : 0,
        rankingClientes,
        rankingVendedores,
        conversaoPorMes,
      };
    },
    enabled: !!tenantId,
  });
}

export function useRelatorioProducao(tenantId?: string, dias = 90) {
  return useQuery({
    queryKey: ["relatorio-producao", tenantId, dias],
    queryFn: async (): Promise<ProducaoOPs> => {
      const { inicio } = getDateRange(dias);

      const { data: ops } = await supabase
        .from("ordens_producao")
        .select("id, setor, status, created_at")
        .eq("tenant_id", tenantId!)
        .gte("created_at", inicio);

      const all = ops ?? [];
      const concluidas = all.filter(o => o.status === "concluida");
      const emAndamento = all.filter(o => ["em_producao", "acabamento"].includes(o.status));
      const aguardando = all.filter(o => o.status === "aguardando");

      // Por setor
      const setorMap = new Map<string, { total: number; concluidas: number }>();
      all.forEach(o => {
        const setor = o.setor || 'digital';
        const cur = setorMap.get(setor) || { total: 0, concluidas: 0 };
        cur.total++;
        if (o.status === "concluida") cur.concluidas++;
        setorMap.set(setor, cur);
      });

      // Por status
      const statusMap = new Map<string, number>();
      all.forEach(o => statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1));

      // Por mês
      const mesMap = new Map<string, number>();
      all.forEach(o => {
        const mes = (o.created_at as string).slice(0, 7);
        mesMap.set(mes, (mesMap.get(mes) || 0) + 1);
      });

      return {
        totalOPs: all.length,
        opsConcluidas: concluidas.length,
        opsEmAndamento: emAndamento.length,
        opsAguardando: aguardando.length,
        porSetor: Array.from(setorMap.entries()).map(([setor, v]) => ({ setor, ...v })),
        porStatus: Array.from(statusMap.entries()).map(([status, qtd]) => ({ status, qtd })),
        porMes: Array.from(mesMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([mes, qtd]) => ({ mes, label: getMesLabel(mes), qtd })),
      };
    },
    enabled: !!tenantId,
  });
}

export function useRelatorioEstoque(tenantId?: string, dias = 90) {
  return useQuery({
    queryKey: ["relatorio-estoque", tenantId, dias],
    queryFn: async (): Promise<EstoqueConsumo> => {
      const { inicio } = getDateRange(dias);

      const { data: itens } = await supabase
        .from("estoque")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("ativo", true);

      const { data: movs } = await supabase
        .from("estoque_movimentacoes")
        .select("*, estoque(nome, categoria, unidade)")
        .eq("tenant_id", tenantId!)
        .gte("created_at", inicio)
        .order("created_at", { ascending: false });

      const allItens = itens ?? [];
      const allMovs = movs ?? [];

      const valorTotal = allItens.reduce((s, i) => s + Number(i.quantidade) * Number(i.custo_unitario), 0);
      const itensAlerta = allItens.filter(i => Number(i.quantidade) <= Number(i.quantidade_minima)).length;

      // Mais consumidos (saídas)
      const consumoMap = new Map<string, { quantidade: number; unidade: string; categoria: string }>();
      allMovs.filter(m => m.tipo === 'saida').forEach((m: any) => {
        const nome = m.estoque?.nome || 'Item';
        const cur = consumoMap.get(nome) || { quantidade: 0, unidade: m.estoque?.unidade || 'un', categoria: m.estoque?.categoria || '' };
        cur.quantidade += Number(m.quantidade);
        consumoMap.set(nome, cur);
      });
      const maisConsumidos = Array.from(consumoMap.entries())
        .map(([nome, v]) => ({ nome, ...v }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 10);

      // Custo por categoria
      const catMap = new Map<string, { custo: number; itens: number }>();
      allItens.forEach(i => {
        const cat = i.categoria || 'Outros';
        const cur = catMap.get(cat) || { custo: 0, itens: 0 };
        cur.custo += Number(i.quantidade) * Number(i.custo_unitario);
        cur.itens++;
        catMap.set(cat, cur);
      });

      // Movimentações por mês
      const mesMap = new Map<string, { entradas: number; saidas: number }>();
      allMovs.forEach(m => {
        const mes = (m.created_at as string).slice(0, 7);
        const cur = mesMap.get(mes) || { entradas: 0, saidas: 0 };
        if (m.tipo === 'entrada') cur.entradas += Number(m.quantidade);
        else if (m.tipo === 'saida') cur.saidas += Number(m.quantidade);
        mesMap.set(mes, cur);
      });

      return {
        totalItens: allItens.length,
        valorTotal,
        itensAlerta,
        totalMovimentacoes: allMovs.length,
        maisConsumidos,
        custoPorCategoria: Array.from(catMap.entries()).map(([categoria, v]) => ({ categoria, ...v })),
        movimentacoesPorMes: Array.from(mesMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([mes, v]) => ({ mes, label: getMesLabel(mes), ...v })),
      };
    },
    enabled: !!tenantId,
  });
}
