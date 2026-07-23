import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { DollarSign, History, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useFormasPagamento } from "@/hooks/use-formas-pagamento";
import { useTenant } from "@/hooks/use-tenant";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface RecebimentoParcialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: any; // contas_receber record
  caixaAberto?: boolean;
}

export function RecebimentoParcialDialog({ open, onOpenChange, conta, caixaAberto = true }: RecebimentoParcialDialogProps) {
  const { user } = useAuth();
  const { activeTenantId } = useTenant();
  const queryClient = useQueryClient();
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: formasPagamento } = useFormasPagamento(activeTenantId || undefined);

  const { data: recebimentos, isLoading: loadingRecebimentos } = useQuery({
    queryKey: ["recebimentos-parciais", conta?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recebimentos_parciais" as any)
        .select("*")
        .eq("conta_receber_id", conta.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!conta?.id && open,
  });

  const valorTotal = Number(conta?.valor || 0);
  const totalRecebido = (recebimentos || []).reduce((sum: number, r: any) => sum + Number(r.valor), 0);
  const valorRestante = valorTotal - totalRecebido;

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const isFirstPayment = !recebimentos || recebimentos.length === 0;

  const handleSubmit = async () => {
    if (!caixaAberto) {
      toast.warning("Abra o caixa antes de registrar recebimentos.");
      return;
    }
    const valorNum = parseFloat(valor);
    if (!valorNum || valorNum <= 0) {
      toast.warning("Informe um valor válido.");
      return;
    }
    if (!formaPagamento) {
      toast.warning("Selecione a forma de pagamento.");
      return;
    }
    if (valorNum > valorRestante + 0.01) {
      toast.warning(`O valor não pode exceder o restante de ${fmt(valorRestante)}.`);
      return;
    }
    // First payment must be at least 40% of the total OS value
    if (isFirstPayment) {
      const minimo = valorTotal * 0.4;
      if (valorNum < minimo - 0.01) {
        toast.warning(`O primeiro recebimento deve ser de no mínimo 40% do valor (${fmt(minimo)}).`);
        return;
      }
    }

    setSaving(true);
    try {
      const { data: recebimentosAtuais, error: recebimentosError } = await supabase
        .from("recebimentos_parciais" as any)
        .select("valor")
        .eq("conta_receber_id", conta.id);
      if (recebimentosError) throw recebimentosError;

      const totalRecebidoAtual = (recebimentosAtuais || []).reduce(
        (sum: number, r: any) => sum + Number(r.valor || 0),
        0,
      );
      const valorRestanteAtual = valorTotal - totalRecebidoAtual;

      if (valorNum > valorRestanteAtual + 0.01) {
        toast.warning(`O valor excede o restante atual de ${fmt(valorRestanteAtual)}.`);
        return;
      }

      // Insert partial payment record
      const { error: insertError } = await supabase.from("recebimentos_parciais" as any).insert({
        tenant_id: activeTenantId,
        conta_receber_id: conta.id,
        valor: valorNum,
        forma_pagamento: formaPagamento,
        data_recebimento: new Date().toISOString().split("T")[0],
        observacoes: observacoes || null,
        registrado_por: user?.id || null,
      } as any);
      if (insertError) throw insertError;

      // Check if fully paid
      const novoTotalRecebido = totalRecebidoAtual + valorNum;
      const fullyPaid = novoTotalRecebido >= valorTotal - 0.01;

      // Update conta_receber status
      const updatePayload: any = {};
      if (fullyPaid) {
        updatePayload.status = "recebido";
        updatePayload.data_recebimento = new Date().toISOString().split("T")[0];
      } else {
        updatePayload.status = "parcial";
        updatePayload.observacoes = `Recebido parcialmente: ${fmt(novoTotalRecebido)} de ${fmt(valorTotal)}`;
      }

      const { error: updateError } = await supabase
        .from("contas_receber")
        .update(updatePayload)
        .eq("id", conta.id);
      if (updateError) throw updateError;

      // Register in pdv_vendas for daily cash tracking
      const { error: pdvError } = await supabase.from("pdv_vendas" as any).insert({
        tenant_id: activeTenantId,
        cliente_id: conta.cliente_id || null,
        usuario_id: user?.id || null,
        subtotal: valorNum,
        desconto: 0,
        cashback_usado: 0,
        total: valorNum,
        forma_pagamento: formaPagamento,
        itens: [{ name: `Recebimento parcial - ${conta.descricao}`, quantity: 1, unitPrice: valorNum, total: valorNum }],
      } as any);
      if (pdvError) throw pdvError;

      toast.success(fullyPaid ? "Conta quitada totalmente!" : `Recebimento de ${fmt(valorNum)} registrado!`);
      setValor("");
      setFormaPagamento("");
      setObservacoes("");
      queryClient.invalidateQueries({ queryKey: ["recebimentos-parciais", conta.id] });
      queryClient.invalidateQueries({ queryKey: ["contas-receber"] });
      queryClient.invalidateQueries({ queryKey: ["contas-receber-all"] });
      queryClient.invalidateQueries({ queryKey: ["pdv-daily-sales"] });
      queryClient.invalidateQueries({ queryKey: ["pdv-daily-sales-count"] });
      queryClient.invalidateQueries({ queryKey: ["pdv-pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["pdv-contas-parciais"] });

      if (fullyPaid) onOpenChange(false);
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!conta) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Recebimento Parcial
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-md border border-border bg-muted/30">
              <p className="text-[10px] text-muted-foreground">Total</p>
              <p className="text-sm font-bold text-foreground">{fmt(valorTotal)}</p>
            </div>
            <div className="text-center p-3 rounded-md border border-border bg-emerald-500/10">
              <p className="text-[10px] text-muted-foreground">Recebido</p>
              <p className="text-sm font-bold text-emerald-600">{fmt(totalRecebido)}</p>
            </div>
            <div className="text-center p-3 rounded-md border border-border bg-amber-500/10">
              <p className="text-[10px] text-muted-foreground">Restante</p>
              <p className="text-sm font-bold text-amber-600">{fmt(valorRestante)}</p>
            </div>
          </div>

          <Separator />

          {/* Payment history */}
          {recebimentos && recebimentos.length > 0 && (
            <div>
              <Label className="text-xs flex items-center gap-1 mb-2">
                <History className="h-3 w-3" /> Histórico de Recebimentos
              </Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Forma</TableHead>
                    <TableHead className="text-xs text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recebimentos.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">
                        {new Date(r.data_recebimento).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{r.forma_pagamento}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-right font-medium text-emerald-600">
                        {fmt(Number(r.valor))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* New payment form */}
          {valorRestante > 0.01 && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-xs font-medium">Novo Recebimento</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Valor *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={valorRestante}
                      placeholder={`Máx: ${fmt(valorRestante)}`}
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Forma de Pagamento *</Label>
                    <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {formasPagamento && formasPagamento.length > 0 ? (
                          formasPagamento.map((fp) => (
                            <SelectItem key={fp.id} value={fp.nome}>{fp.nome}</SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                            <SelectItem value="PIX">PIX</SelectItem>
                            <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                            <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                            <SelectItem value="Boleto">Boleto</SelectItem>
                            <SelectItem value="Transferência">Transferência</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Observações</Label>
                  <Textarea
                    placeholder="Observações do recebimento..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          {valorRestante > 0.01 && (
            <Button onClick={handleSubmit} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
              Registrar Recebimento
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
