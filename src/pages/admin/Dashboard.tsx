import {
  Building2,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Printer,
  Users,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatCard } from "@/components/admin/StatCard";
import { useTenants } from "@/hooks/use-tenants";
import { useMetricas } from "@/hooks/use-metricas";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig = {
  ativo: { label: "Ativo", className: "bg-success/10 text-success border-success/20" },
  trial: { label: "Trial", className: "bg-info/10 text-info border-info/20" },
  inadimplente: { label: "Inadimplente", className: "bg-destructive/10 text-destructive border-destructive/20" },
  suspenso: { label: "Suspenso", className: "bg-warning/10 text-warning border-warning/20" },
};

export default function Dashboard() {
  const { data: tenants, isLoading: loadingTenants } = useTenants();
  const { data: metricas, isLoading: loadingMetricas } = useMetricas();

  if (loadingTenants || loadingMetricas) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const m = metricas ?? { gmv_total: 0, total_pedidos: 0, total_tenants_ativos: 0, receita_recorrente: 0, churn_rate: 0, inadimplentes: 0, total_tenants: 0 };

  return (
    <div>
      <AdminHeader title="Dashboard" subtitle="Visão geral do ecossistema Gráfica 360°" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Tenants Ativos" value={m.total_tenants_ativos} change={`${m.total_tenants} total`} changeType="neutral" icon={Building2} />
          <StatCard title="GMV Total" value={`R$ ${m.gmv_total.toLocaleString("pt-BR")}`} changeType="positive" icon={DollarSign} />
          <StatCard title="Pedidos no Mês" value={m.total_pedidos} changeType="positive" icon={ShoppingCart} />
          <StatCard title="MRR (Receita Recorrente)" value={`R$ ${m.receita_recorrente.toLocaleString("pt-BR")}`} change={`${m.total_tenants_ativos} assinantes`} changeType="neutral" icon={TrendingUp} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="Churn Rate" value={`${m.churn_rate}%`} change={m.inadimplentes > 0 ? `${m.inadimplentes} inadimplente(s)` : "Nenhum inadimplente"} changeType={m.inadimplentes > 0 ? "negative" : "positive"} icon={AlertTriangle} />
          <StatCard title="ARR Projetado" value={`R$ ${(m.receita_recorrente * 12).toLocaleString("pt-BR")}`} changeType="positive" icon={TrendingUp} />
        </div>

        <div className="bg-card rounded-xl border border-border animate-fade-in">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Gráficas Recentes</h2>
            <span className="text-xs text-muted-foreground">{tenants?.length ?? 0} tenants</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-5 py-3 font-medium">Gráfica</th>
                  <th className="text-left px-5 py-3 font-medium">Plano</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Domínio</th>
                  <th className="text-right px-5 py-3 font-medium">Pedidos/Mês</th>
                  <th className="text-right px-5 py-3 font-medium">GMV/Mês</th>
                </tr>
              </thead>
              <tbody>
                {(tenants ?? []).map((tenant) => {
                  const status = statusConfig[tenant.status as keyof typeof statusConfig];
                  return (
                    <tr key={tenant.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-foreground">{tenant.nome_grafica}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant="secondary" className="font-medium">{tenant.planos?.nome ?? "—"}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className={cn("font-medium", status?.className)}>{status?.label ?? tenant.status}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{tenant.dominio}</td>
                      <td className="px-5 py-3.5 text-right text-foreground">{tenant.pedidos_mes}</td>
                      <td className="px-5 py-3.5 text-right font-medium text-foreground">R$ {Number(tenant.gmv_mes).toLocaleString("pt-BR")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
