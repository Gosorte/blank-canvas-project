import { useState, useMemo } from "react";
import {
  Package, Plus, Search, Loader2, Trash2, AlertTriangle, ArrowUpDown,
  TrendingUp, TrendingDown, DollarSign, BarChart3, History, Link2,
  ArrowDownCircle, ArrowUpCircle, RefreshCw, Calendar as CalendarIcon,
  Eye, Edit, ChevronRight
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useTenant } from "@/hooks/use-tenant";
import {
  useEstoque, useCreateItemEstoque, useCreateMovimentacao,
  useDeleteItemEstoque, useUpdateItemEstoque, useMovimentacoes,
  useMovimentacoesDia, useMovimentacoesPeriodo,
  useProdutosVinculados, useVincularProdutoEstoque
} from "@/hooks/use-estoque";
import { useFornecedores } from "@/hooks/use-fornecedores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const categorias = [
  { value: "papel", label: "Papel" },
  { value: "substrato", label: "Substrato" },
  { value: "tinta", label: "Tinta" },
  { value: "ilhos", label: "Ilhós" },
  { value: "chapa", label: "Chapa CTP" },
  { value: "bobina", label: "Bobina" },
  { value: "adesivo", label: "Adesivo/Vinil" },
  { value: "estrutura", label: "Estrutura" },
  { value: "outros", label: "Outros" },
];

const unidades = ["un", "folha", "kg", "m", "m²", "litro", "bobina", "resma", "rolo"];

const motivoLabels: Record<string, string> = {
  compra: "Compra",
  producao: "Produção",
  perda: "Perda/Avaria",
  ajuste_inventario: "Ajuste de Inventário",
  devolucao: "Devolução",
  op_consumo: "Consumo OP",
};

function StatCard({ icon: Icon, label, value, subtitle, color }: {
  icon: any; label: string; value: string; subtitle?: string; color: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", color)}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function Estoque() {
  const { activeTenantId } = useTenant();
  const [activeTab, setActiveTab] = useState("itens");
  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("todas");
  const [createOpen, setCreateOpen] = useState(false);
  const [movOpen, setMovOpen] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [vincularOpen, setVincularOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Filtros do histórico
  const hoje = new Date().toISOString().split("T")[0];
  const [histDataInicio, setHistDataInicio] = useState(hoje);
  const [histDataFim, setHistDataFim] = useState(hoje);

  const { data: estoque, isLoading } = useEstoque(activeTenantId ?? undefined);
  const { data: movsDia } = useMovimentacoesDia(activeTenantId ?? undefined);
  const { data: movsPeriodo } = useMovimentacoesPeriodo(
    activeTenantId ?? undefined,
    activeTab === "historico" ? histDataInicio : undefined,
    activeTab === "historico" ? histDataFim : undefined
  );
  const { data: movimentacoesItem } = useMovimentacoes(histOpen ? selectedItem?.id : undefined);
  const { data: produtosVinculados } = useProdutosVinculados(activeTenantId ?? undefined);
  const { data: fornecedores } = useFornecedores(activeTenantId ?? undefined);

  const createItem = useCreateItemEstoque();
  const updateItem = useUpdateItemEstoque();
  const createMov = useCreateMovimentacao();
  const deleteItem = useDeleteItemEstoque();
  const vincularProduto = useVincularProdutoEstoque();

  const [form, setForm] = useState({
    nome: "", categoria: "papel", unidade: "folha",
    quantidade: 0, quantidade_minima: 0, custo_unitario: 0,
    localizacao: "", fornecedor_id: "",
  });
  const [movForm, setMovForm] = useState({
    tipo: "entrada", quantidade: 0, motivo: "compra", observacoes: "", valor_total: 0
  });
  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  // Métricas do dashboard
  const stats = useMemo(() => {
    const items = estoque ?? [];
    const totalItens = items.length;
    const valorTotal = items.reduce((s, i: any) => s + Number(i.quantidade) * Number(i.custo_unitario), 0);
    const alertas = items.filter((i: any) => Number(i.quantidade) <= Number(i.quantidade_minima));
    const entradasHoje = (movsDia ?? []).filter((m: any) => m.tipo === "entrada").length;
    const saidasHoje = (movsDia ?? []).filter((m: any) => m.tipo === "saida" || m.tipo === "op_consumo").length;
    return { totalItens, valorTotal, alertas, entradasHoje, saidasHoje, movsHoje: (movsDia ?? []).length };
  }, [estoque, movsDia]);

  const filtered = useMemo(() => {
    return (estoque ?? []).filter((i: any) => {
      const matchSearch = i.nome.toLowerCase().includes(search.toLowerCase());
      const matchCategoria = filterCategoria === "todas" || i.categoria === filterCategoria;
      return matchSearch && matchCategoria;
    });
  }, [estoque, search, filterCategoria]);

  // Produtos vinculados a um item de estoque específico
  const getProdutosDoItem = (estoqueId: string) => {
    return (produtosVinculados ?? []).filter((p: any) => p.estoque_id === estoqueId);
  };

  const handleCreate = async () => {
    if (!activeTenantId || !form.nome) { toast.error("Preencha o nome do item"); return; }
    try {
      await createItem.mutateAsync({
        tenant_id: activeTenantId,
        nome: form.nome,
        categoria: form.categoria,
        unidade: form.unidade,
        quantidade: form.quantidade,
        quantidade_minima: form.quantidade_minima,
        custo_unitario: form.custo_unitario,
        localizacao: form.localizacao || null,
        fornecedor_id: form.fornecedor_id || null,
        observacoes: null,
        ativo: true,
      });
      toast.success("Item cadastrado!");
      setCreateOpen(false);
      setForm({ nome: "", categoria: "papel", unidade: "folha", quantidade: 0, quantidade_minima: 0, custo_unitario: 0, localizacao: "", fornecedor_id: "" });
    } catch { toast.error("Erro ao cadastrar"); }
  };

  const handleMov = async () => {
    if (!selectedItem || movForm.quantidade <= 0) { toast.error("Quantidade inválida"); return; }
    try {
      await createMov.mutateAsync({
        tenant_id: selectedItem.tenant_id,
        estoque_id: selectedItem.id,
        tipo: movForm.tipo,
        quantidade: movForm.quantidade,
        motivo: movForm.motivo,
        referencia_id: null,
        observacoes: movForm.observacoes || null,
        valor_total: movForm.valor_total,
      });
      toast.success(`${movForm.tipo === "entrada" ? "Entrada" : movForm.tipo === "ajuste" ? "Ajuste" : "Saída"} registrada!`);
      setMovOpen(false);
      setSelectedItem(null);
    } catch { toast.error("Erro na movimentação"); }
  };

  if (!activeTenantId) {
    return (
      <div>
        <AdminHeader title="Estoque" subtitle="Controle de insumos e materiais" />
        <div className="p-6">
          <div className="bg-muted/50 rounded-xl p-8 text-center">
            <Package size={48} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Selecione uma empresa para gerenciar o estoque</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div>
      <AdminHeader title="Estoque" subtitle="Controle integrado de insumos e materiais" />
      <div className="p-6 space-y-5">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Package} label="Total de Itens" value={String(stats.totalItens)} color="bg-primary" />
          <StatCard icon={DollarSign} label="Valor em Estoque" value={`R$ ${stats.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} color="bg-emerald-600" />
          <StatCard icon={AlertTriangle} label="Estoque Baixo" value={String(stats.alertas.length)} subtitle={stats.alertas.length > 0 ? "itens abaixo do mínimo" : "tudo ok"} color={stats.alertas.length > 0 ? "bg-destructive" : "bg-emerald-600"} />
          <StatCard icon={ArrowUpDown} label="Movimentações Hoje" value={String(stats.movsHoje)} subtitle={`${stats.entradasHoje} entradas • ${stats.saidasHoje} saídas`} color="bg-blue-600" />
        </div>

        {/* Alertas de estoque baixo */}
        {stats.alertas.length > 0 && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-destructive" />
              <span className="font-semibold text-sm text-destructive">
                Atenção: {stats.alertas.length} {stats.alertas.length === 1 ? "item" : "itens"} com estoque baixo
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.alertas.map((a: any) => (
                <Badge key={a.id} variant="outline" className="text-destructive border-destructive/30 text-xs">
                  {a.nome}: {Number(a.quantidade)} {a.unidade} (mín: {Number(a.quantidade_minima)})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="itens" className="gap-1.5"><Package size={14} />Itens</TabsTrigger>
            <TabsTrigger value="historico" className="gap-1.5"><History size={14} />Movimentações</TabsTrigger>
            <TabsTrigger value="vinculos" className="gap-1.5"><Link2 size={14} />Vínculos</TabsTrigger>
          </TabsList>

          {/* ABA: Itens de Estoque */}
          <TabsContent value="itens" className="space-y-4">
            <div className="flex gap-3 items-center justify-between flex-wrap">
              <div className="flex gap-3 items-center flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input placeholder="Buscar insumo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {categorias.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild><Button className="gap-2"><Plus size={16} />Novo Item</Button></DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader><DialogTitle>Cadastrar Item de Estoque</DialogTitle></DialogHeader>
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1.5"><Label>Nome do Insumo</Label><Input value={form.nome} onChange={(e) => update("nome", e.target.value)} placeholder="Ex: Papel Couchê 150g 66x96" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label>Categoria</Label>
                        <Select value={form.categoria} onValueChange={(v) => update("categoria", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{categorias.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5"><Label>Fornecedor</Label>
                        <Select value={form.fornecedor_id} onValueChange={(v) => update("fornecedor_id", v)}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Nenhum</SelectItem>
                            {(fornecedores ?? []).map((f: any) => <SelectItem key={f.id} value={f.id}>{f.nome_fantasia || f.razao_social}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5"><Label>Unidade</Label>
                        <Select value={form.unidade} onValueChange={(v) => update("unidade", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{unidades.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5"><Label>Qtd Inicial</Label><Input type="number" value={form.quantidade} onChange={(e) => update("quantidade", Number(e.target.value))} /></div>
                      <div className="space-y-1.5"><Label>Qtd Mínima</Label><Input type="number" value={form.quantidade_minima} onChange={(e) => update("quantidade_minima", Number(e.target.value))} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label>Custo Unitário (R$)</Label><Input type="number" step="0.01" value={form.custo_unitario} onChange={(e) => update("custo_unitario", Number(e.target.value))} /></div>
                      <div className="space-y-1.5"><Label>Localização</Label><Input value={form.localizacao} onChange={(e) => update("localizacao", e.target.value)} placeholder="Ex: Prateleira A3" /></div>
                    </div>
                    <Button className="w-full" onClick={handleCreate} disabled={createItem.isPending}>
                      {createItem.isPending && <Loader2 className="animate-spin mr-2" size={16} />}Cadastrar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((item: any) => {
                const baixo = Number(item.quantidade) <= Number(item.quantidade_minima);
                const produtosDoItem = getProdutosDoItem(item.id);
                const valorItem = Number(item.quantidade) * Number(item.custo_unitario);
                return (
                  <div key={item.id} className={cn(
                    "bg-card rounded-xl border p-5 hover:shadow-lg transition-all animate-fade-in group",
                    baixo ? "border-destructive/30" : "border-border"
                  )}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", baixo ? "bg-destructive/10" : "bg-primary/10")}>
                          <Package size={18} className={baixo ? "text-destructive" : "text-primary"} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">{item.nome}</h3>
                          <p className="text-xs text-muted-foreground">
                            {item.fornecedores?.razao_social || "Sem fornecedor"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {categorias.find(c => c.value === item.categoria)?.label ?? item.categoria}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 text-xs mb-3">
                      <div className={cn("rounded-lg p-2 text-center", baixo ? "bg-destructive/5" : "bg-muted")}>
                        <p className={cn("font-bold text-sm", baixo ? "text-destructive" : "text-foreground")}>{Number(item.quantidade)}</p>
                        <p className="text-muted-foreground">{item.unidade}</p>
                      </div>
                      <div className="bg-muted rounded-lg p-2 text-center">
                        <p className="font-bold text-sm text-foreground">{Number(item.quantidade_minima)}</p>
                        <p className="text-muted-foreground">Mín.</p>
                      </div>
                      <div className="bg-muted rounded-lg p-2 text-center">
                        <p className="font-bold text-sm text-foreground">R$ {Number(item.custo_unitario).toFixed(2)}</p>
                        <p className="text-muted-foreground">Unit.</p>
                      </div>
                      <div className="bg-muted rounded-lg p-2 text-center">
                        <p className="font-bold text-sm text-foreground">R$ {valorItem.toFixed(0)}</p>
                        <p className="text-muted-foreground">Total</p>
                      </div>
                    </div>

                    {/* Produtos vinculados */}
                    {produtosDoItem.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {produtosDoItem.map((p: any) => (
                          <Badge key={p.id} variant="secondary" className="text-[10px] gap-1">
                            <Link2 size={8} />{p.nome}
                            {p.bloquear_sem_estoque && <span className="text-destructive">🔒</span>}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {item.localizacao && (
                      <p className="text-[10px] text-muted-foreground mb-3">📍 {item.localizacao}</p>
                    )}

                    <div className="flex justify-between mt-3 pt-3 border-t border-border gap-1">
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => {
                        setSelectedItem(item);
                        setMovOpen(true);
                        setMovForm({ tipo: "entrada", quantidade: 0, motivo: "compra", observacoes: "", valor_total: 0 });
                      }}>
                        <ArrowUpDown size={12} />Movimentar
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => {
                        setSelectedItem(item);
                        setHistOpen(true);
                      }}>
                        <History size={12} />Histórico
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive h-7 text-xs opacity-0 group-hover:opacity-100" onClick={() => setDeleteId(item.id)}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="col-span-full bg-muted/30 rounded-xl p-8 text-center">
                  <Package size={40} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">Nenhum item encontrado</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ABA: Histórico de Movimentações */}
          <TabsContent value="historico" className="space-y-4">
            <div className="flex gap-3 items-center flex-wrap">
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">De:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <CalendarIcon size={14} />{format(parseISO(histDataInicio), "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[60]" align="start">
                    <Calendar mode="single" selected={parseISO(histDataInicio)} onSelect={(d) => d && setHistDataInicio(format(d, "yyyy-MM-dd"))} locale={ptBR} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">Até:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <CalendarIcon size={14} />{format(parseISO(histDataFim), "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[60]" align="start">
                    <Calendar mode="single" selected={parseISO(histDataFim)} onSelect={(d) => d && setHistDataFim(format(d, "yyyy-MM-dd"))} locale={ptBR} />
                  </PopoverContent>
                </Popover>
              </div>
              <Badge variant="secondary" className="text-xs">{(movsPeriodo ?? []).length} registros</Badge>
            </div>

            {/* Resumo do período */}
            {(movsPeriodo ?? []).length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                  <ArrowDownCircle size={20} className="mx-auto text-emerald-600 mb-1" />
                  <p className="text-lg font-bold text-emerald-600">
                    {(movsPeriodo ?? []).filter((m: any) => m.tipo === "entrada").reduce((s: number, m: any) => s + Number(m.quantidade), 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Entradas</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                  <ArrowUpCircle size={20} className="mx-auto text-red-600 mb-1" />
                  <p className="text-lg font-bold text-red-600">
                    {(movsPeriodo ?? []).filter((m: any) => m.tipo === "saida" || m.tipo === "op_consumo").reduce((s: number, m: any) => s + Number(m.quantidade), 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Saídas</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                  <RefreshCw size={20} className="mx-auto text-blue-600 mb-1" />
                  <p className="text-lg font-bold text-blue-600">
                    {(movsPeriodo ?? []).filter((m: any) => m.tipo === "ajuste").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Ajustes</p>
                </div>
              </div>
            )}

            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Data/Hora</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Item</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Qtd</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Motivo</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Valor</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Obs</th>
                  </tr>
                </thead>
                <tbody>
                  {(movsPeriodo ?? []).map((m: any) => (
                    <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-3 text-xs">{format(new Date(m.created_at), "dd/MM HH:mm")}</td>
                      <td className="p-3 text-xs font-medium">{m.estoque?.nome ?? "—"}</td>
                      <td className="p-3">
                        <Badge variant={m.tipo === "entrada" ? "default" : m.tipo === "ajuste" ? "secondary" : "destructive"} className="text-[10px]">
                          {m.tipo === "entrada" ? "Entrada" : m.tipo === "ajuste" ? "Ajuste" : "Saída"}
                        </Badge>
                      </td>
                      <td className="p-3 text-right text-xs font-mono font-bold">
                        {m.tipo === "entrada" ? "+" : m.tipo === "saida" || m.tipo === "op_consumo" ? "-" : "="}{Number(m.quantidade)} {m.estoque?.unidade ?? ""}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{motivoLabels[m.motivo] ?? m.motivo ?? "—"}</td>
                      <td className="p-3 text-right text-xs font-mono">{Number(m.valor_total) > 0 ? `R$ ${Number(m.valor_total).toFixed(2)}` : "—"}</td>
                      <td className="p-3 text-xs text-muted-foreground max-w-32 truncate">{m.observacoes || "—"}</td>
                    </tr>
                  ))}
                  {(movsPeriodo ?? []).length === 0 && (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground text-sm">Nenhuma movimentação no período</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ABA: Vínculos Produto ↔ Estoque */}
          <TabsContent value="vinculos" className="space-y-4">
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <Link2 size={14} className="inline mr-1" />
                Vincule produtos da loja/produção a itens de estoque. Ative <strong>"Bloquear sem estoque"</strong> para
                impedir a venda do produto quando o estoque estiver zerado.
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Produto</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Setor</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Item Estoque</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Bloquear s/ Estoque</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {(produtosVinculados ?? []).map((p: any) => {
                    const itemEstoque = (estoque ?? []).find((e: any) => e.id === p.estoque_id);
                    return (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="p-3 text-xs font-medium">{p.nome}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px]">
                            {p.tipo_modulo === "digital" ? "Digital" : p.tipo_modulo === "offset" ? "Offset" : "Visual"}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs">
                          {itemEstoque ? (
                            <span className="flex items-center gap-1">
                              <Package size={12} className="text-primary" />
                              {itemEstoque.nome} ({Number(itemEstoque.quantidade)} {itemEstoque.unidade})
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Não vinculado</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <Switch
                            checked={p.bloquear_sem_estoque}
                            disabled={!p.estoque_id}
                            onCheckedChange={async (checked) => {
                              try {
                                await vincularProduto.mutateAsync({ produtoId: p.id, estoqueId: p.estoque_id, bloquear: checked });
                                toast.success(checked ? "Produto será bloqueado sem estoque" : "Bloqueio removido");
                              } catch { toast.error("Erro ao atualizar"); }
                            }}
                          />
                        </td>
                        <td className="p-3 text-center">
                          <Select
                            value={p.estoque_id || "none"}
                            onValueChange={async (v) => {
                              try {
                                const estoqueId = v === "none" ? null : v;
                                await vincularProduto.mutateAsync({ produtoId: p.id, estoqueId, bloquear: estoqueId ? p.bloquear_sem_estoque : false });
                                toast.success(estoqueId ? "Produto vinculado ao estoque" : "Vínculo removido");
                              } catch { toast.error("Erro ao vincular"); }
                            }}
                          >
                            <SelectTrigger className="h-7 text-xs w-40"><SelectValue placeholder="Vincular..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhum</SelectItem>
                              {(estoque ?? []).map((e: any) => (
                                <SelectItem key={e.id} value={e.id}>{e.nome} ({Number(e.quantidade)} {e.unidade})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    );
                  })}
                  {(produtosVinculados ?? []).length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">Nenhum produto cadastrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Movimentação Dialog */}
      <Dialog open={movOpen} onOpenChange={setMovOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Movimentação: {selectedItem?.nome}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            {selectedItem && (
              <div className="bg-muted rounded-lg p-3 text-xs flex justify-between">
                <span>Estoque atual: <strong>{Number(selectedItem.quantidade)} {selectedItem.unidade}</strong></span>
                <span>Mín: <strong>{Number(selectedItem.quantidade_minima)}</strong></span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Tipo</Label>
                <Select value={movForm.tipo} onValueChange={(v) => setMovForm(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">📥 Entrada</SelectItem>
                    <SelectItem value="saida">📤 Saída</SelectItem>
                    <SelectItem value="ajuste">🔄 Ajuste (def. absoluto)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Quantidade</Label><Input type="number" value={movForm.quantidade} onChange={(e) => setMovForm(f => ({ ...f, quantidade: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Motivo</Label>
                <Select value={movForm.motivo} onValueChange={(v) => setMovForm(f => ({ ...f, motivo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compra">Compra</SelectItem>
                    <SelectItem value="producao">Produção</SelectItem>
                    <SelectItem value="perda">Perda/Avaria</SelectItem>
                    <SelectItem value="ajuste_inventario">Ajuste Inventário</SelectItem>
                    <SelectItem value="devolucao">Devolução</SelectItem>
                    <SelectItem value="op_consumo">Consumo OP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Valor Total (R$)</Label><Input type="number" step="0.01" value={movForm.valor_total} onChange={(e) => setMovForm(f => ({ ...f, valor_total: Number(e.target.value) }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Observações</Label><Input value={movForm.observacoes} onChange={(e) => setMovForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
            <Button className="w-full" onClick={handleMov} disabled={createMov.isPending}>
              {createMov.isPending && <Loader2 className="animate-spin mr-2" size={16} />}Registrar Movimentação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Histórico do item Dialog */}
      <Dialog open={histOpen} onOpenChange={setHistOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Histórico: {selectedItem?.nome}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {(movimentacoesItem ?? []).length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-6">Nenhuma movimentação registrada</p>
            )}
            {(movimentacoesItem ?? []).map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center",
                  m.tipo === "entrada" ? "bg-emerald-500/10" : m.tipo === "ajuste" ? "bg-blue-500/10" : "bg-red-500/10"
                )}>
                  {m.tipo === "entrada" ? <ArrowDownCircle size={16} className="text-emerald-600" /> :
                    m.tipo === "ajuste" ? <RefreshCw size={16} className="text-blue-600" /> :
                      <ArrowUpCircle size={16} className="text-red-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">
                      {m.tipo === "entrada" ? "+" : m.tipo === "saida" || m.tipo === "op_consumo" ? "-" : "="}{Number(m.quantidade)} {selectedItem?.unidade}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(m.created_at), "dd/MM/yy HH:mm")}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {motivoLabels[m.motivo] ?? m.motivo ?? "—"}
                    {m.observacoes ? ` • ${m.observacoes}` : ""}
                    {Number(m.valor_total) > 0 ? ` • R$ ${Number(m.valor_total).toFixed(2)}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Item de Estoque</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Todas as movimentações associadas serão perdidas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (deleteId) { await deleteItem.mutateAsync(deleteId); toast.success("Item excluído!"); setDeleteId(null); }
            }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
