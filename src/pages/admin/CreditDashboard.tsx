import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTenant } from "@/hooks/use-tenant";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wallet, Crown, AlertTriangle, Search, ArrowUpRight, Users, Gift, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

export default function CreditDashboard() {
  const { user } = useAuth();
  const { activeTenantId } = useTenant();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: credits = [], isLoading } = useQuery({
    queryKey: ["all-customer-credits", activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_credits")
        .select("*")
        .eq("tenant_id", activeTenantId!)
        .order("current_balance", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!user && !!activeTenantId,
  });

  const clienteIds = credits.map((c: any) => c.cliente_id);
  const { data: clientes = [] } = useQuery({
    queryKey: ["credit-clientes", clienteIds],
    queryFn: async () => {
      if (!clienteIds.length) return [];
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome, segmento")
        .in("id", clienteIds);
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: clienteIds.length > 0,
  });

  const clienteMap = useMemo(() => {
    const map: Record<string, any> = {};
    clientes.forEach((c: any) => { map[c.id] = c; });
    return map;
  }, [clientes]);

  const filtered = useMemo(() => {
    if (!search.trim()) return credits;
    const q = search.toLowerCase();
    return credits.filter((c: any) => {
      const cliente = clienteMap[c.cliente_id];
      return cliente?.nome?.toLowerCase().includes(q) || cliente?.segmento?.toLowerCase().includes(q);
    });
  }, [credits, search, clienteMap]);

  const totalBalance = credits.reduce((s: number, c: any) => s + Number(c.current_balance), 0);
  const totalCashback = credits.reduce((s: number, c: any) => s + Number(c.cashback_balance), 0);
  const totalLimit = credits.reduce((s: number, c: any) => s + Number(c.credit_limit), 0);
  const overLimitCount = credits.filter((c: any) => Number(c.current_balance) > Number(c.credit_limit) && Number(c.credit_limit) > 0).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Painel de Créditos & Cashback</h1>
          <p className="text-sm text-muted-foreground">Visão consolidada de todos os clientes com conta corrente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
            <Users className="h-4 w-4" /> Contas Ativas
          </div>
          <p className="text-2xl font-bold">{credits.length}</p>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
            <Wallet className="h-4 w-4" /> Saldo Total em Aberto
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
          <p className="text-xs text-muted-foreground">Limite total: {formatCurrency(totalLimit)}</p>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
            <Gift className="h-4 w-4" /> Cashback Total
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCashback)}</p>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
            <AlertTriangle className="h-4 w-4" /> Limite Excedido
          </div>
          <p className={`text-2xl font-bold ${overLimitCount > 0 ? "text-destructive" : ""}`}>{overLimitCount}</p>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou segmento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <ScrollArea className="max-h-[500px]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-semibold">Cliente</th>
                  <th className="text-left p-3 font-semibold">Segmento</th>
                  <th className="text-right p-3 font-semibold">Saldo</th>
                  <th className="text-right p-3 font-semibold">Limite</th>
                  <th className="text-right p-3 font-semibold">Cashback</th>
                  <th className="text-center p-3 font-semibold">Status</th>
                  <th className="text-center p-3 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Carregando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nenhuma conta corrente encontrada</td></tr>
                ) : (
                  filtered.map((credit: any) => {
                    const cliente = clienteMap[credit.cliente_id];
                    const isOver = Number(credit.current_balance) > Number(credit.credit_limit) && Number(credit.credit_limit) > 0;
                    const isVip = credit.is_vip || Number(credit.cashback_balance) > 0;
                    return (
                      <tr key={credit.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{cliente?.nome ?? `Cliente`}</span>
                            {isVip && (
                              <Badge className="bg-amber-500/10 text-amber-600 text-[10px] gap-1">
                                <Crown className="h-3 w-3" /> VIP
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">{cliente?.segmento || "—"}</td>
                        <td className={`p-3 text-right font-semibold ${isOver ? "text-destructive" : ""}`}>
                          {formatCurrency(Number(credit.current_balance))}
                        </td>
                        <td className="p-3 text-right text-muted-foreground">
                          {formatCurrency(Number(credit.credit_limit))}
                        </td>
                        <td className="p-3 text-right text-green-600 font-medium">
                          {formatCurrency(Number(credit.cashback_balance))}
                        </td>
                        <td className="p-3 text-center">
                          {isOver ? (
                            <Badge variant="destructive" className="text-[10px] gap-1">
                              <AlertTriangle className="h-3 w-3" /> Excedido
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Regular</Badge>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs gap-1"
                            onClick={() => navigate(`/admin/cadastros/clientes/${credit.cliente_id}`)}
                          >
                            <ArrowUpRight className="h-3 w-3" /> Ver
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
