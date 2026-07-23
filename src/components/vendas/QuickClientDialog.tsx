import { useState, useEffect, useCallback } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Users, Truck, UserCheck, Briefcase, Handshake, ShieldCheck, Search, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/use-tenant";
import { toast } from "sonner";

const ORIGINS = [
  "Indicação", "Site", "Instagram", "Facebook", "WhatsApp", "Telefone", "Visita", "Outro",
];

const ROLE_OPTIONS = [
  { value: "cliente", label: "Cliente", icon: Users, color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  { value: "fornecedor", label: "Fornecedor", icon: UserCheck, color: "bg-green-500/10 text-green-600 border-green-500/30" },
  { value: "vendedor", label: "Vendedor", icon: Briefcase, color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  { value: "funcionario", label: "Funcionário", icon: ShieldCheck, color: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
  { value: "parceiro", label: "Parceiro", icon: Handshake, color: "bg-pink-500/10 text-pink-600 border-pink-500/30" },
  { value: "transportadora", label: "Transportadora", icon: Truck, color: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
];

const ROLE_COLORS: Record<string, string> = {
  cliente: "bg-blue-500/10 text-blue-600",
  fornecedor: "bg-green-500/10 text-green-600",
  vendedor: "bg-amber-500/10 text-amber-600",
  funcionario: "bg-purple-500/10 text-purple-600",
  parceiro: "bg-pink-500/10 text-pink-600",
  transportadora: "bg-orange-500/10 text-orange-600",
};

interface QuickClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  initialRoles?: string[];
  onClientCreated: (client: { id: string; nome: string; telefone: string; email?: string }) => void;
}

interface DuplicateInfo {
  record: any;
  matchField: string;
}

export function QuickClientDialog({ open, onOpenChange, initialName, initialRoles, onClientCreated }: QuickClientDialogProps) {
  const { activeTenantId } = useTenant();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "", cpf_cnpj: "", telefone: "", whatsapp: "", email: "",
    roles: ["cliente"] as string[],
  });
  const [duplicate, setDuplicate] = useState<DuplicateInfo | null>(null);
  const [quickSearch, setQuickSearch] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        nome: initialName || "", cpf_cnpj: "", telefone: "", whatsapp: "", email: "",
        roles: initialRoles || ["cliente"],
      });
      setDuplicate(null);
      setQuickSearch("");
    }
  }, [open, initialName, initialRoles]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const toggleRole = (role: string) => {
    setForm((f) => {
      const has = f.roles.includes(role);
      const next = has ? f.roles.filter((r) => r !== role) : [...f.roles, role];
      return { ...f, roles: next.length > 0 ? next : f.roles };
    });
  };

  const checkDuplicate = useCallback(async (field: "cpf_cnpj" | "telefone" | "whatsapp", value: string) => {
    const trimmed = value.trim();
    if (!trimmed || !activeTenantId) return;
    const { data } = await supabase.from("clientes").select("*").eq("tenant_id", activeTenantId).eq(field, trimmed).limit(1);
    if (data && data.length > 0) {
      const labels: Record<string, string> = { cpf_cnpj: "CPF/CNPJ", telefone: "Telefone", whatsapp: "WhatsApp" };
      setDuplicate({ record: data[0], matchField: labels[field] });
    }
  }, [activeTenantId]);

  const handleQuickSearch = async () => {
    const term = quickSearch.trim();
    if (!term || !activeTenantId) return;
    setSearching(true);
    try {
      const { data } = await supabase
        .from("clientes")
        .select("*")
        .eq("tenant_id", activeTenantId)
        .or(`cpf_cnpj.eq.${term},telefone.eq.${term},whatsapp.eq.${term}`)
        .limit(1);
      if (data && data.length > 0) {
        const found = data[0] as any;
        setForm({
          nome: found.nome, cpf_cnpj: found.cpf_cnpj ?? "", telefone: found.telefone ?? "",
          whatsapp: found.whatsapp ?? "", email: found.email ?? "", roles: ["cliente"],
        });
        toast.success("Cadastro encontrado! Dados preenchidos.");
      } else {
        toast.info("Nenhum cadastro encontrado.");
      }
    } catch { toast.error("Erro ao buscar."); }
    finally { setSearching(false); }
  };

  const handleDuplicateContinue = () => {
    if (!duplicate) return;
    const r = duplicate.record;
    onClientCreated({ id: r.id, nome: r.nome, telefone: r.telefone, email: r.email });
    setDuplicate(null);
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error("Informe o nome"); return; }
    if (!form.telefone.trim()) { toast.error("Informe o telefone"); return; }
    if (!activeTenantId) return;

    setLoading(true);
    try {
      for (const field of ["cpf_cnpj", "telefone", "whatsapp"] as const) {
        if (!form[field].trim()) continue;
        const { data } = await supabase.from("clientes").select("*").eq("tenant_id", activeTenantId).eq(field, form[field].trim()).limit(1);
        if (data && data.length > 0) {
          const labels: Record<string, string> = { cpf_cnpj: "CPF/CNPJ", telefone: "Telefone", whatsapp: "WhatsApp" };
          setDuplicate({ record: data[0], matchField: labels[field] });
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase.from("clientes").insert({
        tenant_id: activeTenantId,
        nome: form.nome.trim(),
        cpf_cnpj: form.cpf_cnpj.trim() || null,
        telefone: form.telefone.trim(),
        whatsapp: form.whatsapp.trim() || null,
        email: form.email.trim() || null,
      }).select().single();

      if (error) throw error;
      toast.success("Cadastrado com sucesso!");
      onClientCreated({ id: data.id, nome: data.nome, telefone: data.telefone || "", email: data.email || "" });
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao cadastrar: " + err.message);
    } finally { setLoading(false); }
  };

  if (duplicate) {
    const r = duplicate.record;
    return (
      <Dialog open={open} onOpenChange={(v) => { if (!v) { setDuplicate(null); onOpenChange(false); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Cadastro Duplicado
            </DialogTitle>
            <DialogDescription>
              Já existe um cadastro com o mesmo <strong>{duplicate.matchField}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <p className="font-semibold text-sm">{r.nome}</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              {r.cpf_cnpj && <span>CPF/CNPJ: {r.cpf_cnpj}</span>}
              {r.telefone && <span>Tel: {r.telefone}</span>}
              {r.whatsapp && <span>WhatsApp: {r.whatsapp}</span>}
              {r.email && <span>Email: {r.email}</span>}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => { setDuplicate(null); onOpenChange(false); }}>Cancelar</Button>
            <Button variant="secondary" onClick={() => setDuplicate(null)}>Editar</Button>
            <Button onClick={handleDuplicateContinue}>Prosseguir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastro Rápido</DialogTitle>
          <DialogDescription>Preencha os campos e selecione as atividades.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 items-center p-3 rounded-lg border bg-muted/30">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input placeholder="Busca: CPF/CNPJ, Telefone ou WhatsApp" value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleQuickSearch()} className="h-8" />
          <Button size="sm" variant="secondary" onClick={handleQuickSearch} disabled={searching}>
            {searching ? "..." : "Buscar"}
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground font-semibold mb-2 block">Atividades</Label>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_OPTIONS.map((role) => {
                const Icon = role.icon;
                const active = form.roles.includes(role.value);
                return (
                  <button key={role.value} type="button" onClick={() => toggleRole(role.value)}
                    className={cn("flex items-center gap-1.5 rounded-lg border p-2 text-xs font-medium transition-all",
                      active ? role.color + " border-2" : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50")}>
                    <Icon className="h-3.5 w-3.5 shrink-0" />{role.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div><Label className="text-xs text-muted-foreground">Nome *</Label>
            <Input value={form.nome} onChange={(e) => update("nome", e.target.value)} placeholder="Nome completo" /></div>

          <div><Label className="text-xs text-muted-foreground">CPF/CNPJ</Label>
            <Input value={form.cpf_cnpj} onChange={(e) => update("cpf_cnpj", e.target.value)}
              onBlur={() => form.cpf_cnpj.trim() && checkDuplicate("cpf_cnpj", form.cpf_cnpj)} placeholder="000.000.000-00" /></div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label className="text-xs text-muted-foreground">Telefone *</Label>
              <Input value={form.telefone} onChange={(e) => update("telefone", e.target.value)}
                onBlur={() => form.telefone.trim() && checkDuplicate("telefone", form.telefone)} placeholder="(00) 0000-0000" /></div>
            <div><Label className="text-xs text-muted-foreground">WhatsApp</Label>
              <Input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)}
                onBlur={() => form.whatsapp.trim() && checkDuplicate("whatsapp", form.whatsapp)} placeholder="(00) 00000-0000" /></div>
          </div>

          <div><Label className="text-xs text-muted-foreground">E-mail</Label>
            <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@exemplo.com" /></div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? "Salvando..." : "Cadastrar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
