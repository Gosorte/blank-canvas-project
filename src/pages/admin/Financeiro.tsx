import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Loader2, Plus } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useTenants } from "@/hooks/use-tenants";
import { useAllClientes } from "@/hooks/use-clientes";
import { useAllFornecedores } from "@/hooks/use-fornecedores";
import {
  useAllContasPagar, useAllContasReceber,
  useCreateContaPagar, useCreateContaReceber,
  useUpdateContaPagar, useUpdateContaReceber,
} from "@/hooks/use-financeiro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pendente: "bg-amber-500/10 text-amber-600 border-amber-200",
  pago: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  recebido: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  vencido: "bg-destructive/10 text-destructive border-destructive/20",
  cancelado: "bg-muted text-muted-foreground",
};

export default function Financeiro() {
  const [pagarOpen, setPagarOpen] = useState(false);
  const [receberOpen, setReceberOpen] = useState(false);

  const { data: tenants } = useTenants();
  const { data: fornecedores } = useAllFornecedores();
  const { data: clientes } = useAllClientes();
  const { data: contasPagar, isLoading: loadingPagar } = useAllContasPagar();
  const { data: contasReceber, isLoading: loadingReceber } = useAllContasReceber();
  const createPagar = useCreateContaPagar();
  const createReceber = useCreateContaReceber();
  const updatePagar = useUpdateContaPagar();
  const updateReceber = useUpdateContaReceber();

  const [formPagar, setFormPagar] = useState({
    tenant_id: "", fornecedor_id: "", descricao: "", valor: 0,
    data_vencimento: "", categoria: "insumos", forma_pagamento: "boleto",
  });
  const [formReceber, setFormReceber] = useState({
    tenant_id: "", cliente_id: "", descricao: "", valor: 0,
    data_vencimento: "", forma_pagamento: "pix",
  });

  const totalPagar = (contasPagar ?? []).filter((c: any) => c.status === "pendente").reduce((s: number, c: any) => s + Number(c.valor), 0);
  const totalReceber = (contasReceber ?? []).filter((c: any) => c.status === "pendente").reduce((s: number, c: any) => s + Number(c.valor), 0);

  const handleCreatePagar = async () => {
    if (!formPagar.tenant_id || !formPagar.descricao) { toast.error("Preencha tenant e descrição"); return; }
    try {
      await createPagar.mutateAsync({
        ...formPagar,
        fornecedor_id: formPagar.fornecedor_id || null,
        data_pagamento: null, status: "pendente", observacoes: null,
      } as any);
      toast.success("Conta cadastrada!");
      setPagarOpen(false);
    } catch { toast.error("Erro ao cadastrar"); }
  };

  const handleCreateReceber = async () => {
    if (!formReceber.tenant_id || !formReceber.descricao) { toast.error("Preencha tenant e descrição"); return; }
    try {
      await createReceber.mutateAsync({
        ...formReceber,
        cliente_id: formReceber.cliente_id || null,
        op_id: null, data_recebimento: null, status: "pendente", observacoes: null,
      } as any);
      toast.success("Conta cadastrada!");
      setReceberOpen(false);
    } catch { toast.error("Erro ao cadastrar"); }
  };

  const marcarPago = async (id: string) => {
    await updatePagar.mutateAsync({ id, status: "pago", data_pagamento: new Date().toISOString().split("T")[0] });
    toast.success("Marcado como pago!");
  };

  const marcarRecebido = async (id: string) => {
    await updateReceber.mutateAsync({ id, status: "recebido", data_recebimento: new Date().toISOString().split("T")[0] });
    toast.success("Marcado como recebido!");
  };

  const isLoading = loadingPagar || loadingReceber;
  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div>
      <AdminHeader title="Financeiro" subtitle="Contas a pagar e receber" />
      <div className="p-6 space-y-6">
        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-2"><TrendingDown size={16} className="text-destructive" /><span className="text-sm font-medium">A Pagar</span></div>
            <p className="text-2xl font-bold text-destructive">R$ {totalPagar.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground">{(contasPagar ?? []).filter((c: any) => c.status === "pendente").length} pendentes</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-emerald-600" /><span className="text-sm font-medium">A Receber</span></div>
            <p className="text-2xl font-bold text-emerald-600">R$ {totalReceber.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground">{(contasReceber ?? []).filter((c: any) => c.status === "pendente").length} pendentes</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-2"><DollarSign size={16} className="text-primary" /><span className="text-sm font-medium">Saldo Previsto</span></div>
            <p className={cn("text-2xl font-bold", totalReceber - totalPagar >= 0 ? "text-emerald-600" : "text-destructive")}>
              R$ {(totalReceber - totalPagar).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">Receber - Pagar</p>
          </div>
        </div>

        <Tabs defaultValue="pagar">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="pagar">Contas a Pagar</TabsTrigger>
              <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Dialog open={pagarOpen} onOpenChange={setPagarOpen}>
                <DialogTrigger asChild><Button variant="outline" size="sm" className="gap-1"><Plus size={14} />A Pagar</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nova Conta a Pagar</DialogTitle></DialogHeader>
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label>Tenant</Label>
                        <Select value={formPagar.tenant_id} onValueChange={(v) => setFormPagar(f => ({ ...f, tenant_id: v }))}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{(tenants ?? []).map((t: any) => <SelectItem key={t.id} value={t.id}>{t.nome_grafica}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5"><Label>Categoria</Label>
                        <Select value={formPagar.categoria} onValueChange={(v) => setFormPagar(f => ({ ...f, categoria: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="insumos">Insumos</SelectItem>
                            <SelectItem value="aluguel">Aluguel</SelectItem>
                            <SelectItem value="salarios">Salários</SelectItem>
                            <SelectItem value="equipamentos">Equipamentos</SelectItem>
                            <SelectItem value="outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5"><Label>Descrição</Label><Input value={formPagar.descricao} onChange={(e) => setFormPagar(f => ({ ...f, descricao: e.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label>Valor (R$)</Label><Input type="number" step="0.01" value={formPagar.valor} onChange={(e) => setFormPagar(f => ({ ...f, valor: Number(e.target.value) }))} /></div>
                      <div className="space-y-1.5"><Label>Vencimento</Label><Input type="date" value={formPagar.data_vencimento} onChange={(e) => setFormPagar(f => ({ ...f, data_vencimento: e.target.value }))} /></div>
                    </div>
                    <Button className="w-full" onClick={handleCreatePagar} disabled={createPagar.isPending}>
                      {createPagar.isPending && <Loader2 className="animate-spin mr-2" size={16} />}Cadastrar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={receberOpen} onOpenChange={setReceberOpen}>
                <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus size={14} />A Receber</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nova Conta a Receber</DialogTitle></DialogHeader>
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label>Tenant</Label>
                        <Select value={formReceber.tenant_id} onValueChange={(v) => setFormReceber(f => ({ ...f, tenant_id: v }))}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{(tenants ?? []).map((t: any) => <SelectItem key={t.id} value={t.id}>{t.nome_grafica}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5"><Label>Cliente</Label>
                        <Select value={formReceber.cliente_id} onValueChange={(v) => setFormReceber(f => ({ ...f, cliente_id: v }))}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{(clientes ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5"><Label>Descrição</Label><Input value={formReceber.descricao} onChange={(e) => setFormReceber(f => ({ ...f, descricao: e.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label>Valor (R$)</Label><Input type="number" step="0.01" value={formReceber.valor} onChange={(e) => setFormReceber(f => ({ ...f, valor: Number(e.target.value) }))} /></div>
                      <div className="space-y-1.5"><Label>Vencimento</Label><Input type="date" value={formReceber.data_vencimento} onChange={(e) => setFormReceber(f => ({ ...f, data_vencimento: e.target.value }))} /></div>
                    </div>
                    <Button className="w-full" onClick={handleCreateReceber} disabled={createReceber.isPending}>
                      {createReceber.isPending && <Loader2 className="animate-spin mr-2" size={16} />}Cadastrar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <TabsContent value="pagar">
            <div className="space-y-3 mt-4">
              {(contasPagar ?? []).map((c: any) => (
                <div key={c.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{c.descricao}</h4>
                      <Badge variant="outline" className={cn("text-[10px]", statusColors[c.status])}>{c.status}</Badge>
                      {c.categoria && <Badge variant="secondary" className="text-[10px]">{c.categoria}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.fornecedores?.razao_social ?? "—"} • {c.tenants?.nome_grafica ?? "—"} • Venc: {new Date(c.data_vencimento).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-destructive">R$ {Number(c.valor).toFixed(2)}</p>
                    {c.status === "pendente" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => marcarPago(c.id)}>Pagar</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="receber">
            <div className="space-y-3 mt-4">
              {(contasReceber ?? []).map((c: any) => (
                <div key={c.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{c.descricao}</h4>
                      <Badge variant="outline" className={cn("text-[10px]", statusColors[c.status])}>{c.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.clientes?.nome ?? "—"} • {c.tenants?.nome_grafica ?? "—"} • Venc: {new Date(c.data_vencimento).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-emerald-600">R$ {Number(c.valor).toFixed(2)}</p>
                    {c.status === "pendente" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => marcarRecebido(c.id)}>Receber</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
