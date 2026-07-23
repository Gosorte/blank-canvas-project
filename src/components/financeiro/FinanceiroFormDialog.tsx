import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface FinanceiroFormData {
  id?: string;
  entity_name: string;
  descricao: string;
  categoria: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string;
  status: string;
  forma_pagamento: string;
  observacoes: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FinanceiroFormData) => void;
  isLoading?: boolean;
  editData?: any;
  entityLabel: string;
  title: string;
}

const CATEGORIES = ["geral", "materiais", "serviços", "impostos", "salários", "aluguel", "manutenção", "insumos", "equipamentos", "outros"];
const PAYMENT_METHODS = ["dinheiro", "pix", "cartão", "boleto", "transferência", "cheque"];
const STATUSES = [
  { value: "pendente", label: "Pendente" },
  { value: "pago", label: "Pago" },
  { value: "vencido", label: "Vencido" },
  { value: "cancelado", label: "Cancelado" },
];

export function FinanceiroFormDialog({ open, onOpenChange, onSubmit, isLoading, editData, entityLabel, title }: Props) {
  const [form, setForm] = useState<FinanceiroFormData>({
    entity_name: "", descricao: "", categoria: "geral", valor: 0,
    data_vencimento: "", data_pagamento: "", status: "pendente",
    forma_pagamento: "", observacoes: "",
  });

  useEffect(() => {
    if (editData) {
      setForm({
        id: editData.id,
        entity_name: editData.entity_name || editData.fornecedores?.razao_social || editData.clientes?.nome || "",
        descricao: editData.descricao || "",
        categoria: editData.categoria || "geral",
        valor: editData.valor || 0,
        data_vencimento: editData.data_vencimento || "",
        data_pagamento: editData.data_pagamento || editData.data_recebimento || "",
        status: editData.status || "pendente",
        forma_pagamento: editData.forma_pagamento || "",
        observacoes: editData.observacoes || "",
      });
    } else {
      setForm({
        entity_name: "", descricao: "", categoria: "geral", valor: 0,
        data_vencimento: new Date().toISOString().split("T")[0], data_pagamento: "",
        status: "pendente", forma_pagamento: "", observacoes: "",
      });
    }
  }, [editData, open]);

  const handleSubmit = () => {
    if (!form.descricao || !form.data_vencimento) return;
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <Label>{entityLabel}</Label>
            <Input value={form.entity_name} onChange={(e) => setForm({ ...form, entity_name: e.target.value })} placeholder={`Nome do ${entityLabel.toLowerCase()}`} />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Descrição *</Label>
            <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição da conta" />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Valor (R$) *</Label>
            <Input type="number" step="0.01" min="0" value={form.valor || ""} onChange={(e) => setForm({ ...form, valor: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-2">
            <Label>Vencimento *</Label>
            <Input type="date" value={form.data_vencimento} onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Data Pagamento</Label>
            <Input type="date" value={form.data_pagamento} onChange={(e) => setForm({ ...form, data_pagamento: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <Select value={form.forma_pagamento || ""} onValueChange={(v) => setForm({ ...form, forma_pagamento: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editData ? "Salvar" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}