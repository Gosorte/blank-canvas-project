import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/admin/StatCard";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Users, DollarSign, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line } from "recharts";
import { useTenant } from "@/hooks/use-tenant";

export default function DashboardEcommerce() {
  const { activeTenantId, tenantName } = useTenant();

  const { data: pedidos = [] } = useQuery({
    queryKey: ["dashboard-ecom-pedidos", activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("loja_pedidos").select("*").eq("tenant_id", activeTenantId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["dashboard-ecom-clientes", activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("id, auth_user_id, created_at").eq("tenant_id", activeTenantId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const statusLabels: Record<string, { label: string; color: string }> = {
    pendente: { label: "Pendente", color: "hsl(45, 93%, 47%)" },
    confirmado: { label: "Confirmado", color: "hsl(217, 91%, 60%)" },
    em_producao: { label: "Em Produção", color: "hsl(25, 95%, 53%)" },
    pronto: { label: "Pronto", color: "hsl(271, 91%, 65%)" },
    entregue: { label: "Entregue", color: "hsl(142, 71%, 45%)" },
    cancelado: { label: "Cancelado", color: "hsl(0, 84%, 60%)" },
  };

  const pedidosPorStatus = useMemo(() => {
    const map: Record<string, number> = {};
    pedidos.forEach(p => { map[p.status] = (map[p.status] || 0) + 1; });
    return Object.entries(map).map(([status, value]) => ({ name: statusLabels[status]?.label || status, value, fill: statusLabels[status]?.color || "hsl(var(--muted))" }));
  }, [pedidos]);

  const vendasPorMes = useMemo(() => {
    const map: Record<string, { faturamento: number; pedidos: number }> = {};
    pedidos.filter(p => p.status !== "cancelado").forEach(p => {
      const d = new Date(p.created_at); const m = `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      if (!map[m]) map[m] = { faturamento: 0, pedidos: 0 }; map[m].faturamento += Number(p.valor_total); map[m].pedidos += 1;
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-6).map(([mes, v]) => ({ mes, faturamento: Math.round(v.faturamento), pedidos: v.pedidos }));
  }, [pedidos]);

  const clientesPorMes = useMemo(() => {
    const map: Record<string, number> = {};
    clientes.filter(c => c.auth_user_id).forEach(c => {
      const d = new Date(c.created_at); const m = `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`; map[m] = (map[m] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-6).map(([mes, total]) => ({ mes, total }));
  }, [clientes]);

  if (!activeTenantId) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Selecione uma empresa no menu lateral para visualizar o dashboard E-commerce.</p>
      </div>
    );
  }

  const totalPedidos = pedidos.length;
  const faturamento = pedidos.filter(p => p.status !== "cancelado").reduce((s, p) => s + Number(p.valor_total), 0);
  const pedidosPendentes = pedidos.filter(p => p.status === "pendente").length;
  const ticketMedio = totalPedidos > 0 ? faturamento / pedidos.filter(p => p.status !== "cancelado").length || 1 : 0;
  const clientesLoja = clientes.filter(c => c.auth_user_id).length;
  const recentOrders = pedidos.slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard E-commerce</h1>
        <p className="text-muted-foreground">{tenantName} — Performance da loja virtual</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total de Pedidos" value={totalPedidos} change={`${pedidosPendentes} pendente(s)`} changeType="neutral" icon={ShoppingCart} iconColor="bg-blue-500/10" />
        <StatCard title="Faturamento" value={`R$ ${faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={DollarSign} iconColor="bg-green-500/10" />
        <StatCard title="Ticket Médio" value={`R$ ${ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={TrendingUp} iconColor="bg-purple-500/10" />
        <StatCard title="Clientes da Loja" value={clientesLoja} change={`${clientes.length} total cadastrados`} changeType="neutral" icon={Users} iconColor="bg-orange-500/10" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Evolução de Vendas</CardTitle></CardHeader>
          <CardContent>
            {vendasPorMes.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={vendasPorMes}>
                  <defs><linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip formatter={(v: number, name: string) => name === "faturamento" ? `R$ ${v.toLocaleString("pt-BR")}` : v} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="faturamento" name="Faturamento" stroke="hsl(var(--primary))" fill="url(#colorFat)" strokeWidth={2} />
                  <Line type="monotone" dataKey="pedidos" name="Pedidos" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-10">Sem dados de vendas</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Pedidos por Status</CardTitle></CardHeader>
          <CardContent>
            {pedidosPorStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pedidosPorStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pedidosPorStatus.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-10">Sem pedidos</p>}
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Novos Clientes/Mês</CardTitle></CardHeader>
          <CardContent>
            {clientesPorMes.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={clientesPorMes}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="total" name="Clientes" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-10">Sem dados</p>}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-base">Últimos Pedidos</CardTitle></CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum pedido encontrado</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map(order => {
                  const info = statusLabels[order.status] || { label: order.status, color: "hsl(var(--muted))" };
                  return (
                    <div key={order.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">Pedido #{order.numero_pedido}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: info.color }} />
                          {info.label}
                        </Badge>
                        <span className="text-sm font-semibold">R$ {Number(order.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
