import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { CalendarItem } from "@/hooks/use-calendar-events";

interface Props {
  currentDate: Date;
  items: CalendarItem[];
  onDayClick: (date: Date) => void;
  onItemClick: (item: CalendarItem) => void;
}

export function CalendarMonthView({ currentDate, items, onDayClick, onItemClick }: Props) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { locale: ptBR });
    const end = endOfWeek(endOfMonth(currentDate), { locale: ptBR });
    const result: Date[] = [];
    let day = start;
    while (day <= end) { result.push(day); day = addDays(day, 1); }
    return result;
  }, [currentDate]);

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const getItemsForDay = (date: Date) => items.filter(i => i.date === format(date, "yyyy-MM-dd"));

  return (
    <div className="border rounded-sm overflow-hidden">
      <div className="grid grid-cols-7 bg-muted/50">
        {weekDays.map(d => <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2 border-b">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayItems = getItemsForDay(day);
          const inMonth = isSameMonth(day, currentDate);
          return (
            <div key={i} className={cn("min-h-[100px] border-b border-r p-1 cursor-pointer transition-colors hover:bg-muted/30", !inMonth && "bg-muted/10 opacity-50")} onClick={() => onDayClick(day)}>
              <div className={cn("text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full", isToday(day) && "bg-primary text-primary-foreground")}>{format(day, "d")}</div>
              <div className="space-y-0.5">
                {dayItems.slice(0, 3).map(item => (
                  <div key={item.id} className="text-[10px] leading-tight px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: item.color + "20", color: item.color, borderLeft: `2px solid ${item.color}` }}
                    onClick={e => { e.stopPropagation(); onItemClick(item); }}>
                    {item.startTime && <span className="font-semibold mr-0.5">{item.startTime}</span>}
                    {item.title}
                  </div>
                ))}
                {dayItems.length > 3 && <div className="text-[10px] text-muted-foreground pl-1">+{dayItems.length - 3} mais</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
