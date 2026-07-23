import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Settings,
  Shield,
  Calculator,
  ChevronRight,
  Users,
  Truck,
  Package,
  ClipboardList,
  DollarSign,
  Megaphone,
  ShoppingCart,
  MessageCircle,
  FileText,
  BookUser,
  Printer,
  Monitor,
  Palette,
  Tag,
  Boxes,
  Kanban,
  Receipt,
  Calendar,
  TrendingUp,
  PieChart,
  Wallet,
  FolderOpen,
  UserCheck,
  HelpCircle,
  BookOpen,
  UserPlus,
} from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";
import { useTenant } from "@/hooks/use-tenant";
import { useAuth } from "@/hooks/use-auth";
import { usePermissoes } from "@/hooks/use-permissoes";
import type { ActiveModule } from "./ModuleSelector";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  end?: boolean;
}

interface MenuGroup {
  title: string;
  description: string;
  icon: React.ElementType;
  items: MenuItem[];
}

const GROUP_ACCENT: Record<string, string> = {
  Dashboard: "210 100% 55%",
  Vendas: "142 65% 40%",
  Financeiro: "38 92% 50%",
  Estoque: "195 85% 42%",
  Offset: "280 60% 50%",
  Digital: "195 85% 55%",
  "Comunicação Visual": "300 60% 50%",
  "Cadastros Gerais": "210 100% 45%",
  Relatórios: "0 72% 50%",
  Configurações: "220 10% 42%",
  Ajuda: "142 65% 40%",
};

const erpMenuGroups: MenuGroup[] = [
  {
    title: "Dashboard",
    description: "Visão geral do sistema",
    icon: LayoutDashboard,
    items: [
      { label: "Visão Geral", path: "/admin/dashboard-erp", icon: BarChart3, end: true },
      { label: "Análises", path: "/admin/dashboard-erp/analises", icon: TrendingUp },
      { label: "Indicadores", path: "/admin/dashboard-erp/indicadores", icon: PieChart },
    ],
  },
  {
    title: "Vendas",
    description: "Orçamentos, pedidos e faturamento",
    icon: DollarSign,
    items: [
      { label: "Orçamentos", path: "/admin/orcamentos-erp", icon: FileText },
      { label: "Orçamento Inteligente", path: "/admin/orcamento-inteligente", icon: ClipboardList },
      { label: "Pedidos", path: "/admin/pedidos-erp", icon: ShoppingCart },
      { label: "Produto Simples", path: "/admin/produtos-simples", icon: Tag },
      { label: "PCP", path: "/admin/pcp", icon: Kanban },
      { label: "PDV", path: "/admin/pdv", icon: CreditCard },
      { label: "Agenda & Tarefas", path: "/admin/agenda-tarefas", icon: Calendar },
    ],
  },
  {
    title: "Financeiro",
    description: "Contas a pagar e receber",
    icon: Wallet,
    items: [
      { label: "Contas a Pagar", path: "/admin/financeiro/contas-pagar", icon: Receipt },
      { label: "Contas a Receber", path: "/admin/financeiro/contas-receber", icon: DollarSign },
      { label: "Fluxo de Caixa", path: "/admin/financeiro/fluxo-caixa", icon: TrendingUp },
      { label: "Relatórios Financeiros", path: "/admin/financeiro/relatorios", icon: BarChart3 },
      { label: "Notas Fiscais", path: "/admin/financeiro/notas-fiscais", icon: Receipt },
      { label: "Formas de Pagamento", path: "/admin/financeiro/formas-pagamento", icon: CreditCard },
      { label: "Créditos & Cashback", path: "/admin/cadastros/creditos", icon: Wallet },
      { label: "Gestão Financeira", path: "/admin/financeiro/gestao", icon: Settings },
    ],
  },
  {
    title: "Estoque",
    description: "Controle de materiais e insumos",
    icon: Package,
    items: [
      { label: "Produtos", path: "/admin/estoque/produtos", icon: Tag },
      { label: "Movimentações", path: "/admin/estoque/movimentacoes", icon: ClipboardList },
      { label: "Inventário", path: "/admin/estoque/inventario", icon: Boxes },
      { label: "Fornecedores", path: "/admin/estoque/fornecedores", icon: Users },
    ],
  },
  {
    title: "Offset",
    description: "Impressão offset e chapas",
    icon: Printer,
    items: [
      { label: "Insumos", path: "/admin/offset/insumos", icon: Package },
      { label: "Máquinas", path: "/admin/offset/maquinas", icon: Printer },
      { label: "Processos", path: "/admin/offset/processos", icon: ClipboardList },
      { label: "Materiais", path: "/admin/offset/materiais", icon: Boxes },
      { label: "Papéis", path: "/admin/offset/papeis", icon: FileText },
      { label: "Produtos", path: "/admin/offset/produtos", icon: Tag },
    ],
  },
  {
    title: "Digital",
    description: "Impressão digital e gráfica rápida",
    icon: Monitor,
    items: [
      { label: "Insumos", path: "/admin/digital/insumos", icon: Package },
      { label: "Máquinas", path: "/admin/digital/maquinas", icon: Printer },
      { label: "Processos", path: "/admin/digital/processos", icon: ClipboardList },
      { label: "Materiais", path: "/admin/digital/materiais", icon: Boxes },
      { label: "Papéis", path: "/admin/digital/papeis", icon: FileText },
      { label: "Produtos", path: "/admin/digital/produtos", icon: Tag },
    ],
  },
  {
    title: "Comunicação Visual",
    description: "Banners, adesivos e substratos",
    icon: Palette,
    items: [
      { label: "Insumos", path: "/admin/visual/insumos", icon: Package },
      { label: "Máquinas", path: "/admin/visual/maquinas", icon: Printer },
      { label: "Processos", path: "/admin/visual/processos", icon: ClipboardList },
      { label: "Materiais", path: "/admin/visual/materiais", icon: Boxes },
      { label: "Papéis", path: "/admin/visual/papeis", icon: FileText },
      { label: "Mão de Obra", path: "/admin/visual/mao-de-obra", icon: UserPlus },
      { label: "Produtos", path: "/admin/visual/produtos", icon: Tag },
    ],
  },
  {
    title: "Cadastros Gerais",
    description: "Clientes, fornecedores e produtos",
    icon: FolderOpen,
    items: [
      { label: "Clientes", path: "/admin/clientes", icon: Users },
      { label: "Fornecedores", path: "/admin/fornecedores", icon: UserCheck },
      { label: "Transportadoras", path: "/admin/transportadoras", icon: Truck },
      { label: "Vendedores", path: "/admin/vendedores", icon: UserPlus },
      { label: "Produtos", path: "/admin/cadastros/produtos", icon: Tag },
      { label: "Serviços", path: "/admin/cadastros/servicos", icon: Calculator },
    ],
  },
  {
    title: "Relatórios",
    description: "Análises e indicadores",
    icon: BarChart3,
    items: [
      { label: "Vendas", path: "/admin/relatorios/vendas", icon: DollarSign },
      { label: "Financeiro", path: "/admin/relatorios/financeiro", icon: Wallet },
      { label: "Produção", path: "/admin/relatorios/producao", icon: Printer },
      { label: "Estoque", path: "/admin/relatorios/estoque", icon: Package },
    ],
  },
  {
    title: "Configurações",
    description: "Ajustes do sistema",
    icon: Settings,
    items: [
      { label: "Dashboard Admin", path: "/admin/configuracoes/dashboard-admin", icon: LayoutDashboard },
      { label: "Geral", path: "/admin/configuracoes/geral", icon: Settings },
      { label: "Aparência", path: "/admin/configuracoes/aparencia", icon: Palette },
      { label: "Auditoria", path: "/admin/configuracoes/auditoria", icon: Shield },
      { label: "Notificações", path: "/admin/configuracoes/notificacoes", icon: Calendar },
    ],
  },
  {
    title: "Ajuda",
    description: "Suporte e documentação",
    icon: HelpCircle,
    items: [
      { label: "Central de Ajuda", path: "/admin/ajuda/central", icon: BookOpen },
      { label: "Tutoriais", path: "/admin/ajuda/tutoriais", icon: Monitor },
      { label: "Suporte", path: "/admin/ajuda/suporte", icon: Users },
      { label: "Sobre", path: "/admin/ajuda/sobre", icon: HelpCircle },
    ],
  },
];

const saasItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: CreditCard, label: "Tenants", path: "/admin/tenants" },
  { icon: CreditCard, label: "Planos & Billing", path: "/admin/planos" },
  { icon: BarChart3, label: "Métricas", path: "/admin/metricas" },
  { icon: Shield, label: "LGPD", path: "/admin/lgpd" },
  { icon: Settings, label: "Configurações", path: "/admin/configuracoes" },
];

const crmItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard CRM", path: "/admin/dashboard-crm" },
  { icon: Megaphone, label: "Leads & Funil", path: "/admin/crm" },
  { icon: MessageCircle, label: "Conversas", path: "/admin/crm-conversas" },
  { icon: BookUser, label: "Contatos", path: "/admin/crm-contatos" },
  { icon: FileText, label: "Templates", path: "/admin/crm-templates" },
];

const ecommerceItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard Loja", path: "/admin/dashboard-ecommerce" },
  { icon: ShoppingCart, label: "Pedidos da Loja", path: "/admin/pedidos-loja" },
];

function isPathActive(itemPath: string, currentPath: string) {
  if (itemPath === "/admin") return currentPath === "/admin";
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}

function ErpSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { open } = useSidebar();
  const { isSuperadmin } = useAuth();
  const { moduleConfig } = useTenant();
  const { hasPermission } = usePermissoes();

  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0, triggerCenterY: 0 });
  const menuItemRefs = useRef<{ [key: string]: HTMLLIElement | null }>({});
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Map group titles to permission keys
  const groupPermissionMap: Record<string, string> = {
    Dashboard: "dashboard",
    Vendas: "vendas",
    Financeiro: "financeiro",
    Estoque: "estoque",
    Offset: "offset",
    Digital: "digital",
    "Comunicação Visual": "comunicacao_visual",
    "Cadastros Gerais": "cadastros",
    Relatórios: "relatorios",
    Configurações: "configuracoes",
    Ajuda: "dashboard", // always visible
  };

  const visibleGroups = erpMenuGroups.filter((group) => {
    // Module config filtering (plan-based)
    if (group.title === "Offset" && !(isSuperadmin || moduleConfig?.has_offset)) return false;
    if (group.title === "Digital" && !(isSuperadmin || moduleConfig?.has_digital)) return false;
    if (group.title === "Comunicação Visual" && !(isSuperadmin || moduleConfig?.has_visual)) return false;
    // Permission-based filtering (cargo)
    const permKey = groupPermissionMap[group.title];
    if (permKey && !hasPermission(permKey)) return false;
    return true;
  });

  const isGroupActive = (group: MenuGroup) => group.items.some((item) => isPathActive(item.path, currentPath));

  const handleMouseEnter = (groupTitle: string, itemCount: number) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    setHoveredGroup(groupTitle);
    const element = menuItemRefs.current[groupTitle];
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const sidebarEl = element.closest('[data-sidebar="sidebar"]');
    const sidebarRight = sidebarEl ? sidebarEl.getBoundingClientRect().right : rect.right;
    const viewportHeight = window.innerHeight;
    const triggerCenterY = rect.top + rect.height / 2;
    const submenuEstimatedHeight = Math.min(44 + itemCount * 36 + 16, viewportHeight - 16);

    let top = rect.top;
    top = Math.max(8, Math.min(top, viewportHeight - submenuEstimatedHeight - 8));

    setSubmenuPosition({ top, left: sidebarRight, triggerCenterY });
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => setHoveredGroup(null), 150);
  };

  const handleItemClick = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredGroup(null);
  };

  return (
    <SidebarContent className="pt-1">
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {visibleGroups.map((group) => {
              const isActive = isGroupActive(group);
              const isHovered = hoveredGroup === group.title;
              const GroupIcon = group.icon;

              return (
                <SidebarMenuItem
                  key={group.title}
                  ref={(el) => (menuItemRefs.current[group.title] = el)}
                  onMouseEnter={() => handleMouseEnter(group.title, group.items.length)}
                  onMouseLeave={handleMouseLeave}
                  className="relative"
                >
                  <SidebarMenuButton
                    tooltip={open ? group.title : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();

                      if (hoveredGroup === group.title) {
                        setHoveredGroup(null);
                        return;
                      }

                      handleMouseEnter(group.title, group.items.length);
                    }}
                    className={cn(
                      "h-auto py-1.5",
                      isActive ? "bg-sidebar-accent text-sidebar-primary font-semibold shadow-sm" : "hover:bg-sidebar-accent/50",
                    )}
                  >
                    <GroupIcon className={open ? "h-4 w-4" : "h-6 w-6"} />
                    <span className="text-sm font-medium leading-5">{group.title}</span>
                    <ChevronRight className={cn("ml-auto h-3 w-3 transition-transform", isHovered && "rotate-90")} />
                  </SidebarMenuButton>

                  {isHovered && (() => {
                    const accentHsl = GROUP_ACCENT[group.title] ?? "210 100% 55%";
                    const connectorTop = submenuPosition.triggerCenterY;
                    const arrowLeft = submenuPosition.left - 10;

                    return createPortal(
                      <>
                        <div
                          className="pointer-events-none fixed z-[10000]"
                          style={{
                            top: `${connectorTop}px`,
                            left: `${arrowLeft}px`,
                            transform: "translateY(-50%)",
                            width: 0,
                            height: 0,
                            borderTop: "7px solid transparent",
                            borderBottom: "7px solid transparent",
                            borderRight: `8px solid hsl(${accentHsl})`,
                          }}
                        />

                        <div
                          className="animate-in fade-in-0 slide-in-from-left-2 fixed z-[9999] max-h-[calc(100vh-100px)] min-w-[220px] overflow-y-auto rounded-md border bg-card shadow-xl"
                          style={{
                            top: `${submenuPosition.top}px`,
                            left: `${submenuPosition.left}px`,
                            borderColor: `hsl(${accentHsl} / 0.35)`,
                            borderLeftWidth: 3,
                            borderLeftColor: `hsl(${accentHsl})`,
                          }}
                          onMouseEnter={() => handleMouseEnter(group.title, group.items.length)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div
                            className="flex flex-col gap-0.5 border-b px-3 py-2.5"
                            style={{
                              background: `hsl(${accentHsl} / 0.08)`,
                              borderColor: `hsl(${accentHsl} / 0.2)`,
                            }}
                          >
                            <span className="text-base font-bold tracking-wide" style={{ color: `hsl(${accentHsl})` }}>
                              {group.title}
                            </span>
                            <span className="text-xs text-muted-foreground">{group.description}</span>
                          </div>

                          <div className="space-y-1.5 p-1.5">
                            {group.items.map((item) => (
                              <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.end}
                                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-popover-foreground ring-1 ring-border/50 shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                                activeClassName="bg-accent text-accent-foreground font-medium ring-primary/60 shadow-md"
                                onClick={handleItemClick}
                              >
                                <item.icon className="h-4 w-4 flex-shrink-0" />
                                <span className="flex-1">{item.label}</span>
                              </NavLink>
                            ))}
                          </div>
                        </div>
                      </>,
                      document.body,
                    );
                  })()}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}

function FlatSidebar({ items }: { items: MenuItem[] }) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
      {items.map((item) => {
        const isActive = isPathActive(item.path, currentPath);

        return (
          <RouterNavLink
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/20"
                : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
          >
            <item.icon size={18} className="shrink-0" />
            <span>{item.label}</span>
          </RouterNavLink>
        );
      })}
    </nav>
  );
}

interface AdminSidebarProps {
  activeModule: ActiveModule;
}

export function AdminSidebar({ activeModule }: AdminSidebarProps) {
  if (activeModule === "erp") {
    return (
      <Sidebar collapsible="icon" className="h-full border-r">
        <ErpSidebar />
      </Sidebar>
    );
  }

  let items: MenuItem[] = [];
  switch (activeModule) {
    case "saas":
      items = saasItems;
      break;
    case "crm":
      items = crmItems;
      break;
    case "ecommerce":
      items = ecommerceItems;
      break;
  }

  return (
    <aside className="flex h-full w-52 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <FlatSidebar items={items} />
    </aside>
  );
}
