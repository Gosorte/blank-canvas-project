import { Gauge, Factory, Megaphone, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useTenant } from "@/hooks/use-tenant";
import { usePermissoes } from "@/hooks/use-permissoes";

export type ActiveModule = "saas" | "erp" | "crm" | "ecommerce";

interface ModuleSelectorProps {
  active: ActiveModule;
  onChange: (mod: ActiveModule) => void;
}

const modules: {
  key: ActiveModule;
  label: string;
  icon: React.ElementType;
  gradient: string;
  glow: string;
  requiresSuperadmin?: boolean;
  requiresTenant?: boolean;
  permissionKey?: string;
}[] = [
  { key: "saas", label: "SaaS Control", icon: Gauge, gradient: "from-violet-500 to-purple-600", glow: "shadow-violet-500/25", requiresSuperadmin: true },
  { key: "erp", label: "ERP", icon: Factory, gradient: "from-blue-500 to-cyan-500", glow: "shadow-blue-500/25", requiresTenant: true },
  { key: "crm", label: "CRM", icon: Megaphone, gradient: "from-emerald-500 to-teal-500", glow: "shadow-emerald-500/25", requiresTenant: true, permissionKey: "crm" },
  { key: "ecommerce", label: "E-commerce", icon: Store, gradient: "from-amber-500 to-orange-500", glow: "shadow-amber-500/25", requiresTenant: true, permissionKey: "ecommerce" },
];

export function ModuleSelector({ active, onChange }: ModuleSelectorProps) {
  const { isSuperadmin } = useAuth();
  const { activeTenantId } = useTenant();
  const { hasPermission } = usePermissoes();

  const visible = modules.filter((m) => {
    if (m.requiresSuperadmin && !isSuperadmin) return false;
    if (m.requiresTenant && !activeTenantId) return false;
    if (m.permissionKey && !hasPermission(m.permissionKey)) return false;
    return true;
  });

  return (
    <div className="flex items-center gap-1.5 h-full">
      {visible.map((m) => {
        const isActive = active === m.key;
        return (
          <button
            key={m.key}
            onClick={() => onChange(m.key)}
            className={cn(
              "flex items-center justify-center gap-2 w-36 h-full rounded text-xs font-semibold uppercase tracking-wider transition-all duration-200",
              isActive
                ? `bg-gradient-to-r ${m.gradient} text-white shadow-md ${m.glow}`
                : "bg-secondary text-muted-foreground border border-border hover:text-foreground hover:bg-accent"
            )}
          >
            <m.icon size={15} className="shrink-0" />
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
