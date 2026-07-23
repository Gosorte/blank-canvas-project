import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useTenant } from "@/hooks/use-tenant";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2, Palette, Bell, Users, Check, X, Shield, Save,
  Loader2, Mail, Phone, MapPin, FileText,
} from "lucide-react";
import { CargosManager } from "@/components/admin/CargosManager";
import { useGrupos } from "@/hooks/use-cargos";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// =================== DADOS DA EMPRESA ===================
function DadosEmpresa({ tenantId }: { tenantId: string }) {
  const queryClient = useQueryClient();

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant-config", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", tenantId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    nome_grafica: "", cnpj: "", telefone: "", email: "",
    endereco: "", cidade: "", estado: "", cep: "", descricao: "",
  });

  useEffect(() => {
    if (tenant) {
      setForm({
        nome_grafica: tenant.nome_grafica || "",
        cnpj: (tenant as any).cnpj || "",
        telefone: (tenant as any).telefone || "",
        email: (tenant as any).email || "",
        endereco: (tenant as any).endereco || "",
        cidade: (tenant as any).cidade || "",
        estado: (tenant as any).estado || "",
        cep: (tenant as any).cep || "",
        descricao: (tenant as any).descricao || "",
      });
    }
  }, [tenant]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("tenants")
        .update({
          nome_grafica: form.nome_grafica,
          ...({ cnpj: form.cnpj, telefone: form.telefone, email: form.email,
            endereco: form.endereco, cidade: form.cidade, estado: form.estado,
            cep: form.cep, descricao: form.descricao, updated_at: new Date().toISOString() } as any),
        })
        .eq("id", tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-config"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Dados da empresa salvos!");
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  if (isLoading) return <Loading />;

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-card rounded-xl border p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Informações Gerais</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome da Gráfica *</Label>
            <Input value={form.nome_grafica} onChange={e => set("nome_grafica", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>CNPJ</Label>
            <Input value={form.cnpj} onChange={e => set("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(00) 0000-0000" />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={form.email} onChange={e => set("email", e.target.value)} type="email" placeholder="contato@grafica.com" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Descrição</Label>
          <Textarea value={form.descricao} onChange={e => set("descricao", e.target.value)} placeholder="Breve descrição da gráfica..." rows={3} />
        </div>
      </div>

      <div className="bg-card rounded-xl border p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Endereço</h3>
        </div>
        <div className="space-y-2">
          <Label>Endereço</Label>
          <Input value={form.endereco} onChange={e => set("endereco", e.target.value)} placeholder="Rua, número, complemento" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input value={form.cidade} onChange={e => set("cidade", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Input value={form.estado} onChange={e => set("estado", e.target.value)} placeholder="SP" maxLength={2} />
          </div>
          <div className="space-y-2">
            <Label>CEP</Label>
            <Input value={form.cep} onChange={e => set("cep", e.target.value)} placeholder="00000-000" />
          </div>
        </div>
      </div>

      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
        {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Salvar Dados
      </Button>
    </div>
  );
}

// =================== APARÊNCIA & MARCA ===================
function AparenciaMarca({ tenantId }: { tenantId: string }) {
  const queryClient = useQueryClient();

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant-config", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("tenants").select("*").eq("id", tenantId).single();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({ cor_primaria: "#3b82f6", cor_secundaria: "#6366f1", logo_url: "" });

  useEffect(() => {
    if (tenant) {
      setForm({
        cor_primaria: (tenant as any).cor_primaria || "#3b82f6",
        cor_secundaria: (tenant as any).cor_secundaria || "#6366f1",
        logo_url: (tenant as any).logo_url || "",
      });
    }
  }, [tenant]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("tenants")
        .update({ ...({ cor_primaria: form.cor_primaria, cor_secundaria: form.cor_secundaria, logo_url: form.logo_url, updated_at: new Date().toISOString() } as any) })
        .eq("id", tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-config"] });
      toast.success("Aparência salva!");
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-card rounded-xl border p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Cores da Marca</h3>
        </div>
        <p className="text-sm text-muted-foreground">As cores definidas aqui serão aplicadas na Loja Virtual do tenant.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Cor Primária</Label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.cor_primaria} onChange={e => setForm(p => ({ ...p, cor_primaria: e.target.value }))} className="w-12 h-10 rounded cursor-pointer border" />
              <Input value={form.cor_primaria} onChange={e => setForm(p => ({ ...p, cor_primaria: e.target.value }))} className="flex-1" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Cor Secundária</Label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.cor_secundaria} onChange={e => setForm(p => ({ ...p, cor_secundaria: e.target.value }))} className="w-12 h-10 rounded cursor-pointer border" />
              <Input value={form.cor_secundaria} onChange={e => setForm(p => ({ ...p, cor_secundaria: e.target.value }))} className="flex-1" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-muted/50">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Pré-visualização</p>
          <div className="flex items-center gap-3">
            <div className="w-16 h-10 rounded-lg shadow-sm" style={{ backgroundColor: form.cor_primaria }} />
            <div className="w-16 h-10 rounded-lg shadow-sm" style={{ backgroundColor: form.cor_secundaria }} />
            <div className="flex-1 space-y-1">
              <div className="h-2 rounded-full w-3/4" style={{ backgroundColor: form.cor_primaria }} />
              <div className="h-2 rounded-full w-1/2" style={{ backgroundColor: form.cor_secundaria, opacity: 0.6 }} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Logotipo</h3>
        </div>
        <div className="space-y-2">
          <Label>URL do Logotipo</Label>
          <Input value={form.logo_url} onChange={e => setForm(p => ({ ...p, logo_url: e.target.value }))} placeholder="https://exemplo.com/logo.png" />
          <p className="text-xs text-muted-foreground">Cole a URL da imagem do logotipo. Recomendado: PNG transparente, mín. 200x200px.</p>
        </div>
        {form.logo_url && (
          <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
            <img src={form.logo_url} alt="Logo" className="max-h-20 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
          </div>
        )}
      </div>

      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
        {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Salvar Aparência
      </Button>
    </div>
  );
}

// =================== NOTIFICAÇÕES ===================
function Notificacoes({ tenantId }: { tenantId: string }) {
  const queryClient = useQueryClient();

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant-config", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("tenants").select("*").eq("id", tenantId).single();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    notif_email_pedido: true,
    notif_email_orcamento: true,
    notif_whatsapp_status: false,
  });

  useEffect(() => {
    if (tenant) {
      setForm({
        notif_email_pedido: (tenant as any).notif_email_pedido ?? true,
        notif_email_orcamento: (tenant as any).notif_email_orcamento ?? true,
        notif_whatsapp_status: (tenant as any).notif_whatsapp_status ?? false,
      });
    }
  }, [tenant]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("tenants")
        .update({ ...({ ...form, updated_at: new Date().toISOString() } as any) })
        .eq("id", tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-config"] });
      toast.success("Notificações salvas!");
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-card rounded-xl border p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Notificações por E-mail</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm font-medium">Status de Pedido</p>
              <p className="text-xs text-muted-foreground">Enviar e-mail quando o status do pedido mudar</p>
            </div>
            <Switch checked={form.notif_email_pedido} onCheckedChange={v => setForm(p => ({ ...p, notif_email_pedido: v }))} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm font-medium">Orçamento Aprovado</p>
              <p className="text-xs text-muted-foreground">Notificar cliente quando orçamento for aprovado</p>
            </div>
            <Switch checked={form.notif_email_orcamento} onCheckedChange={v => setForm(p => ({ ...p, notif_email_orcamento: v }))} />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Phone className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Notificações por WhatsApp</h3>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <p className="text-sm font-medium">Mudança de Status</p>
            <p className="text-xs text-muted-foreground">Enviar WhatsApp automático a cada mudança de status da OP</p>
          </div>
          <Switch checked={form.notif_whatsapp_status} onCheckedChange={v => setForm(p => ({ ...p, notif_whatsapp_status: v }))} />
        </div>

        {!form.notif_whatsapp_status && (
          <p className="text-xs text-muted-foreground italic">Requer integração com API do WhatsApp configurada.</p>
        )}
      </div>

      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
        {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Salvar Notificações
      </Button>
    </div>
  );
}

// =================== USUÁRIOS & PERMISSÕES ===================
function UsuariosPermissoes({ tenantId }: { tenantId: string }) {
  const { isSuperadmin, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { data: grupos } = useGrupos();

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ["tenant-users", tenantId],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = (profiles || []).map((p: any) => p.id);
      const { data: roles } = await supabase.from("user_roles").select("*").in("user_id", userIds.length > 0 ? userIds : ["none"]);

      return (profiles || []).map((p: any) => ({
        ...p,
        roles: (roles || []).filter((r: any) => r.user_id === p.id).map((r: any) => r.role),
      }));
    },
  });

  const aprovarMutation = useMutation({
    mutationFn: async ({ userId, aprovado }: { userId: string; aprovado: boolean }) => {
      const { error } = await supabase.from("profiles").update({ aprovado }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-users"] });
      toast.success("Status atualizado!");
    },
  });

  const toggleRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const typedRole = role as "superadmin" | "admin" | "operador";
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", typedRole)
        .maybeSingle();

      if (existing) {
        await supabase.from("user_roles").delete().eq("id", existing.id);
      } else {
        const { error } = await supabase.from("user_roles").insert([{ user_id: userId, role: typedRole }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-users"] });
      toast.success("Permissão atualizada!");
    },
  });

  const assignCargoMutation = useMutation({
    mutationFn: async ({ userId, cargoId }: { userId: string; cargoId: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ cargo_id: cargoId } as any)
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-users"] });
      toast.success("Grupo atribuído!");
    },
  });

  if (isLoading) return <Loading />;

  const pendentes = usuarios?.filter((u: any) => !u.aprovado) || [];
  const ativos = usuarios?.filter((u: any) => u.aprovado) || [];

  return (
    <div className="space-y-6 max-w-2xl">
      {pendentes.length > 0 && (
        <div className="bg-card rounded-xl border border-orange-500/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold">Aguardando Aprovação</h3>
            <Badge variant="secondary" className="ml-auto">{pendentes.length}</Badge>
          </div>
          <div className="space-y-3">
            {pendentes.map((u: any) => (
              <UserRow key={u.id} user={u} onAprovar={aprovarMutation} onToggleRole={toggleRoleMutation} onAssignGrupo={assignCargoMutation} grupos={grupos || []} isSuperadmin={isSuperadmin} isAdmin={isAdmin} />
            ))}
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Usuários Ativos</h3>
          <Badge variant="secondary" className="ml-auto">{ativos.length}</Badge>
        </div>
        {ativos.length > 0 ? (
          <div className="space-y-3">
            {ativos.map((u: any) => (
              <UserRow key={u.id} user={u} onAprovar={aprovarMutation} onToggleRole={toggleRoleMutation} onAssignGrupo={assignCargoMutation} grupos={grupos || []} isSuperadmin={isSuperadmin} isAdmin={isAdmin} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário ativo</p>
        )}
      </div>
    </div>
  );
}

function UserRow({ user, onAprovar, onToggleRole, onAssignGrupo, grupos, isSuperadmin, isAdmin }: {
  user: any; onAprovar: any; onToggleRole: any; onAssignGrupo: any; grupos: any[]; isSuperadmin: boolean; isAdmin: boolean;
}) {
  const grupoNome = grupos.find((c: any) => c.id === user.cargo_id)?.nome;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border gap-3">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">{(user.nome || "?").charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user.nome || "Sem nome"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-1 ml-10 flex-wrap">
          {user.roles.map((r: string) => (
            <Badge key={r} variant={r === "superadmin" || r === "admin" ? "default" : "secondary"} className="text-[10px]">{r}</Badge>
          ))}
          {grupoNome && (
            <Badge variant="outline" className="text-[10px]">
              <Users className="w-2.5 h-2.5 mr-0.5" /> {grupoNome}
            </Badge>
          )}
        </div>
      </div>
      {isAdmin && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {/* Cargo selector */}
          {!user.roles.includes("superadmin") && !user.roles.includes("admin") && (
            <Select
              value={user.cargo_id || "none"}
              onValueChange={(v) => onAssignGrupo.mutate({ userId: user.id, cargoId: v === "none" ? null : v })}
            >
              <SelectTrigger className="h-7 text-[10px] w-28">
                <SelectValue placeholder="Grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">Sem grupo</SelectItem>
                {grupos.map((c: any) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {/* Admin toggle - not for superadmins */}
          {!user.roles.includes("superadmin") && (
            <Button
              size="sm" variant={user.roles.includes("admin") ? "default" : "outline"}
              onClick={() => onToggleRole.mutate({ userId: user.id, role: "admin" })}
              className="text-xs"
            >
              <Shield className="h-3 w-3 mr-1" /> Admin
            </Button>
          )}
          {user.aprovado ? (
            <Button size="sm" variant="outline" onClick={() => onAprovar.mutate({ userId: user.id, aprovado: false })} className="text-xs text-destructive">
              <X className="h-3 w-3 mr-1" /> Revogar
            </Button>
          ) : (
            <Button size="sm" variant="default" onClick={() => onAprovar.mutate({ userId: user.id, aprovado: true })} className="text-xs">
              <Check className="h-3 w-3 mr-1" /> Aprovar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// =================== UTILITIES ===================
function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );
}

// =================== MAIN ===================
export default function Configuracoes() {
  const { activeTenantId } = useTenant();

  return (
    <div>
      <AdminHeader title="Configurações" subtitle="Configurações da empresa e do sistema" />
      <div className="p-6">
        {!activeTenantId ? (
          <p className="text-muted-foreground text-center py-12">Selecione um tenant para gerenciar as configurações.</p>
        ) : (
          <Tabs defaultValue="empresa">
            <TabsList className="grid w-full max-w-2xl grid-cols-5">
              <TabsTrigger value="empresa" className="gap-1.5 text-xs sm:text-sm">
                <Building2 className="w-3.5 h-3.5 hidden sm:block" /> Empresa
              </TabsTrigger>
              <TabsTrigger value="aparencia" className="gap-1.5 text-xs sm:text-sm">
                <Palette className="w-3.5 h-3.5 hidden sm:block" /> Marca
              </TabsTrigger>
              <TabsTrigger value="notificacoes" className="gap-1.5 text-xs sm:text-sm">
                <Bell className="w-3.5 h-3.5 hidden sm:block" /> Notificações
              </TabsTrigger>
              <TabsTrigger value="grupos" className="gap-1.5 text-xs sm:text-sm">
                <Users className="w-3.5 h-3.5 hidden sm:block" /> Grupos
              </TabsTrigger>
              <TabsTrigger value="usuarios" className="gap-1.5 text-xs sm:text-sm">
                <Users className="w-3.5 h-3.5 hidden sm:block" /> Usuários
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="empresa">
                <DadosEmpresa tenantId={activeTenantId} />
              </TabsContent>
              <TabsContent value="aparencia">
                <AparenciaMarca tenantId={activeTenantId} />
              </TabsContent>
              <TabsContent value="notificacoes">
                <Notificacoes tenantId={activeTenantId} />
              </TabsContent>
              <TabsContent value="grupos">
                <CargosManager tenantId={activeTenantId} />
              </TabsContent>
              <TabsContent value="usuarios">
                <UsuariosPermissoes tenantId={activeTenantId} />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
}
