import { useState } from "react";
import { useParams } from "react-router-dom";
import { useRastrearPedido } from "@/hooks/use-loja-public";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Package, CheckCircle, Clock, Truck, XCircle } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pendente: { label: "Pendente", color: "bg-yellow-500", icon: <Clock className="h-5 w-5" /> },
  pago: { label: "Pago", color: "bg-blue-500", icon: <CheckCircle className="h-5 w-5" /> },
  em_producao: { label: "Em Produção", color: "bg-orange-500", icon: <Package className="h-5 w-5" /> },
  pronto: { label: "Pronto", color: "bg-green-500", icon: <CheckCircle className="h-5 w-5" /> },
  entregue: { label: "Entregue", color: "bg-emerald-600", icon: <Truck className="h-5 w-5" /> },
  cancelado: { label: "Cancelado", color: "bg-red-500", icon: <XCircle className="h-5 w-5" /> },
};

const STATUS_STEPS = ["pendente", "pago", "em_producao", "pronto", "entregue"];

export default function RastrearPedido() {
  const { tenantId } = useParams();
  const [input, setInput] = useState("");
  const [numero, setNumero] = useState<number | undefined>();
  const { data: pedido, isLoading, error } = useRastrearPedido(numero, tenantId);

  const handleSearch = () => {
    const n = parseInt(input);
    if (n) setNumero(n);
  };

  const statusInfo = pedido ? STATUS_CONFIG[pedido.status] || STATUS_CONFIG.pendente : null;
  const currentStepIndex = pedido ? STATUS_STEPS.indexOf(pedido.status) : -1;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Rastrear Pedido</h1>
        <p className="text-muted-foreground">Digite o número do seu pedido para acompanhar</p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Número do pedido (ex: 1001)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          className="text-lg"
        />
        <Button onClick={handleSearch} size="lg">
          <Search className="h-5 w-5 mr-2" /> Buscar
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {error && numero && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Pedido #{numero} não encontrado</p>
          </CardContent>
        </Card>
      )}

      {pedido && statusInfo && (
        <div className="space-y-6">
          {/* Status Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Pedido #{pedido.numero_pedido}</span>
                <Badge className={`${statusInfo.color} text-white`}>{statusInfo.label}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pedido.status !== "cancelado" && (
                <div className="flex items-center justify-between mb-6">
                  {STATUS_STEPS.map((step, i) => {
                    const isActive = i <= currentStepIndex;
                    const cfg = STATUS_CONFIG[step];
                    return (
                      <div key={step} className="flex flex-col items-center flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${isActive ? cfg.color : "bg-muted"}`}>
                          {i + 1}
                        </div>
                        <span className={`text-xs mt-1 ${isActive ? "font-semibold" : "text-muted-foreground"}`}>
                          {cfg.label}
                        </span>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`h-0.5 w-full mt-1 ${i < currentStepIndex ? "bg-primary" : "bg-muted"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Valor:</strong> R$ {Number(pedido.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                <p><strong>Data:</strong> {new Date(pedido.created_at).toLocaleDateString("pt-BR")}</p>
                {pedido.forma_pagamento && <p><strong>Pagamento:</strong> {pedido.forma_pagamento}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          {pedido.loja_pedido_itens && (pedido.loja_pedido_itens as any[]).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Itens do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(pedido.loja_pedido_itens as any[]).map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{item.produto_nome}</p>
                      <p className="text-sm text-muted-foreground">Qtd: {item.quantidade}</p>
                    </div>
                    <span className="font-semibold">R$ {Number(item.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
