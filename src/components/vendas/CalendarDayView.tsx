import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { CalendarItem } from "@/hooks/use-calendar-events";

interface Props {
  currentDate: Date;
  items: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);

const statusLabels: Record<string, string> = { agendado: "Agendado", concluido: "Concluído", cancelado: "Cancelado", atrasado: "Atrasado", pendente: "Pendente" };
const priorityLabels: Record<string, string> = { baixa: "Baixa", media: "Média", alta: "Alta", urgente: "Urgente" };

export function CalendarDayView({ currentDate, items, onItemClick }: Props) {
  const dateStr = format(currentDate, "yyyy-MM-dd");
  const dayItems = items.filter(i => i.date === dateStr);
  const allDayItems = dayItems.filter(i => i.allDay);
  const timedItems = dayItems.filter(i => !i.allDay && i.startTime);
  const noTimeItems = dayItems.filter(i => !i.allDay && !i.startTime);

  const getItemPosition = (item: CalendarItem) => {
    if (!item.startTime) return null;
    const [h, m] = item.startTime.split(":").map(Number);
    const top = ((h - 6) * 60 + m) / 60 * 64;
    let duration = 60;
    if (item.endTime) { const [eh, em] = item.endTime.split(":").map(Number); duration = (eh * 60 + em) - (h * 60 + m); }
    return { top, height: Math.max((duration / 60) * 64, 28) };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className={cn("w-14 h-14 rounded-sm flex flex-col items-center justify-center", isToday(currentDate) ? "bg-primary text-primary-foreground" : "bg-muted")}>
          <div className="text-[10px] uppercase">{format(currentDate, "EEE", { locale: ptBR })}</div>
          <div className="text-xl font-bold">{format(currentDate, "d")}</div>
        </div>
        <div>
          <h3 className="font-semibold">{format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</h3>
          <p className="text-sm text-muted-foreground">{dayItems.length} compromisso{dayItems.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {allDayItems.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase">Dia inteiro</div>
          {allDayItems.map(item => (
            <div key={item.id} className="p-2 rounded-sm cursor-pointer hover:opacity-80" style={{ backgroundColor: item.color + "15", borderLeft: `3px solid ${item.color}` }} onClick={() => onItemClick(item)}>
              <div className="font-medium text-sm">{item.title}</div>
              {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
            </div>
          ))}
        </div>
      )}

      {noTimeItems.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase">Sem horário definido</div>
          {noTimeItems.map(item => (
            <div key={item.id} className="p-2 rounded-sm cursor-pointer hover:opacity-80" style={{ backgroundColor: item.color + "15", borderLeft: `3px solid ${item.color}` }} onClick={() => onItemClick(item)}>
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{item.title}</div>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-[10px]">{priorityLabels[item.priority] || item.priority}</Badge>
                  <Badge variant="outline" className="text-[10px]">{statusLabels[item.status] || item.status}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border rounded-sm overflow-hidden">
        <div className="relative max-h-[600px] overflow-y-auto">
          {HOURS.map(h => (
            <div key={h} className="flex h-16 border-b border-dashed border-border/50">
              <div className="w-16 text-[11px] text-muted-foreground text-right pr-3 pt-1 shrink-0">{String(h).padStart(2, "0")}:00</div>
              <div className="flex-1 border-l relative" />
            </div>
          ))}
          {timedItems.map(item => {
            const pos = getItemPosition(item);
            if (!pos) return null;
            return (
              <div key={item.id} className="absolute rounded-sm px-2 py-1 cursor-pointer hover:opacity-80 z-10"
                style={{ top: pos.top, height: pos.height, left: 68, right: 4, backgroundColor: item.color + "20", borderLeft: `3px solid ${item.color}` }}
                onClick={() => onItemClick(item)}>
                <div className="text-xs font-semibold flex items-center gap-1" style={{ color: item.color }}>
                  {item.startTime}{item.endTime ? ` - ${item.endTime}` : ""}
                </div>
                <div className="text-xs font-medium truncate">{item.title}</div>
                {pos.height > 40 && item.location && <div className="text-[10px] text-muted-foreground">📍 {item.location}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
