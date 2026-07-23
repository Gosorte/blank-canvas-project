import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead, FUNIL_STAGES, type CrmLead } from "@/hooks/use-crm";
import { useTenants } from "@/hooks/use-tenants";
import { Plus, User, Phone, Mail, MessageSquare, Trash2, GripVertical, Filter } from "lucide-react";
import { toast } from "sonner";

export default function CRM() {
  const { data: tenants } = useTenants();
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const { data: leads = [], isLoading } = useLeads(selectedTenant || undefined);
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");

  const [form, setForm] = useState({
    nome: "", email: "", telefone: "", whatsapp: "",
    origem: "balcao", tipo: "balcao", setor: "digital",
    valor_estimado: 0, observacoes: "",
  });

  const handleCreate = () => {
    if (!selectedTenant) { toast.error("Selecione um tenant"); return; }
    if (!form.nome) { toast.error("Nome é obrigatório"); return; }
    createLead.mutate({ ...form, tenant_id: selectedTenant }, {
      onSuccess: () => { setDialogOpen(false); setForm({ nome: "", email: "", telefone: "", whatsapp: "", origem: "balcao", tipo: "balcao", setor: "digital", valor_estimado: 0, observacoes: "" }); }
    });
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (leadId) {
      updateLead.mutate({ id: leadId, status_funil: newStatus });
    }
  };

  const filteredLeads = filtroTipo === "todos" ? leads : leads.filter(l => l.tipo === filtroTipo);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">CRM</h1>
          <p className="text-muted-foreground">Funil de vendas e gestão de leads</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedTenant} onValueChange={setSelectedTenant}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Selecione o tenant" /></SelectTrigger>
            <SelectContent>
              {(tenants || []).map(t => (
                <SelectItem key={t.id} value={t.id}>{t.nome_grafica}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Novo Lead</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Nome *" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  <Input placeholder="WhatsApp" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
                </div>
                <Input placeholder="Telefone" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
                <div className="grid grid-cols-3 gap-3">
                  <Select value={form.origem} onValueChange={v => setForm(f => ({ ...f, origem: v }))}>
                    <SelectTrigger><SelectValue placeholder="Origem" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balcao">Balcão</SelectItem>
                      <SelectItem value="site">Site</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="indicacao">Indicação</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                    <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balcao">Balcão (Rápido)</SelectItem>
                      <SelectItem value="orcamento">Orçamento</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={form.setor} onValueChange={v => setForm(f => ({ ...f, setor: v }))}>
                    <SelectTrigger><SelectValue placeholder="Setor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="digital">Digital</SelectItem>
                      <SelectItem value="offset">Offset</SelectItem>
                      <SelectItem value="visual">Com. Visual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input type="number" placeholder="Valor estimado (R$)" value={form.valor_estimado || ""} onChange={e => setForm(f => ({ ...f, valor_estimado: Number(e.target.value) }))} />
                <Textarea placeholder="Observações" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
                <Button onClick={handleCreate} className="w-full" disabled={createLead.isPending}>
                  {createLead.isPending ? "Salvando..." : "Criar Lead"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Badge variant={filtroTipo === "todos" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFiltroTipo("todos")}>Todos</Badge>
        <Badge variant={filtroTipo === "balcao" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFiltroTipo("balcao")}>Balcão</Badge>
        <Badge variant={filtroTipo === "orcamento" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFiltroTipo("orcamento")}>Orçamento</Badge>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
        </TabsList>

        {/* KANBAN VIEW */}
        <TabsContent value="kanban">
          {!selectedTenant ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Selecione um tenant para visualizar o funil</CardContent></Card>
          ) : isLoading ? (
            <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : (
            <div className="grid grid-cols-6 gap-3 overflow-x-auto">
              {FUNIL_STAGES.map(stage => {
                const stageLeads = filteredLeads.filter(l => l.status_funil === stage.id);
                return (
                  <div
                    key={stage.id}
                    className="min-w-[220px]"
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDrop(e, stage.id)}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                      <span className="text-sm font-semibold text-foreground">{stage.label}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">{stageLeads.length}</Badge>
                    </div>
                    <div className="space-y-2 min-h-[200px] bg-muted/30 rounded-lg p-2">
                      {stageLeads.map(lead => (
                        <Card
                          key={lead.id}
                          draggable
                          onDragStart={e => handleDragStart(e, lead.id)}
                          className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-start justify-between">
                              <p className="font-medium text-sm text-foreground">{lead.nome}</p>
                              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-[10px]">{lead.tipo === "balcao" ? "Balcão" : "Orçamento"}</Badge>
                              {lead.setor && <Badge variant="secondary" className="text-[10px]">{lead.setor}</Badge>}
                            </div>
                            {lead.valor_estimado > 0 && (
                              <p className="text-xs font-semibold text-green-600">R$ {lead.valor_estimado.toLocaleString("pt-BR")}</p>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground">
                              {lead.whatsapp && <MessageSquare className="h-3 w-3" />}
                              {lead.email && <Mail className="h-3 w-3" />}
                              {lead.telefone && <Phone className="h-3 w-3" />}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* LISTA VIEW */}
        <TabsContent value="lista">
          {!selectedTenant ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Selecione um tenant para visualizar os leads</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium">Nome</th>
                        <th className="text-left p-3 font-medium">Tipo</th>
                        <th className="text-left p-3 font-medium">Setor</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Origem</th>
                        <th className="text-right p-3 font-medium">Valor</th>
                        <th className="text-center p-3 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map(lead => {
                        const stage = FUNIL_STAGES.find(s => s.id === lead.status_funil);
                        return (
                          <tr key={lead.id} className="border-b hover:bg-muted/30">
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{lead.nome}</p>
                                {lead.email && <p className="text-xs text-muted-foreground">{lead.email}</p>}
                              </div>
                            </td>
                            <td className="p-3"><Badge variant="outline">{lead.tipo === "balcao" ? "Balcão" : "Orçamento"}</Badge></td>
                            <td className="p-3">{lead.setor || "—"}</td>
                            <td className="p-3">
                              <Select value={lead.status_funil} onValueChange={v => updateLead.mutate({ id: lead.id, status_funil: v })}>
                                <SelectTrigger className="w-[160px] h-8 text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${stage?.color || ""}`} />
                                    <SelectValue />
                                  </div>
                                </SelectTrigger>
                                <SelectContent>
                                  {FUNIL_STAGES.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-3 capitalize">{lead.origem}</td>
                            <td className="p-3 text-right font-medium">
                              {lead.valor_estimado > 0 ? `R$ ${lead.valor_estimado.toLocaleString("pt-BR")}` : "—"}
                            </td>
                            <td className="p-3 text-center">
                              <Button variant="ghost" size="icon" onClick={() => deleteLead.mutate(lead.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredLeads.length === 0 && (
                        <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhum lead encontrado</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
