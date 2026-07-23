import { useState } from "react";
import { Plus, Loader2, Trash2, ClipboardList, GripVertical } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useProcessos, useCreateProcesso, useDeleteProcesso } from "@/hooks/use-processos";
import { useMaquinas } from "@/hooks/use-maquinas";
import { useTenant } from "@/hooks/use-tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function SetorProcessos({ tipoModulo }: Props) {
  const { activeTenantId } = useTenant();
  const { data: processos, isLoading } = useProcessos(tipoModulo);
  const { data: maquinas } = useMaquinas(tipoModulo);
  const createProc = useCreateProcesso();
  const deleteProc = useDeleteProcesso();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "", ordem: 0, tempo_estimado_min: 0, custo_processo: 0, requer_maquina: false, maquina_id: "" });
  const up = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!activeTenantId || !form.nome) { toast.error("Preencha o nome"); return; }
    try {
      await createProc.mutateAsync({
        ...form,
        tenant_id: activeTenantId,
        tipo_modulo: tipoModulo,
        maquina_id: form.maquina_id || null,
      });
      toast.success("Processo cadastrado!");
      setCreateOpen(false);
      setForm({ nome: "", descricao: "", ordem: 0, tempo_estimado_min: 0, custo_processo: 0, requer_maquina: false, maquina_id: "" });
    } catch { toast.error("Erro ao cadastrar"); }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div>
      <AdminHeader title={`Processos — ${MODULO_LABELS[tipoModulo]}`} subtitle="Fluxo de produção e etapas" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus size={16} />Novo Processo</Button></DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Cadastrar Processo</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5"><Label>Nome</Label><Input value={form.nome} onChange={e => up("nome", e.target.value)} placeholder="Ex: Impressão, Refile, Laminação" /></div>
                <div className="space-y-1.5"><Label>Descrição</Label><Input value={form.descricao} onChange={e => up("descricao", e.target.value)} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5"><Label>Ordem</Label><Input type="number" value={form.ordem} onChange={e => up("ordem", Number(e.target.value))} /></div>
                  <div className="space-y-1.5"><Label>Tempo (min)</Label><Input type="number" value={form.tempo_estimado_min} onChange={e => up("tempo_estimado_min", Number(e.target.value))} /></div>
                  <div className="space-y-1.5"><Label>Custo (R$)</Label><Input type="number" step="0.01" value={form.custo_processo} onChange={e => up("custo_processo", Number(e.target.value))} /></div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.requer_maquina} onCheckedChange={v => up("requer_maquina", v)} />
                  <Label>Requer máquina</Label>
                </div>
                {form.requer_maquina && (
                  <div className="space-y-1.5"><Label>Máquina</Label>
                    <Select value={form.maquina_id} onValueChange={v => up("maquina_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {(maquinas ?? []).map((m: any) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button className="w-full" onClick={handleCreate} disabled={createProc.isPending}>
                  {createProc.isPending && <Loader2 className="animate-spin mr-2" size={16} />}Cadastrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Process list ordered */}
        <div className="space-y-2">
          {(processos ?? []).map((p: any, idx: number) => (
            <div key={p.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-all flex items-center gap-4 group">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GripVertical size={16} />
                <span className="text-sm font-mono font-bold text-primary w-6">{idx + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm">{p.nome}</h3>
                {p.descricao && <p className="text-xs text-muted-foreground truncate">{p.descricao}</p>}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                {p.tempo_estimado_min > 0 && <Badge variant="secondary" className="text-[10px]">⏱ {p.tempo_estimado_min} min</Badge>}
                {Number(p.custo_processo) > 0 && <Badge variant="secondary" className="text-[10px]">R$ {Number(p.custo_processo).toFixed(2)}</Badge>}
                {p.requer_maquina && <Badge variant="outline" className="text-[10px]">🖨 {p.maquinas?.nome || "Máquina"}</Badge>}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100" onClick={() => setDeleteId(p.id)}>
                <Trash2 size={12} />
              </Button>
            </div>
          ))}
          {(processos ?? []).length === 0 && (
            <div className="text-center py-12 text-muted-foreground">Nenhum processo cadastrado</div>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir Processo</AlertDialogTitle><AlertDialogDescription>Tem certeza?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (deleteId) { await deleteProc.mutateAsync(deleteId); toast.success("Excluído!"); setDeleteId(null); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
