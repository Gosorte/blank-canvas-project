import { useState } from "react";
import { Truck, Plus, Search, Loader2, Trash2, Phone, Mail, Pencil, MapPin } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useTenant } from "@/hooks/use-tenant";
import { useTransportadoras, useCreateTransportadora, useUpdateTransportadora, useDeleteTransportadora } from "@/hooks/use-transportadoras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { toast } from "sonner";

const emptyForm = {
  nome: "", cnpj: "", telefone: "", email: "",
  contato_nome: "", cidade: "", estado: "", observacoes: "", ativo: true,
};

export default function Transportadoras() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { activeTenantId } = useTenant();
  const { data: transportadoras = [], isLoading } = useTransportadoras();
  const createMut = useCreateTransportadora();
  const updateMut = useUpdateTransportadora();
  const deleteMut = useDeleteTransportadora();

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = transportadoras.filter((t) =>
    t.nome.toLowerCase().includes(search.toLowerCase()) ||
    (t.cidade ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (t: any) => {
    setEditId(t.id);
    setForm({
      nome: t.nome, cnpj: t.cnpj ?? "", telefone: t.telefone ?? "",
      email: t.email ?? "", contato_nome: t.contato_nome ?? "",
      cidade: t.cidade ?? "", estado: t.estado ?? "",
      observacoes: t.observacoes ?? "", ativo: t.ativo,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome) { toast.error("Preencha o nome da transportadora"); return; }
    try {
      if (editId) {
        await updateMut.mutateAsync({ id: editId, ...form });
        toast.success("Transportadora atualizada!");
      } else {
        await createMut.mutateAsync({ ...form, tenant_id: activeTenantId! } as any);
        toast.success("Transportadora cadastrada!");
      }
      setDialogOpen(false);
    } catch { toast.error("Erro ao salvar"); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteMut.mutateAsync(deleteId); toast.success("Transportadora excluída!"); setDeleteId(null); }
    catch { toast.error("Erro ao excluir"); }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div>
      <AdminHeader title="Transportadoras" subtitle="Cadastro de transportadoras para entregas" />
      <div className="p-6 space-y-4">
        <div className="flex gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Buscar transportadora..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button className="gap-2" onClick={openCreate}><Plus size={16} />Nova Transportadora</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div key={t.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-all animate-fade-in group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <Truck size={18} className="text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{t.nome}</h3>
                    {t.cidade && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={10} />{t.cidade}{t.estado ? ` - ${t.estado}` : ""}</p>}
                  </div>
                </div>
                <Badge variant={t.ativo ? "default" : "secondary"} className="text-[10px]">{t.ativo ? "Ativo" : "Inativo"}</Badge>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                {t.cnpj && <p className="font-mono">{t.cnpj}</p>}
                {t.email && <div className="flex items-center gap-2"><Mail size={12} />{t.email}</div>}
                {t.telefone && <div className="flex items-center gap-2"><Phone size={12} />{t.telefone}</div>}
                {t.contato_nome && <p>Contato: {t.contato_nome}</p>}
              </div>
              <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-border">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEdit(t)}>
                  <Pencil size={12} className="mr-1" />Editar
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive h-7 text-xs opacity-0 group-hover:opacity-100" onClick={() => setDeleteId(t.id)}>
                  <Trash2 size={12} className="mr-1" />Excluir
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && !isLoading && (
            <div className="col-span-full text-center py-12 text-muted-foreground">Nenhuma transportadora cadastrada</div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Editar" : "Nova"} Transportadora</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5"><Label>Nome *</Label><Input value={form.nome} onChange={(e) => update("nome", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>CNPJ</Label><Input value={form.cnpj} onChange={(e) => update("cnpj", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Contato</Label><Input value={form.contato_nome} onChange={(e) => update("contato_nome", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => update("telefone", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Cidade</Label><Input value={form.cidade} onChange={(e) => update("cidade", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Estado</Label><Input value={form.estado} onChange={(e) => update("estado", e.target.value)} maxLength={2} placeholder="UF" /></div>
            </div>
            <div className="space-y-1.5"><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => update("observacoes", e.target.value)} rows={2} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.ativo} onCheckedChange={(v) => update("ativo", v)} />
              <Label>Ativo</Label>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="animate-spin mr-2" size={16} />}
              {editId ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={handleDelete}
        itemName="esta transportadora"
      />
    </div>
  );
}
