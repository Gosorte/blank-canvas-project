import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/admin/StatCard";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, ClipboardList, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { useTenant } from "@/hooks/use-tenant";

export default function DashboardERP() {
  const { activeTenantId, tenantName } = useTenant();

  const { data: estoque = [] } = useQuery({
    queryKey: ["dashboard-erp-estoque", activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("estoque").select("*").eq("tenant_id", activeTenantId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const { data: ordens = [] } = useQuery({
    queryKey: ["dashboard-erp-ordens", activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("ordens_producao").select("*").eq("tenant_id", activeTenantId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const { data: contasPagar = [] } = useQuery({
    queryKey: ["dashboard-erp-contas-pagar", activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("contas_pagar").select("*").eq("tenant_id", activeTenantId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const { data: contasReceber = [] } = useQuery({
    queryKey: ["dashboard-erp-contas-receber", activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("contas_receber").select("*").eq("tenant_id", activeTenantId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  if (!activeTenantId) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Selecione uma empresa no menu lateral para visualizar o dashboard ERP.</p>
      </div>
    );
  }

  const itensAbaixoMinimo = estoque.filter(e => e.ativo && e.quantidade < e.quantidade_minima);
  const valorEstoque = estoque.reduce((s, e) => s + Number(e.quantidade) * Number(e.custo_unitario), 0);
  const opsEmProducao = ordens.filter(o => o.status === "em_producao" || o.status === "em_impressao" || o.status === "em_acabamento");
  const opsAtrasadas = ordens.filter(o => o.data_entrega && new Date(o.data_entrega) < new Date() && o.status !== "entregue" && o.status !== "cancelada");
  const totalPagar = contasPagar.filter(c => c.status === "pendente").reduce((s, c) => s + Number(c.valor), 0);
  const totalReceber = contasReceber.filter(c => c.status === "pendente").reduce((s, c) => s + Number(c.valor), 0);
  const saldoProjetado = totalReceber - totalPagar;
  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  const estoquePorCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    estoque.filter(e => e.ativo).forEach(e => { map[e.categoria] = (map[e.categoria] || 0) + Number(e.quantidade) * Number(e.custo_unitario); });
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [estoque]);

  const financeiroMensal = useMemo(() => {
    const months: Record<string, { pagar: number; receber: number }> = {};
    const fmt = (d: string) => { const date = new Date(d); return `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`; };
    contasPagar.forEach(c => { const m = fmt(c.data_vencimento); if (!months[m]) months[m] = { pagar: 0, receber: 0 }; months[m].pagar += Number(c.valor); });
    contasReceber.forEach(c => { const m = fmt(c.data_vencimento); if (!months[m]) months[m] = { pagar: 0, receber: 0 }; months[m].receber += Number(c.valor); });
    return Object.entries(months).sort((a, b) => a[0].localeCompare(b[0])).slice(-6).map(([mes, v]) => ({ mes, pagar: Math.round(v.pagar), receber: Math.round(v.receber) }));
  }, [contasPagar, contasReceber]);

  const opsPorSetor = useMemo(() => {
    const map: Record<string, number> = {};
    ordens.forEach(o => { const label = o.setor === "digital" ? "Digital" : o.setor === "offset" ? "Offset" : "Com. Visual"; map[label] = (map[label] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [ordens]);

  const opsPorMes = useMemo(() => {
    const map: Record<string, number> = {};
    ordens.forEach(o => { const d = new Date(o.created_at); const m = `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`; map[m] = (map[m] || 0) + 1; });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-6).map(([mes, total]) => ({ mes, total }));
  }, [ordens]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard ERP</h1>
        <p className="text-muted-foreground">{tenantName} — Gestão operacional e financeira</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Valor em Estoque" value={`R$ ${valorEstoque.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={Package} iconColor="bg-blue-500/10" />
        <StatCard title="OPs em Produção" value={opsEmProducao.length} change={`${opsAtrasadas.length} atrasada(s)`} changeType={opsAtrasadas.length > 0 ? "negative" : "neutral"} icon={ClipboardList} iconColor="bg-orange-500/10" />
        <StatCard title="A Receber" value={`R$ ${totalReceber.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} changeType="positive" icon={TrendingUp} iconColor="bg-green-500/10" />
        <StatCard title="A Pagar" value={`R$ ${totalPagar.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} changeType="negative" icon={DollarSign} iconColor="bg-red-500/10" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Fluxo Financeiro Mensal</CardTitle></CardHeader>
          <CardContent>
            {financeiroMensal.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={financeiroMensal}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="receber" name="A Receber" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pagar" name="A Pagar" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-10">Sem dados financeiros</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Valor em Estoque por Categoria</CardTitle></CardHeader>
          <CardContent>
            {estoquePorCategoria.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={estoquePorCategoria} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="value" name="Valor" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-10">Sem dados de estoque</p>}
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Saldo Projetado</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${saldoProjetado >= 0 ? "text-green-600" : "text-destructive"}`}>R$ {saldoProjetado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground mt-1">Receber - Pagar (pendentes)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">OPs por Setor</CardTitle></CardHeader>
          <CardContent>
            {opsPorSetor.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={opsPorSetor} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {opsPorSetor.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-10">Sem OPs</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Tendência de OPs</CardTitle></CardHeader>
          <CardContent>
            {opsPorMes.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={opsPorMes}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-10">Sem dados</p>}
          </CardContent>
        </Card>
      </div>
      {itensAbaixoMinimo.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" /> Estoque Abaixo do Mínimo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {itensAbaixoMinimo.slice(0, 5).map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.nome}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-destructive font-semibold">{Number(item.quantidade)} {item.unidade}</span>
                    <span className="text-muted-foreground">/ mín: {Number(item.quantidade_minima)}</span>
                  </div>
                </div>
              ))}
              {itensAbaixoMinimo.length > 5 && <p className="text-xs text-muted-foreground">+ {itensAbaixoMinimo.length - 5} item(ns)</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
