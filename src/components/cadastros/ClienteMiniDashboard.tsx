import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/use-tenant";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, FileText, TrendingUp, Package, Calendar, DollarSign, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClienteMonthlyCharts } from "./ClienteMonthlyCharts";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val / 100);

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  aprovado: "bg-green-100 text-green-800",
  producao: "bg-blue-100 text-blue-800",
  entregue: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-red-100 text-red-800",
  rascunho: "bg-gray-100 text-gray-800",
  enviado: "bg-indigo-100 text-indigo-800",
  recusado: "bg-red-100 text-red-800",
  Aberto: "bg-blue-100 text-blue-800",
  Aguardando: "bg-yellow-100 text-yellow-800",
  Pronto: "bg-emerald-100 text-emerald-800",
  pago: "bg-green-100 text-green-800",
};

function StatMini({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4 space-y-1">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}

export function ClienteMiniDashboard({ clienteId, clienteNome }: { clienteId: string; clienteNome?: string }) {
  const { activeTenantId } = useTenant();

  const orFilter = `cliente_id.eq.${clienteId}${clienteNome ? `,cliente_nome.eq.${clienteNome}` : ""}`;

  const { data: orcamentos = [] } = useQuery({
    queryKey: ["cliente-orcamentos", clienteId, activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("erp_orcamentos").select("*")
        .eq("tenant_id", activeTenantId!)
        .or(orFilter)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeTenantId,
  });

  const { data: pedidos = [] } = useQuery({
    queryKey: ["cliente-pedidos", clienteId, activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("erp_pedidos").select("*")
        .eq("tenant_id", activeTenantId!)
        .or(orFilter)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeTenantId,
  });

  // Fetch order items for "Top Products"
  const pedidoIds = pedidos.map((p) => p.id);
  const orcamentoIds = orcamentos.map((o) => o.id);
  const allIds = [...pedidoIds, ...orcamentoIds];

  const { data: orderItems = [] } = useQuery({
    queryKey: ["cliente-order-items", clienteId, allIds],
    queryFn: async () => {
      if (allIds.length === 0) return [];
      const { data, error } = await supabase
        .from("erp_orcamento_itens").select("*")
        .in("orcamento_id", allIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: allIds.length > 0,
  });

  const { data: contasReceber = [] } = useQuery({
    queryKey: ["cliente-contas-receber", clienteId, activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contas_receber").select("*")
        .eq("tenant_id", activeTenantId!)
        .eq("cliente_id", clienteId)
        .order("data_vencimento", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeTenantId,
  });

  // Converted budgets = those that became orders
  const convertedBudgets = orcamentos.filter((b: any) => b.status === "Convertido");
  const activeBudgets = orcamentos.filter((b: any) => b.status !== "Convertido");
  const totalOrcamentos = activeBudgets.reduce((s, o) => s + (Number(o.valor_total) || 0), 0);
  const totalPedidos = pedidos.reduce((s, o) => s + (Number(o.valor_total) || 0), 0);
  const taxaConversao = orcamentos.length > 0 ? Math.round((convertedBudgets.length / orcamentos.length) * 100) : 0;

  // Top products
  const productMap: Record<string, { qty: number; total: number }> = {};
  orderItems.forEach((item: any) => {
    const desc = item.descricao || "Sem descrição";
    if (!productMap[desc]) productMap[desc] = { qty: 0, total: 0 };
    productMap[desc].qty += Number(item.quantidade) || 0;
    productMap[desc].total += Number(item.subtotal) || 0;
  });
  const topProducts = Object.entries(productMap)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5);

  // Timeline
  const timeline = [
    ...orcamentos.map((b: any) => ({
      type: "budget" as const,
      date: b.created_at,
      label: `Orçamento #${b.numero}`,
      value: Number(b.valor_total) || 0,
      status: b.status,
      salesperson: b.vendedor || null,
    })),
    ...pedidos.map((o: any) => ({
      type: "order" as const,
      date: o.created_at,
      label: `Pedido #${o.numero}`,
      value: Number(o.valor_total) || 0,
      status: o.status,
      salesperson: o.vendedor || null,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatMini icon={ShoppingCart} label="Orçamentos" value={activeBudgets.length.toString()} sub={formatCurrency(totalOrcamentos)} />
        <StatMini icon={Package} label="Pedidos" value={pedidos.length.toString()} sub={formatCurrency(totalPedidos)} />
        <StatMini icon={DollarSign} label="Faturamento Total" value={formatCurrency(totalPedidos)} />
        <StatMini icon={TrendingUp} label="Conversão" value={`${taxaConversao}%`} sub={`${pedidos.length}/${orcamentos.length}`} />
      </div>

      {/* Charts */}
      <ClienteMonthlyCharts orcamentos={orcamentos} pedidos={pedidos} />

      {/* Lists: Budgets, Orders, Top Products */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Budgets */}
        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Orçamentos
          </h4>
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-2">
              {orcamentos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum orçamento.</p>
              ) : orcamentos.map((b: any) => (
                <div key={b.id} className="rounded-md border p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Orçamento #{b.numero}</span>
                    <Badge variant="outline" className="text-[10px]">{b.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{format(new Date(b.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                    <span className="font-medium">{formatCurrency(Number(b.valor_total) || 0)}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Atendente: <span className="font-medium text-foreground">{b.vendedor || "Não informado"}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Orders */}
        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" /> Pedidos
          </h4>
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-2">
              {pedidos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum pedido.</p>
              ) : pedidos.map((o: any) => (
                <div key={o.id} className="rounded-md border p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pedido #{o.numero}</span>
                    <Badge variant="outline" className="text-[10px]">{o.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{format(new Date(o.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                    <span className="font-medium">{formatCurrency(Number(o.valor_total) || 0)}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Categoria: <span className="font-medium text-foreground capitalize">{o.categoria || "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Top Products */}
        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> Produtos Mais Comprados
          </h4>
          <div className="space-y-2">
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum produto registrado.</p>
            ) : topProducts.map(([name, data], i) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                  <span className="truncate">{name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary" className="text-xs">{data.qty}x</Badge>
                  <span className="text-xs text-muted-foreground">{formatCurrency(data.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Timeline - Histórico de Relacionamento */}
      {timeline.length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Histórico de Relacionamento
          </h4>
          <ScrollArea className="max-h-[250px]">
            <div className="space-y-3">
              {timeline.map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${item.type === "order" ? "bg-primary" : "bg-primary/40"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{item.label}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">{item.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
                      <span>{format(new Date(item.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                      <span className="font-medium">{formatCurrency(item.value)}</span>
                    </div>
                    {item.salesperson && (
                      <p className="text-[11px] text-muted-foreground">Vendedor: {item.salesperson}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
