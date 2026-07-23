import { useState } from "react";
import { Plus, Loader2, Trash2, Printer, Wrench, Power } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useMaquinas, useCreateMaquina, useUpdateMaquina, useDeleteMaquina } from "@/hooks/use-maquinas";
import { useTenant } from "@/hooks/use-tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  ativa: { label: "Ativa", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  manutencao: { label: "Manutenção", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  inativa: { label: "Inativa", color: "bg-red-500/10 text-red-600 border-red-200" },
};

const MODULO_LABELS: Record<string, string> = {
  digital: "Digital",
  offset: "Offset",
  visual: "Comunicação Visual",
};

interface Props {
  tipoModulo: string;
}

export default function SetorMaquinas({ tipoModulo }: Props) {
  const { activeTenantId } = useTenant();
  const { data: maquinas, isLoading } = useMaquinas(tipoModulo);
  const createMaq = useCreateMaquina();
  const updateMaq = useUpdateMaquina();
  const deleteMaq = useDeleteMaquina();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", marca: "", modelo: "", capacidade: "", custo_hora: 0, localizacao: "", observacoes: "" });
  const up = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!activeTenantId || !form.nome) { toast.error("Preencha o nome"); return; }
    try {
      await createMaq.mutateAsync({ ...form, tenant_id: activeTenantId, tipo_modulo: tipoModulo });
      toast.success("Máquina cadastrada!");
      setCreateOpen(false);
      setForm({ nome: "", marca: "", modelo: "", capacidade: "", custo_hora: 0, localizacao: "", observacoes: "" });
    } catch { toast.error("Erro ao cadastrar"); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateMaq.mutateAsync({ id, status });
      toast.success("Status atualizado!");
    } catch { toast.error("Erro ao atualizar"); }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div>
      <AdminHeader title={`Máquinas — ${MODULO_LABELS[tipoModulo]}`} subtitle="Cadastro e gestão de equipamentos" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus size={16} />Nova Máquina</Button></DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Cadastrar Máquina</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5"><Label>Nome</Label><Input value={form.nome} onChange={e => up("nome", e.target.value)} placeholder="Ex: HP Indigo 5600" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Marca</Label><Input value={form.marca} onChange={e => up("marca", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Modelo</Label><Input value={form.modelo} onChange={e => up("modelo", e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Capacidade</Label><Input value={form.capacidade} onChange={e => up("capacidade", e.target.value)} placeholder="Ex: 4600 folhas/hora" /></div>
                  <div className="space-y-1.5"><Label>Custo/Hora (R$)</Label><Input type="number" step="0.01" value={form.custo_hora} onChange={e => up("custo_hora", Number(e.target.value))} /></div>
                </div>
                <div className="space-y-1.5"><Label>Localização</Label><Input value={form.localizacao} onChange={e => up("localizacao", e.target.value)} placeholder="Ex: Galpão A" /></div>
                <div className="space-y-1.5"><Label>Observações</Label><Input value={form.observacoes} onChange={e => up("observacoes", e.target.value)} /></div>
                <Button className="w-full" onClick={handleCreate} disabled={createMaq.isPending}>
                  {createMaq.isPending && <Loader2 className="animate-spin mr-2" size={16} />}Cadastrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(maquinas ?? []).map((m: any) => {
            const st = STATUS_MAP[m.status] ?? STATUS_MAP.ativa;
            return (
              <div key={m.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Printer size={18} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{m.nome}</h3>
                      <p className="text-xs text-muted-foreground">{[m.marca, m.modelo].filter(Boolean).join(" — ") || "Sem detalhes"}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px]", st.color)}>{st.label}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="bg-muted rounded-lg p-2 text-center">
                    <p className="font-bold text-foreground">R$ {Number(m.custo_hora).toFixed(2)}</p>
                    <p className="text-muted-foreground">Custo/Hora</p>
                  </div>
                  <div className="bg-muted rounded-lg p-2 text-center">
                    <p className="font-bold text-foreground">{m.capacidade || "—"}</p>
                    <p className="text-muted-foreground">Capacidade</p>
                  </div>
                </div>
                {m.localizacao && <p className="text-xs text-muted-foreground mb-2">📍 {m.localizacao}</p>}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <Select value={m.status} onValueChange={v => handleStatusChange(m.id, v)}>
                    <SelectTrigger className="h-7 text-xs w-auto min-w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativa">Ativa</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                      <SelectItem value="inativa">Inativa</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" className="text-destructive h-7 text-xs opacity-0 group-hover:opacity-100" onClick={() => setDeleteId(m.id)}>
                    <Trash2 size={12} className="mr-1" />Excluir
                  </Button>
                </div>
              </div>
            );
          })}
          {(maquinas ?? []).length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">Nenhuma máquina cadastrada</div>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir Máquina</AlertDialogTitle><AlertDialogDescription>Tem certeza?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (deleteId) { await deleteMaq.mutateAsync(deleteId); toast.success("Excluída!"); setDeleteId(null); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
