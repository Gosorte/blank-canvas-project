import { useState } from "react";
import { Package, Plus, Search, Edit, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTenant } from "@/hooks/use-tenant";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


const emptyForm = { codigo: "", nome: "", descricao: "", preco_unitario: "", grupo_id: "", observacoes: "" };

export default function ProdutosSimples() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { user } = useAuth();
  const { activeTenantId } = useTenant();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["produtos-simples", activeTenantId, searchTerm, selectedGroup],
    queryFn: async () => {
      let query = supabase.from("produtos_simples" as any).select("*, product_groups(nome)")
        .eq("tenant_id", activeTenantId!).order("created_at", { ascending: false });
      if (searchTerm) query = query.or(`nome.ilike.%${searchTerm}%,codigo.ilike.%${searchTerm}%`);
      if (selectedGroup !== "all") query = query.eq("grupo_id", selectedGroup);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user && !!activeTenantId,
  });

  const { data: groups } = useQuery({
    queryKey: ["product-groups", activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_groups" as any).select("*").eq("tenant_id", activeTenantId!).order("nome");
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user && !!activeTenantId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("produtos_simples" as any).insert({
        tenant_id: activeTenantId, codigo: form.codigo, nome: form.nome,
        descricao: form.descricao || null, preco_unitario: Math.round(parseFloat(form.preco_unitario || "0") * 100),
        grupo_id: form.grupo_id || null, observacoes: form.observacoes || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["produtos-simples"] }); toast.success("Produto criado!"); setFormOpen(false); setForm(emptyForm); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("produtos_simples" as any).update({
        codigo: form.codigo, nome: form.nome, descricao: form.descricao || null,
        preco_unitario: Math.round(parseFloat(form.preco_unitario || "0") * 100),
        grupo_id: form.grupo_id || null, observacoes: form.observacoes || null,
      } as any).eq("id", editingId!);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["produtos-simples"] }); toast.success("Produto atualizado!"); setFormOpen(false); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("produtos_simples" as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["produtos-simples"] }); toast.success("Produto excluído!"); setDeleteOpen(false); },
    onError: (err: any) => toast.error(err.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (p: any) => {
      const { error } = await supabase.from("produtos_simples" as any).insert({
        tenant_id: activeTenantId, codigo: `${p.codigo}-COPIA`, nome: `${p.nome} (Cópia)`,
        descricao: p.descricao, grupo_id: p.grupo_id, preco_unitario: p.preco_unitario, observacoes: p.observacoes,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["produtos-simples"] }); toast.success("Produto duplicado!"); },
    onError: (err: any) => toast.error(err.message),
  });

  const formatCurrency = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormOpen(true); };
  const openEdit = (p: any) => {
    setEditingId(p.id);
    setForm({ codigo: p.codigo, nome: p.nome, descricao: p.descricao || "", preco_unitario: (p.preco_unitario / 100).toString(), grupo_id: p.grupo_id || "", observacoes: p.observacoes || "" });
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!form.nome.trim() || !form.codigo.trim()) { toast.error("Código e nome são obrigatórios"); return; }
    if (editingId) updateMutation.mutate(); else createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><Package className="h-6 w-6 text-primary" /><div><h1 className="text-xl font-bold">Produtos Simples</h1><p className="text-sm text-muted-foreground">Catálogo de produtos para venda rápida e PDV</p></div></div>
      <div className="flex justify-end"><Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Novo Produto</Button></div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" /></div>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}><SelectTrigger className="w-[200px]"><SelectValue placeholder="Grupo" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{groups?.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>)}</SelectContent></Select>
        </div>

        <div className="rounded-md border"><Table><TableHeader><TableRow>
          <TableHead>Código</TableHead><TableHead>Nome</TableHead><TableHead>Grupo</TableHead><TableHead>Preço</TableHead><TableHead className="text-right">Ações</TableHead>
        </TableRow></TableHeader><TableBody>
          {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow>
          : !products?.length ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum produto</TableCell></TableRow>
          : products.map((p: any) => (
            <TableRow key={p.id}>
              <TableCell><Badge variant="outline">{p.codigo}</Badge></TableCell>
              <TableCell>{p.nome}</TableCell>
              <TableCell className="text-muted-foreground">{p.product_groups?.nome || "-"}</TableCell>
              <TableCell className="font-semibold text-primary">{formatCurrency(p.preco_unitario)}</TableCell>
              <TableCell className="text-right"><div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => duplicateMutation.mutate(p)}><Copy className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { setDeletingId(p.id); setDeleteOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
              </div></TableCell>
            </TableRow>
          ))}
        </TableBody></Table></div>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editingId ? "Editar" : "Novo"} Produto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Código *</Label><Input value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} /></div>
              <div><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={form.preco_unitario} onChange={e => setForm({...form, preco_unitario: e.target.value})} /></div>
              <div><Label>Grupo</Label><Select value={form.grupo_id} onValueChange={v => setForm({...form, grupo_id: v})}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{groups?.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>Observações</Label><Input value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button><Button onClick={handleSave}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={() => deletingId && deleteMutation.mutate(deletingId)} isLoading={deleteMutation.isPending} itemName="este produto" />
    </div>
  );
}
