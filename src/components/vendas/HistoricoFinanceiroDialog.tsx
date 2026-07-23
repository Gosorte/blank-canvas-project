import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { History, Banknote, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface HistoricoFinanceiroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contaReceberId: string | null;
  osNumber?: number | string | null;
  clienteNome?: string;
}

export function HistoricoFinanceiroDialog({
  open,
  onOpenChange,
  contaReceberId,
  osNumber,
  clienteNome,
}: HistoricoFinanceiroDialogProps) {
  const { data: conta } = useQuery({
    queryKey: ["historico-conta", contaReceberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contas_receber")
        .select("id, descricao, valor, status, forma_pagamento, data_vencimento, data_recebimento, observacoes, created_at")
        .eq("id", contaReceberId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!contaReceberId && open,
  });

  const { data: recebimentos, isLoading } = useQuery({
    queryKey: ["historico-recebimentos", contaReceberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recebimentos_parciais" as any)
        .select("*")
        .eq("conta_receber_id", contaReceberId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!contaReceberId && open,
  });

  const valorTotal = Number(conta?.valor || 0);
  const totalRecebido = (recebimentos || []).reduce((sum: number, r: any) => sum + Number(r.valor), 0);
  const valorRestante = valorTotal - totalRecebido;
  const isQuitado = conta?.status === "recebido" || valorRestante <= 0.01;

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("pt-BR");
    } catch {
      return d;
    }
  };

  const fmtDateTime = (d: string) => {
    try {
      return new Date(d).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return d;
    }
  };

  if (!contaReceberId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico Financeiro
            {osNumber && (
              <Badge variant="outline" className="font-mono text-xs ml-1">
                OS-{osNumber}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* OS info */}
          <div className="rounded-md border border-border bg-muted/20 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Cliente</span>
              <span className="text-sm font-medium text-foreground">{clienteNome || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Criado em</span>
              <span className="text-sm text-foreground">{conta ? fmtDate(conta.created_at) : "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status</span>
              <Badge
                variant="outline"
                className={`text-xs ${
                  isQuitado
                    ? "border-emerald-500/50 text-emerald-600 bg-emerald-500/10"
                    : "border-amber-500/50 text-amber-600 bg-amber-500/10"
                }`}
              >
                {isQuitado ? (
                  <><CheckCircle2 className="h-3 w-3 mr-1" /> Quitado</>
                ) : (
                  <><Clock className="h-3 w-3 mr-1" /> Parcial</>
                )}
              </Badge>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-md border border-border bg-muted/30">
              <p className="text-[10px] text-muted-foreground">Total da OS</p>
              <p className="text-sm font-bold text-foreground">{fmt(valorTotal)}</p>
            </div>
            <div className="text-center p-3 rounded-md border border-border bg-emerald-500/10">
              <p className="text-[10px] text-muted-foreground">Total Recebido</p>
              <p className="text-sm font-bold text-emerald-600">{fmt(totalRecebido)}</p>
            </div>
            <div className="text-center p-3 rounded-md border border-border bg-amber-500/10">
              <p className="text-[10px] text-muted-foreground">Restante</p>
              <p className="text-sm font-bold text-amber-600">{fmt(Math.max(0, valorRestante))}</p>
            </div>
          </div>

          <Separator />

          {/* Payment history table */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5" />
              Registros de Recebimento ({recebimentos?.length || 0})
            </p>
            {isLoading ? (
              <div className="text-center py-4 text-sm text-muted-foreground">Carregando...</div>
            ) : !recebimentos || recebimentos.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Nenhum recebimento registrado
              </div>
            ) : (
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Data</TableHead>
                      <TableHead className="text-xs">Forma</TableHead>
                      <TableHead className="text-xs text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recebimentos.map((r: any, idx: number) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="text-xs">
                          {fmtDateTime(r.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {r.forma_pagamento || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right font-semibold text-emerald-600">
                          {fmt(Number(r.valor))}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Total row */}
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={3} className="text-xs font-semibold text-foreground">
                        Total Recebido
                      </TableCell>
                      <TableCell className="text-xs text-right font-bold text-emerald-600">
                        {fmt(totalRecebido)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Observations */}
          {conta?.observacoes && (
            <div className="rounded-md border border-border bg-muted/20 p-3">
              <p className="text-[10px] text-muted-foreground mb-1">Observações</p>
              <p className="text-xs text-foreground">{conta.observacoes}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
