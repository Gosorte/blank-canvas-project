import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();

  const toggle = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return (
    <Button
      variant="ghost"
      size={collapsed ? "icon" : "default"}
      onClick={toggle}
      className={collapsed ? "w-full justify-center" : "w-full justify-start gap-3 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"}
    >
      {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      {!collapsed && (
        <span className="text-sm">
          {resolvedTheme === "dark" ? "Modo Claro" : "Modo Escuro"}
        </span>
      )}
    </Button>
  );
}
