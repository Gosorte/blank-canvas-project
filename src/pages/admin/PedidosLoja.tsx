import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { usePedidosLoja, useUpdatePedidoStatus, PEDIDO_STATUS } from "@/hooks/use-loja";
import { useTenants } from "@/hooks/use-tenants";
import { ShoppingCart, Package, Eye, LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatCard } from "@/components/admin/StatCard";
import { Link } from "react-router-dom";

export default function PedidosLoja() {
  const { data: tenants } = useTenants();
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const { data: pedidos = [], isLoading } = usePedidosLoja(selectedTenant || undefined);
  const updateStatus = useUpdatePedidoStatus();
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  const filtered = filtroStatus === "todos" ? pedidos : pedidos.filter(p => p.status === filtroStatus);

  const totalPendente = pedidos.filter(p => p.status === "pendente").reduce((s, p) => s + p.valor_total, 0);
  const totalPago = pedidos.filter(p => ["pago", "em_producao", "pronto", "entregue"].includes(p.status)).reduce((s, p) => s + p.valor_total, 0);
  const totalPedidos = pedidos.length;
  const comOP = pedidos.filter(p => p.op_id).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">E-commerce</h1>
          <p className="text-muted-foreground">Gestão de pedidos da loja virtual</p>
        </div>
        <Select value={selectedTenant} onValueChange={setSelectedTenant}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Selecione o tenant" /></SelectTrigger>
          <SelectContent>
            {(tenants || []).map(t => (
              <SelectItem key={t.id} value={t.id}>{t.nome_grafica}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total de Pedidos" value={totalPedidos.toString()} icon={ShoppingCart} />
        <StatCard title="Receita Confirmada" value={`R$ ${totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={Package} />
        <StatCard title="Pendente de Pagamento" value={`R$ ${totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={ShoppingCart} />
        <StatCard title="Com OP Gerada" value={`${comOP} / ${totalPedidos}`} icon={LinkIcon} />
      </div>

      {/* Info banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-3 px-4 text-sm text-muted-foreground flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-primary" />
          Ao alterar o status para <Badge variant="secondary" className="mx-1">Pago</Badge>, uma Ordem de Produção é gerada automaticamente e vinculada ao pedido.
        </CardContent>
      </Card>

      {/* Filtros de status */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={filtroStatus === "todos" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFiltroStatus("todos")}>Todos</Badge>
        {PEDIDO_STATUS.map(s => (
          <Badge key={s.id} variant={filtroStatus === s.id ? "default" : "outline"} className="cursor-pointer" onClick={() => setFiltroStatus(s.id)}>
            {s.label} ({pedidos.filter(p => p.status === s.id).length})
          </Badge>
        ))}
      </div>

      {!selectedTenant ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Selecione um tenant para visualizar os pedidos</CardContent></Card>
      ) : isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <TooltipProvider>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Pedido #</th>
                      <th className="text-left p-3 font-medium">Data</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">OP</th>
                      <th className="text-left p-3 font-medium">Pagamento</th>
                      <th className="text-right p-3 font-medium">Valor</th>
                      <th className="text-center p-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(pedido => {
                      const statusInfo = PEDIDO_STATUS.find(s => s.id === pedido.status);
                      return (
                        <tr key={pedido.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-mono font-semibold">#{pedido.numero_pedido}</td>
                          <td className="p-3 text-muted-foreground">
                            {format(new Date(pedido.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </td>
                          <td className="p-3">
                            <Select value={pedido.status} onValueChange={v => updateStatus.mutate({ id: pedido.id, status: v })}>
                              <SelectTrigger className="w-[160px] h-8 text-xs">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${statusInfo?.color || ""}`} />
                                  <SelectValue />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                {PEDIDO_STATUS.map(s => (
                                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            {pedido.op_id ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link to="/admin/ordens-producao">
                                    <Badge variant="secondary" className="cursor-pointer gap-1">
                                      <LinkIcon className="h-3 w-3" /> OP vinculada
                                    </Badge>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>Clique para ver a Ordem de Produção</TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3">{pedido.forma_pagamento || "—"}</td>
                          <td className="p-3 text-right font-semibold">R$ {pedido.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                          <td className="p-3 text-center">
                            <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhum pedido encontrado</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TooltipProvider>
      )}
    </div>
  );
}