import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, Layers, Palette, Search, Check, FileText, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTenant } from "@/hooks/use-tenant";
import { toast } from "sonner";

type ItemMode = "orcamento" | "pedido";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetId: string | null;
  budgetNumber?: number;
  clientName?: string;
  onItemAdded: () => void;
  mode?: ItemMode;
}

export function BudgetItemDialog({ open, onOpenChange, budgetId, budgetNumber, clientName, onItemAdded, mode = "orcamento" }: Props) {
  const [activeTab, setActiveTab] = useState("digital");
  const [searchTerm, setSearchTerm] = useState("");
  const [simpleForm, setSimpleForm] = useState({ descricao: "", quantidade: "1", preco_unitario: "", observacoes: "" });
  const { user } = useAuth();
  const { activeTenantId } = useTenant();

  const { data: produtos = [] } = useQuery({
    queryKey: ["erp-produtos", activeTenantId, searchTerm],
    queryFn: async () => {
      let query = supabase.from("produtos").select("*").eq("tenant_id", activeTenantId!).eq("ativo", true).order("nome");
      if (searchTerm) query = query.ilike("nome", `%${searchTerm}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!activeTenantId && open,
  });

  const { data: produtosSimples = [] } = useQuery({
    queryKey: ["erp-produtos-simples", activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("produtos_simples").select("*").eq("tenant_id", activeTenantId!).eq("ativo", true).order("nome");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!activeTenantId && open,
  });

  const handleUseProduct = async (produto: any) => {
    if (!budgetId) return;
    const table = mode === "pedido" ? "erp_pedidos" : "erp_orcamento_itens";
    const idField = mode === "pedido" ? "orcamento_id" : "orcamento_id";
    const { error } = await supabase.from("erp_orcamento_itens" as any).insert({
      orcamento_id: budgetId,
      produto_id: produto.id,
      descricao: produto.nome,
      quantidade: 1,
      preco_unitario: produto.preco_minimo || 0,
      subtotal: produto.preco_minimo || 0,
    } as any);
    if (error) { toast.error(error.message); return; }
    onItemAdded();
  };

  const handleSaveSimple = async () => {
    if (!budgetId || !simpleForm.descricao.trim()) { toast.error("Descrição obrigatória"); return; }
    const qty = parseInt(simpleForm.quantidade) || 1;
    const price = parseFloat(simpleForm.preco_unitario) || 0;
    const { error } = await supabase.from("erp_orcamento_itens" as any).insert({
      orcamento_id: budgetId,
      descricao: simpleForm.descricao,
      quantidade: qty,
      preco_unitario: price,
      subtotal: qty * price,
    } as any);
    if (error) { toast.error(error.message); return; }
    setSimpleForm({ descricao: "", quantidade: "1", preco_unitario: "", observacoes: "" });
    onItemAdded();
  };

  const filterByModule = (mod: string) => produtos.filter((p: any) => p.tipo_modulo === mod);

  const renderProductList = (modulo: string) => {
    const filtered = filterByModule(modulo).filter((p: any) => !searchTerm || p.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    return (
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar produto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <div className="rounded-md border max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço Mín.</TableHead>
                <TableHead className="w-20 text-center">Usar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhum produto encontrado</TableCell></TableRow>
              ) : filtered.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell>R$ {(p.preco_minimo || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUseProduct(p)}>
                      <Check className="h-4 w-4 text-primary" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="bg-primary px-6 py-3">
          <h2 className="text-lg font-semibold text-primary-foreground">Adicionar Item — {mode === "pedido" ? "Pedido" : "Orçamento"} #{budgetNumber || "..."}</h2>
          {clientName && <p className="text-sm text-primary-foreground/70">Cliente: {clientName}</p>}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6 pb-6">
          <TabsList className="bg-transparent border-b rounded-none w-full justify-start gap-0 h-auto p-0">
            <TabsTrigger value="digital" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-3 gap-1.5">
              <Printer className="h-4 w-4" /> Digital
            </TabsTrigger>
            <TabsTrigger value="offset" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-3 gap-1.5">
              <Layers className="h-4 w-4" /> Offset
            </TabsTrigger>
            <TabsTrigger value="comunicacao_visual" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-3 gap-1.5">
              <Palette className="h-4 w-4" /> Com. Visual
            </TabsTrigger>
            <TabsTrigger value="simples" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-3 gap-1.5">
              <Package className="h-4 w-4" /> Produto Simples
            </TabsTrigger>
          </TabsList>

          <TabsContent value="digital" className="mt-4">{renderProductList("digital")}</TabsContent>
          <TabsContent value="offset" className="mt-4">{renderProductList("offset")}</TabsContent>
          <TabsContent value="comunicacao_visual" className="mt-4">{renderProductList("comunicacao_visual")}</TabsContent>

          <TabsContent value="simples" className="mt-4 space-y-4">
            <div className="border rounded-lg p-4 bg-muted/30">
              <p className="text-sm"><strong>Orçamento:</strong> #{budgetNumber} — <strong>Cliente:</strong> {clientName || "-"}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Descrição *</Label>
                <Input value={simpleForm.descricao} onChange={(e) => setSimpleForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descreva o item" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Quantidade</Label>
                <Input type="number" value={simpleForm.quantidade} onChange={(e) => setSimpleForm(f => ({ ...f, quantidade: e.target.value }))} min={1} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Preço Unitário (R$)</Label>
                <Input type="number" step="0.01" value={simpleForm.preco_unitario} onChange={(e) => setSimpleForm(f => ({ ...f, preco_unitario: e.target.value }))} placeholder="0,00" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Observações</Label>
                <Input value={simpleForm.observacoes} onChange={(e) => setSimpleForm(f => ({ ...f, observacoes: e.target.value }))} />
              </div>
            </div>
            <Button onClick={handleSaveSimple} className="w-full">Adicionar Item</Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
