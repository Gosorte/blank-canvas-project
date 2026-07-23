import { useState } from "react";
import { Calculator, Plus, Loader2, Pencil, Trash2, FlaskConical, DollarSign } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useTenants } from "@/hooks/use-tenants";
import { useAllProdutos, useCreateProduto, useDeleteProduto, useCalcularPreco, Produto } from "@/hooks/use-produtos";
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
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const moduloConfig = {
  digital: { label: "Digital", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  offset: { label: "Offset", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  visual: { label: "Visual", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
};

export default function Precificacao() {
  const [createOpen, setCreateOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: tenants } = useTenants();
  const { data: produtos, isLoading } = useAllProdutos();
  const createProduto = useCreateProduto();
  const deleteProduto = useDeleteProduto();

  // Form state
  const [form, setForm] = useState({
    tenant_id: "",
    tipo_modulo: "digital",
    nome: "",
    descricao: "",
    preco_minimo: 0,
    markup: 50,
    custo_clique: 0,
    custo_acabamento: 0,
    custo_chapa: 0,
    custo_milheiro: 0,
    custo_setup: 0,
    escala_minima: 1000,
    custo_m2: 0,
    substrato: "",
    custo_estrutura: 0,
  });

  const resetForm = () => setForm({
    tenant_id: "", tipo_modulo: "digital", nome: "", descricao: "",
    preco_minimo: 0, markup: 50, custo_clique: 0, custo_acabamento: 0,
    custo_chapa: 0, custo_milheiro: 0, custo_setup: 0, escala_minima: 1000,
    custo_m2: 0, substrato: "", custo_estrutura: 0,
  });

  const handleCreate = async () => {
    if (!form.tenant_id || !form.nome) {
      toast.error("Preencha tenant e nome do produto");
      return;
    }
    try {
      await createProduto.mutateAsync({ ...form, ativo: true } as any);
      toast.success("Produto criado!");
      setCreateOpen(false);
      resetForm();
    } catch {
      toast.error("Erro ao criar produto");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProduto.mutateAsync(deleteId);
      toast.success("Produto excluído!");
      setDeleteId(null);
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  return (
    <div>
      <AdminHeader title="Motor de Preços" subtitle="Configure produtos e simule preços para cada módulo" />

      <div className="p-6 space-y-6">
        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Dialog open={simulatorOpen} onOpenChange={setSimulatorOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2"><FlaskConical size={16} />Simulador</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Simulador de Preço</DialogTitle></DialogHeader>
              <PriceSimulator produtos={produtos ?? []} />
            </DialogContent>
          </Dialog>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus size={16} />Novo Produto</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Cadastrar Produto</DialogTitle></DialogHeader>
              <ProductForm form={form} setForm={setForm} tenants={tenants ?? []} onSubmit={handleCreate} isPending={createProduto.isPending} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Products Grid */}
        <Tabs defaultValue="todos">
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="digital">Digital</TabsTrigger>
            <TabsTrigger value="offset">Offset</TabsTrigger>
            <TabsTrigger value="visual">Visual</TabsTrigger>
          </TabsList>

          {["todos", "digital", "offset", "visual"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                {(produtos ?? [])
                  .filter((p: any) => tab === "todos" || p.tipo_modulo === tab)
                  .map((p: any) => {
                    const mod = moduloConfig[p.tipo_modulo as keyof typeof moduloConfig];
                    return (
                      <div key={p.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-all animate-fade-in group">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground text-sm">{p.nome}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{p.tenants?.nome_grafica ?? "—"}</p>
                          </div>
                          <Badge variant="outline" className={cn("text-[10px]", mod?.color)}>{mod?.label}</Badge>
                        </div>
                        {p.descricao && <p className="text-xs text-muted-foreground mb-3">{p.descricao}</p>}

                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div className="bg-muted rounded-lg p-2 text-center">
                            <p className="font-bold text-foreground">R$ {Number(p.preco_minimo).toFixed(2)}</p>
                            <p className="text-muted-foreground">Preço Mín.</p>
                          </div>
                          <div className="bg-muted rounded-lg p-2 text-center">
                            <p className="font-bold text-foreground">{Number(p.markup)}%</p>
                            <p className="text-muted-foreground">Markup</p>
                          </div>
                        </div>

                        {p.tipo_modulo === "digital" && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Clique: R$ {Number(p.custo_clique).toFixed(2)} | Acabamento: R$ {Number(p.custo_acabamento).toFixed(2)}</p>
                          </div>
                        )}
                        {p.tipo_modulo === "offset" && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Milheiro: R$ {Number(p.custo_milheiro).toFixed(2)} | Chapa: R$ {Number(p.custo_chapa).toFixed(2)} | Setup: R$ {Number(p.custo_setup).toFixed(2)}</p>
                          </div>
                        )}
                        {p.tipo_modulo === "visual" && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>m²: R$ {Number(p.custo_m2).toFixed(2)} | Substrato: {p.substrato || "—"} | Estrutura: R$ {Number(p.custo_estrutura).toFixed(2)}</p>
                          </div>
                        )}

                        <div className="flex justify-end mt-3 pt-3 border-t border-border">
                          <Button variant="ghost" size="sm" className="text-destructive h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteId(p.id)}>
                            <Trash2 size={12} className="mr-1" /> Excluir
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Product Form ──────────────────────────────────────────────────
function ProductForm({ form, setForm, tenants, onSubmit, isPending }: any) {
  const update = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Tenant (Gráfica)</Label>
          <Select value={form.tenant_id} onValueChange={(v) => update("tenant_id", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {tenants.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>{t.nome_grafica}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Módulo</Label>
          <Select value={form.tipo_modulo} onValueChange={(v) => update("tipo_modulo", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="digital">Digital</SelectItem>
              <SelectItem value="offset">Offset</SelectItem>
              <SelectItem value="visual">Comunicação Visual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Nome do Produto</Label>
        <Input value={form.nome} onChange={(e) => update("nome", e.target.value)} placeholder="Ex: Cartão de Visita 4x4" />
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input value={form.descricao} onChange={(e) => update("descricao", e.target.value)} placeholder="Opcional" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Preço Mínimo (R$)</Label>
          <Input type="number" value={form.preco_minimo} onChange={(e) => update("preco_minimo", Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Markup (%)</Label>
          <Input type="number" value={form.markup} onChange={(e) => update("markup", Number(e.target.value))} />
        </div>
      </div>

      {/* Module-specific fields */}
      {form.tipo_modulo === "digital" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Custo por Clique (R$)</Label>
            <Input type="number" step="0.01" value={form.custo_clique} onChange={(e) => update("custo_clique", Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Custo Acabamento (R$)</Label>
            <Input type="number" step="0.01" value={form.custo_acabamento} onChange={(e) => update("custo_acabamento", Number(e.target.value))} />
          </div>
        </div>
      )}

      {form.tipo_modulo === "offset" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Custo por Milheiro (R$)</Label>
              <Input type="number" step="0.01" value={form.custo_milheiro} onChange={(e) => update("custo_milheiro", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Custo por Chapa (R$)</Label>
              <Input type="number" step="0.01" value={form.custo_chapa} onChange={(e) => update("custo_chapa", Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Custo Setup (R$)</Label>
              <Input type="number" step="0.01" value={form.custo_setup} onChange={(e) => update("custo_setup", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Escala Mínima</Label>
              <Input type="number" value={form.escala_minima} onChange={(e) => update("escala_minima", Number(e.target.value))} />
            </div>
          </div>
        </div>
      )}

      {form.tipo_modulo === "visual" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Custo por m² (R$)</Label>
              <Input type="number" step="0.01" value={form.custo_m2} onChange={(e) => update("custo_m2", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Substrato</Label>
              <Input value={form.substrato} onChange={(e) => update("substrato", e.target.value)} placeholder="Ex: Lona 440g" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Custo Estrutura (R$)</Label>
            <Input type="number" step="0.01" value={form.custo_estrutura} onChange={(e) => update("custo_estrutura", Number(e.target.value))} />
          </div>
        </div>
      )}

      <Button className="w-full" onClick={onSubmit} disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
        Cadastrar Produto
      </Button>
    </div>
  );
}

// ─── Price Simulator ───────────────────────────────────────────────
function PriceSimulator({ produtos }: { produtos: any[] }) {
  const [produtoId, setProdutoId] = useState("");
  const [params, setParams] = useState({
    quantidade_folhas: 100,
    quantidade_milheiros: 1,
    num_chapas: 4,
    largura_m: 3,
    altura_m: 1,
  });
  const calcular = useCalcularPreco();

  const selectedProduto = produtos.find((p: any) => p.id === produtoId);

  const handleCalc = () => {
    if (!selectedProduto) return;
    calcular.mutate({
      tenant_id: selectedProduto.tenant_id,
      produto_id: produtoId,
      ...params,
    });
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label>Produto</Label>
        <Select value={produtoId} onValueChange={setProdutoId}>
          <SelectTrigger><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
          <SelectContent>
            {produtos.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>
                [{p.tipo_modulo}] {p.nome} — {p.tenants?.nome_grafica}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProduto?.tipo_modulo === "digital" && (
        <div className="space-y-2">
          <Label>Quantidade de Folhas</Label>
          <Input type="number" value={params.quantidade_folhas} onChange={(e) => setParams((p) => ({ ...p, quantidade_folhas: Number(e.target.value) }))} />
        </div>
      )}

      {selectedProduto?.tipo_modulo === "offset" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Milheiros</Label>
            <Input type="number" value={params.quantidade_milheiros} onChange={(e) => setParams((p) => ({ ...p, quantidade_milheiros: Number(e.target.value) }))} />
          </div>
          <div className="space-y-2">
            <Label>Chapas</Label>
            <Input type="number" value={params.num_chapas} onChange={(e) => setParams((p) => ({ ...p, num_chapas: Number(e.target.value) }))} />
          </div>
        </div>
      )}

      {selectedProduto?.tipo_modulo === "visual" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Largura (m)</Label>
            <Input type="number" step="0.1" value={params.largura_m} onChange={(e) => setParams((p) => ({ ...p, largura_m: Number(e.target.value) }))} />
          </div>
          <div className="space-y-2">
            <Label>Altura (m)</Label>
            <Input type="number" step="0.1" value={params.altura_m} onChange={(e) => setParams((p) => ({ ...p, altura_m: Number(e.target.value) }))} />
          </div>
        </div>
      )}

      <Button className="w-full" onClick={handleCalc} disabled={!produtoId || calcular.isPending}>
        {calcular.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : <Calculator size={16} className="mr-2" />}
        Calcular Preço
      </Button>

      {calcular.data && (
        <div className="bg-muted rounded-xl p-4 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-primary" />
            <h4 className="font-semibold text-foreground">Resultado</h4>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">Custo Insumos:</span></div>
            <div className="text-right font-mono">R$ {calcular.data.custo_insumos?.toFixed(2)}</div>
            <div><span className="text-muted-foreground">Custo Produção:</span></div>
            <div className="text-right font-mono">R$ {calcular.data.custo_producao?.toFixed(2)}</div>
            <div><span className="text-muted-foreground">Markup:</span></div>
            <div className="text-right font-mono">{calcular.data.markup_percentual}%</div>
            <div className="col-span-2 border-t border-border pt-2 mt-1"></div>
            <div><span className="font-semibold text-foreground">Preço Final:</span></div>
            <div className="text-right font-mono font-bold text-lg text-primary">R$ {calcular.data.preco_final?.toFixed(2)}</div>
          </div>
        </div>
      )}

      {calcular.isError && (
        <p className="text-destructive text-sm">Erro ao calcular. Verifique os dados e tente novamente.</p>
      )}
    </div>
  );
}
