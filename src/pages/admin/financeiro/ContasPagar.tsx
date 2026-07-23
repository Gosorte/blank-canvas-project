import { useState, useMemo } from "react";
import { useContasPagar, useCreateContaPagar, useUpdateContaPagar } from "@/hooks/use-financeiro";
import { useTenant } from "@/hooks/use-tenant";
import { FinanceiroFormDialog } from "@/components/financeiro/FinanceiroFormDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Receipt, Pencil, Trash2, AlertTriangle, CheckCircle2, Clock, XCircle, TrendingDown, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; icon: any; className: string }> = {
  pendente: { label: "Pendente", icon: Clock, className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  pago: { label: "Pago", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  vencido: { label: "Vencido", icon: AlertTriangle, className: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelado: { label: "Cancelado", icon: XCircle, className: "bg-muted text-muted-foreground border-muted" },
};

export default function ContasPagar() {
  const { activeTenantId } = useTenant();
  const { data, isLoading } = useContasPagar(activeTenantId || undefined);
  const createMutation = useCreateContaPagar();
  const updateMutation = useUpdateContaPagar();
  const qc = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("contas_pagar").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contas-pagar"] }),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const filtered = useMemo(() => (data ?? []).filter((item: any) => {
    const matchSearch = item.descricao.toLowerCase().includes(search.toLowerCase()) || (item.fornecedores?.razao_social || "").toLowerCase().includes(search.toLowerCase());
    const isOverdue = item.status === "pendente" && new Date(item.data_vencimento) < new Date();
    const effectiveStatus = isOverdue ? "vencido" : item.status;
    return (statusFilter === "todos" || effectiveStatus === statusFilter) && matchSearch;
  }), [data, search, statusFilter]);

  const totals = useMemo(() => {
    const items = data ?? [];
    return {
      pending: items.filter((i: any) => i.status === "pendente").reduce((s: number, i: any) => s + Number(i.valor), 0),
      overdue: items.filter((i: any) => i.status === "pendente" && new Date(i.data_vencimento) < new Date()).reduce((s: number, i: any) => s + Number(i.valor), 0),
      paid: items.filter((i: any) => i.status === "pago").reduce((s: number, i: any) => s + Number(i.valor), 0),
    };
  }, [data]);

  const handleSubmit = async (formData: any) => {
    const payload = { tenant_id: activeTenantId!, descricao: formData.descricao, valor: formData.valor, data_vencimento: formData.data_vencimento, data_pagamento: formData.data_pagamento || null, status: formData.status, categoria: formData.categoria || null, forma_pagamento: formData.forma_pagamento || null, observacoes: formData.observacoes || null };
    try {
      if (formData.id) await updateMutation.mutateAsync({ id: formData.id, ...payload });
      else await createMutation.mutateAsync(payload as any);
      toast.success(formData.id ? "Conta atualizada!" : "Conta cadastrada!");
      setDialogOpen(false); setEditItem(null);
    } catch { toast.error("Erro ao salvar"); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try { await deleteMutation.mutateAsync(deleteItem.id); toast.success("Removido!"); setDeleteDialogOpen(false); setDeleteItem(null); } catch { toast.error("Erro"); }
  };

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Receipt className="h-7 w-7 text-destructive" />Contas a Pagar</h1><p className="text-muted-foreground text-sm mt-1">Gerencie suas obrigações financeiras</p></div>
        <Button onClick={() => { setEditItem(null); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />Nova Conta</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pendente</CardTitle><Clock className="h-4 w-4 text-amber-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600">{fmt(totals.pending)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Vencido</CardTitle><AlertTriangle className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{fmt(totals.overdue)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pago</CardTitle><CheckCircle2 className="h-4 w-4 text-emerald-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-600">{fmt(totals.paid)}</div></CardContent></Card>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="pago">Pago</SelectItem><SelectItem value="vencido">Vencido</SelectItem><SelectItem value="cancelado">Cancelado</SelectItem></SelectContent></Select>
      </div>
      <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Fornecedor</TableHead><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>
        {filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground"><TrendingDown className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Nenhuma conta encontrada</p></TableCell></TableRow> : filtered.map((item: any) => {
          const isOverdue = item.status === "pendente" && new Date(item.data_vencimento) < new Date();
          const cfg = STATUS_CONFIG[isOverdue ? "vencido" : item.status] || STATUS_CONFIG.pendente;
          const Icon = cfg.icon;
          return (<TableRow key={item.id} className={isOverdue ? "bg-destructive/5" : ""}><TableCell className="font-medium">{item.fornecedores?.razao_social || "—"}</TableCell><TableCell className="max-w-[200px] truncate">{item.descricao}</TableCell><TableCell><Badge variant="outline" className="capitalize">{item.categoria || "geral"}</Badge></TableCell><TableCell className="text-right font-mono font-medium">{fmt(Number(item.valor))}</TableCell><TableCell>{new Date(item.data_vencimento).toLocaleDateString("pt-BR")}</TableCell><TableCell><Badge variant="outline" className={cfg.className}><Icon className="h-3 w-3 mr-1" />{cfg.label}</Badge></TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => { setEditItem(item); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => { setDeleteItem(item); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell></TableRow>);
        })}</TableBody></Table></CardContent></Card>
      <FinanceiroFormDialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditItem(null); }} onSubmit={handleSubmit} isLoading={createMutation.isPending || updateMutation.isPending} editData={editItem} entityLabel="Fornecedor" title={editItem ? "Editar Conta a Pagar" : "Nova Conta a Pagar"} />
      <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleDelete} itemName={deleteItem?.descricao} />
    </div>
  );
}