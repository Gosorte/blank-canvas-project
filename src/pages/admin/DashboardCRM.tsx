import { useTenant } from "@/hooks/use-tenant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, PieChart, BarChart3 } from "lucide-react";
import CrmDashboardTab from "@/components/crm/dashboard/CrmDashboardTab";
import CrmRelatoriosTab from "@/components/crm/dashboard/CrmRelatoriosTab";
import CrmDesempenhoTab from "@/components/crm/dashboard/CrmDesempenhoTab";

export default function DashboardCRM() {
  const { activeTenantId, tenantName } = useTenant();

  if (!activeTenantId) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Selecione uma empresa no menu lateral para visualizar o dashboard CRM.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard CRM</h1>
        <p className="text-muted-foreground">{tenantName} — Visão geral do atendimento</p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutGrid className="w-4 h-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="gap-2">
            <PieChart className="w-4 h-4" /> Relatórios
          </TabsTrigger>
          <TabsTrigger value="desempenho" className="gap-2">
            <BarChart3 className="w-4 h-4" /> Desempenho
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <CrmDashboardTab tenantId={activeTenantId} />
        </TabsContent>

        <TabsContent value="relatorios" className="mt-6">
          <CrmRelatoriosTab tenantId={activeTenantId} />
        </TabsContent>

        <TabsContent value="desempenho" className="mt-6">
          <CrmDesempenhoTab tenantId={activeTenantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
