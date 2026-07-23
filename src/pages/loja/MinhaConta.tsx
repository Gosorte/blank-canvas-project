import { useParams, Link, Navigate } from "react-router-dom";
import { useLojaAuth } from "@/hooks/use-loja-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, FileText, ShoppingBag, LogOut, RefreshCw } from "lucide-react";
import { format } from "date-fns";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  pago: { label: "Pago", variant: "secondary" },
  em_producao: { label: "Em Produção", variant: "default" },
  pronto: { label: "Pronto", variant: "default" },
  entregue: { label: "Entregue", variant: "default" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

export default function MinhaConta() {
  const { tenantId } = useParams();
  const { user, cliente, loading, signOut } = useLojaAuth();

  const { data: pedidos = [] } = useQuery({
    queryKey: ["meus-pedidos", cliente?.id],
    enabled: !!cliente?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loja_pedidos")
        .select("*")
        .eq("cliente_id", cliente!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: arquivos = [] } = useQuery({
    queryKey: ["meus-arquivos", cliente?.id],
    enabled: !!cliente?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_arquivos")
        .select("*")
        .eq("cliente_id", cliente!.id)
        .eq("aprovado", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to={`/loja/${tenantId}/login`} replace />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Minha Conta</h1>
          <p className="text-muted-foreground">{cliente?.nome || user.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-1" /> Sair
        </Button>
      </div>

      <Tabs defaultValue="pedidos">
        <TabsList>
          <TabsTrigger value="pedidos">
            <ShoppingBag className="h-4 w-4 mr-1" /> Meus Pedidos
          </TabsTrigger>
          <TabsTrigger value="arquivos">
            <FileText className="h-4 w-4 mr-1" /> Arquivos Aprovados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pedidos">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              {pedidos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum pedido realizado ainda.</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link to={`/loja/${tenantId}`}>Ver catálogo</Link>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Acompanhar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedidos.map((p: any) => {
                      const st = STATUS_MAP[p.status] || { label: p.status, variant: "outline" as const };
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono font-bold">#{p.numero_pedido}</TableCell>
                          <TableCell>{format(new Date(p.created_at), "dd/MM/yyyy")}</TableCell>
                          <TableCell>R$ {Number(p.valor_total).toFixed(2)}</TableCell>
                          <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/loja/${tenantId}/rastrear?pedido=${p.numero_pedido}`}>
                                <Package className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arquivos">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Arquivos Aprovados para Reimpressão</CardTitle>
            </CardHeader>
            <CardContent>
              {arquivos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum arquivo aprovado disponível.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {arquivos.map((a: any) => (
                    <Card key={a.id} className="border">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{a.nome_arquivo}</p>
                          <Badge variant="default">Aprovado</Badge>
                        </div>
                        {a.tipo_produto && (
                          <p className="text-xs text-muted-foreground">Tipo: {a.tipo_produto}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Enviado em {format(new Date(a.created_at), "dd/MM/yyyy")}
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={a.arquivo_url} target="_blank" rel="noreferrer">
                              <FileText className="h-4 w-4 mr-1" /> Baixar
                            </a>
                          </Button>
                          <Button variant="default" size="sm" asChild>
                            <Link to={`/loja/${tenantId}`}>
                              <RefreshCw className="h-4 w-4 mr-1" /> Reimprimir
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
