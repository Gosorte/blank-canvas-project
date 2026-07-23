import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useMetricas } from "@/hooks/use-metricas";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

const gmvData = [
  { mes: "Out", valor: 42000 },
  { mes: "Nov", valor: 51000 },
  { mes: "Dez", valor: 48000 },
  { mes: "Jan", valor: 62000 },
  { mes: "Fev", valor: 71000 },
  { mes: "Mar", valor: 77600 },
];

const pedidosData = [
  { mes: "Out", pedidos: 310 },
  { mes: "Nov", pedidos: 380 },
  { mes: "Dez", pedidos: 350 },
  { mes: "Jan", pedidos: 470 },
  { mes: "Fev", pedidos: 540 },
  { mes: "Mar", pedidos: 604 },
];

const moduloData = [
  { name: "Digital", value: 45, color: "hsl(217, 91%, 60%)" },
  { name: "Visual", value: 35, color: "hsl(262, 83%, 58%)" },
  { name: "Offset", value: 20, color: "hsl(38, 92%, 50%)" },
];

export default function Metricas() {
  const { data: metricas, isLoading } = useMetricas();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  const m = metricas!;
  const ticketMedio = m.total_pedidos > 0 ? Math.round(m.gmv_total / m.total_pedidos) : 0;

  return (
    <div>
      <AdminHeader title="Métricas Globais" subtitle="Dados agregados e anonimizados (LGPD)" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-5 animate-fade-in">
            <h3 className="font-semibold text-foreground mb-4">GMV Mensal</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={gmvData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "GMV"]} contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214, 32%, 91%)" }} />
                <Bar dataKey="valor" fill="hsl(217, 91%, 60%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 animate-fade-in">
            <h3 className="font-semibold text-foreground mb-4">Pedidos por Mês</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={pedidosData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214, 32%, 91%)" }} />
                <Line type="monotone" dataKey="pedidos" stroke="hsl(262, 83%, 58%)" strokeWidth={2.5} dot={{ fill: "hsl(262, 83%, 58%)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-card rounded-xl border border-border p-5 animate-fade-in">
            <h3 className="font-semibold text-foreground mb-4">Distribuição por Módulo</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={moduloData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {moduloData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {moduloData.map((mod) => (
                <div key={mod.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mod.color }} />
                  <span className="text-muted-foreground">{mod.name} {mod.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 animate-fade-in">
            <h3 className="font-semibold text-foreground mb-4">Indicadores Chave</h3>
            <div className="grid grid-cols-2 gap-4">
              <MetricBox label="GMV Total" value={`R$ ${m.gmv_total.toLocaleString("pt-BR")}`} />
              <MetricBox label="Total de Pedidos" value={m.total_pedidos.toLocaleString("pt-BR")} />
              <MetricBox label="Churn Rate" value={`${m.churn_rate}%`} highlight />
              <MetricBox label="Ticket Médio" value={`R$ ${ticketMedio}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="p-4 rounded-lg bg-muted text-center">
      <p className={cn("text-xl font-bold", highlight ? "text-warning" : "text-foreground")}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
