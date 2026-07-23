import { useState } from "react";
import { Truck, Plus, Search, Loader2, Trash2, Phone, Mail } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useTenants } from "@/hooks/use-tenants";
import { useAllFornecedores, useCreateFornecedor, useDeleteFornecedor } from "@/hooks/use-fornecedores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const categoriaOptions = ["papel", "substrato", "tinta", "chapa", "ilhós", "estrutura", "outros"];

export default function Fornecedores() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: tenants } = useTenants();
  const { data: fornecedores, isLoading } = useAllFornecedores();
  const createFornecedor = useCreateFornecedor();
  const deleteFornecedor = useDeleteFornecedor();

  const [form, setForm] = useState({
    tenant_id: "", razao_social: "", nome_fantasia: "", cnpj: "",
    email: "", telefone: "", contato_nome: "", condicao_pagamento: "",
  });
  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = (fornecedores ?? []).filter((f: any) =>
    f.razao_social.toLowerCase().includes(search.toLowerCase()) ||
    (f.nome_fantasia ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.tenant_id || !form.razao_social) { toast.error("Preencha tenant e razão social"); return; }
    try {
      await createFornecedor.mutateAsync({
        ...form, ativo: true, endereco: null, cidade: null, estado: null,
        categorias: null, observacoes: null,
      } as any);
      toast.success("Fornecedor cadastrado!");
      setCreateOpen(false);
      setForm({ tenant_id: "", razao_social: "", nome_fantasia: "", cnpj: "", email: "", telefone: "", contato_nome: "", condicao_pagamento: "" });
    } catch { toast.error("Erro ao cadastrar"); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteFornecedor.mutateAsync(deleteId); toast.success("Fornecedor excluído!"); setDeleteId(null); }
    catch { toast.error("Erro ao excluir"); }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div>
      <AdminHeader title="Fornecedores" subtitle="Cadastro de fornecedores de insumos" />
      <div className="p-6 space-y-4">
        <div className="flex gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Buscar fornecedor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus size={16} />Novo Fornecedor</Button></DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Cadastrar Fornecedor</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5"><Label>Tenant</Label>
                  <Select value={form.tenant_id} onValueChange={(v) => update("tenant_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{(tenants ?? []).map((t: any) => <SelectItem key={t.id} value={t.id}>{t.nome_grafica}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Razão Social</Label><Input value={form.razao_social} onChange={(e) => update("razao_social", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Nome Fantasia</Label><Input value={form.nome_fantasia} onChange={(e) => update("nome_fantasia", e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>CNPJ</Label><Input value={form.cnpj} onChange={(e) => update("cnpj", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Contato</Label><Input value={form.contato_nome} onChange={(e) => update("contato_nome", e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => update("telefone", e.target.value)} /></div>
                </div>
                <div className="space-y-1.5"><Label>Condição de Pagamento</Label><Input value={form.condicao_pagamento} onChange={(e) => update("condicao_pagamento", e.target.value)} placeholder="Ex: 30/60/90" /></div>
                <Button className="w-full" onClick={handleCreate} disabled={createFornecedor.isPending}>
                  {createFornecedor.isPending && <Loader2 className="animate-spin mr-2" size={16} />}Cadastrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((f: any) => (
            <div key={f.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-all animate-fade-in group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <Truck size={18} className="text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{f.nome_fantasia || f.razao_social}</h3>
                    <p className="text-xs text-muted-foreground">{f.tenants?.nome_grafica ?? "—"}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                {f.cnpj && <p className="font-mono">{f.cnpj}</p>}
                {f.email && <div className="flex items-center gap-2"><Mail size={12} />{f.email}</div>}
                {f.telefone && <div className="flex items-center gap-2"><Phone size={12} />{f.telefone}</div>}
                {f.condicao_pagamento && <p>Pagamento: {f.condicao_pagamento}</p>}
              </div>
              <div className="flex justify-end mt-3 pt-3 border-t border-border">
                <Button variant="ghost" size="sm" className="text-destructive h-7 text-xs opacity-0 group-hover:opacity-100" onClick={() => setDeleteId(f.id)}>
                  <Trash2 size={12} className="mr-1" />Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir Fornecedor</AlertDialogTitle><AlertDialogDescription>Tem certeza?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
