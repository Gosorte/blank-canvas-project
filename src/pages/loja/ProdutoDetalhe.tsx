import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProdutoPublic, useAcabamentosPublic, usePapeisPublic, useSubstratosPublic } from "@/hooks/use-loja-public";
import { useCarrinho } from "@/hooks/use-carrinho";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShoppingCart, Upload, ArrowLeft } from "lucide-react";

export default function ProdutoDetalhe() {
  const { tenantId, produtoId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCarrinho();
  const { data: produto, isLoading } = useProdutoPublic(produtoId);
  const { data: acabamentos = [] } = useAcabamentosPublic(tenantId, produto?.tipo_modulo);
  const { data: papeis = [] } = usePapeisPublic(tenantId);
  const { data: substratos = [] } = useSubstratosPublic(tenantId);

  const [quantidade, setQuantidade] = useState(1);
  const [acabamentoId, setAcabamentoId] = useState("");
  const [papelId, setPapelId] = useState("");
  const [substratoId, setSubstratoId] = useState("");
  const [largura, setLargura] = useState("");
  const [altura, setAltura] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (!produto) {
    return <div className="text-center py-12 text-muted-foreground">Produto não encontrado</div>;
  }

  const isVisual = produto.tipo_modulo === "visual";
  const isOffset = produto.tipo_modulo === "offset";
  const isDigital = produto.tipo_modulo === "digital";

  const calcularPreco = () => {
    let preco = Number(produto.preco_minimo);
    if (isVisual && largura && altura) {
      const area = parseFloat(largura) * parseFloat(altura);
      preco = Math.max(preco, area * Number(produto.custo_m2 || 0) * Number(produto.markup || 1));
    } else if (isOffset) {
      const milheiros = Math.max(1, Math.ceil(quantidade / 1000));
      preco = Math.max(preco, milheiros * Number(produto.custo_milheiro || 0) + Number(produto.custo_chapa || 0) + Number(produto.custo_setup || 0));
      preco *= Number(produto.markup || 1);
    } else if (isDigital) {
      preco = Math.max(preco, quantidade * Number(produto.custo_clique || 0) * Number(produto.markup || 1));
    }
    if (acabamentoId) {
      const acab = acabamentos.find(a => a.id === acabamentoId);
      if (acab) preco += Number(acab.custo_unitario) * quantidade;
    }
    return Math.max(preco, Number(produto.preco_minimo));
  };

  const precoTotal = calcularPreco();

  const handleUpload = async (file: File) => {
    setUploading(true);
    const path = `${tenantId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("loja-arquivos").upload(path, file);
    setUploading(false);
    if (error) {
      toast.error("Erro ao enviar arquivo");
      return null;
    }
    const { data } = supabase.storage.from("loja-arquivos").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleAddToCart = async () => {
    let arquivoUrl: string | undefined;
    if (arquivo) {
      const url = await handleUpload(arquivo);
      if (!url) return;
      arquivoUrl = url;
    }

    const especificacoes: Record<string, string> = {};
    if (acabamentoId) {
      const acab = acabamentos.find(a => a.id === acabamentoId);
      if (acab) especificacoes["Acabamento"] = acab.nome;
    }
    if (papelId) {
      const papel = papeis.find(p => p.id === papelId);
      if (papel) especificacoes["Papel"] = `${papel.nome} ${papel.gramatura}g`;
    }
    if (substratoId) {
      const sub = substratos.find(s => s.id === substratoId);
      if (sub) especificacoes["Substrato"] = sub.nome;
    }
    if (isVisual && largura && altura) {
      especificacoes["Dimensões"] = `${largura}m x ${altura}m`;
    }

    addItem({
      produtoId: produto.id,
      produtoNome: produto.nome,
      quantidade,
      especificacoes,
      valorUnitario: precoTotal / quantidade,
      valorTotal: precoTotal,
      arquivoUrl,
    });

    toast.success("Produto adicionado ao carrinho!");
    navigate(`/loja/${tenantId}/carrinho`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(`/loja/${tenantId}`)}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao catálogo
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Produto Info */}
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit mb-2">
              {produto.tipo_modulo === "offset" ? "Offset" : produto.tipo_modulo === "digital" ? "Digital" : "Comunicação Visual"}
            </Badge>
            <CardTitle className="text-2xl">{produto.nome}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {produto.descricao && <p className="text-muted-foreground">{produto.descricao}</p>}
            {produto.substrato && <p className="text-sm"><strong>Substrato:</strong> {produto.substrato}</p>}
            <div className="pt-4 border-t">
              <span className="text-sm text-muted-foreground">A partir de</span>
              <p className="text-3xl font-bold text-primary">
                R$ {Number(produto.preco_minimo).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Personalização */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personalize seu pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={isOffset ? (produto.escala_minima || 1000) : 1}
                value={quantidade}
                onChange={e => setQuantidade(parseInt(e.target.value) || 1)}
              />
              {isOffset && produto.escala_minima && (
                <p className="text-xs text-muted-foreground mt-1">Mínimo: {produto.escala_minima} unidades</p>
              )}
            </div>

            {isVisual && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Largura (m)</Label>
                  <Input type="number" step="0.01" min="0.1" value={largura} onChange={e => setLargura(e.target.value)} placeholder="Ex: 1.5" />
                </div>
                <div>
                  <Label>Altura (m)</Label>
                  <Input type="number" step="0.01" min="0.1" value={altura} onChange={e => setAltura(e.target.value)} placeholder="Ex: 0.8" />
                </div>
              </div>
            )}

            {(isOffset || isDigital) && papeis.length > 0 && (
              <div>
                <Label>Papel</Label>
                <Select value={papelId} onValueChange={setPapelId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o papel" /></SelectTrigger>
                  <SelectContent>
                    {papeis.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nome} {p.gramatura}g</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {isVisual && substratos.length > 0 && (
              <div>
                <Label>Substrato</Label>
                <Select value={substratoId} onValueChange={setSubstratoId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o substrato" /></SelectTrigger>
                  <SelectContent>
                    {substratos.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {acabamentos.length > 0 && (
              <div>
                <Label>Acabamento</Label>
                <Select value={acabamentoId} onValueChange={setAcabamentoId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o acabamento" /></SelectTrigger>
                  <SelectContent>
                    {acabamentos.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.nome} (+R$ {Number(a.custo_unitario).toFixed(2)}/un)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Upload */}
            <div>
              <Label>Arquivo para impressão</Label>
              <div className="mt-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => document.getElementById("file-input")?.click()}>
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                {arquivo ? (
                  <p className="text-sm font-medium">{arquivo.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Clique para enviar seu arquivo (PDF, AI, CDR, JPG)</p>
                )}
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  accept=".pdf,.ai,.cdr,.jpg,.jpeg,.png,.tiff,.psd"
                  onChange={e => setArquivo(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            {/* Total e botão */}
            <div className="pt-4 border-t space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total estimado:</span>
                <span className="text-2xl font-bold text-primary">
                  R$ {precoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <Button className="w-full" size="lg" onClick={handleAddToCart} disabled={uploading}>
                <ShoppingCart className="h-5 w-5 mr-2" />
                {uploading ? "Enviando arquivo..." : "Adicionar ao Carrinho"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
