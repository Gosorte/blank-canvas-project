import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, BarChart3, ListChecks } from "lucide-react";
import { useCalendarEvents, type CalendarItem, type CalendarEvent } from "@/hooks/use-calendar-events";
import { CalendarMonthView } from "@/components/vendas/CalendarMonthView";
import { CalendarWeekView } from "@/components/vendas/CalendarWeekView";
import { CalendarDayView } from "@/components/vendas/CalendarDayView";
import { EventDialog } from "@/components/vendas/EventDialog";
import { PerformanceReport } from "@/components/vendas/PerformanceReport";
import { TaskListView } from "@/components/vendas/TaskListView";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

type ViewMode = "month" | "week" | "day";
type MainTab = "calendario" | "tarefas" | "relatorio";

const statusLabels: Record<string, string> = {
  agendado: "Agendado", concluido: "Concluído", cancelado: "Cancelado", atrasado: "Atrasado",
  pendente: "Pendente", "em-progresso": "Em Progresso", concluida: "Concluída",
};
const priorityLabels: Record<string, string> = { baixa: "Baixa", media: "Média", alta: "Alta", urgente: "Urgente" };
const categoryLabels: Record<string, string> = {
  geral: "Geral", reuniao: "Reunião", entrega: "Entrega", producao: "Produção",
  visita: "Visita", cobranca: "Cobrança", pessoal: "Pessoal",
};

export default function AgendaTarefas() {
  const { calendarItems, events, isLoading, createEvent, updateEvent, deleteEvent, isCreating, isUpdating, isDeleting } = useCalendarEvents();
  const [mainTab, setMainTab] = useState<MainTab>("tarefas");
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const navigate = (dir: "prev" | "next" | "today") => {
    if (dir === "today") return setCurrentDate(new Date());
    const fn = dir === "next"
      ? viewMode === "month" ? addMonths : viewMode === "week" ? addWeeks : addDays
      : viewMode === "month" ? subMonths : viewMode === "week" ? subWeeks : subDays;
    setCurrentDate(d => fn(d, 1));
  };

  const handleDayClick = (date: Date) => {
    if (viewMode === "month") { setCurrentDate(date); setViewMode("day"); }
    else { setDefaultDate(format(date, "yyyy-MM-dd")); setEditEvent(null); setDialogOpen(true); }
  };

  const handleItemClick = (item: CalendarItem) => setSelectedItem(item);

  const handleEditFromSheet = () => {
    if (!selectedItem || selectedItem.type !== "event") return;
    const ev = events.find(e => e.id === selectedItem.id);
    if (ev) { setEditEvent(ev); setSelectedItem(null); setDialogOpen(true); }
  };

  const handleSubmit = async (data: Partial<CalendarEvent>) => {
    if ((data as any).id) {
      const { id, ...rest } = data as any;
      await updateEvent({ id, ...rest });
    } else {
      await createEvent(data);
    }
  };

  const handleMarkCompleted = async () => {
    if (!selectedItem) return;
    if (selectedItem.type === "event") {
      await updateEvent({ id: selectedItem.id, status: "concluido", concluido_em: new Date().toISOString() });
    }
    setSelectedItem(null);
  };

  const getTitle = () => {
    if (viewMode === "month") return format(currentDate, "MMMM yyyy", { locale: ptBR });
    if (viewMode === "week") return `Semana de ${format(currentDate, "dd/MM", { locale: ptBR })}`;
    return format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agenda & Tarefas</h1>
          <p className="text-muted-foreground text-sm">Gerencie compromissos, tarefas e acompanhe seu desempenho</p>
        </div>
        {mainTab === "calendario" && (
          <Button size="sm" className="gap-1.5" onClick={() => { setEditEvent(null); setDefaultDate(format(currentDate, "yyyy-MM-dd")); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" /> Novo Evento
          </Button>
        )}
      </div>

      <Tabs value={mainTab} onValueChange={v => setMainTab(v as MainTab)}>
        <TabsList>
          <TabsTrigger value="tarefas" className="gap-1.5"><ListChecks className="h-4 w-4" /> Tarefas</TabsTrigger>
          <TabsTrigger value="calendario" className="gap-1.5"><CalendarIcon className="h-4 w-4" /> Calendário</TabsTrigger>
          <TabsTrigger value="relatorio" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Relatório</TabsTrigger>
        </TabsList>

        <TabsContent value="tarefas" className="mt-4">
          <TaskListView />
        </TabsContent>

        <TabsContent value="calendario" className="space-y-4 mt-4">
          <div className="flex items-center justify-between bg-card border rounded-sm p-2">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => navigate("today")} className="text-xs">Hoje</Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("prev")}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("next")}><ChevronRight className="h-4 w-4" /></Button>
              <h2 className="text-sm font-semibold capitalize ml-2">{getTitle()}</h2>
            </div>
            <Tabs value={viewMode} onValueChange={v => setViewMode(v as ViewMode)}>
              <TabsList className="h-8">
                <TabsTrigger value="month" className="text-xs">Mês</TabsTrigger>
                <TabsTrigger value="week" className="text-xs">Semana</TabsTrigger>
                <TabsTrigger value="day" className="text-xs">Dia</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {viewMode === "month" && <CalendarMonthView currentDate={currentDate} items={calendarItems} onDayClick={handleDayClick} onItemClick={handleItemClick} />}
          {viewMode === "week" && <CalendarWeekView currentDate={currentDate} items={calendarItems} onDayClick={handleDayClick} onItemClick={handleItemClick} />}
          {viewMode === "day" && <CalendarDayView currentDate={currentDate} items={calendarItems} onItemClick={handleItemClick} />}
        </TabsContent>

        <TabsContent value="relatorio" className="mt-4 space-y-6">
          <PerformanceReport items={calendarItems} currentDate={currentDate} />
        </TabsContent>
      </Tabs>

      <EventDialog open={dialogOpen} onOpenChange={setDialogOpen} editEvent={editEvent} defaultDate={defaultDate} onSubmit={handleSubmit} isLoading={isCreating || isUpdating} />

      <Sheet open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <SheetContent>
          {selectedItem && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedItem.color }} />
                  {selectedItem.title}
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={selectedItem.type === "task" ? "secondary" : "default"}>{selectedItem.type === "task" ? "📋 Tarefa" : "📅 Evento"}</Badge>
                  <Badge variant="outline">{statusLabels[selectedItem.status] || selectedItem.status}</Badge>
                  <Badge variant="outline">{priorityLabels[selectedItem.priority] || selectedItem.priority}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(selectedItem.date), "dd/MM/yyyy", { locale: ptBR })}</span>
                    {selectedItem.startTime && <span className="text-muted-foreground">• {selectedItem.startTime}{selectedItem.endTime ? ` - ${selectedItem.endTime}` : ""}</span>}
                  </div>
                  {selectedItem.category && <div className="flex items-center gap-2"><span className="text-muted-foreground">Categoria:</span><span>{categoryLabels[selectedItem.category] || selectedItem.category}</span></div>}
                  {selectedItem.location && <div className="flex items-center gap-2"><span>📍</span><span>{selectedItem.location}</span></div>}
                </div>
                {selectedItem.description && <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Descrição</p><p className="text-sm">{selectedItem.description}</p></div>}
              </div>
              <SheetFooter className="mt-6 flex-col gap-2">
                {selectedItem.status !== "concluido" && selectedItem.status !== "concluida" && (
                  <Button className="w-full" variant="default" size="sm" onClick={handleMarkCompleted}>Marcar como Concluído</Button>
                )}
                {selectedItem.type === "event" && (
                  <>
                    <Button className="w-full" variant="outline" size="sm" onClick={handleEditFromSheet}>Editar Evento</Button>
                    <Button className="w-full" variant="destructive" size="sm" onClick={() => { setDeleteId(selectedItem.id); setSelectedItem(null); }}>Excluir</Button>
                  </>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={async () => { if (deleteId) { await deleteEvent(deleteId); setDeleteId(null); } }} isLoading={isDeleting} itemName="este evento" />
    </div>
  );
}
