import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { MessageSquare, Clock, CheckCircle, TrendingUp, Star } from 'lucide-react';
import { format, subDays, startOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CrmStatCard } from './CrmDashboardStats';
import { CustomTooltipContent, CHART_COLORS } from './CrmCustomTooltip';

interface Conversa {
  status: string;
  created_at: string;
  setor_id: string | null;
}

interface SetorRow {
  id: string;
  nome: string;
  cor: string;
}

interface Props {
  tenantId: string;
}

export default function CrmDashboardTab({ tenantId }: Props) {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [setores, setSetores] = useState<SetorRow[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<{ nota: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [cRes, sRes, aRes] = await Promise.all([
        supabase.from('crm_conversas').select('status, created_at, setor_id').eq('tenant_id', tenantId),
        supabase.from('crm_setores').select('id, nome, cor').eq('tenant_id', tenantId).eq('ativo', true),
        supabase.from('crm_avaliacoes' as any).select('nota').eq('tenant_id', tenantId),
      ]);
      setConversas((cRes.data as any) || []);
      setSetores((sRes.data as any) || []);
      setAvaliacoes((aRes.data as any) || []);
      setLoading(false);
    };
    fetchData();
  }, [tenantId]);

  const stats = useMemo(() => {
    const total = conversas.length;
    const aguardando = conversas.filter(c => c.status === 'aguardando').length;
    const emAtendimento = conversas.filter(c => c.status === 'em_atendimento').length;
    const finalizadas = conversas.filter(c => c.status === 'finalizado').length;
    const notaMedia = avaliacoes.length > 0
      ? (avaliacoes.reduce((sum, a) => sum + a.nota, 0) / avaliacoes.length).toFixed(1)
      : '–';
    const totalAvaliacoes = avaliacoes.length;
    return { total, aguardando, emAtendimento, finalizadas, notaMedia, totalAvaliacoes };
  }, [conversas, avaliacoes]);

  const dailyData = useMemo(() => {
    const days = 14;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayConversas = conversas.filter(c => format(parseISO(c.created_at), 'yyyy-MM-dd') === dateStr);
      result.push({
        date: format(date, 'dd MMM', { locale: ptBR }),
        total: dayConversas.length,
        aguardando: dayConversas.filter(c => c.status === 'aguardando').length,
        em_atendimento: dayConversas.filter(c => c.status === 'em_atendimento').length,
        finalizado: dayConversas.filter(c => c.status === 'finalizado').length,
      });
    }
    return result;
  }, [conversas]);

  const statusData = useMemo(() => {
    if (stats.total === 0) return [];
    return [
      { name: 'Aguardando', value: stats.aguardando, color: CHART_COLORS.amber },
      { name: 'Em atendimento', value: stats.emAtendimento, color: CHART_COLORS.blue },
      { name: 'Finalizadas', value: stats.finalizadas, color: CHART_COLORS.emerald },
    ].filter(d => d.value > 0);
  }, [stats]);

  const setorData = useMemo(() => {
    const setorMap: Record<string, { nome: string; count: number; cor: string }> = {};
    setores.forEach(s => { setorMap[s.id] = { nome: s.nome, count: 0, cor: s.cor || CHART_COLORS.primary }; });
    conversas.forEach(c => {
      if (c.setor_id && setorMap[c.setor_id]) setorMap[c.setor_id].count++;
    });
    return Object.values(setorMap).filter(s => s.count > 0).sort((a, b) => b.count - a.count);
  }, [conversas, setores]);

  const statCards = [
    { title: 'Total', value: stats.total, icon: MessageSquare, gradient: 'from-primary/20 to-primary/5', iconBg: 'bg-primary/15 text-primary', border: 'border-primary/20' },
    { title: 'Aguardando', value: stats.aguardando, icon: Clock, gradient: 'from-amber-500/20 to-amber-500/5', iconBg: 'bg-amber-500/15 text-amber-500', border: 'border-amber-500/20' },
    { title: 'Em atendimento', value: stats.emAtendimento, icon: TrendingUp, gradient: 'from-blue-500/20 to-blue-500/5', iconBg: 'bg-blue-500/15 text-blue-500', border: 'border-blue-500/20' },
    { title: 'Finalizadas', value: stats.finalizadas, icon: CheckCircle, gradient: 'from-emerald-500/20 to-emerald-500/5', iconBg: 'bg-emerald-500/15 text-emerald-500', border: 'border-emerald-500/20' },
    { title: 'Nota Média', value: `${stats.notaMedia}${stats.totalAvaliacoes > 0 ? ` (${stats.totalAvaliacoes})` : ''}`, icon: Star, gradient: 'from-yellow-500/20 to-yellow-500/5', iconBg: 'bg-yellow-500/15 text-yellow-500', border: 'border-yellow-500/20' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {statCards.map((stat) => (
          <CrmStatCard key={stat.title} {...stat} loading={loading} />
        ))}
      </div>

      {/* Area + Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border/40 bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Conversas — Últimos 14 dias
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {conversas.length === 0 && !loading ? (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                Nenhuma conversa registrada
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dailyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip content={<CustomTooltipContent />} />
                  <Area type="monotone" dataKey="total" name="Total" stroke={CHART_COLORS.primary} fill="url(#gradTotal)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: CHART_COLORS.primary }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Por status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {statusData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltipContent />} />
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={8}
                    formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/40 bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Status diário
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {conversas.length === 0 && !loading ? (
              <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">Nenhuma conversa registrada</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip content={<CustomTooltipContent />} />
                  <Bar dataKey="aguardando" name="Aguardando" fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="em_atendimento" name="Em atendimento" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="finalizado" name="Finalizadas" fill={CHART_COLORS.emerald} radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Conversas por setor
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {setorData.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={setorData} layout="vertical" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="nome" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={100} />
                  <RechartsTooltip content={<CustomTooltipContent />} />
                  <Bar dataKey="count" name="Conversas" fill={CHART_COLORS.primary} radius={[0, 6, 6, 0]} barSize={18}>
                    {setorData.map((entry, i) => <Cell key={i} fill={entry.cor} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
