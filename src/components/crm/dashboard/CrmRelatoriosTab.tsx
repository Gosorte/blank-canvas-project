import { useState } from 'react';
import { useRelatoriosCRM, FaturamentoSetor, ConversaoOrcamento, ProdutividadeMembro } from '@/hooks/use-crm-relatorios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, DollarSign, TrendingUp, Users, MessageSquare, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const mesesNome: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
};

interface Props {
  tenantId: string;
}

// Sub-components
const FaturamentoContent = ({ dados }: { dados: FaturamentoSetor[] }) => {
  const maxTotal = Math.max(...dados.map(d => d.total), 1);
  return (
    <div className="space-y-4">
      {dados.length === 0 && <p className="text-center text-muted-foreground py-12">Nenhum orçamento aprovado no período</p>}
      {dados.map((d, i) => (
        <div key={i} className="p-4 rounded-xl border bg-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.cor }} />
              <span className="font-semibold text-sm">{d.setor}</span>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm">{fmt(d.total)}</p>
              <p className="text-[10px] text-muted-foreground">{d.qtdOrcamentos} orçamento{d.qtdOrcamentos !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(d.total / maxTotal) * 100}%`, backgroundColor: d.cor }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const ConversaoContent = ({ dados }: { dados: ConversaoOrcamento[] }) => {
  if (dados.length === 0) return <p className="text-center text-muted-foreground py-12">Nenhum orçamento encontrado no período</p>;

  const totalGeral = dados.reduce((s, d) => s + d.total, 0);
  const aprovadosGeral = dados.reduce((s, d) => s + d.aprovados, 0);
  const taxaGeral = totalGeral > 0 ? +((aprovadosGeral / totalGeral) * 100).toFixed(1) : 0;
  const valorAprovadoGeral = dados.reduce((s, d) => s + d.valorAprovado, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-muted text-center">
          <p className="text-2xl font-bold">{totalGeral}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Total orçamentos</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/10 text-center">
          <p className="text-2xl font-bold text-emerald-600">{aprovadosGeral}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Aprovados</p>
        </div>
        <div className="p-3 rounded-xl bg-primary/10 text-center">
          <p className="text-2xl font-bold text-primary">{taxaGeral}%</p>
          <p className="text-[10px] text-muted-foreground font-medium">Taxa conversão</p>
        </div>
        <div className="p-3 rounded-xl bg-muted text-center">
          <p className="text-lg font-bold">{fmt(valorAprovadoGeral)}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Valor aprovado</p>
        </div>
      </div>

      <div className="space-y-3">
        {dados.map((d, i) => {
          const [ano, mes] = d.mes.split('-');
          const label = `${mesesNome[mes]} ${ano}`;
          return (
            <div key={i} className="p-4 rounded-xl border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{label}</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">{d.total} orç.</span>
                  <span className="text-emerald-600 font-medium">{d.aprovados} aprov.</span>
                  <span className={cn('font-bold', d.taxa >= 50 ? 'text-emerald-600' : d.taxa >= 25 ? 'text-orange-500' : 'text-destructive')}>
                    {d.taxa}%
                  </span>
                </div>
              </div>
              <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${d.taxa}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">{fmt(d.valorAprovado)} aprovado</span>
                <span className="text-[10px] text-muted-foreground">{fmt(d.valorTotal)} total</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProdutividadeContent = ({ dados }: { dados: ProdutividadeMembro[] }) => {
  const maxConversas = Math.max(...dados.map(d => d.conversasAtendidas), 1);
  const maxOrcamentos = Math.max(...dados.map(d => d.orcamentosCriados), 1);

  if (dados.length === 0) return <p className="text-center text-muted-foreground py-12">Nenhum dado de produtividade encontrado</p>;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Membro</TableHead>
            <TableHead><div className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Conversas</div></TableHead>
            <TableHead><div className="flex items-center gap-1"><Calculator className="w-3.5 h-3.5" /> Orçamentos</div></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dados.map((m) => (
            <TableRow key={m.userId}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary">{m.nome.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="font-medium text-sm">{m.nome}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <span className="text-sm font-bold">{m.conversasAtendidas}</span>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden max-w-[120px]">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(m.conversasAtendidas / maxConversas) * 100}%` }} />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <span className="text-sm font-bold">{m.orcamentosCriados}</span>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden max-w-[120px]">
                    <div className="h-full rounded-full bg-secondary-foreground/40 transition-all duration-500" style={{ width: `${(m.orcamentosCriados / maxOrcamentos) * 100}%` }} />
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default function CrmRelatoriosTab({ tenantId }: Props) {
  const [periodo, setPeriodo] = useState(30);
  const { faturamentoPorSetor, conversaoOrcamentos, produtividadeEquipe, totais, loading } = useRelatoriosCRM(tenantId, periodo);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex justify-end">
        <Select value={String(periodo)} onValueChange={v => setPeriodo(Number(v))}>
          <SelectTrigger className="w-[140px]">
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

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-primary/10 flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-primary" />
          <div>
            <p className="text-lg font-bold">{fmt(totais.faturamentoTotal)}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Faturamento</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-muted flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-foreground" />
          <div>
            <p className="text-lg font-bold">{totais.totalOrcamentos}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Orçamentos</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-muted flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-foreground" />
          <div>
            <p className="text-lg font-bold">{fmt(totais.ticketMedio)}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Ticket médio</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-muted flex items-center gap-3">
          <Users className="w-5 h-5 text-foreground" />
          <div>
            <p className="text-lg font-bold">{totais.totalConversas}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Conversas</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <Tabs defaultValue="faturamento">
          <TabsList>
            <TabsTrigger value="faturamento" className="gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Faturamento</TabsTrigger>
            <TabsTrigger value="conversao" className="gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Conversão</TabsTrigger>
            <TabsTrigger value="produtividade" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Produtividade</TabsTrigger>
          </TabsList>
          <TabsContent value="faturamento"><FaturamentoContent dados={faturamentoPorSetor} /></TabsContent>
          <TabsContent value="conversao"><ConversaoContent dados={conversaoOrcamentos} /></TabsContent>
          <TabsContent value="produtividade"><ProdutividadeContent dados={produtividadeEquipe} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}
