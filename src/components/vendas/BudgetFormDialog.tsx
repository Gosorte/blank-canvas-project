import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Search, UserPlus, Upload, Plus } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/use-tenant";
import { QuickClientDialog } from "./QuickClientDialog";
import { BudgetSuggestions } from "./BudgetSuggestions";

export interface BudgetFormData {
  cliente_nome: string;
  contato_nome: string;
  contato_telefone: string;
  contato_email: string;
  origem: string;
  vendedor: string;
  parceiros: string;
  valor_total: string;
  data_entrega: string;
  hora_entrega: string;
  tipo_entrega: string;
  transportadora: string;
  status: string;
  categoria: string;
  forma_pagamento: string;
  observacoes: string;
}

export const emptyBudgetForm: BudgetFormData = {
  cliente_nome: "", contato_nome: "", contato_telefone: "", contato_email: "",
  origem: "", vendedor: "", parceiros: "", valor_total: "",
  data_entrega: "", hora_entrega: "", tipo_entrega: "retirada", transportadora: "",
  status: "rascunho", categoria: "digital", forma_pagamento: "", observacoes: "",
};

const ORIGINS = ["Indicação", "Site", "Instagram", "Facebook", "WhatsApp", "Telefone", "Visita", "Outro"];
const PAYMENT_METHODS = ["Dinheiro", "PIX", "Cartão Crédito", "Cartão Débito", "Boleto", "Transferência", "Outro"];

type FormMode = "orcamento" | "pedido";

const MODE_CONFIG = {
  orcamento: {
    title: "Orçamento",
    numberLabel: "Nº Orçamento",
    dateLabel: "Data do Orçamento",
    statuses: [
      { value: "rascunho", label: "Rascunho" },
      { value: "enviado", label: "Enviado" },
      { value: "aprovado", label: "Aprovado" },
      { value: "cancelado", label: "Cancelado" },
    ],
    notesPlaceholder: "Observações gerais sobre o orçamento...",
  },
  pedido: {
    title: "Pedido",
    numberLabel: "Nº Pedido",
    dateLabel: "Data do Pedido",
    statuses: [
      { value: "aguardando", label: "Aguardando" },
      { value: "balcao", label: "Balcão" },
      { value: "arte", label: "Arte" },
      { value: "offset", label: "Offset" },
      { value: "digital", label: "Digital" },
      { value: "com_visual", label: "Com. Visual" },
      { value: "pronto", label: "Pronto" },
      { value: "cancelado", label: "Cancelado" },
    ],
    notesPlaceholder: "Observações gerais sobre o pedido...",
  },
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: BudgetFormData;
  onFormChange: (form: BudgetFormData) => void;
  onSave: () => void;
  onSaveAndAddItem: () => void;
  isLoading: boolean;
  isEditing: boolean;
  budgetNumber?: number;
  budgetDate?: string;
  mode?: FormMode;
}

export function BudgetFormDialog({
  open, onOpenChange, form, onFormChange, onSave, onSaveAndAddItem,
  isLoading, isEditing, budgetNumber, budgetDate, mode = "orcamento",
}: Props) {
  const config = MODE_CONFIG[mode];
  const { activeTenantId } = useTenant();
  const [negotiationOpen, setNegotiationOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState(form.cliente_nome);
  const [clients, setClients] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [quickClientOpen, setQuickClientOpen] = useState(false);
  const [quickVendedorOpen, setQuickVendedorOpen] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Vendedor search
  const [spSearch, setSpSearch] = useState(form.vendedor);
  const [spResults, setSpResults] = useState<any[]>([]);
  const [showSpSuggestions, setShowSpSuggestions] = useState(false);
  const spRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setClientSearch(form.cliente_nome); }, [form.cliente_nome]);
  useEffect(() => { setSpSearch(form.vendedor); }, [form.vendedor]);
  useEffect(() => { if (open) setAttempted(false); }, [open]);

  useEffect(() => {
    if (!clientSearch.trim() || clientSearch.length < 2 || !activeTenantId) { setClients([]); return; }
    const timeout = setTimeout(async () => {
      const { data } = await supabase.from("clientes").select("id, nome, telefone, whatsapp, email")
        .eq("tenant_id", activeTenantId).ilike("nome", `%${clientSearch}%`).limit(8);
      setClients(data || []);
    }, 300);
    return () => clearTimeout(timeout);
  }, [clientSearch, activeTenantId]);

  // Search vendedores (from clientes table)
  useEffect(() => {
    if (!spSearch.trim() || spSearch.length < 2 || !activeTenantId) { setSpResults([]); return; }
    const timeout = setTimeout(async () => {
      const { data } = await supabase.from("clientes").select("id, nome, telefone")
        .eq("tenant_id", activeTenantId).ilike("nome", `%${spSearch}%`).limit(8);
      setSpResults(data || []);
    }, 300);
    return () => clearTimeout(timeout);
  }, [spSearch, activeTenantId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (spRef.current && !spRef.current.contains(e.target as Node)) setShowSpSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectClient = (client: any) => {
    onFormChange({ ...form, cliente_nome: client.nome, contato_telefone: client.telefone || form.contato_telefone, contato_email: client.email || form.contato_email });
    setClientSearch(client.nome);
    setShowSuggestions(false);
  };

  const update = (field: keyof BudgetFormData, value: string) => onFormChange({ ...form, [field]: value });

  const missingRequired = !form.cliente_nome.trim() || !form.data_entrega || !form.hora_entrega || !form.origem || !form.vendedor.trim();
  const showError = (field: string) => attempted && !field.trim();

  const handleSave = () => { if (missingRequired) { setAttempted(true); return; } onSave(); };
  const handleSaveAndAddItem = () => { if (missingRequired) { setAttempted(true); return; } onSaveAndAddItem(); };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {/* Header */}
          <div className="bg-primary px-6 py-3">
            <h2 className="text-lg font-semibold text-primary-foreground">{isEditing ? "Editar" : "Novo"} {config.title}</h2>
          </div>

          {/* Tab indicator */}
          <div className="border-b px-6">
            <div className="inline-block border-b-2 border-primary px-4 py-2 text-sm font-medium text-primary">
              📄 Proposta
            </div>
          </div>

          <div className="px-6 pb-6 space-y-6">
            {/* Row 1: Numbers & Dates */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">{config.numberLabel}</Label>
                  <Input value={budgetNumber ? `${budgetNumber}` : "Automático"} disabled className="bg-muted text-muted-foreground italic" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{config.dateLabel}</Label>
                  <Input value={budgetDate ? format(new Date(budgetDate), "dd/MM/yyyy") : format(new Date(), "dd/MM/yyyy")} disabled className="bg-muted" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Data de Entrega *</Label>
                  <Input type="date" value={form.data_entrega} onChange={(e) => update("data_entrega", e.target.value)}
                    className={showError(form.data_entrega) ? "border-destructive" : ""} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Hora de Entrega *</Label>
                  <Input type="time" value={form.hora_entrega} onChange={(e) => update("hora_entrega", e.target.value)}
                    className={showError(form.hora_entrega) ? "border-destructive" : ""} />
                </div>
              </div>

              {/* Cliente */}
              <div className="relative" ref={suggestionsRef}>
                <Label className="text-xs text-muted-foreground">Cliente *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={clientSearch}
                      onChange={(e) => { setClientSearch(e.target.value); update("cliente_nome", e.target.value); setShowSuggestions(true); }}
                      onFocus={() => clientSearch.length >= 2 && setShowSuggestions(true)}
                      placeholder="Digite o nome do cliente..."
                      className={`pl-10 text-base font-medium ${showError(form.cliente_nome) ? "border-destructive" : ""}`}
                    />
                  </div>
                  <Button type="button" variant="outline" size="icon" className="shrink-0" title="Cadastrar novo cliente"
                    onClick={() => setQuickClientOpen(true)}>
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
                {showSuggestions && clientSearch.length >= 2 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {clients.length > 0 ? clients.map((c: any) => (
                      <button key={c.id} type="button" className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex justify-between" onClick={() => selectClient(c)}>
                        <span className="font-medium">{c.nome}</span>
                        <span className="text-xs text-muted-foreground">{c.telefone}</span>
                      </button>
                    )) : (
                      <div className="px-3 py-3 text-center text-sm text-muted-foreground">
                        <p>Nenhum cliente encontrado</p>
                        <Button variant="link" size="sm" className="mt-1 gap-1"
                          onClick={() => { setShowSuggestions(false); setQuickClientOpen(true); }}>
                          <UserPlus className="h-3 w-3" /> Cadastrar "{clientSearch}"
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Contato + Origem */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Contato</Label>
                  <Input value={form.contato_nome} onChange={(e) => update("contato_nome", e.target.value)} placeholder="Nome do contato" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Origem *</Label>
                  <Select value={form.origem} onValueChange={(v) => update("origem", v)}>
                    <SelectTrigger className={showError(form.origem) ? "border-destructive" : ""}>
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>{ORIGINS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {/* Vendedor + Parceiros */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative" ref={spRef}>
                  <Label className="text-xs text-muted-foreground">Vendedor *</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={spSearch}
                        onChange={(e) => { setSpSearch(e.target.value); update("vendedor", e.target.value); setShowSpSuggestions(true); }}
                        onFocus={() => spSearch.length >= 2 && setShowSpSuggestions(true)}
                        placeholder="Digite o nome do vendedor..."
                        className={`pl-10 ${showError(form.vendedor) ? "border-destructive" : ""}`}
                      />
                    </div>
                    <Button type="button" variant="outline" size="icon" className="shrink-0" title="Cadastrar novo vendedor"
                      onClick={() => setQuickVendedorOpen(true)}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                  {showSpSuggestions && spSearch.length >= 2 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {spResults.length > 0 ? spResults.map((s: any) => (
                        <button key={s.id} type="button" className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex justify-between"
                          onClick={() => { update("vendedor", s.nome); setSpSearch(s.nome); setShowSpSuggestions(false); }}>
                          <span className="font-medium">{s.nome}</span>
                          <span className="text-xs text-muted-foreground">{s.telefone}</span>
                        </button>
                      )) : (
                        <div className="px-3 py-3 text-center text-sm text-muted-foreground">
                          <p>Nenhum vendedor encontrado</p>
                          <Button variant="link" size="sm" className="mt-1 gap-1"
                            onClick={() => { setShowSpSuggestions(false); setQuickVendedorOpen(true); }}>
                            <UserPlus className="h-3 w-3" /> Cadastrar "{spSearch}"
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Parceiros</Label>
                  <Input value={form.parceiros} onChange={(e) => update("parceiros", e.target.value)} placeholder="Parceiros envolvidos" />
                </div>
              </div>

              {/* Entrega */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <RadioGroup value={form.tipo_entrega} onValueChange={(v) => update("tipo_entrega", v)} className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="retirada" id="retirada" />
                      <Label htmlFor="retirada" className="text-sm">Retirada</Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="entrega" id="entrega" />
                      <Label htmlFor="entrega" className="text-sm">Entrega</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Transportadora</Label>
                  <Input value={form.transportadora} onChange={(e) => update("transportadora", e.target.value)}
                    placeholder="Nome da transportadora" disabled={form.tipo_entrega === "retirada"}
                    className={form.tipo_entrega === "retirada" ? "bg-muted" : ""} />
                </div>
              </div>
            </div>

            {/* Negotiation Section */}
            <Collapsible open={negotiationOpen} onOpenChange={setNegotiationOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 rounded-lg border bg-muted/50 hover:bg-muted">
                <span className="text-sm font-medium">Negociação & Pagamento</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${negotiationOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 border rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Valor Total (R$)</Label>
                    <Input type="number" step="0.01" value={form.valor_total} onChange={(e) => update("valor_total", e.target.value)} placeholder="0,00" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Categoria</Label>
                    <Select value={form.categoria} onValueChange={(v) => update("categoria", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="digital">Digital</SelectItem>
                        <SelectItem value="offset">Offset</SelectItem>
                        <SelectItem value="comunicacao_visual">Comunicação Visual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Forma de Pagamento</Label>
                    <Select value={form.forma_pagamento} onValueChange={(v) => update("forma_pagamento", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={form.status} onValueChange={(v) => update("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{config.statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Observações */}
            <div>
              <Label className="text-sm font-medium">Observações</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Confira todos os dados, após aprovação não poderemos alterar alguns itens.
              </p>
              <Textarea value={form.observacoes} onChange={(e) => update("observacoes", e.target.value)} placeholder={config.notesPlaceholder} rows={3} />
            </div>

            {/* Sugestões de Cross-Sell */}
            {form.cliente_nome.trim().length >= 3 && (
              <BudgetSuggestions clientName={form.cliente_nome} />
            )}

            {/* Upload area */}
            <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="h-8 w-8 mb-2" />
              <p className="text-sm">Clique ou arraste seu arquivo</p>
            </div>

            {/* Validation message */}
            {attempted && missingRequired && (
              <p className="text-sm text-destructive">* Preencha todos os campos obrigatórios: Cliente, Data de Entrega, Hora, Origem e Vendedor.</p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="link" className="text-primary gap-1" onClick={handleSaveAndAddItem} disabled={isLoading}>
                <Plus className="h-4 w-4" /> Salvar e adicionar Item
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Salvar"}
              </Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Client Dialog */}
      <QuickClientDialog
        open={quickClientOpen}
        onOpenChange={setQuickClientOpen}
        initialName={clientSearch}
        onClientCreated={(client) => {
          onFormChange({ ...form, cliente_nome: client.nome, contato_telefone: client.telefone || form.contato_telefone, contato_email: client.email || form.contato_email });
          setClientSearch(client.nome);
        }}
      />

      {/* Quick Vendedor Dialog */}
      <QuickClientDialog
        open={quickVendedorOpen}
        onOpenChange={setQuickVendedorOpen}
        initialName={spSearch}
        initialRoles={["vendedor"]}
        onClientCreated={(client) => {
          update("vendedor", client.nome);
          setSpSearch(client.nome);
        }}
      />
    </>
  );
}
