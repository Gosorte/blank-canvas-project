import { useState } from "react";
import { Plus, Loader2, Trash2, Package, Search } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MODULO_LABELS: Record<string, string> = {
  digital: "Digital",
  offset: "Offset",
  visual: "Comunicação Visual",
};

interface Props {
  tipoModulo: string;
}

function useInsumos(tipoModulo: string) {
  const { activeTenantId } = useTenant();
  return useQuery({
    queryKey: ["insumos_precos", activeTenantId, tipoModulo],
    enabled: !!activeTenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insumos_precos")
        .select("*")
        .eq("tenant_id", activeTenantId!)
        .eq("tipo_modulo", tipoModulo)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useCreateInsumo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      const { data, error } = await supabase.from("insumos_precos").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insumos_precos"] }),
  });
}

function useDeleteInsumo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("insumos_precos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insumos_precos"] }),
  });
}

export default function SetorInsumos({ tipoModulo }: Props) {
  const { activeTenantId } = useTenant();
  const { data: insumos, isLoading } = useInsumos(tipoModulo);
  const createIns = useCreateInsumo();
  const deleteIns = useDeleteInsumo();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ nome_insumo: "", custo_base: 0, markup_padrao: 0 });
  const up = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const filtered = (insumos ?? []).filter((i: any) => i.nome_insumo.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!activeTenantId || !form.nome_insumo) { toast.error("Preencha o nome"); return; }
    try {
      await createIns.mutateAsync({ ...form, tenant_id: activeTenantId, tipo_modulo: tipoModulo });
      toast.success("Insumo cadastrado!");
      setCreateOpen(false);
      setForm({ nome_insumo: "", custo_base: 0, markup_padrao: 0 });
    } catch { toast.error("Erro ao cadastrar"); }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div>
      <AdminHeader title={`Insumos — ${MODULO_LABELS[tipoModulo]}`} subtitle="Custos base e markup de insumos" />
      <div className="p-6 space-y-4">
        <div className="flex gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Buscar insumo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus size={16} />Novo Insumo</Button></DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Cadastrar Insumo</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5"><Label>Nome do Insumo</Label><Input value={form.nome_insumo} onChange={e => up("nome_insumo", e.target.value)} placeholder={tipoModulo === "offset" ? "Ex: Chapa CTP, Tinta Cyan" : tipoModulo === "visual" ? "Ex: Lona 440g, Adesivo Vinil" : "Ex: Toner, Papel A4"} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Custo Base (R$)</Label><Input type="number" step="0.01" value={form.custo_base} onChange={e => up("custo_base", Number(e.target.value))} /></div>
                  <div className="space-y-1.5"><Label>Markup Padrão (%)</Label><Input type="number" value={form.markup_padrao} onChange={e => up("markup_padrao", Number(e.target.value))} /></div>
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={createIns.isPending}>
                  {createIns.isPending && <Loader2 className="animate-spin mr-2" size={16} />}Cadastrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item: any) => (
            <div key={item.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{item.nome_insumo}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{tipoModulo}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="bg-muted rounded-lg p-2 text-center">
                  <p className="font-bold text-foreground">R$ {Number(item.custo_base).toFixed(2)}</p>
                  <p className="text-muted-foreground">Custo Base</p>
                </div>
                <div className="bg-muted rounded-lg p-2 text-center">
                  <p className="font-bold text-foreground">{Number(item.markup_padrao)}%</p>
                  <p className="text-muted-foreground">Markup</p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2 text-center text-xs">
                <p className="text-muted-foreground">Preço Venda</p>
                <p className="font-bold text-primary text-sm">R$ {(Number(item.custo_base) * (1 + Number(item.markup_padrao) / 100)).toFixed(2)}</p>
              </div>
              <div className="flex justify-end mt-3 pt-3 border-t border-border">
                <Button variant="ghost" size="sm" className="text-destructive h-7 text-xs opacity-0 group-hover:opacity-100" onClick={() => setDeleteId(item.id)}>
                  <Trash2 size={12} className="mr-1" />Excluir
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">Nenhum insumo cadastrado</div>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir Insumo</AlertDialogTitle><AlertDialogDescription>Tem certeza?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (deleteId) { await deleteIns.mutateAsync(deleteId); toast.success("Excluído!"); setDeleteId(null); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
