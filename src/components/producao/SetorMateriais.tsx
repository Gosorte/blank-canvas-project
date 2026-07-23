import { useState } from "react";
import { Plus, Loader2, Trash2, FileText, Search } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useTenant } from "@/hooks/use-tenant";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const MODULO_LABELS: Record<string, string> = {
  digital: "Digital",
  offset: "Offset",
  visual: "Comunicação Visual",
};

interface Props {
  tipoModulo: string;
}

function useMateriais(tipoModulo: string) {
  const { activeTenantId } = useTenant();
  // For offset/digital: papéis table; for visual: substratos table
  const table = tipoModulo === "visual" ? "substratos" : "papeis";

  return useQuery({
    queryKey: [table, activeTenantId, tipoModulo],
    enabled: !!activeTenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("tenant_id", activeTenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export default function SetorMateriais({ tipoModulo }: Props) {
  const { activeTenantId } = useTenant();
  const { data: materiais, isLoading } = useMateriais(tipoModulo);
  const qc = useQueryClient();
  const isVisual = tipoModulo === "visual";
  const table = isVisual ? "substratos" : "papeis";
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Form for papéis
  const [papelForm, setPapelForm] = useState({ nome: "", tipo: "couche", gramatura: 90, custo_folha: 0, formato: "66x96", largura_cm: 66, altura_cm: 96 });
  // Form for substratos
  const [subForm, setSubForm] = useState({ nome: "", custo_m2: 0, largura_max_m: 0 });

  const createMat = useMutation({
    mutationFn: async (values: any) => {
      const { data, error } = await supabase.from(table).insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });

  const deleteMat = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });

  const filtered = (materiais ?? []).filter((m: any) => m.nome.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!activeTenantId) return;
    try {
      if (isVisual) {
        if (!subForm.nome) { toast.error("Preencha o nome"); return; }
        await createMat.mutateAsync({ ...subForm, tenant_id: activeTenantId });
      } else {
        if (!papelForm.nome) { toast.error("Preencha o nome"); return; }
        await createMat.mutateAsync({ ...papelForm, tenant_id: activeTenantId });
      }
      toast.success("Material cadastrado!");
      setCreateOpen(false);
    } catch { toast.error("Erro ao cadastrar"); }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div>
      <AdminHeader title={`${isVisual ? "Substratos" : "Papéis"} — ${MODULO_LABELS[tipoModulo]}`} subtitle={isVisual ? "Gestão de substratos (lona, adesivo, etc.)" : "Gestão de papéis e gramaturas"} />
      <div className="p-6 space-y-4">
        <div className="flex gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus size={16} />Novo {isVisual ? "Substrato" : "Papel"}</Button></DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Cadastrar {isVisual ? "Substrato" : "Papel"}</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                {isVisual ? (
                  <>
                    <div className="space-y-1.5"><Label>Nome</Label><Input value={subForm.nome} onChange={e => setSubForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Lona 440g, Adesivo Vinil" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label>Custo/m² (R$)</Label><Input type="number" step="0.01" value={subForm.custo_m2} onChange={e => setSubForm(f => ({ ...f, custo_m2: Number(e.target.value) }))} /></div>
                      <div className="space-y-1.5"><Label>Largura Máx. (m)</Label><Input type="number" step="0.1" value={subForm.largura_max_m} onChange={e => setSubForm(f => ({ ...f, largura_max_m: Number(e.target.value) }))} /></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5"><Label>Nome</Label><Input value={papelForm.nome} onChange={e => setPapelForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Couchê 150g 66x96" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label>Gramatura (g/m²)</Label><Input type="number" value={papelForm.gramatura} onChange={e => setPapelForm(f => ({ ...f, gramatura: Number(e.target.value) }))} /></div>
                      <div className="space-y-1.5"><Label>Custo/Folha (R$)</Label><Input type="number" step="0.01" value={papelForm.custo_folha} onChange={e => setPapelForm(f => ({ ...f, custo_folha: Number(e.target.value) }))} /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5"><Label>Formato</Label><Input value={papelForm.formato} onChange={e => setPapelForm(f => ({ ...f, formato: e.target.value }))} /></div>
                      <div className="space-y-1.5"><Label>Largura (cm)</Label><Input type="number" value={papelForm.largura_cm} onChange={e => setPapelForm(f => ({ ...f, largura_cm: Number(e.target.value) }))} /></div>
                      <div className="space-y-1.5"><Label>Altura (cm)</Label><Input type="number" value={papelForm.altura_cm} onChange={e => setPapelForm(f => ({ ...f, altura_cm: Number(e.target.value) }))} /></div>
                    </div>
                  </>
                )}
                <Button className="w-full" onClick={handleCreate} disabled={createMat.isPending}>
                  {createMat.isPending && <Loader2 className="animate-spin mr-2" size={16} />}Cadastrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((m: any) => (
            <div key={m.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{m.nome}</h3>
                    <p className="text-xs text-muted-foreground">
                      {isVisual ? `Largura: ${m.largura_max_m ?? 0}m` : `${m.gramatura}g/m² • ${m.formato ?? ""}`}
                    </p>
                  </div>
                </div>
                <Badge variant={m.ativo ? "default" : "secondary"} className="text-[10px]">{m.ativo ? "Ativo" : "Inativo"}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted rounded-lg p-2 text-center">
                  <p className="font-bold text-foreground">R$ {isVisual ? Number(m.custo_m2).toFixed(2) : Number(m.custo_folha).toFixed(2)}</p>
                  <p className="text-muted-foreground">{isVisual ? "Custo/m²" : "Custo/Folha"}</p>
                </div>
                {!isVisual && (
                  <div className="bg-muted rounded-lg p-2 text-center">
                    <p className="font-bold text-foreground">{m.largura_cm}x{m.altura_cm}</p>
                    <p className="text-muted-foreground">Dimensão (cm)</p>
                  </div>
                )}
                {isVisual && (
                  <div className="bg-muted rounded-lg p-2 text-center">
                    <p className="font-bold text-foreground">{Number(m.estoque_m2 ?? 0).toFixed(1)} m²</p>
                    <p className="text-muted-foreground">Estoque</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-3 pt-3 border-t border-border">
                <Button variant="ghost" size="sm" className="text-destructive h-7 text-xs opacity-0 group-hover:opacity-100" onClick={() => setDeleteId(m.id)}>
                  <Trash2 size={12} className="mr-1" />Excluir
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">Nenhum material cadastrado</div>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir Material</AlertDialogTitle><AlertDialogDescription>Tem certeza?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (deleteId) { await deleteMat.mutateAsync(deleteId); toast.success("Excluído!"); setDeleteId(null); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
