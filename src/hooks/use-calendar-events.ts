import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTenant } from "@/hooks/use-tenant";
import { toast } from "sonner";

export interface CalendarEvent {
  id: string;
  tenant_id: string;
  titulo: string;
  descricao?: string;
  data_evento: string;
  hora_inicio?: string;
  hora_fim?: string;
  local?: string;
  categoria: string;
  prioridade: string;
  status: string;
  cor: string;
  concluido_em?: string;
  created_at: string;
}

export interface CalendarItem {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  allDay: boolean;
  category: string;
  color: string;
  status: string;
  priority: string;
  type: "event" | "task";
  description?: string;
  location?: string;
}

export function useCalendarEvents() {
  const { user } = useAuth();
  const { activeTenantId } = useTenant();
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: ["calendar-events", activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_events" as any)
        .select("*")
        .eq("tenant_id", activeTenantId!)
        .order("data_evento", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CalendarEvent[];
    },
    enabled: !!user && !!activeTenantId,
  });

  const tasksQuery = useQuery({
    queryKey: ["calendar-tasks", activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks" as any)
        .select("*")
        .eq("tenant_id", activeTenantId!)
        .not("data_vencimento", "is", null)
        .order("data_vencimento", { ascending: true });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!user && !!activeTenantId,
  });

  const createEvent = useMutation({
    mutationFn: async (event: Partial<CalendarEvent>) => {
      const { data, error } = await supabase
        .from("calendar_events" as any)
        .insert({ ...event, tenant_id: activeTenantId, criado_por: user?.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Evento criado!");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<CalendarEvent>) => {
      const { data, error } = await supabase
        .from("calendar_events" as any)
        .update(updates as any)
        .eq("id", id as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Evento atualizado!");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("calendar_events" as any)
        .delete()
        .eq("id", id as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Evento excluído!");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const calendarItems: CalendarItem[] = (eventsQuery.data ?? []).map((e): CalendarItem => ({
    id: e.id,
    title: e.titulo,
    date: e.data_evento,
    startTime: e.hora_inicio?.slice(0, 5),
    endTime: e.hora_fim?.slice(0, 5),
    allDay: !e.hora_inicio,
    category: e.categoria,
    color: e.cor,
    status: e.status,
    priority: e.prioridade,
    type: "event",
    description: e.descricao,
    location: e.local,
  }));

  return {
    events: eventsQuery.data ?? [],
    tasks: tasksQuery.data ?? [],
    calendarItems,
    isLoading: eventsQuery.isLoading || tasksQuery.isLoading,
    createEvent: createEvent.mutateAsync,
    updateEvent: updateEvent.mutateAsync,
    deleteEvent: deleteEvent.mutateAsync,
    isCreating: createEvent.isPending,
    isUpdating: updateEvent.isPending,
    isDeleting: deleteEvent.isPending,
  };
}
