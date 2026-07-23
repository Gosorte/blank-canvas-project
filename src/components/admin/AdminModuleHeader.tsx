import { ModuleSelector, type ActiveModule } from "./ModuleSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { useTenant } from "@/hooks/use-tenant";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  activeModule: ActiveModule;
  onModuleChange: (m: ActiveModule) => void;
}

export function AdminModuleHeader({ activeModule, onModuleChange }: Props) {
  const { profile, roles, signOut, isSuperadmin } = useAuth();
  const { activeTenantId, setActiveTenantId, tenants } = useTenant();

  return (
    <header className="h-14 border-b border-border bg-card px-4 flex items-center justify-between sticky top-0 z-20 gap-4">
      {/* Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-xs">G360</span>
        </div>
        <span className="font-semibold text-sm text-foreground hidden lg:inline">Gráfica 360°</span>
      </div>

      {/* Module buttons */}
      <div className="flex-1 flex justify-center h-full">
        <ModuleSelector active={activeModule} onChange={onModuleChange} />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Tenant selector compact */}
        {isSuperadmin && tenants.length > 0 && (
          <Select value={activeTenantId || ""} onValueChange={setActiveTenantId}>
            <SelectTrigger className="h-8 text-xs w-40 bg-secondary border-none hidden md:flex">
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map(t => (
                <SelectItem key={t.id} value={t.id} className="text-xs">{t.nome_grafica}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <ThemeToggle collapsed />

        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-destructive rounded-full" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full bg-secondary h-8 w-8">
              <User size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="space-y-1">
              <p className="text-sm font-medium">{profile?.nome || "Usuário"}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
              <div className="flex gap-1 pt-1">
                {roles.map((r) => (
                  <Badge key={r} variant={r === "superadmin" || r === "admin" ? "default" : "secondary"} className="text-[10px]">{r}</Badge>
                ))}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
