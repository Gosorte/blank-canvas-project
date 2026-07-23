import { useMemo } from "react";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";

interface ClienteMonthlyChartsProps {
  orcamentos: any[];
  pedidos: any[];
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val / 100);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm border bg-popover p-3 shadow-md text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">
            {entry.name.includes("Qtd") ? entry.value : formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export function ClienteMonthlyCharts({ orcamentos, pedidos }: ClienteMonthlyChartsProps) {
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; start: Date; end: Date }[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      months.push({
        key: format(d, "yyyy-MM"),
        label: format(d, "MMM/yy", { locale: ptBR }),
        start: startOfMonth(d),
        end: endOfMonth(d),
      });
    }

    return months.map((m) => {
      const monthBudgets = orcamentos.filter((b) =>
        isWithinInterval(new Date(b.created_at), { start: m.start, end: m.end })
      );
      const monthOrders = pedidos.filter((o) =>
        isWithinInterval(new Date(o.created_at), { start: m.start, end: m.end })
      );

      return {
        name: m.label,
        "Orçamentos (R$)": monthBudgets.reduce((sum, b) => sum + (Number(b.valor_total) || 0), 0),
        "Pedidos (R$)": monthOrders.reduce((sum, b) => sum + (Number(b.valor_total) || 0), 0),
        "Qtd Orçamentos": monthBudgets.length,
        "Qtd Pedidos": monthOrders.length,
      };
    });
  }, [orcamentos, pedidos]);

  const hasAnyData = monthlyData.some(
    (d) => d["Orçamentos (R$)"] > 0 || d["Pedidos (R$)"] > 0
  );

  if (!hasAnyData) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="p-4">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Evolução de Faturamento (12 meses)
        </h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${(v / 100).toFixed(0)}`} className="text-muted-foreground" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Orçamentos (R$)" fill="hsl(var(--primary) / 0.4)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Pedidos (R$)" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Quantidade Mensal (12 meses)
        </h4>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} className="text-muted-foreground" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="Qtd Orçamentos" stroke="hsl(var(--primary) / 0.5)" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Qtd Pedidos" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}