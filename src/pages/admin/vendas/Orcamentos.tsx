import { useState } from "react";
import { FileText, Plus, Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { BudgetFormDialog, BudgetFormData, emptyBudgetForm } from "@/components/vendas/BudgetFormDialog";
import { BudgetItemDialog } from "@/components/vendas/BudgetItemDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTenant } from "@/hooks/use-tenant";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "digital", label: "Digital" },
  { value: "offset", label: "Offset" },
  { value: "comunicacao_visual", label: "Comunicação Visual" },
];

const statusConfig: Record<string, { label: string; class: string }> = {
  rascunho: { label: "Rascunho", class: "bg-yellow-500/20 text-yellow-700" },
  enviado: { label: "Enviado", class: "bg-blue-500/20 text-blue-700" },
  aprovado: { label: "Aprovado", class: "bg-green-500/20 text-green-700" },
  cancelado: { label: "Cancelado", class: "bg-red-500/20 text-red-700" },
};

export default function Orcamentos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedNumber, setSavedNumber] = useState<number | undefined>();
  const [form, setForm] = useState<BudgetFormData>(emptyBudgetForm);
  const { user } = useAuth();
  const { activeTenantId } = useTenant();
  const queryClient = useQueryClient();

  const { data: budgets, isLoading } = useQuery({
    queryKey: ["erp-orcamentos", activeTenantId, searchTerm, categoryFilter],
    queryFn: async () => {
      let query = supabase.from("erp_orcamentos").select("*").eq("tenant_id", activeTenantId!).order("created_at", { ascending: false });
      if (searchTerm) query = query.ilike("cliente_nome", `%${searchTerm}%`);
      if (categoryFilter !== "all") query = query.eq("categoria", categoryFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!activeTenantId,
  });

  const buildPayload = (f: BudgetFormData) => ({
    tenant_id: activeTenantId!, criado_por: user?.id,
    cliente_nome: f.cliente_nome, contato_nome: f.contato_nome || null,
    contato_telefone: f.contato_telefone || null, contato_email: f.contato_email || null,
    origem: f.origem || null, vendedor: f.vendedor || null, parceiros: f.parceiros || null,
    valor_total: parseFloat(f.valor_total || "0"),
    data_entrega: f.data_entrega || null, hora_entrega: f.hora_entrega || null,
    tipo_entrega: f.tipo_entrega || "retirada", transportadora: f.transportadora || null,
    status: f.status, categoria: f.categoria,
    forma_pagamento: f.forma_pagamento || null, observacoes: f.observacoes || null,
  });

  const createMutation = useMutation({
    mutationFn: async (f: BudgetFormData) => {
      const { data, error } = await supabase.from("erp_orcamentos").insert(buildPayload(f) as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["erp-orcamentos"] });
      toast.success("Orçamento criado!");
      setSavedId(data.id);
      setSavedNumber(data.numero);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, f }: { id: string; f: BudgetFormData }) => {
      const { status, ...payload } = buildPayload(f);
      const { data, error } = await supabase.from("erp_orcamentos").update({ ...payload, status } as any).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["erp-orcamentos"] });
      toast.success("Orçamento atualizado!");
      setSavedId(data.id);
      setSavedNumber(data.numero);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("erp_orcamentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["erp-orcamentos"] }); toast.success("Orçamento excluído!"); setDeleteOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const changeStatusMutation = useMutation({
    mutationFn: async ({ budget, newStatus }: { budget: any; newStatus: string }) => {
      if (newStatus === "aprovado") {
        // Auto-convert to order
        const { error: orderError } = await supabase.from("erp_pedidos").insert({
          tenant_id: activeTenantId!, criado_por: user?.id,
          cliente_nome: budget.cliente_nome, contato_nome: budget.contato_nome,
          contato_telefone: budget.contato_telefone, contato_email: budget.contato_email,
          origem: budget.origem, vendedor: budget.vendedor, parceiros: budget.parceiros,
          valor_total: budget.valor_total, data_entrega: budget.data_entrega,
          hora_entrega: budget.hora_entrega, tipo_entrega: budget.tipo_entrega,
          transportadora: budget.transportadora, forma_pagamento: budget.forma_pagamento,
          observacoes: budget.observacoes, status: "aguardando", categoria: budget.categoria || "digital",
          orcamento_id: budget.id,
        } as any);
        if (orderError) throw orderError;
      }
      const { error } = await supabase.from("erp_orcamentos").update({ status: newStatus } as any).eq("id", budget.id);
      if (error) throw error;
    },
    onSuccess: (_, { newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ["erp-orcamentos"] });
      if (newStatus === "aprovado") {
        queryClient.invalidateQueries({ queryKey: ["erp-pedidos"] });
        toast.success("Orçamento aprovado e convertido em pedido!");
      } else toast.success(`Status alterado!`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const openCreate = () => { setEditingId(null); setSavedId(null); setSavedNumber(undefined); setForm(emptyBudgetForm); setFormOpen(true); };

  const openEdit = (b: any) => {
    setEditingId(b.id); setSavedId(b.id); setSavedNumber(b.numero);
    setForm({
      cliente_nome: b.cliente_nome, contato_nome: b.contato_nome || "", contato_telefone: b.contato_telefone || "",
      contato_email: b.contato_email || "", origem: b.origem || "", vendedor: b.vendedor || "",
      parceiros: b.parceiros || "", valor_total: String(b.valor_total || ""),
      data_entrega: b.data_entrega ? format(new Date(b.data_entrega), "yyyy-MM-dd") : "",
      hora_entrega: b.hora_entrega || "", tipo_entrega: b.tipo_entrega || "retirada",
      transportadora: b.transportadora || "", status: b.status, categoria: b.categoria || "digital",
      forma_pagamento: b.forma_pagamento || "", observacoes: b.observacoes || "",
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    if (editingId) updateMutation.mutate({ id: editingId, f: form });
    else createMutation.mutate(form);
    setFormOpen(false);
  };

  const handleSaveAndAddItem = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, f: form }, { onSuccess: () => { setFormOpen(false); setItemDialogOpen(true); } });
    } else {
      createMutation.mutate(form, { onSuccess: () => { setFormOpen(false); setItemDialogOpen(true); } });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <div><h1 className="text-xl font-bold">Orçamentos</h1><p className="text-sm text-muted-foreground">Gerencie propostas e orçamentos para clientes</p></div>
        </div>
        <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Novo Orçamento</Button>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : !budgets?.length ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Nenhum orçamento encontrado</p>
                    <Button variant="outline" onClick={openCreate} className="mt-2"><Plus className="h-4 w-4 mr-2" /> Criar primeiro orçamento</Button>
                  </div>
                </TableCell></TableRow>
              ) : budgets.map((b: any) => {
                const sCfg = statusConfig[b.status] || statusConfig.rascunho;
                return (
                  <TableRow key={b.id}>
                    <TableCell><Badge variant="outline">#{b.numero}</Badge></TableCell>
                    <TableCell><Badge variant={b.categoria === "offset" ? "secondary" : b.categoria === "comunicacao_visual" ? "outline" : "default"}>{CATEGORIES.find(c => c.value === b.categoria)?.label || b.categoria}</Badge></TableCell>
                    <TableCell className="font-medium">{b.cliente_nome}</TableCell>
                    <TableCell className="text-muted-foreground">{b.vendedor || "-"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold cursor-pointer hover:opacity-80 ${sCfg.class}`}>{sCfg.label}</button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {["aprovado", "cancelado"].map((s) => (
                            <DropdownMenuItem key={s} disabled={b.status === s} onClick={() => changeStatusMutation.mutate({ budget: b, newStatus: s })}>
                              <Badge className={`mr-2 rounded-sm ${statusConfig[s]?.class}`}>{statusConfig[s]?.label}</Badge>
                              {s === "aprovado" && <span className="text-xs text-muted-foreground">→ Pedido</span>}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>{b.data_entrega ? format(new Date(b.data_entrega), "dd/MM/yyyy") : "-"}</TableCell>
                    <TableCell className="font-semibold text-primary">{formatCurrency(b.valor_total)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeletingId(b.id); setDeleteOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <BudgetFormDialog open={formOpen} onOpenChange={setFormOpen} form={form} onFormChange={setForm}
        onSave={handleSave} onSaveAndAddItem={handleSaveAndAddItem}
        isLoading={createMutation.isPending || updateMutation.isPending}
        isEditing={!!editingId} budgetNumber={savedNumber}
        budgetDate={editingId ? budgets?.find((b: any) => b.id === editingId)?.created_at : undefined}
      />

      <BudgetItemDialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}
        budgetId={savedId} budgetNumber={savedNumber} clientName={form.cliente_nome}
        onItemAdded={() => { queryClient.invalidateQueries({ queryKey: ["erp-orcamentos"] }); toast.success("Item adicionado!"); }}
      />

      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        isLoading={deleteMutation.isPending} itemName="este orçamento"
      />
    </div>
  );
}
