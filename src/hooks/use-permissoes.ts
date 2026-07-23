import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

/**
 * Returns the current user's permissions based on their cargo.
 * Admin and Superadmin have all permissions.
 */
export function usePermissoes() {
  const { user, isAdmin, isSuperadmin } = useAuth();

  const { data: permissoes = [], isLoading } = useQuery({
    queryKey: ["user-permissoes", user?.id],
    queryFn: async () => {
      // Admin/Superadmin always have full access
      if (isAdmin || isSuperadmin) return ["*"];

      const { data: profile } = await supabase
        .from("profiles")
        .select("cargo_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.cargo_id) return [];

      const { data: cargo } = await supabase
        .from("cargos" as any)
        .select("permissoes")
        .eq("id", profile.cargo_id)
        .single();

      return (cargo as any)?.permissoes || [];
    },
    enabled: !!user?.id,
  });

  const hasPermission = (key: string): boolean => {
    if (isAdmin || isSuperadmin) return true;
    return permissoes.includes("*") || permissoes.includes(key);
  };

  return { permissoes, hasPermission, isLoading };
}
