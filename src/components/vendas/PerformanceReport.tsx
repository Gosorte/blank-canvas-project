import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO, subWeeks, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, XCircle, Clock, TrendingUp, TrendingDown, AlertTriangle, Target } from "lucide-react";
import type { CalendarItem } from "@/hooks/use-calendar-events";

interface Props { items: CalendarItem[]; currentDate: Date; }

const PIE_COLORS = ["#22c55e", "#ef4444", "#f97316", "#3b82f6"];

export function PerformanceReport({ items, currentDate }: Props) {
  const [period, setPeriod] = useState<"week" | "month">("week");

  const stats = useMemo(() => {
    const start = period === "week" ? startOfWeek(currentDate, { locale: ptBR }) : startOfMonth(currentDate);
    const end = period === "week" ? endOfWeek(currentDate, { locale: ptBR }) : endOfMonth(currentDate);
    const periodItems = items.filter(i => { try { return isWithinInterval(parseISO(i.date), { start, end }); } catch { return false; } });

    const total = periodItems.length;
    const completed = periodItems.filter(i => i.status === "concluido" || i.status === "concluida").length;
    const cancelled = periodItems.filter(i => i.status === "cancelado" || i.status === "cancelada").length;
    const overdue = periodItems.filter(i => i.status === "atrasado").length;
    const pending = total - completed - cancelled - overdue;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    const byCategory: Record<string, { total: number; completed: number }> = {};
    periodItems.forEach(i => {
      if (!byCategory[i.category]) byCategory[i.category] = { total: 0, completed: 0 };
      byCategory[i.category].total++;
      if (i.status === "concluido" || i.status === "concluida") byCategory[i.category].completed++;
    });

    const byPriority: Record<string, { total: number; completed: number }> = {};
    periodItems.forEach(i => {
      if (!byPriority[i.priority]) byPriority[i.priority] = { total: 0, completed: 0 };
      byPriority[i.priority].total++;
      if (i.status === "concluido" || i.status === "concluida") byPriority[i.priority].completed++;
    });

    const prevStart = period === "week" ? startOfWeek(subWeeks(currentDate, 1), { locale: ptBR }) : startOfMonth(subMonths(currentDate, 1));
    const prevEnd = period === "week" ? endOfWeek(subWeeks(currentDate, 1), { locale: ptBR }) : endOfMonth(subMonths(currentDate, 1));
    const prevItems = items.filter(i => { try { return isWithinInterval(parseISO(i.date), { start: prevStart, end: prevEnd }); } catch { return false; } });
    const prevCompleted = prevItems.filter(i => i.status === "concluido" || i.status === "concluida").length;
    const prevRate = prevItems.length > 0 ? (prevCompleted / prevItems.length) * 100 : 0;

    return { total, completed, cancelled, overdue, pending, completionRate, byCategory, byPriority, rateChange: completionRate - prevRate, prevRate };
  }, [items, currentDate, period]);

  const pieData = [
    { name: "Concluídos", value: stats.completed }, { name: "Atrasados", value: stats.overdue },
    { name: "Cancelados", value: stats.cancelled }, { name: "Pendentes", value: stats.pending },
  ].filter(d => d.value > 0);

  const categoryData = Object.entries(stats.byCategory).map(([name, v]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1), concluidos: v.completed, pendentes: v.total - v.completed,
  }));

  const priorityLabels: Record<string, string> = { baixa: "Baixa", media: "Média", alta: "Alta", urgente: "Urgente" };
  const getPerformanceLevel = (rate: number) => {
    if (rate >= 90) return { label: "Excelente", color: "text-green-600", icon: TrendingUp };
    if (rate >= 70) return { label: "Bom", color: "text-primary", icon: Target };
    if (rate >= 50) return { label: "Regular", color: "text-yellow-600", icon: AlertTriangle };
    return { label: "Crítico", color: "text-destructive", icon: TrendingDown };
  };

  const perf = getPerformanceLevel(stats.completionRate);
  const PerfIcon = perf.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Relatório de Desempenho</h3>
        <Tabs value={period} onValueChange={v => setPeriod(v as any)}>
          <TabsList className="h-8">
            <TabsTrigger value="week" className="text-xs">Semanal</TabsTrigger>
            <TabsTrigger value="month" className="text-xs">Mensal</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {stats.total === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum compromisso neste período</CardContent></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-sm bg-primary/10"><Target className="h-4 w-4 text-primary" /></div><div><p className="text-[10px] text-muted-foreground uppercase">Total</p><p className="text-xl font-bold">{stats.total}</p></div></div></Card>
            <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-sm bg-green-500/10"><CheckCircle2 className="h-4 w-4 text-green-600" /></div><div><p className="text-[10px] text-muted-foreground uppercase">Concluídos</p><p className="text-xl font-bold text-green-600">{stats.completed}</p></div></div></Card>
            <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-sm bg-destructive/10"><XCircle className="h-4 w-4 text-destructive" /></div><div><p className="text-[10px] text-muted-foreground uppercase">Atrasados</p><p className="text-xl font-bold text-destructive">{stats.overdue}</p></div></div></Card>
            <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-sm bg-yellow-500/10"><Clock className="h-4 w-4 text-yellow-600" /></div><div><p className="text-[10px] text-muted-foreground uppercase">Pendentes</p><p className="text-xl font-bold text-yellow-600">{stats.pending}</p></div></div></Card>
          </div>

          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><PerfIcon className={`h-5 w-5 ${perf.color}`} /><span className={`font-bold ${perf.color}`}>{perf.label}</span></div>
                <div className="text-right"><span className="text-2xl font-bold">{stats.completionRate.toFixed(0)}%</span><span className="text-xs text-muted-foreground ml-1">de conclusão</span></div>
              </div>
              <Progress value={stats.completionRate} className="h-3" />
              <div className="flex items-center gap-1 text-xs">
                {stats.rateChange >= 0
                  ? <><TrendingUp className="h-3 w-3 text-green-600" /><span className="text-green-600">+{stats.rateChange.toFixed(0)}%</span></>
                  : <><TrendingDown className="h-3 w-3 text-destructive" /><span className="text-destructive">{stats.rateChange.toFixed(0)}%</span></>}
                <span className="text-muted-foreground">vs período anterior ({stats.prevRate.toFixed(0)}%)</span>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Distribuição por Status</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                  </Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {pieData.map((d, i) => <div key={d.name} className="flex items-center gap-1 text-xs"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />{d.name} ({d.value})</div>)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Desempenho por Categoria</CardTitle></CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="concluidos" fill="#22c55e" name="Concluídos" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="pendentes" fill="#f97316" name="Pendentes" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground text-sm py-8">Sem dados</p>}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Rendimento por Prioridade</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(stats.byPriority).map(([key, val]) => {
                const rate = val.total > 0 ? (val.completed / val.total) * 100 : 0;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{priorityLabels[key] || key}</span>
                      <span className="text-xs text-muted-foreground">{val.completed}/{val.total} ({rate.toFixed(0)}%)</span>
                    </div>
                    <Progress value={rate} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {stats.overdue > 0 && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Pontos de Atenção</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>Você tem <strong>{stats.overdue}</strong> compromisso{stats.overdue > 1 ? "s" : ""} atrasado{stats.overdue > 1 ? "s" : ""}.</p>
                {stats.completionRate < 50 && <p>Sua taxa de conclusão está em <strong>{stats.completionRate.toFixed(0)}%</strong>. Considere revisar sua carga.</p>}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
