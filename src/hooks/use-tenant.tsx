import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

interface ModuleConfig {
  has_digital: boolean;
  has_visual: boolean;
  has_offset: boolean;
  has_crm_advanced: boolean;
}

interface TenantContextType {
  activeTenantId: string | null;
  setActiveTenantId: (id: string | null) => void;
  tenantName: string | null;
  moduleConfig: ModuleConfig | null;
  tenants: { id: string; nome_grafica: string }[];
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user, isSuperadmin, profile } = useAuth();
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);

  // Fetch user's profile tenant_id
  const { data: profileData } = useQuery({
    queryKey: ["profile-tenant", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch all tenants (for superadmin selector)
  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, nome_grafica")
        .order("nome_grafica");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && isSuperadmin,
  });

  // Fetch module_config for active tenant
  const { data: moduleConfig = null, isLoading: loadingModules } = useQuery({
    queryKey: ["module-config", activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("module_config")
        .select("has_digital, has_visual, has_offset, has_crm_advanced")
        .eq("tenant_id", activeTenantId!)
        .single();
      if (error) return { has_digital: true, has_visual: false, has_offset: false, has_crm_advanced: false };
      return data as ModuleConfig;
    },
    enabled: !!activeTenantId,
  });

  // Auto-set tenant for operators
  useEffect(() => {
    if (!isSuperadmin && profileData?.tenant_id) {
      setActiveTenantId(profileData.tenant_id);
    }
  }, [isSuperadmin, profileData]);

  // For superadmin, restore from localStorage or pick first
  useEffect(() => {
    if (isSuperadmin && !activeTenantId && tenants.length > 0) {
      const saved = localStorage.getItem("active_tenant_id");
      if (saved && tenants.some(t => t.id === saved)) {
        setActiveTenantId(saved);
      } else {
        // Auto-select first tenant so modules are visible immediately
        setActiveTenantId(tenants[0].id);
      }
    }
  }, [isSuperadmin, tenants, activeTenantId]);

  // Persist superadmin selection
  useEffect(() => {
    if (isSuperadmin && activeTenantId) {
      localStorage.setItem("active_tenant_id", activeTenantId);
    }
  }, [isSuperadmin, activeTenantId]);

  const tenantName = tenants.find(t => t.id === activeTenantId)?.nome_grafica ?? null;

  return (
    <TenantContext.Provider value={{
      activeTenantId,
      setActiveTenantId,
      tenantName,
      moduleConfig,
      tenants,
      isLoading: loadingModules,
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) throw new Error("useTenant must be used within TenantProvider");
  return context;
}
