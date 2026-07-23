import { useState, useMemo, useEffect, useRef } from "react";
import {
  Kanban, Search, GripVertical, TrendingUp, Clock, AlertTriangle,
  CheckCircle2, Timer, Zap, CalendarClock, Filter, CalendarIcon, X, Settings2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTenant } from "@/hooks/use-tenant";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, differenceInDays, isBefore, isToday, addDays, isAfter, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { XAxis, YAxis, CartesianGrid, Area, AreaChart } from "recharts";

const categories = [
  { value: "all", label: "Todas Categorias" },
  { value: "digital", label: "Digital" },
  { value: "offset", label: "Offset" },
  { value: "comunicacao_visual", label: "Comunicação Visual" },
  { value: "produto_simples", label: "Produto Simples" },
];

const statusColumns = [
  { id: "aguardando", label: "Aguardando", color: "bg-yellow-100/60 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700", icon: Clock },
  { id: "balcao", label: "Balcão", color: "bg-blue-100/60 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700", icon: Timer },
  { id: "arte", label: "Arte", color: "bg-purple-100/60 border-purple-300 dark:bg-purple-900/20 dark:border-purple-700", icon: Zap },
  { id: "offset", label: "Offset", color: "bg-orange-100/60 border-orange-300 dark:bg-orange-900/20 dark:border-orange-700", icon: TrendingUp },
  { id: "digital", label: "Digital", color: "bg-cyan-100/60 border-cyan-300 dark:bg-cyan-900/20 dark:border-cyan-700", icon: Zap },
  { id: "com_visual", label: "Com. Visual", color: "bg-pink-100/60 border-pink-300 dark:bg-pink-900/20 dark:border-pink-700", icon: TrendingUp },
  { id: "pronto", label: "Pronto", color: "bg-green-100/60 border-green-300 dark:bg-green-900/20 dark:border-green-700", icon: CheckCircle2 },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

type DeliveryAlert = {
  orderId: string;
  orderNumber: number;
  clientName: string;
  deliveryDate: Date;
  status: string;
  severity: "overdue" | "today" | "soon";
};

export default function PCP() {
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [salespersonFilter, setSalespersonFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [alertDays, setAlertDays] = useState(() => {
    const saved = localStorage.getItem("pcp_alert_days");
    return saved ? parseInt(saved, 10) : 3;
  });
  const notifiedRef = useRef<Set<string>>(new Set());
  const { user } = useAuth();
  const { activeTenantId } = useTenant();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["pcp-orders", activeTenantId, searchTerm],
    queryFn: async () => {
      let query = supabase.from("erp_pedidos" as any).select("*")
        .eq("tenant_id", activeTenantId!)
        .not("status", "eq", "cancelado")
        .order("created_at", { ascending: false });
      if (searchTerm) query = query.ilike("cliente_nome", `%${searchTerm}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user && !!activeTenantId,
  });

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o: any) => {
      if (categoryFilter !== "all" && o.categoria !== categoryFilter) return false;
      if (salespersonFilter !== "all" && (o.vendedor || "") !== salespersonFilter) return false;
      if (dateFrom && isBefore(new Date(o.created_at), startOfDay(dateFrom))) return false;
      if (dateTo && isAfter(new Date(o.created_at), endOfDay(dateTo))) return false;
      return true;
    });
  }, [orders, categoryFilter, salespersonFilter, dateFrom, dateTo]);

  const salespersons = useMemo(() => {
    if (!orders) return [];
    const set = new Set<string>();
    orders.forEach((o: any) => { if (o.vendedor?.trim()) set.add(o.vendedor.trim()); });
    return Array.from(set).sort();
  }, [orders]);

  const activeFilterCount = [categoryFilter !== "all", salespersonFilter !== "all", !!dateFrom, !!dateTo].filter(Boolean).length;
  const clearFilters = () => { setCategoryFilter("all"); setSalespersonFilter("all"); setDateFrom(undefined); setDateTo(undefined); };

  const metrics = useMemo(() => {
    if (!filteredOrders?.length) return { total: 0, completed: 0, inProgress: 0, completionRate: 0, avgDaysInProd: 0, onTimeRate: 0 };
    const total = filteredOrders.length;
    const completed = filteredOrders.filter((o: any) => o.status === "pronto").length;
    const inProgress = total - completed;
    const completionRate = Math.round((completed / total) * 100);
    let totalDays = 0;
    filteredOrders.forEach((o: any) => { totalDays += differenceInDays(new Date(), new Date(o.created_at)); });
    const avgDaysInProd = Math.round((totalDays / total) * 10) / 10;
    const withDelivery = filteredOrders.filter((o: any) => o.data_entrega);
    const onTime = withDelivery.filter((o: any) => o.status === "pronto" || !isBefore(new Date(o.data_entrega), new Date()));
    const onTimeRate = withDelivery.length > 0 ? Math.round((onTime.length / withDelivery.length) * 100) : 100;
    return { total, completed, inProgress, completionRate, avgDaysInProd, onTimeRate };
  }, [filteredOrders]);

  const alerts = useMemo<DeliveryAlert[]>(() => {
    if (!filteredOrders) return [];
    const now = new Date();
    const soon = addDays(now, alertDays);
    const result: DeliveryAlert[] = [];
    filteredOrders.forEach((o: any) => {
      if (!o.data_entrega || o.status === "pronto") return;
      const dd = new Date(o.data_entrega);
      if (isBefore(dd, now) && !isToday(dd)) result.push({ orderId: o.id, orderNumber: o.numero, clientName: o.cliente_nome, deliveryDate: dd, status: o.status, severity: "overdue" });
      else if (isToday(dd)) result.push({ orderId: o.id, orderNumber: o.numero, clientName: o.cliente_nome, deliveryDate: dd, status: o.status, severity: "today" });
      else if (isBefore(dd, soon)) result.push({ orderId: o.id, orderNumber: o.numero, clientName: o.cliente_nome, deliveryDate: dd, status: o.status, severity: "soon" });
    });
    return result.sort((a, b) => a.deliveryDate.getTime() - b.deliveryDate.getTime());
  }, [filteredOrders, alertDays]);

  useEffect(() => {
    if (!alerts.length) return;
    alerts.forEach((alert) => {
      if (notifiedRef.current.has(alert.orderId)) return;
      notifiedRef.current.add(alert.orderId);
      const daysText = alert.severity === "overdue"
        ? `atrasado ${Math.abs(differenceInDays(new Date(), alert.deliveryDate))} dias`
        : alert.severity === "today" ? "vence HOJE"
        : `vence em ${differenceInDays(alert.deliveryDate, new Date())} dias`;
      if (alert.severity === "overdue") toast.error(`⚠️ Pedido #${alert.orderNumber} — ${alert.clientName} está ${daysText}!`, { duration: 8000 });
      else if (alert.severity === "today") toast.warning(`🔔 Pedido #${alert.orderNumber} — ${alert.clientName} ${daysText}!`, { duration: 6000 });
      else toast.info(`📋 Pedido #${alert.orderNumber} — ${alert.clientName} ${daysText}`, { duration: 5000 });
    });
  }, [alerts]);

  const overdueCount = alerts.filter(a => a.severity === "overdue").length;
  const todayCount = alerts.filter(a => a.severity === "today").length;

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const { error } = await supabase.from("erp_pedidos" as any).update({ status: newStatus } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ["pcp-orders"] });
      queryClient.invalidateQueries({ queryKey: ["erp-pedidos"] });
      toast.success(`Pedido movido para ${newStatus}`);
    },
    onError: (err: any) => toast.error("Erro ao mover pedido: " + err.message),
  });

  const getOrdersByStatus = (status: string) => filteredOrders?.filter((o: any) => o.status === status) || [];
  const handleDragStart = (e: React.DragEvent, orderId: string) => { setDraggedOrderId(orderId); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (!draggedOrderId) return;
    const order = filteredOrders?.find((o: any) => o.id === draggedOrderId);
    if (order && (order as any).status !== targetStatus) updateStatusMutation.mutate({ id: draggedOrderId, newStatus: targetStatus });
    setDraggedOrderId(null);
  };
  const handleDragEnd = () => setDraggedOrderId(null);

  const getDeliveryAlertForOrder = (order: any) => {
    if (!order.data_entrega || order.status === "pronto") return null;
    const dd = new Date(order.data_entrega);
    const now = new Date();
    if (isBefore(dd, now) && !isToday(dd)) return "overdue";
    if (isToday(dd)) return "today";
    if (isBefore(dd, addDays(now, alertDays))) return "soon";
    return null;
  };

  const statusDistribution = useMemo(() => {
    if (!filteredOrders) return [];
    return statusColumns.map(col => ({
      ...col,
      count: filteredOrders.filter((o: any) => o.status === col.id).length,
      percentage: filteredOrders.length > 0 ? Math.round((filteredOrders.filter((o: any) => o.status === col.id).length / filteredOrders.length) * 100) : 0,
    }));
  }, [filteredOrders]);

  const efficiencyTimeline = useMemo(() => {
    if (!filteredOrders?.length) return [];
    const dayMap = new Map<string, { total: number; completed: number; onTime: number; withDelivery: number }>();
    filteredOrders.forEach((o: any) => {
      const day = format(new Date(o.created_at), "yyyy-MM-dd");
      if (!dayMap.has(day)) dayMap.set(day, { total: 0, completed: 0, onTime: 0, withDelivery: 0 });
      const d = dayMap.get(day)!;
      d.total++;
      if (o.status === "pronto") d.completed++;
      if (o.data_entrega) { d.withDelivery++; if (o.status === "pronto" || !isBefore(new Date(o.data_entrega), new Date())) d.onTime++; }
    });
    const sorted = Array.from(dayMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    let cumTotal = 0, cumCompleted = 0, cumOnTime = 0, cumWithDelivery = 0;
    return sorted.map(([day, d]) => {
      cumTotal += d.total; cumCompleted += d.completed; cumOnTime += d.onTime; cumWithDelivery += d.withDelivery;
      return {
        date: format(new Date(day), "dd/MM", { locale: ptBR }),
        completionRate: cumTotal > 0 ? Math.round((cumCompleted / cumTotal) * 100) : 0,
        onTimeRate: cumWithDelivery > 0 ? Math.round((cumOnTime / cumWithDelivery) * 100) : 100,
        orders: d.total,
      };
    });
  }, [filteredOrders]);

  const chartConfig = {
    completionRate: { label: "Taxa de Conclusão (%)", color: "hsl(var(--chart-2))" },
    onTimeRate: { label: "Pontualidade (%)", color: "hsl(var(--primary))" },
  };

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-sm bg-primary/10 flex items-center justify-center">
                <Kanban className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Controle de Produção</h1>
                <p className="text-sm text-muted-foreground">{metrics.total} pedidos · {metrics.inProgress} em andamento</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground h-8">
                  <Settings2 className="h-3.5 w-3.5" /> Alertas: {alertDays}d
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm">Prazo de Alerta</h4>
                    <p className="text-xs text-muted-foreground mt-1">Notificar <strong>{alertDays}</strong> {alertDays === 1 ? "dia" : "dias"} antes do vencimento</p>
                  </div>
                  <Slider value={[alertDays]} onValueChange={([v]) => { setAlertDays(v); localStorage.setItem("pcp_alert_days", String(v)); notifiedRef.current.clear(); }} min={1} max={14} step={1} />
                  <div className="flex justify-between text-[10px] text-muted-foreground"><span>1d</span><span>7d</span><span>14d</span></div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { label: "Produção", value: metrics.total, sub: `${metrics.inProgress} ativos`, icon: Kanban, accent: "text-primary", bg: "bg-primary/5 border-primary/10" },
            { label: "Concluídos", value: `${metrics.completionRate}%`, sub: `${metrics.completed} pedidos`, icon: CheckCircle2, accent: "text-green-600", bg: "bg-green-500/5 border-green-500/10" },
            { label: "Tempo Médio", value: `${metrics.avgDaysInProd}d`, sub: "em produção", icon: Timer, accent: "text-amber-600", bg: "bg-amber-500/5 border-amber-500/10" },
            { label: "Pontualidade", value: `${metrics.onTimeRate}%`, sub: "no prazo", icon: TrendingUp, accent: metrics.onTimeRate >= 80 ? "text-green-600" : "text-red-600", bg: metrics.onTimeRate >= 80 ? "bg-green-500/5 border-green-500/10" : "bg-red-500/5 border-red-500/10" },
            { label: "Atrasados", value: overdueCount, sub: "vencidos", icon: AlertTriangle, accent: overdueCount > 0 ? "text-destructive" : "text-muted-foreground", bg: overdueCount > 0 ? "bg-destructive/5 border-destructive/10" : "bg-muted/50 border-border" },
            { label: "Hoje", value: todayCount, sub: "vencem hoje", icon: CalendarClock, accent: todayCount > 0 ? "text-yellow-600" : "text-muted-foreground", bg: todayCount > 0 ? "bg-yellow-500/5 border-yellow-500/10" : "bg-muted/50 border-border" },
          ].map((kpi, i) => (
            <div key={kpi.label} className={cn("rounded-sm border p-3 transition-all hover:shadow-sm", kpi.bg)} style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <kpi.icon className={cn("h-3.5 w-3.5", kpi.accent)} />
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
              </div>
              <p className={cn("text-xl font-bold tabular-nums", kpi.accent)}>{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {alerts.slice(0, 8).map(alert => (
              <div key={alert.orderId} className={cn("flex items-center gap-2 px-3 py-2 rounded-sm border text-xs shrink-0",
                alert.severity === "overdue" ? "bg-destructive/5 border-destructive/20 text-destructive" :
                alert.severity === "today" ? "bg-yellow-500/5 border-yellow-500/20 text-yellow-700" :
                "bg-blue-500/5 border-blue-500/20 text-blue-700"
              )}>
                {alert.severity === "overdue" ? <AlertTriangle className="h-3 w-3 shrink-0" /> : <Clock className="h-3 w-3 shrink-0" />}
                <span className="font-semibold">#{alert.orderNumber}</span>
                <span className="text-foreground/70 truncate max-w-[120px]">{alert.clientName}</span>
                <span className="font-medium">
                  {alert.severity === "overdue" ? `-${Math.abs(differenceInDays(new Date(), alert.deliveryDate))}d` :
                   alert.severity === "today" ? "hoje" : `${differenceInDays(alert.deliveryDate, new Date())}d`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Flow Bar + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-sm border border-border bg-card p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-3">Fluxo de Produção</p>
            <div className="flex h-2 rounded-sm overflow-hidden gap-px mb-3">
              {statusDistribution.map(s => s.count > 0 ? (
                <Tooltip key={s.id}>
                  <TooltipTrigger asChild>
                    <div className={cn(s.color.split(" ")[0], "transition-all hover:opacity-80")} style={{ width: `${s.percentage}%`, minWidth: "4px" }} />
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p className="text-xs font-medium">{s.label}: {s.count} ({s.percentage}%)</p></TooltipContent>
                </Tooltip>
              ) : null)}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
              {statusDistribution.map(s => (
                <span key={s.id} className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <span className={cn("inline-block h-1.5 w-1.5 rounded-sm", s.color.split(" ")[0])} />
                  {s.label} <span className="font-semibold text-foreground">{s.count}</span>
                </span>
              ))}
            </div>
          </div>

          {efficiencyTimeline.length > 1 ? (
            <div className="rounded-sm border border-border bg-card p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Evolução da Eficiência</p>
              <ChartContainer config={chartConfig} className="h-[120px] w-full">
                <AreaChart data={efficiencyTimeline} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCompletion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradOnTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="completionRate" stroke="hsl(var(--chart-2))" fill="url(#gradCompletion)" strokeWidth={1.5} dot={false} name="completionRate" />
                  <Area type="monotone" dataKey="onTimeRate" stroke="hsl(var(--primary))" fill="url(#gradOnTime)" strokeWidth={1.5} dot={false} name="onTimeRate" />
                </AreaChart>
              </ChartContainer>
            </div>
          ) : (
            <div className="rounded-sm border border-border bg-card p-4 flex items-center justify-center">
              <p className="text-xs text-muted-foreground">Dados insuficientes para o gráfico</p>
            </div>
          )}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Buscar cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 h-9 text-sm bg-card" />
            </div>
            <Button variant={showFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5 h-9">
              <Filter className="h-3.5 w-3.5" />
              {activeFilterCount > 0 ? <Badge variant="secondary" className="h-4 w-4 p-0 flex items-center justify-center rounded-sm text-[10px]">{activeFilterCount}</Badge> : <span className="text-xs">Filtros</span>}
            </Button>
            {activeFilterCount > 0 && <Button variant="ghost" size="icon" onClick={clearFilters} className="h-9 w-9 text-muted-foreground"><X className="h-3.5 w-3.5" /></Button>}
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-3 rounded-sm border border-border bg-card animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="space-y-1">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">De</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-8 text-xs", !dateFrom && "text-muted-foreground")} size="sm">
                      <CalendarIcon className="mr-1.5 h-3 w-3" />
                      {dateFrom ? format(dateFrom, "dd/MM/yy", { locale: ptBR }) : "Início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Até</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-8 text-xs", !dateTo && "text-muted-foreground")} size="sm">
                      <CalendarIcon className="mr-1.5 h-3 w-3" />
                      {dateTo ? format(dateTo, "dd/MM/yy", { locale: ptBR }) : "Fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Categoria</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Vendedor</label>
                <Select value={salespersonFilter} onValueChange={setSalespersonFilter}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Todos</SelectItem>
                    {salespersons.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Kanban Board */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-sm border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">Carregando produção...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-2">
            {statusColumns.map(column => {
              const items = getOrdersByStatus(column.id);
              const ColIcon = column.icon;
              return (
                <div key={column.id}
                  className={cn("rounded-sm border p-2.5 min-h-[280px] transition-all duration-200",
                    draggedOrderId ? "border-primary/30 bg-primary/[0.02]" : "border-border/60 bg-card/50"
                  )}
                  onDragOver={handleDragOver} onDrop={e => handleDrop(e, column.id)}>
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-border/40">
                    <div className="flex items-center gap-1.5">
                      <ColIcon className="h-3 w-3 text-muted-foreground/70" />
                      <h3 className="font-medium text-[10px] uppercase tracking-wider text-muted-foreground">{column.label}</h3>
                    </div>
                    <span className="text-[10px] font-bold text-foreground bg-muted/80 h-5 w-5 rounded flex items-center justify-center">{items.length}</span>
                  </div>
                  <div className="space-y-1.5">
                    {items.map((order: any) => {
                      const alertLevel = getDeliveryAlertForOrder(order);
                      return (
                        <div key={order.id} draggable onDragStart={e => handleDragStart(e, order.id)} onDragEnd={handleDragEnd}
                          className={cn(
                            "group rounded-sm border p-2.5 cursor-grab active:cursor-grabbing transition-all duration-150",
                            "bg-card hover:shadow-md hover:-translate-y-px border-l-[3px]", column.color,
                            draggedOrderId === order.id && "opacity-40 scale-95",
                            alertLevel === "overdue" && "ring-1 ring-destructive/30",
                            alertLevel === "today" && "ring-1 ring-yellow-500/30",
                          )}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-primary tracking-wide">#{order.numero}</span>
                            <div className="flex items-center gap-0.5">
                              {alertLevel && (
                                <Tooltip>
                                  <TooltipTrigger><AlertTriangle className={cn("h-2.5 w-2.5", alertLevel === "overdue" ? "text-destructive" : alertLevel === "today" ? "text-yellow-600" : "text-blue-500")} /></TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">{alertLevel === "overdue" ? "Atrasado" : alertLevel === "today" ? "Vence hoje" : "Em breve"}</TooltipContent>
                                </Tooltip>
                              )}
                              <GripVertical className="h-3 w-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          <p className="text-xs font-medium text-foreground line-clamp-1 mb-1">{order.cliente_nome}</p>
                          <div className="flex items-center justify-between">
                            {order.data_entrega ? (
                              <span className={cn("text-[10px]", alertLevel === "overdue" ? "text-destructive font-semibold" : alertLevel === "today" ? "text-yellow-600 font-semibold" : "text-muted-foreground")}>
                                {format(new Date(order.data_entrega), "dd/MM")}
                              </span>
                            ) : <span className="text-[10px] text-muted-foreground/50">—</span>}
                            <span className="text-[10px] font-semibold text-primary">{formatCurrency(order.valor_total)}</span>
                          </div>
                          <div className="mt-1 pt-1 border-t border-border/30">
                            <span className="text-[9px] text-muted-foreground/60">{differenceInDays(new Date(), new Date(order.created_at))}d produção</span>
                          </div>
                        </div>
                      );
                    })}
                    {items.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
                        <div className="h-8 w-8 rounded-sm border-2 border-dashed border-current flex items-center justify-center mb-2"><ColIcon className="h-3 w-3" /></div>
                        <span className="text-[10px]">Solte aqui</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
