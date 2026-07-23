import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCarrinho } from "@/hooks/use-carrinho";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2, ShoppingCart, ArrowLeft, CheckCircle } from "lucide-react";

export default function Carrinho() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { itens, removeItem, clearCart, total } = useCarrinho();
  const [step, setStep] = useState<"cart" | "checkout" | "success">("cart");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [numeroPedido, setNumeroPedido] = useState<number | null>(null);

  const handleCheckout = async () => {
    if (!nome.trim() || !email.trim()) {
      toast.error("Preencha nome e e-mail");
      return;
    }
    setSubmitting(true);
    try {
      // Create order
      const { data: pedido, error: pedidoError } = await supabase
        .from("loja_pedidos")
        .insert({
          tenant_id: tenantId!,
          valor_total: total,
          observacoes: `Cliente: ${nome} | Email: ${email} | Tel: ${telefone}\n${observacoes}`,
          status: "pendente",
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // Create order items
      const itensPedido = itens.map(item => ({
        pedido_id: pedido.id,
        produto_id: item.produtoId,
        produto_nome: item.produtoNome,
        quantidade: item.quantidade,
        especificacoes: item.especificacoes,
        valor_unitario: item.valorUnitario,
        valor_total: item.valorTotal,
        arquivo_url: item.arquivoUrl || null,
        status_arquivo: item.arquivoUrl ? "enviado" : "pendente",
      }));

      const { error: itensError } = await supabase
        .from("loja_pedido_itens")
        .insert(itensPedido);

      if (itensError) throw itensError;

      setNumeroPedido(pedido.numero_pedido);
      clearCart();
      setStep("success");
      toast.success("Pedido realizado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao finalizar pedido");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "success") {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-12">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
        <h1 className="text-3xl font-bold">Pedido Realizado!</h1>
        <p className="text-muted-foreground">Seu pedido foi recebido com sucesso.</p>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Número do pedido</p>
            <p className="text-4xl font-bold font-mono text-primary">#{numeroPedido}</p>
            <p className="text-sm text-muted-foreground mt-2">Guarde este número para acompanhar seu pedido</p>
          </CardContent>
        </Card>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link to={`/loja/${tenantId}`}>Continuar Comprando</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/loja/${tenantId}/rastrear`}>Rastrear Pedido</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(`/loja/${tenantId}`)}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao catálogo
      </Button>

      <h1 className="text-2xl font-bold flex items-center gap-2">
        <ShoppingCart className="h-6 w-6" />
        {step === "cart" ? "Carrinho" : "Finalizar Pedido"}
      </h1>

      {itens.length === 0 && step === "cart" ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Seu carrinho está vazio</p>
            <Button className="mt-4" asChild>
              <Link to={`/loja/${tenantId}`}>Ver Catálogo</Link>
            </Button>
          </CardContent>
        </Card>
      ) : step === "cart" ? (
        <>
          <div className="space-y-3">
            {itens.map((item, i) => (
              <Card key={i}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.produtoNome}</h3>
                    <p className="text-sm text-muted-foreground">Qtd: {item.quantidade}</p>
                    {Object.entries(item.especificacoes).map(([k, v]) => (
                      <p key={k} className="text-xs text-muted-foreground">{k}: {v}</p>
                    ))}
                    {item.arquivoUrl && <p className="text-xs text-green-600">✓ Arquivo enviado</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-primary">
                      R$ {item.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold text-primary">
                R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </CardContent>
          </Card>
          <Button className="w-full" size="lg" onClick={() => setStep("checkout")}>
            Finalizar Pedido
          </Button>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Seus dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome completo *</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" />
            </div>
            <div>
              <Label>E-mail *</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
            </div>
            <div>
              <Label>Telefone / WhatsApp</Label>
              <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-0000" />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Informações adicionais sobre o pedido..." />
            </div>
            <div className="pt-4 border-t flex items-center justify-between">
              <span className="text-lg font-bold">
                Total: R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("cart")}>Voltar</Button>
                <Button onClick={handleCheckout} disabled={submitting}>
                  {submitting ? "Processando..." : "Confirmar Pedido"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
