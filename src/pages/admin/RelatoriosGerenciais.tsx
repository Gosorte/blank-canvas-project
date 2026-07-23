import { useState } from "react";
import { Loader2, DollarSign, TrendingUp, Factory, Package, BarChart3, Users, ShoppingCart, Trophy } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useTenant } from "@/hooks/use-tenant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  useRelatorioFaturamento,
  useRelatorioVendas,
  useRelatorioProducao,
  useRelatorioEstoque,
} from "@/hooks/use-relatorios-gerenciais";
import { cn } from "@/lib/utils";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const COLORS = [
  "hsl(217, 91%, 60%)", "hsl(142, 65%, 40%)", "hsl(38, 92%, 50%)",
  "hsl(262, 83%, 58%)", "hsl(0, 72%, 50%)", "hsl(195, 85%, 42%)",
];

const SETOR_LABELS: Record<string, string> = {
  digital: "Digital", offset: "Offset", visual: "Comunicação Visual",
};

const STATUS_LABELS: Record<string, string> = {
  aguardando: "Aguardando", em_producao: "Em Produção", acabamento: "Acabamento",
  concluida: "Concluída", cancelada: "Cancelada", entregue: "Entregue",
};

function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <div className={cn("p-4 rounded-xl border flex items-center gap-3", accent ? "bg-primary/10 border-primary/20" : "bg-card")}>
      <div className={cn("p-2.5 rounded-lg", accent ? "bg-primary/20" : "bg-muted")}>
        <Icon className={cn("w-5 h-5", accent ? "text-primary" : "text-foreground")} />
      </div>
      <div>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

// =================== FATURAMENTO ===================
function TabFaturamento({ tenantId, dias }: { tenantId: string; dias: number }) {
  const { data, isLoading } = useRelatorioFaturamento(tenantId, dias);
  if (isLoading) return <Loading />;
  if (!data) return <Empty />;
  const d = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Faturamento Total" value={fmt(d.totalFaturado)} accent />
        <StatCard icon={ShoppingCart} label="Total de Vendas" value={String(d.totalPedidos)} />
        <StatCard icon={TrendingUp} label="Ticket Médio" value={fmt(d.ticketMedio)} />
        <StatCard icon={BarChart3} label="Orçamentos" value={String(d.totalOrcamentos)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-semibold text-foreground mb-4">Faturamento por Mês</h3>
          {d.porMes.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={d.porMes}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [fmt(v), "Faturamento"]} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="valor" fill="hsl(217, 91%, 60%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </div>

        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-semibold text-foreground mb-4">Faturamento por Origem</h3>
          {d.porOrigem.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={d.porOrigem.map((o, i) => ({ ...o, name: o.origem, value: o.valor, color: COLORS[i % COLORS.length] }))}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {d.porOrigem.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {d.porOrigem.map((o, i) => (
                  <div key={o.origem} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{o.origem} ({o.qtd})</span>
                  </div>
                ))}
              </div>
            </>
          ) : <Empty />}
        </div>
      </div>
    </div>
  );
}

// =================== VENDAS & CONVERSÃO ===================
function TabVendas({ tenantId, dias }: { tenantId: string; dias: number }) {
  const { data, isLoading } = useRelatorioVendas(tenantId, dias);
  if (isLoading) return <Loading />;
  if (!data) return <Empty />;
  const d = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={BarChart3} label="Total Orçamentos" value={String(d.totalOrcamentos)} />
        <StatCard icon={TrendingUp} label="Aprovados" value={String(d.orcamentosAprovados)} accent />
        <StatCard icon={TrendingUp} label="Taxa Conversão" value={`${d.taxaConversao}%`} />
        <StatCard icon={DollarSign} label="Ticket Médio" value={fmt(d.ticketMedio)} />
      </div>

      {d.conversaoPorMes.length > 0 && (
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-semibold text-foreground mb-4">Conversão por Mês</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={d.conversaoPorMes}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total" name="Total" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.4} />
              <Bar dataKey="aprovados" name="Aprovados" fill="hsl(142, 65%, 40%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Trophy className="w-4 h-4" /> Top Clientes</h3>
          {d.rankingClientes.length > 0 ? (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {d.rankingClientes.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm">{c.nome}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(c.total)}</TableCell>
                    <TableCell className="text-right text-sm">{c.qtd}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado</p>}
        </div>

        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> Top Vendedores</h3>
          {d.rankingVendedores.length > 0 ? (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {d.rankingVendedores.map((v, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm">{v.nome}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(v.total)}</TableCell>
                    <TableCell className="text-right text-sm">{v.qtd}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado</p>}
        </div>
      </div>
    </div>
  );
}

// =================== PRODUÇÃO ===================
function TabProducao({ tenantId, dias }: { tenantId: string; dias: number }) {
  const { data, isLoading } = useRelatorioProducao(tenantId, dias);
  if (isLoading) return <Loading />;
  if (!data) return <Empty />;
  const d = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Factory} label="Total OPs" value={String(d.totalOPs)} accent />
        <StatCard icon={TrendingUp} label="Concluídas" value={String(d.opsConcluidas)} />
        <StatCard icon={BarChart3} label="Em Andamento" value={String(d.opsEmAndamento)} />
        <StatCard icon={Package} label="Aguardando" value={String(d.opsAguardando)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-semibold text-foreground mb-4">OPs por Mês</h3>
          {d.porMes.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={d.porMes}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="qtd" name="OPs" stroke="hsl(262, 83%, 58%)" strokeWidth={2.5} dot={{ fill: "hsl(262, 83%, 58%)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </div>

        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-semibold text-foreground mb-4">Distribuição por Status</h3>
          {d.porStatus.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={d.porStatus.map((s, i) => ({ ...s, name: STATUS_LABELS[s.status] || s.status, value: s.qtd }))}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {d.porStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {d.porStatus.map((s, i) => (
                  <div key={s.status} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{STATUS_LABELS[s.status] || s.status} ({s.qtd})</span>
                  </div>
                ))}
              </div>
            </>
          ) : <Empty />}
        </div>
      </div>

      {d.porSetor.length > 0 && (
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-semibold text-foreground mb-4">OPs por Setor</h3>
          <div className="space-y-3">
            {d.porSetor.map((s, i) => {
              const max = Math.max(...d.porSetor.map(x => x.total), 1);
              const taxa = s.total > 0 ? ((s.concluidas / s.total) * 100).toFixed(0) : "0";
              return (
                <div key={s.setor} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm">{SETOR_LABELS[s.setor] || s.setor}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">{s.total} OPs</span>
                      <span className="text-emerald-600 font-medium">{s.concluidas} concl.</span>
                      <span className="font-bold">{taxa}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(s.total / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// =================== ESTOQUE & CONSUMO ===================
function TabEstoque({ tenantId, dias }: { tenantId: string; dias: number }) {
  const { data, isLoading } = useRelatorioEstoque(tenantId, dias);
  if (isLoading) return <Loading />;
  if (!data) return <Empty />;
  const d = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Package} label="Total Itens" value={String(d.totalItens)} accent />
        <StatCard icon={DollarSign} label="Valor em Estoque" value={fmt(d.valorTotal)} />
        <StatCard icon={TrendingUp} label="Movimentações" value={String(d.totalMovimentacoes)} />
        <StatCard icon={Package} label="Em Alerta" value={String(d.itensAlerta)} sub={d.itensAlerta > 0 ? "Abaixo do mínimo" : ""} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-semibold text-foreground mb-4">Movimentações por Mês</h3>
          {d.movimentacoesPorMes.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={d.movimentacoesPorMes}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="entradas" name="Entradas" stroke="hsl(142, 65%, 40%)" fill="hsl(142, 65%, 40%)" fillOpacity={0.2} />
                <Area type="monotone" dataKey="saidas" name="Saídas" stroke="hsl(0, 72%, 50%)" fill="hsl(0, 72%, 50%)" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </div>

        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-semibold text-foreground mb-4">Custo por Categoria</h3>
          {d.custoPorCategoria.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={d.custoPorCategoria.map((c, i) => ({ ...c, name: c.categoria, value: c.custo }))}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {d.custoPorCategoria.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {d.custoPorCategoria.map((c, i) => (
                  <div key={c.categoria} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{c.categoria} ({c.itens})</span>
                  </div>
                ))}
              </div>
            </>
          ) : <Empty />}
        </div>
      </div>

      {d.maisConsumidos.length > 0 && (
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-semibold text-foreground mb-4">Itens Mais Consumidos</h3>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Consumo</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {d.maisConsumidos.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-sm">{item.nome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.categoria}</TableCell>
                  <TableCell className="text-right text-sm font-bold">{item.quantidade} {item.unidade}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// =================== UTILITIES ===================
function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );
}

function Empty() {
  return <p className="text-center text-muted-foreground py-12">Nenhum dado encontrado para o período selecionado</p>;
}

// =================== MAIN ===================
export default function RelatoriosGerenciais() {
  const { activeTenantId } = useTenant();
  const [dias, setDias] = useState(90);

  return (
    <div>
      <AdminHeader title="Relatórios Gerenciais" subtitle="Análises consolidadas CRM + ERP + E-commerce" />
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <Select value={String(dias)} onValueChange={v => setDias(Number(v))}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="180">Últimos 6 meses</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="faturamento">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="faturamento" className="gap-1.5 text-xs sm:text-sm">
              <DollarSign className="w-3.5 h-3.5 hidden sm:block" /> Faturamento
            </TabsTrigger>
            <TabsTrigger value="vendas" className="gap-1.5 text-xs sm:text-sm">
              <TrendingUp className="w-3.5 h-3.5 hidden sm:block" /> Vendas
            </TabsTrigger>
            <TabsTrigger value="producao" className="gap-1.5 text-xs sm:text-sm">
              <Factory className="w-3.5 h-3.5 hidden sm:block" /> Produção
            </TabsTrigger>
            <TabsTrigger value="estoque" className="gap-1.5 text-xs sm:text-sm">
              <Package className="w-3.5 h-3.5 hidden sm:block" /> Estoque
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faturamento">
            {activeTenantId && <TabFaturamento tenantId={activeTenantId} dias={dias} />}
          </TabsContent>
          <TabsContent value="vendas">
            {activeTenantId && <TabVendas tenantId={activeTenantId} dias={dias} />}
          </TabsContent>
          <TabsContent value="producao">
            {activeTenantId && <TabProducao tenantId={activeTenantId} dias={dias} />}
          </TabsContent>
          <TabsContent value="estoque">
            {activeTenantId && <TabEstoque tenantId={activeTenantId} dias={dias} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
