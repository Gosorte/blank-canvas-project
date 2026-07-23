import { useState, useMemo } from "react";
import { ListChecks, Plus, Clock, CheckCircle2, Circle, Trash2, Edit, Search, Flag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTenant } from "@/hooks/use-tenant";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";

const priorityConfig: Record<string, { label: string; color: string }> = {
  alta: { label: "Alta", color: "bg-destructive/20 text-destructive" },
  media: { label: "Média", color: "bg-yellow-500/20 text-yellow-700" },
  baixa: { label: "Baixa", color: "bg-green-500/20 text-green-700" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-700" },
  em_andamento: { label: "Em Andamento", color: "bg-blue-500/20 text-blue-700" },
  concluida: { label: "Concluída", color: "bg-green-500/20 text-green-700" },
  cancelada: { label: "Cancelada", color: "bg-red-500/20 text-red-700" },
};

const categoryConfig: Record<string, string> = { geral: "Geral", producao: "Produção", entrega: "Entrega", arte: "Arte", financeiro: "Financeiro" };
const emptyForm = { titulo: "", descricao: "", prioridade: "media", categoria: "geral", data_vencimento: "" };

export function TaskListView() {
  const { user } = useAuth();
  const { activeTenantId } = useTenant();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks" as any).select("*")
        .eq("tenant_id", activeTenantId!)
        .order("data_vencimento", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!user && !!activeTenantId,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => { const { error } = await supabase.from("tasks" as any).insert(payload as any); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tasks"] }); toast.success("Tarefa criada!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => { const { error } = await supabase.from("tasks" as any).update(updates as any).eq("id", id as any); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tasks"] }); toast.success("Tarefa atualizada!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("tasks" as any).delete().eq("id", id as any); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tasks"] }); toast.success("Tarefa excluída!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t: any) => t.status === "concluida").length;
    const overdue = tasks.filter((t: any) => t.data_vencimento && isPast(new Date(t.data_vencimento)) && t.status !== "concluida" && t.status !== "cancelada").length;
    return { total, completed, overdue, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter((t: any) => {
      const matchSearch = !search || t.titulo.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || t.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [tasks, search, filterStatus]);

  const toggleStatus = async (task: any) => {
    const next = task.status === "pendente" ? "em_andamento" : task.status === "em_andamento" ? "concluida" : "pendente";
    await updateMutation.mutateAsync({ id: task.id, status: next, concluido_em: next === "concluida" ? new Date().toISOString() : null });
  };

  const handleSubmit = () => {
    if (!form.titulo.trim()) { toast.error("Título obrigatório"); return; }
    const payload: any = {
      tenant_id: activeTenantId, criado_por: user?.id, titulo: form.titulo,
      descricao: form.descricao || null, prioridade: form.prioridade, categoria: form.categoria,
      data_vencimento: form.data_vencimento ? new Date(form.data_vencimento + "T12:00:00").toISOString() : null,
    };
    if (editingTask) updateMutation.mutate({ id: editingTask.id, ...payload });
    else createMutation.mutate({ ...payload, status: "pendente" });
    setDialogOpen(false); setEditingTask(null); setForm(emptyForm);
  };

  const openEdit = (t: any) => {
    setEditingTask(t);
    setForm({ titulo: t.titulo, descricao: t.descricao || "", prioridade: t.prioridade, categoria: t.categoria, data_vencimento: t.data_vencimento ? t.data_vencimento.split("T")[0] : "" });
    setDialogOpen(true);
  };

  const getDueLabel = (t: any) => {
    if (!t.data_vencimento) return null;
    const d = new Date(t.data_vencimento);
    if (isToday(d)) return "Hoje";
    if (isTomorrow(d)) return "Amanhã";
    return format(d, "dd/MM", { locale: ptBR });
  };

  const isOverdue = (t: any) => t.data_vencimento && isPast(new Date(t.data_vencimento)) && !isToday(new Date(t.data_vencimento)) && t.status !== "concluida" && t.status !== "cancelada";

  return (
    <div className="space-y-4">
      {/* Header with new task button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          <span className="font-semibold">Tarefas</span>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => { setEditingTask(null); setForm(emptyForm); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" /> Nova Tarefa
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3"><p className="text-[10px] text-muted-foreground uppercase mb-1">Total</p><p className="text-xl font-bold">{metrics.total}</p></Card>
        <Card className="p-3"><p className="text-[10px] text-muted-foreground uppercase mb-1">Concluídas</p><p className="text-xl font-bold text-green-600">{metrics.completed}</p><Progress value={metrics.rate} className="mt-2 h-1.5" /></Card>
        <Card className="p-3"><p className="text-[10px] text-muted-foreground uppercase mb-1">Atrasadas</p><p className="text-xl font-bold text-destructive">{metrics.overdue}</p></Card>
        <Card className="p-3"><p className="text-[10px] text-muted-foreground uppercase mb-1">Taxa</p><p className="text-xl font-bold text-primary">{metrics.rate}%</p></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar tarefa..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      {isLoading ? <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      : <div className="space-y-2">
        {filtered.map((task: any) => {
          const overdue = isOverdue(task);
          const pCfg = priorityConfig[task.prioridade] || priorityConfig.media;
          const sCfg = statusConfig[task.status] || statusConfig.pendente;
          return (
            <Card key={task.id} className={`group transition-all hover:shadow-md border-l-4 ${overdue ? "border-l-destructive bg-destructive/5" : task.status === "concluida" ? "border-l-green-500 opacity-70" : task.prioridade === "alta" ? "border-l-destructive" : task.prioridade === "media" ? "border-l-yellow-500" : "border-l-green-500"}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <button onClick={() => toggleStatus(task)} className="shrink-0">
                  {task.status === "concluida" ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : task.status === "em_andamento" ? <Clock className="h-5 w-5 text-blue-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.status === "concluida" ? "line-through text-muted-foreground" : ""}`}>{task.titulo}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge className={`text-[10px] ${pCfg.color}`}><Flag className="h-2.5 w-2.5 mr-1" />{pCfg.label}</Badge>
                    <Badge className={`text-[10px] ${sCfg.color}`}>{sCfg.label}</Badge>
                    <Badge variant="outline" className="text-[10px]">{categoryConfig[task.categoria] || task.categoria}</Badge>
                    {getDueLabel(task) && <span className={`text-[10px] ${overdue ? "text-destructive font-bold" : "text-muted-foreground"}`}>{getDueLabel(task)}</span>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(task)}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setDeletingId(task.id); setDeleteOpen(true); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!filtered.length && <p className="text-center py-8 text-muted-foreground">Nenhuma tarefa encontrada</p>}
      </div>}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTask ? "Editar" : "Nova"} Tarefa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} /></div>
            <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Prioridade</Label><Select value={form.prioridade} onValueChange={v => setForm({...form, prioridade: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(priorityConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Categoria</Label><Select value={form.categoria} onValueChange={v => setForm({...form, categoria: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(categoryConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Vencimento</Label><Input type="date" value={form.data_vencimento} onChange={e => setForm({...form, data_vencimento: e.target.value})} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={() => deletingId && deleteMutation.mutate(deletingId)} isLoading={deleteMutation.isPending} itemName="esta tarefa" />
    </div>
  );
}
