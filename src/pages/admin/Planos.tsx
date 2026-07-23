import { Check, X, Loader2 } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { usePlanos } from "@/hooks/use-planos";
import { useMetricas } from "@/hooks/use-metricas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const planColors: Record<string, string> = {
  Bronze: "from-amber-600 to-amber-800",
  Prata: "from-slate-400 to-slate-600",
  Ouro: "from-yellow-400 to-amber-500",
};

export default function Planos() {
  const { data: planos, isLoading } = usePlanos();
  const { data: metricas } = useMetricas();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  const mrr = metricas?.receita_recorrente ?? 0;
  const ativos = metricas?.total_tenants_ativos ?? 0;

  return (
    <div>
      <AdminHeader title="Planos & Billing" subtitle="Gerencie planos de assinatura e cobrança" />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {(planos ?? []).map((plano) => (
            <div key={plano.id} className={cn("bg-card rounded-2xl border border-border overflow-hidden animate-fade-in transition-transform hover:scale-[1.02]", plano.nome === "Ouro" && "ring-2 ring-primary shadow-xl")}>
              <div className={cn("p-6 text-center bg-gradient-to-br", planColors[plano.nome] ?? "from-gray-400 to-gray-600")}>
                <h3 className="text-xl font-bold text-white">{plano.nome}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-extrabold text-white">R$ {plano.valor}</span>
                  <span className="text-white/80 text-sm">/mês</span>
                </div>
                <p className="text-white/70 text-xs mt-2">{plano.tenants_count} gráfica(s) assinando</p>
              </div>
              <div className="p-6 space-y-3">
                <FeatureRow active={plano.has_digital} label="Gráfica Digital (por clique)" />
                <FeatureRow active={plano.has_visual} label="Comunicação Visual (m²)" />
                <FeatureRow active={plano.has_offset} label="Offset (milheiro/chapas)" />
                <FeatureRow active={plano.has_crm_advanced} label="CRM Avançado + WhatsApp" />
              </div>
              <div className="px-6 pb-6">
                <Button variant={plano.nome === "Ouro" ? "default" : "outline"} className="w-full">Editar Plano</Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-card rounded-xl border border-border p-6 max-w-5xl mx-auto animate-fade-in">
          <h3 className="font-semibold text-foreground mb-4">Resumo de Faturamento</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-2xl font-bold text-foreground">R$ {mrr.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground mt-1">MRR Atual</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-2xl font-bold text-foreground">{ativos}</p>
              <p className="text-xs text-muted-foreground mt-1">Assinantes Ativos</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-2xl font-bold text-success">R$ {(mrr * 12).toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground mt-1">ARR Projetado</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {active ? <Check size={16} className="text-success shrink-0" /> : <X size={16} className="text-muted-foreground/40 shrink-0" />}
      <span className={cn(active ? "text-foreground" : "text-muted-foreground/50")}>{label}</span>
    </div>
  );
}
