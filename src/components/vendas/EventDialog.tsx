import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { CalendarEvent } from "@/hooks/use-calendar-events";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEvent?: CalendarEvent | null;
  defaultDate?: string;
  onSubmit: (data: Partial<CalendarEvent>) => Promise<void>;
  isLoading: boolean;
}

const CATEGORIES = [
  { value: "geral", label: "Geral" }, { value: "reuniao", label: "Reunião" }, { value: "entrega", label: "Entrega" },
  { value: "producao", label: "Produção" }, { value: "visita", label: "Visita" }, { value: "cobranca", label: "Cobrança" }, { value: "pessoal", label: "Pessoal" },
];
const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f97316", "#8b5cf6", "#ec4899", "#14b8a6", "#eab308"];
const PRIORITIES = [{ value: "baixa", label: "Baixa" }, { value: "media", label: "Média" }, { value: "alta", label: "Alta" }, { value: "urgente", label: "Urgente" }];

const emptyForm = {
  titulo: "", descricao: "", data_evento: new Date().toISOString().split("T")[0],
  hora_inicio: "08:00", hora_fim: "09:00", categoria: "geral", cor: "#3b82f6",
  local: "", status: "agendado", prioridade: "media",
};

export function EventDialog({ open, onOpenChange, editEvent, defaultDate, onSubmit, isLoading }: EventDialogProps) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (editEvent) {
      setForm({
        titulo: editEvent.titulo, descricao: editEvent.descricao || "", data_evento: editEvent.data_evento,
        hora_inicio: editEvent.hora_inicio?.slice(0, 5) || "08:00", hora_fim: editEvent.hora_fim?.slice(0, 5) || "09:00",
        categoria: editEvent.categoria, cor: editEvent.cor || "#3b82f6", local: editEvent.local || "",
        status: editEvent.status, prioridade: editEvent.prioridade,
      });
    } else {
      setForm({ ...emptyForm, data_evento: defaultDate || emptyForm.data_evento });
    }
  }, [editEvent, defaultDate, open]);

  const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.titulo.trim()) return;
    const payload: any = { ...form };
    if (editEvent) payload.id = editEvent.id;
    await onSubmit(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editEvent ? "Editar Evento" : "Novo Evento"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Título *</Label><Input value={form.titulo} onChange={e => setField("titulo", e.target.value)} placeholder="Reunião com cliente" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data *</Label><Input type="date" value={form.data_evento} onChange={e => setField("data_evento", e.target.value)} /></div>
            <div><Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={v => setField("categoria", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Início</Label><Input type="time" value={form.hora_inicio} onChange={e => setField("hora_inicio", e.target.value)} /></div>
            <div><Label>Fim</Label><Input type="time" value={form.hora_fim} onChange={e => setField("hora_fim", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Prioridade</Label>
              <Select value={form.prioridade} onValueChange={v => setField("prioridade", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Local</Label><Input value={form.local} onChange={e => setField("local", e.target.value)} placeholder="Escritório, online..." /></div>
          </div>
          <div>
            <Label>Cor</Label>
            <div className="flex gap-2 mt-1">
              {COLORS.map(c => (
                <button key={c} type="button" className={`w-7 h-7 rounded-full border-2 transition-transform ${form.cor === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }} onClick={() => setField("cor", c)} />
              ))}
            </div>
          </div>
          <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setField("descricao", e.target.value)} rows={2} /></div>
          {editEvent && (
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setField("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isLoading || !form.titulo.trim()}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editEvent ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
