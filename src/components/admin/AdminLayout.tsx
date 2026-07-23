import { Outlet, useLocation } from "react-router-dom";  
import { useState, useEffect } from "react";  
import { AdminSidebar } from "./AdminSidebar";
import { AdminModuleHeader } from "./AdminModuleHeader";
import { TenantProvider } from "@/hooks/use-tenant";
import type { ActiveModule } from "./ModuleSelector";
import { cn } from "@/lib/utils";
import { SidebarProvider } from "@/components/ui/sidebar";

function detectModule(path: string): ActiveModule {
  if (path.startsWith("/admin/dashboard-crm") || path.startsWith("/admin/crm")) return "crm";
  if (path.startsWith("/admin/dashboard-ecommerce") || path.startsWith("/admin/pedidos-loja")) return "ecommerce";
  const erpPrefixes = [
    "/admin/dashboard-erp", "/admin/precificacao", "/admin/clientes",
    "/admin/fornecedores", "/admin/estoque", "/admin/ordens",
    "/admin/financeiro", "/admin/digital", "/admin/offset", "/admin/visual",
    "/admin/orcamentos-erp", "/admin/pedidos-erp", "/admin/pcp", "/admin/pdv",
    "/admin/orcamento-inteligente", "/admin/produtos-simples", "/admin/agenda-tarefas",
    "/admin/relatorios", "/admin/cadastros", "/admin/ajuda",
  ];
  if (erpPrefixes.some(p => path.startsWith(p))) return "erp";
  return "saas";
}

function AdminLayoutInner() {
  const location = useLocation();
  const [activeModule, setActiveModule] = useState<ActiveModule>(() => detectModule(location.pathname));
  const isCrmConversasRoute = location.pathname.startsWith('/admin/crm-conversas');

  useEffect(() => {
    setActiveModule(detectModule(location.pathname));
  }, [location.pathname]);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex flex-col h-screen bg-background overflow-hidden w-full">
        <AdminModuleHeader activeModule={activeModule} onModuleChange={setActiveModule} />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <AdminSidebar activeModule={activeModule} />
          <main className={cn('flex-1 min-h-0 min-w-0 flex flex-col', isCrmConversasRoute ? 'overflow-hidden' : 'overflow-auto')}>
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export function AdminLayout() {
  return (
    <TenantProvider>
      <AdminLayoutInner />
    </TenantProvider>
  );
}
