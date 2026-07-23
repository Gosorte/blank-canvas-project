import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Cliente {
  id: string;
  tenant_id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
}

interface LojaAuthContextType {
  user: User | null;
  session: Session | null;
  cliente: Cliente | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nome: string, tenantId: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const LojaAuthContext = createContext<LojaAuthContextType | undefined>(undefined);

export function LojaAuthProvider({ tenantId, children }: { tenantId: string; children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCliente = async (userId: string) => {
    const { data } = await (supabase
      .from("clientes" as any)
      .select("id, tenant_id, nome, email, telefone, whatsapp")
      .eq("auth_user_id", userId)
      .eq("tenant_id", tenantId)
      .single() as any);
    if (data) setCliente(data as Cliente);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchCliente(session.user.id), 0);
        } else {
          setCliente(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCliente(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [tenantId]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, nome: string, tid: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome, tenant_id: tid } },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setCliente(null);
  };

  return (
    <LojaAuthContext.Provider value={{ user, session, cliente, loading, signIn, signUp, signOut }}>
      {children}
    </LojaAuthContext.Provider>
  );
}

export function useLojaAuth() {
  const ctx = useContext(LojaAuthContext);
  if (!ctx) throw new Error("useLojaAuth must be inside LojaAuthProvider");
  return ctx;
}
