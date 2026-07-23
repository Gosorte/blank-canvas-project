import { useState } from "react";
import { ShoppingCart, Plus, Search, Edit, Trash2 } from "lucide-react";
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

const ORDER_STATUSES = ["aguardando", "balcao", "arte", "offset", "digital", "com_visual", "pronto", "cancelado"];

const statusConfig: Record<string, { label: string; class: string }> = {
  aguardando: { label: "Aguardando", class: "bg-yellow-500/20 text-yellow-700" },
  balcao: { label: "Balcão", class: "bg-blue-500/20 text-blue-700" },
  arte: { label: "Arte", class: "bg-purple-500/20 text-purple-700" },
  offset: { label: "Offset", class: "bg-orange-500/20 text-orange-700" },
  digital: { label: "Digital", class: "bg-teal-500/20 text-teal-700" },
  com_visual: { label: "Com. Visual", class: "bg-indigo-500/20 text-indigo-700" },
  pronto: { label: "Pronto", class: "bg-green-500/20 text-green-700" },
  cancelado: { label: "Cancelado", class: "bg-red-500/20 text-red-700" },
};

const emptyOrderForm: BudgetFormData = { ...emptyBudgetForm, status: "aguardando" };

export default function Pedidos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedNumber, setSavedNumber] = useState<number | undefined>();
  const [form, setForm] = useState<BudgetFormData>(emptyOrderForm);
  const { user } = useAuth();
  const { activeTenantId } = useTenant();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["erp-pedidos", activeTenantId, searchTerm, statusFilter, categoryFilter],
    queryFn: async () => {
      let query = supabase.from("erp_pedidos").select("*").eq("tenant_id", activeTenantId!).order("created_at", { ascending: false });
      if (searchTerm) query = query.ilike("cliente_nome", `%${searchTerm}%`);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
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
      const { data, error } = await supabase.from("erp_pedidos").insert(buildPayload(f) as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => { queryClient.invalidateQueries({ queryKey: ["erp-pedidos"] }); toast.success("Pedido criado!"); setSavedId(data.id); setSavedNumber(data.numero); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, f }: { id: string; f: BudgetFormData }) => {
      const { data, error } = await supabase.from("erp_pedidos").update(buildPayload(f) as any).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => { queryClient.invalidateQueries({ queryKey: ["erp-pedidos"] }); toast.success("Pedido atualizado!"); setSavedId(data.id); setSavedNumber(data.numero); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("erp_pedidos").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["erp-pedidos"] }); toast.success("Pedido excluído!"); setDeleteOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const changeStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const { error } = await supabase.from("erp_pedidos").update({ status: newStatus } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["erp-pedidos"] }); toast.success("Status alterado!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const openCreate = () => { setEditingId(null); setSavedId(null); setSavedNumber(undefined); setForm(emptyOrderForm); setFormOpen(true); };

  const openEdit = (o: any) => {
    setEditingId(o.id); setSavedId(o.id); setSavedNumber(o.numero);
    setForm({
      cliente_nome: o.cliente_nome, contato_nome: o.contato_nome || "", contato_telefone: o.contato_telefone || "",
      contato_email: o.contato_email || "", origem: o.origem || "", vendedor: o.vendedor || "",
      parceiros: o.parceiros || "", valor_total: String(o.valor_total || ""),
      data_entrega: o.data_entrega ? format(new Date(o.data_entrega), "yyyy-MM-dd") : "",
      hora_entrega: o.hora_entrega || "", tipo_entrega: o.tipo_entrega || "retirada",
      transportadora: o.transportadora || "", status: o.status, categoria: o.categoria || "digital",
      forma_pagamento: o.forma_pagamento || "", observacoes: o.observacoes || "",
    });
    setFormOpen(true);
  };

  const handleSave = () => { if (editingId) updateMutation.mutate({ id: editingId, f: form }); else createMutation.mutate(form); setFormOpen(false); };
  const handleSaveAndAddItem = () => {
    if (editingId) updateMutation.mutate({ id: editingId, f: form }, { onSuccess: () => { setFormOpen(false); setItemDialogOpen(true); } });
    else createMutation.mutate(form, { onSuccess: () => { setFormOpen(false); setItemDialogOpen(true); } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <div><h1 className="text-xl font-bold">Pedidos</h1><p className="text-sm text-muted-foreground">Gerencie pedidos confirmados</p></div>
        </div>
        <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Novo Pedido</Button>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{statusConfig[s]?.label || s}</SelectItem>)}
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
                <TableHead>Data</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : !orders?.length ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Nenhum pedido encontrado</p>
                    <Button variant="outline" onClick={openCreate} className="mt-2"><Plus className="h-4 w-4 mr-2" /> Criar primeiro pedido</Button>
                  </div>
                </TableCell></TableRow>
              ) : orders.map((o: any) => {
                const sCfg = statusConfig[o.status] || statusConfig.aguardando;
                return (
                  <TableRow key={o.id}>
                    <TableCell><Badge variant="outline">#{o.numero}</Badge></TableCell>
                    <TableCell><Badge variant={o.categoria === "offset" ? "secondary" : o.categoria === "comunicacao_visual" ? "outline" : "default"}>{CATEGORIES.find(c => c.value === o.categoria)?.label || o.categoria}</Badge></TableCell>
                    <TableCell className="font-medium">{o.cliente_nome}</TableCell>
                    <TableCell className="text-muted-foreground">{o.vendedor || "-"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold cursor-pointer hover:opacity-80 ${sCfg.class}`}>{sCfg.label}</button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {ORDER_STATUSES.map((s) => (
                            <DropdownMenuItem key={s} disabled={o.status === s} onClick={() => changeStatusMutation.mutate({ id: o.id, newStatus: s })}>
                              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold mr-2 ${statusConfig[s]?.class}`}>{statusConfig[s]?.label}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>{format(new Date(o.created_at), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{o.data_entrega ? format(new Date(o.data_entrega), "dd/MM/yyyy") : "-"}</TableCell>
                    <TableCell className="font-semibold text-primary">{formatCurrency(o.valor_total)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(o)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeletingId(o.id); setDeleteOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
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
        budgetDate={editingId ? orders?.find((o: any) => o.id === editingId)?.created_at : undefined}
        mode="pedido"
      />

      <BudgetItemDialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}
        budgetId={savedId} budgetNumber={savedNumber} clientName={form.cliente_nome}
        onItemAdded={() => { queryClient.invalidateQueries({ queryKey: ["erp-pedidos"] }); toast.success("Item adicionado!"); }}
        mode="pedido"
      />

      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        isLoading={deleteMutation.isPending} itemName="este pedido"
      />
    </div>
  );
}
