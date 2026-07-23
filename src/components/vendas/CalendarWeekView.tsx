import { useMemo } from "react";
import { format, startOfWeek, addDays, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { CalendarItem } from "@/hooks/use-calendar-events";

interface Props {
  currentDate: Date;
  items: CalendarItem[];
  onDayClick: (date: Date) => void;
  onItemClick: (item: CalendarItem) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);

export function CalendarWeekView({ currentDate, items, onDayClick, onItemClick }: Props) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { locale: ptBR });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const getItemsForDay = (date: Date) => items.filter(i => i.date === format(date, "yyyy-MM-dd"));

  const getItemPosition = (item: CalendarItem) => {
    if (item.allDay || !item.startTime) return null;
    const [h, m] = item.startTime.split(":").map(Number);
    const top = ((h - 7) * 60 + m) / 60 * 48;
    let duration = 60;
    if (item.endTime) { const [eh, em] = item.endTime.split(":").map(Number); duration = (eh * 60 + em) - (h * 60 + m); }
    return { top, height: Math.max((duration / 60) * 48, 20) };
  };

  return (
    <div className="border rounded-sm overflow-hidden">
      <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-muted/50 border-b">
        <div className="p-2" />
        {weekDays.map(day => (
          <div key={day.toISOString()} className={cn("text-center py-2 border-l cursor-pointer hover:bg-muted/30", isToday(day) && "bg-primary/10")} onClick={() => onDayClick(day)}>
            <div className="text-[10px] text-muted-foreground uppercase">{format(day, "EEE", { locale: ptBR })}</div>
            <div className={cn("text-sm font-bold w-7 h-7 mx-auto flex items-center justify-center rounded-full", isToday(day) && "bg-primary text-primary-foreground")}>{format(day, "d")}</div>
            {getItemsForDay(day).filter(i => i.allDay).map(item => (
              <div key={item.id} className="text-[10px] mx-1 px-1 rounded truncate cursor-pointer" style={{ backgroundColor: item.color + "20", color: item.color }}
                onClick={e => { e.stopPropagation(); onItemClick(item); }}>{item.title}</div>
            ))}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[60px_repeat(7,1fr)] max-h-[600px] overflow-y-auto">
        <div>{HOURS.map(h => <div key={h} className="h-12 border-b text-[10px] text-muted-foreground text-right pr-2 pt-0.5">{String(h).padStart(2, "0")}:00</div>)}</div>
        {weekDays.map(day => {
          const dayItems = getItemsForDay(day).filter(i => !i.allDay && i.startTime);
          return (
            <div key={day.toISOString()} className={cn("border-l relative", isToday(day) && "bg-primary/5")} onClick={() => onDayClick(day)}>
              {HOURS.map(h => <div key={h} className="h-12 border-b border-dashed border-border/50" />)}
              {dayItems.map(item => {
                const pos = getItemPosition(item);
                if (!pos) return null;
                return (
                  <div key={item.id} className="absolute left-0.5 right-0.5 rounded px-1 text-[10px] leading-tight overflow-hidden cursor-pointer hover:opacity-80 z-10"
                    style={{ top: pos.top, height: pos.height, backgroundColor: item.color + "25", color: item.color, borderLeft: `3px solid ${item.color}` }}
                    onClick={e => { e.stopPropagation(); onItemClick(item); }}>
                    <div className="font-semibold truncate">{item.startTime} {item.title}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
