import { useParams, Link, useOutletContext } from "react-router-dom";
import { useProdutosPublic } from "@/hooks/use-loja-public";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, Printer, Image as ImageIcon, LayoutGrid } from "lucide-react";

const MODULO_ICONS: Record<string, React.ReactNode> = {
  offset: <Printer className="h-5 w-5" />,
  digital: <LayoutGrid className="h-5 w-5" />,
  visual: <ImageIcon className="h-5 w-5" />,
};

const MODULO_LABELS: Record<string, string> = {
  offset: "Offset",
  digital: "Digital",
  visual: "Comunicação Visual",
};

export default function Catalogo() {
  const { tenantId } = useParams();
  const { tenant } = useOutletContext<{ tenant: { nome_grafica: string } }>();
  const { data: produtos = [], isLoading } = useProdutosPublic(tenantId);
  const [busca, setBusca] = useState("");
  const [filtroModulo, setFiltroModulo] = useState<string>("todos");

  const modulos = [...new Set(produtos.map(p => p.tipo_modulo))];
  const filtered = produtos.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    const matchModulo = filtroModulo === "todos" || p.tipo_modulo === filtroModulo;
    return matchBusca && matchModulo;
  });

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-foreground">{tenant.nome_grafica}</h1>
        <p className="text-lg text-muted-foreground">Encontre o produto ideal para seu projeto gráfico</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={filtroModulo === "todos" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFiltroModulo("todos")}
          >
            Todos
          </Badge>
          {modulos.map(m => (
            <Badge
              key={m}
              variant={filtroModulo === m ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFiltroModulo(m)}
            >
              {MODULO_LABELS[m] || m}
            </Badge>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum produto encontrado
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(produto => (
            <Card key={produto.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {MODULO_ICONS[produto.tipo_modulo]}
                    <span className="ml-1">{MODULO_LABELS[produto.tipo_modulo] || produto.tipo_modulo}</span>
                  </Badge>
                </div>
                <CardTitle className="text-lg">{produto.nome}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                {produto.descricao && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{produto.descricao}</p>
                )}
                <div className="mt-3 text-sm text-muted-foreground space-y-1">
                  {produto.substrato && <p>Substrato: {produto.substrato}</p>}
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between pt-3 border-t">
                <div>
                  <span className="text-xs text-muted-foreground">A partir de</span>
                  <p className="text-lg font-bold text-primary">
                    R$ {Number(produto.preco_minimo).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Button size="sm" asChild>
                  <Link to={`/loja/${tenantId}/produto/${produto.id}`}>Personalizar</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
