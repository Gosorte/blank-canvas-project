import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, LineChart, Line, Cell
} from 'recharts';
import { BarChart3, Users, Star, FileText, Calendar, Loader2 } from 'lucide-react';
import { format, subDays, startOfDay, parseISO, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CustomTooltipContent, CHART_COLORS } from './CrmCustomTooltip';
import { CrmStatCard } from './CrmDashboardStats';

const colorPalette = [CHART_COLORS.primary, CHART_COLORS.blue, CHART_COLORS.violet, CHART_COLORS.orange, CHART_COLORS.emerald, CHART_COLORS.rose];

interface ConversaMetric {
  id: string;
  status: string;
  created_at: string;
  atendente_id: string | null;
  nome_contato: string | null;
}

interface Profile {
  id: string;
  nome: string;
}

interface Props {
  tenantId: string;
}

export default function CrmDesempenhoTab({ tenantId }: Props) {
  const [conversas, setConversas] = useState<ConversaMetric[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodoFiltro, setPeriodoFiltro] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedAtendente, setSelectedAtendente] = useState<string>('todos');

  useEffect(() => {
    const fetchData = async () => {
      const [conversasRes, profilesRes] = await Promise.all([
        supabase.from('crm_conversas').select('id, status, created_at, atendente_id, nome_contato').eq('tenant_id', tenantId),
        supabase.from('profiles').select('id, nome'),
      ]);
      setConversas((conversasRes.data as any) || []);
      setProfiles((profilesRes.data as any) || []);
      setLoading(false);
    };
    fetchData();
  }, [tenantId]);

  const diasFiltro = periodoFiltro === '7d' ? 7 : periodoFiltro === '30d' ? 30 : 90;
  const dataInicio = startOfDay(subDays(new Date(), diasFiltro));

  const conversasFiltradas = useMemo(() => {
    let filtered = conversas.filter(c => parseISO(c.created_at) >= dataInicio);
    if (selectedAtendente !== 'todos') {
      filtered = filtered.filter(c => c.atendente_id === selectedAtendente);
    }
    return filtered;
  }, [conversas, dataInicio, selectedAtendente]);

  const atendentes = useMemo(() => {
    const ids = [...new Set(conversas.filter(c => c.atendente_id).map(c => c.atendente_id!))];
    return ids.map(id => {
      const profile = profiles.find(p => p.id === id);
      return { id, nome: profile?.nome || 'Desconhecido' };
    });
  }, [conversas, profiles]);

  const atendenteMetrics = useMemo(() => {
    return atendentes.map(at => {
      const atConversas = conversasFiltradas.filter(c => c.atendente_id === at.id);
      const finalizadas = atConversas.filter(c => c.status === 'finalizado').length;
      return {
        id: at.id,
        nome: at.nome,
        total: atConversas.length,
        finalizadas,
        emAtendimento: atConversas.filter(c => c.status === 'em_atendimento').length,
      };
    }).sort((a, b) => b.total - a.total);
  }, [atendentes, conversasFiltradas]);

  const dailyByAtendente = useMemo(() => {
    const days = eachDayOfInterval({ start: dataInicio, end: new Date() });
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayLabel = format(day, 'dd/MM', { locale: ptBR });
      const entry: any = { date: dayLabel };
      atendentes.forEach(at => {
        entry[at.nome] = conversasFiltradas.filter(c =>
          c.atendente_id === at.id && format(parseISO(c.created_at), 'yyyy-MM-dd') === dateStr
        ).length;
      });
      return entry;
    });
  }, [conversasFiltradas, atendentes, dataInicio]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Métricas de desempenho por atendente
        </h2>
        <div className="flex items-center gap-2">
          <Select value={periodoFiltro} onValueChange={(v: any) => setPeriodoFiltro(v)}>
            <SelectTrigger className="w-[130px] h-9">
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedAtendente} onValueChange={setSelectedAtendente}>
            <SelectTrigger className="w-[160px] h-9">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {atendentes.map(at => (
                <SelectItem key={at.id} value={at.id}>{at.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <CrmStatCard title="Atendimentos" value={conversasFiltradas.length} icon={FileText}
          gradient="from-primary/20 to-primary/5" iconBg="bg-primary/15 text-primary" border="border-primary/20" />
        <CrmStatCard title="Atendentes" value={atendentes.length} icon={Users}
          gradient="from-blue-500/20 to-blue-500/5" iconBg="bg-blue-500/15 text-blue-500" border="border-blue-500/20" />
        <CrmStatCard title="Finalizados" value={conversasFiltradas.filter(c => c.status === 'finalizado').length} icon={Star}
          gradient="from-emerald-500/20 to-emerald-500/5" iconBg="bg-emerald-500/15 text-emerald-500" border="border-emerald-500/20" />
      </div>

      {/* Line Chart - Daily volume by agent */}
      <Card className="border-border/40 bg-gradient-to-br from-card to-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Volume diário por atendente
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {atendentes.length === 0 ? (
            <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">Sem dados de atendentes</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dailyByAtendente} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip content={<CustomTooltipContent />} />
                {atendentes.map((at, i) => (
                  <Line key={at.id} type="monotone" dataKey={at.nome} stroke={colorPalette[i % colorPalette.length]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Agent Cards - Ranking */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Ranking de atendentes</h2>
        {atendenteMetrics.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum atendente com conversas no período</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {atendenteMetrics.map((at, i) => (
              <Card key={at.id} className="border-border/40">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">{at.nome.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{at.nome}</p>
                      <p className="text-[10px] text-muted-foreground">#{i + 1} no ranking</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-sm font-bold">{at.total}</p>
                      <p className="text-[9px] text-muted-foreground">Total</p>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <p className="text-sm font-bold text-blue-500">{at.emAtendimento}</p>
                      <p className="text-[9px] text-muted-foreground">Ativas</p>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <p className="text-sm font-bold text-emerald-500">{at.finalizadas}</p>
                      <p className="text-[9px] text-muted-foreground">Finaliz.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
