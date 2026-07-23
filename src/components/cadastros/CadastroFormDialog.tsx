import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Users, Truck, UserCheck, Briefcase, Handshake, ShieldCheck, Search } from "lucide-react";
import { toast } from "sonner";
import { checkDuplicate, ORIGENS, SEGMENTOS, type CadastroUnificado } from "@/hooks/use-cadastros";

const ROLE_UI = [
  { value: "cliente", label: "Cliente", icon: Users, color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  { value: "fornecedor", label: "Fornecedor", icon: UserCheck, color: "bg-green-500/10 text-green-600 border-green-500/30" },
  { value: "vendedor", label: "Vendedor", icon: Briefcase, color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  { value: "funcionario", label: "Funcionário", icon: ShieldCheck, color: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
  { value: "parceiro", label: "Parceiro", icon: Handshake, color: "bg-pink-500/10 text-pink-600 border-pink-500/30" },
  { value: "transportadora", label: "Transportadora", icon: Truck, color: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
];

export interface CadastroFormData {
  nome: string;
  cpf_cnpj: string;
  razao_social: string;
  contato_nome: string;
  telefone: string;
  whatsapp: string;
  email: string;
  origem: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  observacoes: string;
  roles: string[];
  segmento: string;
  tipo_pessoa: string;
}

const emptyForm: CadastroFormData = {
  nome: "", cpf_cnpj: "", razao_social: "", contato_nome: "",
  telefone: "", whatsapp: "", email: "", origem: "",
  endereco: "", cidade: "", estado: "", cep: "", observacoes: "",
  roles: ["cliente"], segmento: "", tipo_pessoa: "fisica",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<CadastroFormData> & { id?: string };
  onSubmit: (data: CadastroFormData) => void;
  isLoading?: boolean;
  tenantId: string;
  onDuplicateFound?: (record: CadastroUnificado) => void;
}

export function CadastroFormDialog({ open, onOpenChange, initialData, onSubmit, isLoading, tenantId, onDuplicateFound }: Props) {
  const [form, setForm] = useState<CadastroFormData>(emptyForm);
  const [attempted, setAttempted] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialData ? { ...emptyForm, ...initialData } : emptyForm);
      setAttempted(false);
      setQuickSearch("");
    }
  }, [open, initialData]);

  const update = (field: keyof CadastroFormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const toggleRole = (role: string) => {
    setForm((f) => {
      const has = f.roles.includes(role);
      const next = has ? f.roles.filter((r) => r !== role) : [...f.roles, role];
      return { ...f, roles: next.length > 0 ? next : f.roles };
    });
  };

  const checkDup = useCallback(async (field: "cpf_cnpj" | "telefone" | "whatsapp", value: string): Promise<boolean> => {
    if (!value.trim() || !tenantId) return false;
    const dup = await checkDuplicate(field, value, tenantId, initialData?.id);
    if (dup) {
      const labels: Record<string, string> = { cpf_cnpj: "CPF/CNPJ", telefone: "Telefone", whatsapp: "WhatsApp" };
      toast.error(`Cadastro duplicado! Já existe um registro com este ${labels[field]}.`);
      onDuplicateFound?.(dup);
      return true;
    }
    return false;
  }, [tenantId, initialData?.id, onDuplicateFound]);

  const handleQuickSearch = async () => {
    const term = quickSearch.trim();
    if (!term || !tenantId) return;
    setSearching(true);
    try {
      const fields: ("cpf_cnpj" | "telefone" | "whatsapp")[] = ["cpf_cnpj", "telefone", "whatsapp"];
      for (const field of fields) {
        const found = await checkDuplicate(field, term, tenantId);
        if (found) {
          setForm({
            nome: found.nome, cpf_cnpj: found.cpf_cnpj ?? "", razao_social: found.razao_social ?? "",
            contato_nome: found.contato_nome ?? "", telefone: found.telefone ?? "", whatsapp: found.whatsapp ?? "",
            email: found.email ?? "", origem: found.origem ?? "", endereco: found.endereco ?? "",
            cidade: found.cidade ?? "", estado: found.estado ?? "", cep: found.cep ?? "",
            observacoes: found.observacoes ?? "", roles: found.roles ?? ["cliente"],
            segmento: found.segmento ?? "", tipo_pessoa: found.tipo_pessoa ?? "fisica",
          });
          toast.success("Cadastro encontrado! Dados preenchidos automaticamente.");
          return;
        }
      }
      toast.info("Nenhum cadastro encontrado com este dado.");
    } catch { toast.error("Erro ao buscar cadastro."); }
    finally { setSearching(false); }
  };

  const handleSubmit = async () => {
    setAttempted(true);
    if (!form.nome.trim() || !form.telefone.trim()) return;
    if (!initialData?.id) {
      if (form.cpf_cnpj.trim() && await checkDup("cpf_cnpj", form.cpf_cnpj)) return;
      if (await checkDup("telefone", form.telefone)) return;
      if (form.whatsapp.trim() && await checkDup("whatsapp", form.whatsapp)) return;
    }
    onSubmit(form);
  };

  const isEditing = !!initialData?.id;
  const showErr = (val: string) => attempted && !val.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Cadastro" : "Novo Cadastro"}</DialogTitle>
          <DialogDescription>Preencha os dados e selecione as atividades do cadastro.</DialogDescription>
        </DialogHeader>

        {!isEditing && (
          <div className="flex gap-2 items-center p-3 rounded-lg border bg-muted/30">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input placeholder="Busca rápida: CPF, Telefone ou WhatsApp" value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickSearch()} className="h-8" />
            <Button size="sm" variant="secondary" onClick={handleQuickSearch} disabled={searching}>
              {searching ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Nome *</Label>
                <Input value={form.nome} onChange={(e) => update("nome", e.target.value)}
                  placeholder="Nome completo" className={cn(showErr(form.nome) && "border-destructive")} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">CPF/CNPJ</Label>
                <Input value={form.cpf_cnpj} onChange={(e) => update("cpf_cnpj", e.target.value)}
                  onBlur={() => form.cpf_cnpj.trim() && checkDup("cpf_cnpj", form.cpf_cnpj)}
                  placeholder="000.000.000-00" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Razão Social</Label>
                <Input value={form.razao_social} onChange={(e) => update("razao_social", e.target.value)} placeholder="Razão social" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Telefone *</Label>
                <Input value={form.telefone} onChange={(e) => update("telefone", e.target.value)}
                  onBlur={() => form.telefone.trim() && checkDup("telefone", form.telefone)}
                  placeholder="(00) 0000-0000" className={cn(showErr(form.telefone) && "border-destructive")} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">WhatsApp</Label>
                <Input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)}
                  onBlur={() => form.whatsapp.trim() && checkDup("whatsapp", form.whatsapp)}
                  placeholder="(00) 00000-0000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">E-mail</Label>
                <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Contato</Label>
                <Input value={form.contato_nome} onChange={(e) => update("contato_nome", e.target.value)} placeholder="Pessoa de contato" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Origem</Label>
                <Select value={form.origem} onValueChange={(v) => update("origem", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione a origem" /></SelectTrigger>
                  <SelectContent>{ORIGENS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Segmento</Label>
                <Select value={form.segmento} onValueChange={(v) => update("segmento", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{SEGMENTOS.map((s) => <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Endereço</Label>
              <Input value={form.endereco} onChange={(e) => update("endereco", e.target.value)} placeholder="Rua, número, bairro" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label className="text-xs text-muted-foreground">Cidade</Label><Input value={form.cidade} onChange={(e) => update("cidade", e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">Estado</Label><Input value={form.estado} onChange={(e) => update("estado", e.target.value)} placeholder="UF" /></div>
              <div><Label className="text-xs text-muted-foreground">CEP</Label><Input value={form.cep} onChange={(e) => update("cep", e.target.value)} placeholder="00000-000" /></div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => update("observacoes", e.target.value)} placeholder="Observações gerais" rows={3} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground font-semibold">Atividades</Label>
            {ROLE_UI.map((role) => {
              const Icon = role.icon;
              const active = form.roles.includes(role.value);
              return (
                <button key={role.value} type="button" onClick={() => toggleRole(role.value)}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all",
                    active ? role.color + " border-2" : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50"
                  )}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {role.label}
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
