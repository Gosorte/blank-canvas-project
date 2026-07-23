import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Receipt, DollarSign, CreditCard, QrCode, Banknote, FileText, Wallet,
  Calendar, TrendingUp, Printer, X, ArrowUpRight, ArrowDownRight, PieChart,
  ClipboardList, Hash, CalendarIcon,
} from "lucide-react";

interface FechamentoCaixaProps {
  open: boolean;
  onClose: () => void;
  initialDate?: string;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const getIconForPayment = (name: string) => {
  const lower = (name || "").toLowerCase();
  if (lower.includes("pix")) return <QrCode className="h-4 w-4" />;
  if (lower.includes("crédito") || lower.includes("credito")) return <CreditCard className="h-4 w-4" />;
  if (lower.includes("débito") || lower.includes("debito")) return <CreditCard className="h-4 w-4" />;
  if (lower.includes("dinheiro")) return <Banknote className="h-4 w-4" />;
  if (lower.includes("boleto") || lower.includes("cheque")) return <FileText className="h-4 w-4" />;
  if (lower.includes("crediário") || lower.includes("crediario")) return <Wallet className="h-4 w-4" />;
  return <DollarSign className="h-4 w-4" />;
};

export function FechamentoCaixa({ open, onClose, initialDate }: FechamentoCaixaProps) {
  const { activeTenantId } = useTenant();
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (open && initialDate) {
      setSelectedDate(initialDate);
    }
  }, [open, initialDate]);

  // PDV sales
  const { data: vendas } = useQuery({
    queryKey: ["fechamento-caixa", activeTenantId, selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdv_vendas" as any)
        .select("*")
        .eq("tenant_id", activeTenantId!)
        .gte("created_at", `${selectedDate}T00:00:00`)
        .lte("created_at", `${selectedDate}T23:59:59`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!activeTenantId && open,
  });

  // All recebimentos_parciais for the date
  const { data: recebimentos } = useQuery({
    queryKey: ["fechamento-recebimentos", activeTenantId, selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recebimentos_parciais" as any)
        .select("*, contas_receber:conta_receber_id(id, descricao, valor, status, cliente_id, clientes(nome))")
        .eq("tenant_id", activeTenantId!)
        .eq("data_recebimento", selectedDate)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!activeTenantId && open,
  });

  // Contas recebidas no dia (full payments without recebimentos_parciais)
  const { data: contasRecebidas } = useQuery({
    queryKey: ["fechamento-contas-recebidas", activeTenantId, selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contas_receber")
        .select("*, clientes(nome)")
        .eq("tenant_id", activeTenantId!)
        .eq("data_recebimento", selectedDate)
        .in("status", ["recebido", "parcial"]);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!activeTenantId && open,
  });

  // Caixa session for the date
  const { data: caixaSessao } = useQuery({
    queryKey: ["fechamento-caixa-sessao", activeTenantId, selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdv_caixa" as any)
        .select("*")
        .eq("tenant_id", activeTenantId!)
        .gte("aberto_em", `${selectedDate}T00:00:00`)
        .lte("aberto_em", `${selectedDate}T23:59:59`)
        .order("aberto_em", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!activeTenantId && open,
  });

  // Profile names for caixa operators
  const operatorIds = useMemo(() => {
    const ids = new Set<string>();
    (caixaSessao || []).forEach((c: any) => {
      if (c.aberto_por) ids.add(c.aberto_por);
      if (c.fechado_por) ids.add(c.fechado_por);
    });
    return Array.from(ids);
  }, [caixaSessao]);

  const { data: operatorProfiles } = useQuery({
    queryKey: ["fechamento-profiles", operatorIds],
    queryFn: async () => {
      if (operatorIds.length === 0) return {};
      const { data } = await supabase.from("profiles").select("id, nome").in("id", operatorIds);
      const map: Record<string, string> = {};
      (data || []).forEach((p: any) => { map[p.id] = p.nome; });
      return map;
    },
    enabled: operatorIds.length > 0,
  });

  // === Summary calculations ===
  const resumoRecebimentos = useMemo(() => {
    const porForma: Record<string, number> = {};
    let totalRecebido = 0;
    let qtdTransacoes = 0;

    (recebimentos || []).forEach((r: any) => {
      const valor = Number(r.valor || 0);
      totalRecebido += valor;
      qtdTransacoes++;
      const forma = r.forma_pagamento || "Outros";
      porForma[forma] = (porForma[forma] || 0) + valor;
    });

    return { totalRecebido, qtdTransacoes, porForma };
  }, [recebimentos]);

  const resumoVendas = useMemo(() => {
    let total = 0;
    let descontos = 0;
    let cashback = 0;
    (vendas || []).forEach((v: any) => {
      total += Number(v.total || 0);
      descontos += Number(v.desconto || 0);
      cashback += Number(v.cashback_usado || 0);
    });
    return { total, descontos, cashback, qtd: (vendas || []).length };
  }, [vendas]);

  // Group recebimentos by OS
  const recebimentosPorOS = useMemo(() => {
    const map: Record<string, { osNumber: string; clienteNome: string; valorTotal: number; status: string; recebimentos: any[] }> = {};
    (recebimentos || []).forEach((r: any) => {
      const conta = r.contas_receber;
      const contaId = r.conta_receber_id;
      const desc = conta?.descricao || "";
      const osMatch = desc.match(/OS-(\d+)/);
      const osNumber = osMatch ? osMatch[1] : contaId?.slice(0, 8);
      const key = contaId || osNumber;

      if (!map[key]) {
        map[key] = {
          osNumber: osNumber || "?",
          clienteNome: conta?.clientes?.nome || "—",
          valorTotal: Number(conta?.valor || 0),
          status: conta?.status || "—",
          recebimentos: [],
        };
      }
      map[key].recebimentos.push(r);
    });
    return Object.values(map).sort((a, b) => Number(a.osNumber) - Number(b.osNumber));
  }, [recebimentos]);

  const todasFormas = useMemo(() => {
    return Object.entries(resumoRecebimentos.porForma).sort((a, b) => b[1] - a[1]);
  }, [resumoRecebimentos.porForma]);

  const totalGeral = resumoRecebimentos.totalRecebido;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <Receipt className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold text-foreground">Relatório de Caixa</h2>
              <p className="text-sm text-muted-foreground">Fluxo completo de recebimentos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-1.5 w-48 justify-start text-left font-normal")}>
                  <CalendarIcon className="h-4 w-4" />
                  {format(parseISO(selectedDate), "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[60]" align="end">
                <CalendarComponent
                  mode="single"
                  selected={parseISO(selectedDate)}
                  onSelect={(date) => {
                    if (date) setSelectedDate(format(date, "yyyy-MM-dd"));
                  }}
                  locale={ptBR}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1">
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="resumo" className="p-6">
          <TabsList className="mb-4">
            <TabsTrigger value="resumo" className="gap-1.5"><PieChart className="h-3.5 w-3.5" /> Resumo</TabsTrigger>
            <TabsTrigger value="detalhado" className="gap-1.5"><ClipboardList className="h-3.5 w-3.5" /> Por OS</TabsTrigger>
            <TabsTrigger value="sessoes" className="gap-1.5"><Receipt className="h-3.5 w-3.5" /> Sessões Caixa</TabsTrigger>
          </TabsList>

          {/* === TAB 1: RESUMO === */}
          <TabsContent value="resumo" className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4 pb-4 px-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" /> Total Recebido
                  </div>
                  <p className="text-xl font-bold text-emerald-600">{fmt(totalGeral)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 px-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Hash className="h-3.5 w-3.5 text-primary" /> Transações
                  </div>
                  <p className="text-xl font-bold text-foreground">{resumoRecebimentos.qtdTransacoes}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 px-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <ArrowDownRight className="h-3.5 w-3.5 text-destructive" /> Descontos
                  </div>
                  <p className="text-xl font-bold text-destructive">{fmt(resumoVendas.descontos)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 px-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Wallet className="h-3.5 w-3.5 text-amber-600" /> Cashback Usado
                  </div>
                  <p className="text-xl font-bold text-amber-600">{fmt(resumoVendas.cashback)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Payment method breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Recebimentos por Forma de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {todasFormas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum recebimento no período</p>
                ) : (
                  todasFormas.map(([forma, valor]) => {
                    const percentual = totalGeral > 0 ? (valor / totalGeral) * 100 : 0;
                    return (
                      <div key={forma} className="flex items-center gap-3 p-3 rounded-md border border-border bg-background/50">
                        <div className="text-primary">{getIconForPayment(forma)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{forma}</p>
                          <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                            <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${percentual}%` }} />
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-foreground">{fmt(valor)}</p>
                          <p className="text-[10px] text-muted-foreground">{percentual.toFixed(1)}%</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <Separator className="my-3" />
                <div className="flex items-center justify-between p-3 rounded-md bg-primary/5 border border-primary/20">
                  <span className="text-sm font-semibold text-foreground">Total Consolidado</span>
                  <span className="text-lg font-bold text-primary">{fmt(totalGeral)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Vendas PDV resumo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Vendas PDV ({resumoVendas.qtd})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>OS</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead className="text-right">Desconto</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(vendas || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Nenhuma venda</TableCell>
                      </TableRow>
                    ) : (
                      (vendas || []).map((v: any) => (
                        <TableRow key={v.id}>
                          <TableCell className="text-xs">
                            {new Date(v.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] font-mono">OS-{v.numero_venda}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{v.forma_pagamento}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs text-destructive">
                            {Number(v.desconto) > 0 ? `-${fmt(Number(v.desconto))}` : "—"}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">{fmt(Number(v.total))}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === TAB 2: POR OS === */}
          <TabsContent value="detalhado" className="space-y-4">
            {recebimentosPorOS.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ClipboardList className="h-10 w-10 mx-auto opacity-30 mb-2" />
                <p className="text-sm">Nenhum recebimento registrado nesta data</p>
              </div>
            ) : (
              recebimentosPorOS.map((os) => {
                const totalRecebidoOS = os.recebimentos.reduce((s: number, r: any) => s + Number(r.valor || 0), 0);
                const restante = os.valorTotal - totalRecebidoOS;
                return (
                  <Card key={os.osNumber}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs border-primary/50 text-primary bg-primary/10">
                            OS-{os.osNumber}
                          </Badge>
                          <span className="text-foreground">{os.clienteNome}</span>
                        </CardTitle>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-muted-foreground">Total: <strong className="text-foreground">{fmt(os.valorTotal)}</strong></span>
                          <span className="text-emerald-600">Recebido: <strong>{fmt(totalRecebidoOS)}</strong></span>
                          {restante > 0.01 && (
                            <span className="text-amber-600">Restante: <strong>{fmt(restante)}</strong></span>
                          )}
                          <Badge variant={os.status === "recebido" ? "default" : "secondary"} className="text-[10px]">
                            {os.status === "recebido" ? "Quitado" : os.status === "parcial" ? "Parcial" : os.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Forma Pagamento</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead>Observação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {os.recebimentos.map((r: any) => (
                            <TableRow key={r.id}>
                              <TableCell className="text-xs">
                                {new Date(r.created_at).toLocaleString("pt-BR", {
                                  day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                                })}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  {getIconForPayment(r.forma_pagamento || "")}
                                  <span className="text-sm">{r.forma_pagamento || "—"}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-sm font-semibold text-emerald-600">
                                {fmt(Number(r.valor))}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                {r.observacoes || "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* === TAB 3: SESSÕES DE CAIXA === */}
          <TabsContent value="sessoes" className="space-y-4">
            {(caixaSessao || []).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="h-10 w-10 mx-auto opacity-30 mb-2" />
                <p className="text-sm">Nenhuma sessão de caixa nesta data</p>
              </div>
            ) : (
              (caixaSessao || []).map((sessao: any, idx: number) => (
                <Card key={sessao.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-primary" />
                        Sessão #{(caixaSessao || []).length - idx}
                      </span>
                      <Badge variant={sessao.status === "aberto" ? "default" : "secondary"}>
                        {sessao.status === "aberto" ? "Aberto" : "Fechado"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="p-3 rounded-md border border-border bg-muted/30">
                        <p className="text-[10px] text-muted-foreground">Abertura</p>
                        <p className="text-sm font-bold text-foreground">
                          {new Date(sessao.aberto_em).toLocaleString("pt-BR", {
                            day: "2-digit", month: "2-digit", year: "2-digit",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Por: <strong>{operatorProfiles?.[sessao.aberto_por] || "..."}</strong>
                        </p>
                      </div>
                      <div className="p-3 rounded-md border border-border bg-muted/30">
                        <p className="text-[10px] text-muted-foreground">Fechamento</p>
                        {sessao.fechado_em ? (
                          <>
                            <p className="text-sm font-bold text-foreground">
                              {new Date(sessao.fechado_em).toLocaleString("pt-BR", {
                                day: "2-digit", month: "2-digit", year: "2-digit",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Por: <strong>{operatorProfiles?.[sessao.fechado_por] || "..."}</strong>
                            </p>
                          </>
                        ) : (
                          <p className="text-sm font-medium text-amber-600">Em andamento</p>
                        )}
                      </div>
                      <div className="p-3 rounded-md border border-border bg-emerald-500/5">
                        <p className="text-[10px] text-muted-foreground">Troco Inicial</p>
                        <p className="text-sm font-bold text-foreground">{fmt(Number(sessao.valor_abertura || 0))}</p>
                      </div>
                      <div className="p-3 rounded-md border border-primary/30 bg-primary/5">
                        <p className="text-[10px] text-muted-foreground">Total Vendas</p>
                        <p className="text-sm font-bold text-primary">{fmt(Number(sessao.total_vendas || 0))}</p>
                      </div>
                    </div>
                    {sessao.status === "fechado" && (
                      <div className="p-3 rounded-md border border-border bg-muted/30 text-center">
                        <p className="text-[10px] text-muted-foreground">Total no Caixa (Troco + Vendas)</p>
                        <p className="text-lg font-bold text-foreground">{fmt(Number(sessao.valor_fechamento || 0))}</p>
                      </div>
                    )}
                    {(sessao.observacoes_abertura || sessao.observacoes_fechamento) && (
                      <div className="mt-3 space-y-1">
                        {sessao.observacoes_abertura && (
                          <p className="text-xs text-muted-foreground"><strong>Obs. Abertura:</strong> {sessao.observacoes_abertura}</p>
                        )}
                        {sessao.observacoes_fechamento && (
                          <p className="text-xs text-muted-foreground"><strong>Obs. Fechamento:</strong> {sessao.observacoes_fechamento}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
