import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTenant } from "@/hooks/use-tenant";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, CreditCard, ArrowUpRight, ArrowDownLeft, Plus, AlertTriangle, Crown, Gift } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

export function ClienteCreditWallet({ clienteId, clienteNome }: { clienteId: string; clienteNome?: string }) {
  const { user } = useAuth();
  const { activeTenantId } = useTenant();
  const queryClient = useQueryClient();
  const [showSetup, setShowSetup] = useState(false);
  const [showTransaction, setShowTransaction] = useState(false);
  const [creditLimit, setCreditLimit] = useState("");
  const [cashbackPercent, setCashbackPercent] = useState("3");
  const [releaseDays, setReleaseDays] = useState("30");
  const [maxDiscount, setMaxDiscount] = useState("5");
  const [txType, setTxType] = useState("debito");
  const [txAmount, setTxAmount] = useState("");
  const [txDesc, setTxDesc] = useState("");

  const { data: creditAccount, isLoading } = useQuery({
    queryKey: ["customer-credit", clienteId],
    queryFn: async () => {
      const { data, error } = await supabase.from("customer_credits")
        .select("*").eq("cliente_id", clienteId).maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!user,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["credit-transactions", clienteId],
    queryFn: async () => {
      if (!creditAccount) return [];
      const { data, error } = await supabase.from("credit_transactions")
        .select("*").eq("credit_account_id", creditAccount.id)
        .order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!creditAccount,
  });

  const setupMutation = useMutation({
    mutationFn: async () => {
      if (!activeTenantId) throw new Error("Tenant não identificado");
      const payload = {
        cliente_id: clienteId,
        tenant_id: activeTenantId,
        credit_limit: Number(creditLimit) || 0,
        cashback_percent: Number(cashbackPercent) || 3,
        cashback_release_days: Number(releaseDays) || 30,
        desconto_max_percentual: Number(maxDiscount) || 5,
      };
      if (creditAccount) {
        const { error } = await supabase.from("customer_credits")
          .update({
            credit_limit: payload.credit_limit,
            cashback_percent: payload.cashback_percent,
            cashback_release_days: payload.cashback_release_days,
            desconto_max_percentual: payload.desconto_max_percentual,
          } as any)
          .eq("id", creditAccount.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("customer_credits").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-credit", clienteId] });
      toast.success("Conta corrente configurada!");
      setShowSetup(false);
    },
    onError: (e: any) => toast.error("Erro ao salvar: " + e.message),
  });

  const transactionMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(txAmount) || 0;
      if (amount <= 0) throw new Error("Valor inválido");
      if (!creditAccount) throw new Error("Configure a conta primeiro");

      const isDebit = txType === "debito";
      const currentBalance = Number(creditAccount.current_balance) || 0;
      const newBalance = isDebit ? currentBalance + amount : currentBalance - amount;

      const { error: txError } = await supabase.from("credit_transactions").insert({
        cliente_id: clienteId,
        tenant_id: activeTenantId!,
        credit_account_id: creditAccount.id,
        tipo_transacao: txType,
        valor: amount,
        descricao: txDesc || (isDebit ? "Compra a prazo" : "Pagamento recebido"),
        saldo_apos: newBalance,
        usuario_id: user?.id,
      } as any);
      if (txError) throw txError;

      const { error: updateError } = await supabase.from("customer_credits")
        .update({ current_balance: newBalance } as any).eq("id", creditAccount.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-credit", clienteId] });
      queryClient.invalidateQueries({ queryKey: ["credit-transactions", clienteId] });
      toast.success("Transação registrada!");
      setShowTransaction(false);
      setTxAmount(""); setTxDesc("");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  if (isLoading) return null;

  const currentBalance = Number(creditAccount?.current_balance ?? 0);
  const creditLimitVal = Number(creditAccount?.credit_limit ?? 0);
  const cashbackBalance = Number(creditAccount?.cashback_balance ?? 0);
  const isOverLimit = creditAccount && currentBalance > creditLimitVal && creditLimitVal > 0;
  const isVip = creditAccount?.is_vip || cashbackBalance > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Credit Wallet */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-1.5"><Wallet className="h-4 w-4 text-primary" /></div>
              <span className="text-xs font-semibold text-muted-foreground uppercase">Conta Corrente</span>
            </div>
            {isVip && (
              <Badge className="bg-amber-500/10 text-amber-600 text-[10px] gap-1">
                <Crown className="h-3 w-3" /> VIP
              </Badge>
            )}
          </div>
          {creditAccount ? (
            <>
              <p className={`text-xl font-bold ${isOverLimit ? "text-destructive" : "text-card-foreground"}`}>
                {formatCurrency(currentBalance)}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Limite: {formatCurrency(creditLimitVal)}</span>
                {isOverLimit && (
                  <Badge variant="destructive" className="text-[10px] gap-1">
                    <AlertTriangle className="h-3 w-3" /> Excedido
                  </Badge>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Não configurada</p>
          )}
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant={creditAccount ? "outline" : "default"} className="text-xs flex-1" onClick={() => {
              if (creditAccount) {
                setCreditLimit(String(creditAccount.credit_limit ?? 0));
                setCashbackPercent(String(creditAccount.cashback_percent ?? 3));
                setReleaseDays(String(creditAccount.cashback_release_days ?? 30));
                setMaxDiscount(String(creditAccount.desconto_max_percentual ?? 5));
              } else {
                setCreditLimit("1000");
                setCashbackPercent("3");
                setReleaseDays("30");
                setMaxDiscount("5");
              }
              setShowSetup(true);
            }}>
              {!creditAccount && <Plus className="h-3 w-3 mr-1" />}
              {creditAccount ? "Editar" : "Configurar Conta"}
            </Button>
            {creditAccount && (
              <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => setShowTransaction(true)}>
                <Plus className="h-3 w-3 mr-1" /> Lançar
              </Button>
            )}
          </div>
        </Card>

        {/* Cashback */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-green-500/10 p-1.5"><Gift className="h-4 w-4 text-green-600" /></div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">Cashback</span>
          </div>
          <p className="text-xl font-bold text-green-600">{formatCurrency(cashbackBalance)}</p>
          <p className="text-xs text-muted-foreground">
            Taxa: {creditAccount?.cashback_percent ?? 3}% por compra
          </p>
        </Card>

        {/* LTV */}
        <ClienteLTVCard clienteId={clienteId} clienteNome={clienteNome} />
      </div>

      {/* Account Statement */}
      {transactions.length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" />Extrato da Conta Corrente</h4>
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-2">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    {tx.tipo_transacao === "debito" ? <ArrowUpRight className="h-4 w-4 text-destructive shrink-0" /> : <ArrowDownLeft className="h-4 w-4 text-green-600 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.descricao}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(tx.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${tx.tipo_transacao === "debito" ? "text-destructive" : "text-green-600"}`}>
                      {tx.tipo_transacao === "debito" ? "+" : "-"}{formatCurrency(Number(tx.valor))}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Saldo: {formatCurrency(Number(tx.saldo_apos))}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Setup Dialog */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Conta Corrente</DialogTitle>
            <DialogDescription>Defina os parâmetros da conta corrente do cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Limite de Crédito (R$)</Label>
              <Input type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label className="text-xs">Cashback (%)</Label>
              <Input type="number" value={cashbackPercent} onChange={(e) => setCashbackPercent(e.target.value)} placeholder="3" />
            </div>
            <div>
              <Label className="text-xs">Ciclo de Liberação do Cashback (dias)</Label>
              <Input type="number" value={releaseDays} onChange={(e) => setReleaseDays(e.target.value)} placeholder="30" />
              <p className="text-[10px] text-muted-foreground mt-1">O cashback só pode ser usado após este período</p>
            </div>
            <div>
              <Label className="text-xs">Desconto Máximo no PDV (%)</Label>
              <Input type="number" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} placeholder="5" />
              <p className="text-[10px] text-muted-foreground mt-1">Acima deste valor, requer código do gestor</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSetup(false)}>Cancelar</Button>
            <Button onClick={() => setupMutation.mutate()} disabled={setupMutation.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={showTransaction} onOpenChange={setShowTransaction}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
            <DialogDescription>Registre um débito ou crédito na conta do cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={txType} onValueChange={setTxType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="debito">Débito (Compra a prazo)</SelectItem>
                  <SelectItem value="credito">Crédito (Pagamento)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Valor (R$)</Label>
              <Input type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label className="text-xs">Descrição</Label>
              <Input value={txDesc} onChange={(e) => setTxDesc(e.target.value)} placeholder="Descrição do lançamento" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransaction(false)}>Cancelar</Button>
            <Button onClick={() => transactionMutation.mutate()} disabled={transactionMutation.isPending}>Lançar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClienteLTVCard({ clienteId, clienteNome }: { clienteId: string; clienteNome?: string }) {
  const { activeTenantId } = useTenant();

  const { data: ltv = 0 } = useQuery({
    queryKey: ["cliente-ltv", clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("erp_pedidos")
        .select("valor_total")
        .eq("tenant_id", activeTenantId!)
        .or(`cliente_id.eq.${clienteId}${clienteNome ? `,cliente_nome.eq.${clienteNome}` : ""}`);
      if (error) throw error;
      return (data ?? []).reduce((sum, o) => sum + (Number(o.valor_total) || 0), 0);
    },
    enabled: !!activeTenantId,
  });

  return (
    <Card className="p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className="rounded-md bg-purple-500/10 p-1.5"><CreditCard className="h-4 w-4 text-purple-600" /></div>
        <span className="text-xs font-semibold text-muted-foreground uppercase">LTV (Valor Vitalício)</span>
      </div>
      <p className="text-xl font-bold text-purple-600">
        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(ltv / 100)}
      </p>
      <p className="text-xs text-muted-foreground">Total investido na gráfica</p>
    </Card>
  );
}
