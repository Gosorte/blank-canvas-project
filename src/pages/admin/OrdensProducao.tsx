import { useState, useRef, DragEvent } from "react";
import { ClipboardList, Plus, Loader2, Trash2, List, LayoutGrid } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useTenants } from "@/hooks/use-tenants";
import { useAllClientes } from "@/hooks/use-clientes";
import { useAllOrdensProducao, useCreateOrdemProducao, useUpdateOrdemProducao, useDeleteOrdemProducao, OP_STATUS, PRIORIDADES } from "@/hooks/use-ordens-producao";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// Kanban column statuses (exclude cancelado from board)
const KANBAN_STATUSES = OP_STATUS.filter(s => s.value !== "cancelado");

function KanbanCard({ op, onDelete }: { op: any; onDelete: (id: string) => void }) {
  const prioCfg = PRIORIDADES.find(p => p.value === op.prioridade);
  
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", op.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="bg-card rounded-lg border border-border p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono font-semibold text-xs text-primary">OP #{op.numero_op}</span>
        <Badge variant="outline" className={cn("text-[10px]", prioCfg?.color)}>{prioCfg?.label}</Badge>
      </div>
      <p className="text-sm font-medium text-foreground truncate">{op.produto_nome}</p>
      <p className="text-xs text-muted-foreground truncate">{op.clientes?.nome ?? "Sem cliente"}</p>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{op.setor}</Badge>
          <span>Qtd: {op.quantidade}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); onDelete(op.id); }}
        >
          <Trash2 size={10} />
        </Button>
      </div>
      {op.data_entrega && (
        <p className="text-[10px] text-muted-foreground mt-1">
          Entrega: {new Date(op.data_entrega).toLocaleDateString("pt-BR")}
        </p>
      )}
    </div>
  );
}

function KanbanColumn({
  status,
  ordens,
  onDrop,
  onDelete,
}: {
  status: typeof OP_STATUS[0];
  ordens: any[];
  onDrop: (opId: string, newStatus: string) => void;
  onDelete: (id: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const opId = e.dataTransfer.getData("text/plain");
    if (opId) onDrop(opId, status.value);
  };

  return (
    <div
      className={cn(
        "flex flex-col min-w-[260px] w-[260px] rounded-xl border bg-muted/30 transition-colors",
        dragOver && "border-primary bg-primary/5"
      )}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className={cn("flex items-center justify-between px-3 py-2.5 rounded-t-xl", status.color)}>
        <span className="font-semibold text-xs">{status.label}</span>
        <Badge variant="secondary" className="text-[10px] h-5 min-w-[20px] flex items-center justify-center">
          {ordens.length}
        </Badge>
      </div>
      {/* Cards */}
      <ScrollArea className="flex-1 p-2 max-h-[calc(100vh-280px)]">
        <div className="space-y-2">
          {ordens.map(op => (
            <KanbanCard key={op.id} op={op} onDelete={onDelete} />
          ))}
          {ordens.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-6 border-2 border-dashed rounded-lg">
              Arraste OPs aqui
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function OrdensProducao() {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "lista">("kanban");

  const { data: tenants } = useTenants();
  const { data: clientes } = useAllClientes();
  const { data: ordens, isLoading } = useAllOrdensProducao();
  const createOP = useCreateOrdemProducao();
  const updateOP = useUpdateOrdemProducao();
  const deleteOP = useDeleteOrdemProducao();

  const [form, setForm] = useState({
    tenant_id: "", cliente_id: "", setor: "digital", produto_nome: "",
    quantidade: 1, valor_total: 0, prioridade: "normal", data_entrega: "", observacoes: "",
  });
  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const [setorFilter, setSetorFilter] = useState("todos");

  const handleCreate = async () => {
    if (!form.tenant_id || !form.produto_nome) { toast.error("Preencha tenant e produto"); return; }
    try {
      await createOP.mutateAsync({
        tenant_id: form.tenant_id,
        cliente_id: form.cliente_id || null,
        setor: form.setor,
        status: "aguardando",
        prioridade: form.prioridade,
        produto_nome: form.produto_nome,
        especificacoes: {},
        quantidade: form.quantidade,
        valor_total: form.valor_total,
        data_entrega: form.data_entrega || null,
        observacoes: form.observacoes || null,
        arquivo_url: null,
      });
      toast.success("OP criada!");
      setCreateOpen(false);
    } catch { toast.error("Erro ao criar OP"); }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateOP.mutateAsync({ id, status: newStatus });
      toast.success("Status atualizado!");
    } catch { toast.error("Erro ao atualizar"); }
  };

  const filteredOrdens = (ordens ?? []).filter((op: any) => setorFilter === "todos" || op.setor === setorFilter);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div>
      <AdminHeader title="Ordens de Produção" subtitle="Gestão de OPs por setor" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Setor Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {["todos", "digital", "offset", "visual"].map(s => (
              <Badge
                key={s}
                variant={setorFilter === s ? "default" : "outline"}
                className="cursor-pointer capitalize"
                onClick={() => setSetorFilter(s)}
              >
                {s === "todos" ? "Todos" : s === "visual" ? "Visual" : s.charAt(0).toUpperCase() + s.slice(1)}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "kanban" ? "default" : "ghost"}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid size={16} />
              </Button>
              <Button
                variant={viewMode === "lista" ? "default" : "ghost"}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode("lista")}
              >
                <List size={16} />
              </Button>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild><Button className="gap-2"><Plus size={16} />Nova OP</Button></DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Nova Ordem de Produção</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Tenant</Label>
                      <Select value={form.tenant_id} onValueChange={(v) => update("tenant_id", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{(tenants ?? []).map((t: any) => <SelectItem key={t.id} value={t.id}>{t.nome_grafica}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label>Setor</Label>
                      <Select value={form.setor} onValueChange={(v) => update("setor", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="digital">Digital</SelectItem>
                          <SelectItem value="offset">Offset</SelectItem>
                          <SelectItem value="visual">Comunicação Visual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5"><Label>Cliente</Label>
                    <Select value={form.cliente_id} onValueChange={(v) => update("cliente_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                      <SelectContent>
                        {(clientes ?? []).filter((c: any) => !form.tenant_id || c.tenant_id === form.tenant_id).map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Produto/Serviço</Label><Input value={form.produto_nome} onChange={(e) => update("produto_nome", e.target.value)} placeholder="Ex: Banner 3x1m Lona 440g" /></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5"><Label>Quantidade</Label><Input type="number" value={form.quantidade} onChange={(e) => update("quantidade", Number(e.target.value))} /></div>
                    <div className="space-y-1.5"><Label>Valor Total</Label><Input type="number" step="0.01" value={form.valor_total} onChange={(e) => update("valor_total", Number(e.target.value))} /></div>
                    <div className="space-y-1.5"><Label>Prioridade</Label>
                      <Select value={form.prioridade} onValueChange={(v) => update("prioridade", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{PRIORIDADES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5"><Label>Data de Entrega</Label><Input type="date" value={form.data_entrega} onChange={(e) => update("data_entrega", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Observações</Label><Input value={form.observacoes} onChange={(e) => update("observacoes", e.target.value)} /></div>
                  <Button className="w-full" onClick={handleCreate} disabled={createOP.isPending}>
                    {createOP.isPending && <Loader2 className="animate-spin mr-2" size={16} />}Criar OP
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KANBAN VIEW */}
        {viewMode === "kanban" && (
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4 min-h-[500px]">
              {KANBAN_STATUSES.map(status => (
                <KanbanColumn
                  key={status.value}
                  status={status}
                  ordens={filteredOrdens.filter((op: any) => op.status === status.value)}
                  onDrop={handleStatusChange}
                  onDelete={(id) => setDeleteId(id)}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}

        {/* LIST VIEW */}
        {viewMode === "lista" && (
          <div className="space-y-3 mt-4">
            {filteredOrdens.map((op: any) => {
              const statusCfg = OP_STATUS.find(s => s.value === op.status);
              const prioCfg = PRIORIDADES.find(p => p.value === op.prioridade);
              return (
                <div key={op.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-all animate-fade-in group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ClipboardList size={18} className="text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground text-sm">OP #{op.numero_op}</h3>
                          <Badge variant="outline" className="text-[10px]">{op.setor}</Badge>
                          <Badge variant="outline" className={cn("text-[10px]", prioCfg?.color)}>{prioCfg?.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{op.produto_nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {op.clientes?.nome ?? "Sem cliente"} • {op.tenants?.nome_grafica ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={op.status} onValueChange={(v) => handleStatusChange(op.id, v)}>
                        <SelectTrigger className={cn("h-7 text-xs w-auto min-w-[120px]", statusCfg?.color)}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OP_STATUS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100" onClick={() => setDeleteId(op.id)}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                    <span>Qtd: <strong className="text-foreground">{op.quantidade}</strong></span>
                    <span>Valor: <strong className="text-foreground">R$ {Number(op.valor_total).toFixed(2)}</strong></span>
                    {op.data_entrega && <span>Entrega: <strong className="text-foreground">{new Date(op.data_entrega).toLocaleDateString("pt-BR")}</strong></span>}
                    <span>Criada: {new Date(op.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              );
            })}
            {filteredOrdens.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">Nenhuma OP encontrada</div>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir OP</AlertDialogTitle><AlertDialogDescription>Tem certeza?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (deleteId) { await deleteOP.mutateAsync(deleteId); toast.success("OP excluída!"); setDeleteId(null); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
