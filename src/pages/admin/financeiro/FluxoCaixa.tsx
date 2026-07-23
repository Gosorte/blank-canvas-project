import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, BarChart3, Loader2 } from "lucide-react";
import { useContasPagar, useContasReceber } from "@/hooks/use-financeiro";
import { useTenant } from "@/hooks/use-tenant";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

export default function FluxoCaixa() {
  const { activeTenantId } = useTenant();
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const { data: payables = [], isLoading: l1 } = useContasPagar(activeTenantId || undefined);
  const { data: receivables = [], isLoading: l2 } = useContasReceber(activeTenantId || undefined);

  const monthDate = parseISO(`${selectedMonth}-01`);
  const monthStart = format(startOfMonth(monthDate), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(monthDate), "yyyy-MM-dd");

  const monthPayables = useMemo(() => (payables as any[]).filter(p => p.data_vencimento >= monthStart && p.data_vencimento <= monthEnd), [payables, monthStart, monthEnd]);
  const monthReceivables = useMemo(() => (receivables as any[]).filter(r => r.data_vencimento >= monthStart && r.data_vencimento <= monthEnd), [receivables, monthStart, monthEnd]);

  const summary = useMemo(() => {
    const totalReceivable = monthReceivables.reduce((s, r) => s + Number(r.valor), 0);
    const totalPayable = monthPayables.reduce((s, p) => s + Number(p.valor), 0);
    const paidRec = monthReceivables.filter(r => r.status === "recebido" || r.status === "pago").reduce((s, r) => s + Number(r.valor), 0);
    const paidPay = monthPayables.filter(p => p.status === "pago").reduce((s, p) => s + Number(p.valor), 0);
    return { totalReceivable, totalPayable, balance: totalReceivable - totalPayable, realBalance: paidRec - paidPay };
  }, [monthPayables, monthReceivables]);

  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) });
    let acc = 0;
    return days.map(day => {
      const ds = format(day, "yyyy-MM-dd");
      const dayIn = monthReceivables.filter(r => r.data_vencimento === ds).reduce((s, r) => s + Number(r.valor), 0);
      const dayOut = monthPayables.filter(p => p.data_vencimento === ds).reduce((s, p) => s + Number(p.valor), 0);
      acc += dayIn - dayOut;
      return { date: format(day, "dd"), entradas: dayIn, saidas: dayOut, saldo: acc };
    });
  }, [monthPayables, monthReceivables, monthDate]);

  const months = Array.from({ length: 12 }, (_, i) => { const d = subMonths(addMonths(new Date(), 3), 11 - i); return { value: format(d, "yyyy-MM"), label: format(d, "MMM yyyy", { locale: ptBR }) }; });
  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const chartConfig = { entradas: { label: "Entradas", color: "hsl(var(--chart-2))" }, saidas: { label: "Saídas", color: "hsl(var(--chart-1))" }, saldo: { label: "Saldo", color: "hsl(var(--chart-3))" } };

  if (l1 || l2) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Fluxo de Caixa</h1><p className="text-muted-foreground text-sm">Controle de entradas e saídas</p></div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><ArrowUpRight className="h-4 w-4 text-emerald-500" />Recebíveis</div><p className="text-2xl font-bold text-emerald-600">{fmt(summary.totalReceivable)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><ArrowDownRight className="h-4 w-4 text-destructive" />A Pagar</div><p className="text-2xl font-bold text-destructive">{fmt(summary.totalPayable)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><TrendingUp className="h-4 w-4" />Saldo Projetado</div><p className={`text-2xl font-bold ${summary.balance >= 0 ? "text-emerald-600" : "text-destructive"}`}>{fmt(summary.balance)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><DollarSign className="h-4 w-4" />Saldo Realizado</div><p className={`text-2xl font-bold ${summary.realBalance >= 0 ? "text-emerald-600" : "text-destructive"}`}>{fmt(summary.realBalance)}</p></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Fluxo Diário</CardTitle></CardHeader><CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => fmt(Number(value))} />} />
            <Area type="monotone" dataKey="entradas" stackId="1" stroke="var(--color-entradas)" fill="var(--color-entradas)" fillOpacity={0.3} />
            <Area type="monotone" dataKey="saidas" stackId="2" stroke="var(--color-saidas)" fill="var(--color-saidas)" fillOpacity={0.3} />
            <Area type="monotone" dataKey="saldo" stroke="var(--color-saldo)" fill="var(--color-saldo)" fillOpacity={0.1} strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </CardContent></Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle className="text-base">Próximas Entradas</CardTitle></CardHeader><CardContent>
          {monthReceivables.filter(r => r.status === "pendente").length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma entrada prevista</p> : <div className="space-y-2 max-h-60 overflow-auto">{monthReceivables.filter(r => r.status === "pendente").map((r: any) => <div key={r.id} className="flex justify-between items-center p-2 rounded bg-muted/50"><div><p className="text-sm font-medium">{r.clientes?.nome || "—"}</p><p className="text-xs text-muted-foreground">{r.descricao} • {new Date(r.data_vencimento).toLocaleDateString("pt-BR")}</p></div><span className="text-sm font-semibold text-emerald-600">{fmt(Number(r.valor))}</span></div>)}</div>}
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Próximas Saídas</CardTitle></CardHeader><CardContent>
          {monthPayables.filter(p => p.status === "pendente").length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma saída prevista</p> : <div className="space-y-2 max-h-60 overflow-auto">{monthPayables.filter(p => p.status === "pendente").map((p: any) => <div key={p.id} className="flex justify-between items-center p-2 rounded bg-muted/50"><div><p className="text-sm font-medium">{p.fornecedores?.razao_social || "—"}</p><p className="text-xs text-muted-foreground">{p.descricao} • {new Date(p.data_vencimento).toLocaleDateString("pt-BR")}</p></div><span className="text-sm font-semibold text-destructive">{fmt(Number(p.valor))}</span></div>)}</div>}
        </CardContent></Card>
      </div>
    </div>
  );
}