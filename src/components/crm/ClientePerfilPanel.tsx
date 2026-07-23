import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  User, Mail, Phone, MapPin, FileText, ShoppingBag, Package,
  Calendar, Tag, Loader2, Save, MessageSquare, Hash,
  ClipboardList, Clock, Pencil, X
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  useClienteFromContato,
  useClientePedidos,
  useClienteProdutosFrequentes,
  useClienteOrdens,
  useClienteOrcamentos,
  useContatoInfo,
} from '@/hooks/use-cliente-perfil';

interface ClientePerfilPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contatoId: string | null | undefined;
  contatoNome?: string | null;
  contatoFoto?: string | null;
  contatoNumero?: string | null;
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  pago: 'bg-green-500/10 text-green-600 border-green-500/20',
  producao: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  pronto: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  entregue: 'bg-primary/10 text-primary border-primary/20',
  cancelado: 'bg-destructive/10 text-destructive border-destructive/20',
  rascunho: 'bg-muted text-muted-foreground border-border',
  enviado: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  aprovado: 'bg-green-500/10 text-green-600 border-green-500/20',
  aguardando: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  impressao: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  acabamento: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  finalizado: 'bg-green-500/10 text-green-600 border-green-500/20',
};

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-foreground">{value}</p>
      </div>
    </div>
  );
};

interface ClienteFormData {
  nome: string;
  email: string;
  telefone: string;
  whatsapp: string;
  cpf_cnpj: string;
  tipo_pessoa: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  observacoes: string;
}

const ClientePerfilPanel = ({
  open, onOpenChange, contatoId, contatoNome, contatoFoto, contatoNumero
}: ClientePerfilPanelProps) => {
  const qc = useQueryClient();
  const { data: cliente, isLoading: loadingCliente } = useClienteFromContato(contatoId);
  const { data: contato } = useContatoInfo(contatoId);
  const { data: pedidos = [] } = useClientePedidos(cliente?.id);
  const { data: produtosFreq = [] } = useClienteProdutosFrequentes(cliente?.id);
  const { data: ordens = [] } = useClienteOrdens(cliente?.id);
  const { data: orcamentos = [] } = useClienteOrcamentos(cliente?.id);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ClienteFormData>({
    nome: '', email: '', telefone: '', whatsapp: '', cpf_cnpj: '',
    tipo_pessoa: 'fisica', endereco: '', cidade: '', estado: '', cep: '', observacoes: '',
  });

  const totalGasto = pedidos.reduce((sum, p) => sum + Number(p.valor_total), 0);

  useEffect(() => {
    if (cliente) {
      setForm({
        nome: cliente.nome || '',
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        whatsapp: cliente.whatsapp || '',
        cpf_cnpj: cliente.cpf_cnpj || '',
        tipo_pessoa: cliente.tipo_pessoa || 'fisica',
        endereco: cliente.endereco || '',
        cidade: cliente.cidade || '',
        estado: cliente.estado || '',
        cep: cliente.cep || '',
        observacoes: cliente.observacoes || '',
      });
    }
  }, [cliente]);

  const handleSave = async () => {
    if (!cliente) return;
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    const { error } = await supabase
      .from('clientes')
      .update({
        nome: form.nome.trim(),
        email: form.email.trim() || null,
        telefone: form.telefone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        cpf_cnpj: form.cpf_cnpj.trim() || null,
        tipo_pessoa: form.tipo_pessoa,
        endereco: form.endereco.trim() || null,
        cidade: form.cidade.trim() || null,
        estado: form.estado.trim() || null,
        cep: form.cep.trim() || null,
        observacoes: form.observacoes.trim() || null,
      })
      .eq('id', cliente.id);
    setSaving(false);
    if (error) { toast.error('Erro ao salvar'); return; }
    toast.success('Dados atualizados!');
    setEditing(false);
    qc.invalidateQueries({ queryKey: ['cliente-from-contato', contatoId] });
  };

  const startEdit = () => {
    if (cliente) {
      setForm({
        nome: cliente.nome || '',
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        whatsapp: cliente.whatsapp || contatoNumero || '',
        cpf_cnpj: cliente.cpf_cnpj || '',
        tipo_pessoa: cliente.tipo_pessoa || 'fisica',
        endereco: cliente.endereco || '',
        cidade: cliente.cidade || '',
        estado: cliente.estado || '',
        cep: cliente.cep || '',
        observacoes: cliente.observacoes || '',
      });
    }
    setEditing(true);
  };

  const FormField = ({ label, value, field, icon: Icon, type = 'text', placeholder }: {
    label: string; value: string; field: keyof ClienteFormData; icon: any; type?: string; placeholder?: string;
  }) => (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="w-4 h-4 text-muted-foreground mt-2.5 shrink-0" />
      <div className="flex-1">
        <p className="text-muted-foreground text-xs mb-1">{label}</p>
        <Input
          type={type}
          value={value}
          onChange={(e) => setForm(prev => ({ ...prev, [field]: e.target.value }))}
          placeholder={placeholder || label}
          className="h-8 text-sm"
        />
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) setEditing(false); onOpenChange(v); }}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-primary/5 p-6 pb-4">
          <SheetHeader className="mb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg">Perfil do Cliente</SheetTitle>
              {cliente && !editing && (
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={startEdit}>
                  <Pencil className="w-3 h-3" /> Editar
                </Button>
              )}
              {editing && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditing(false)}>
                    <X className="w-3 h-3" />
                  </Button>
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Salvar
                  </Button>
                </div>
              )}
            </div>
          </SheetHeader>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={contatoFoto || contato?.foto_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {(editing ? form.nome : (cliente?.nome || contatoNome || '?')).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              {editing ? (
                <Input value={form.nome} onChange={(e) => setForm(p => ({ ...p, nome: e.target.value }))}
                  className="h-8 text-sm font-semibold" placeholder="Nome completo" />
              ) : (
                <h3 className="font-semibold text-foreground text-lg truncate">
                  {cliente?.nome || contatoNome || 'Desconhecido'}
                </h3>
              )}
              <div className="flex items-center gap-2 mt-1">
                {editing ? (
                  <Select value={form.tipo_pessoa} onValueChange={(v) => setForm(p => ({ ...p, tipo_pessoa: v }))}>
                    <SelectTrigger className="h-6 text-xs w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fisica">Pessoa Física</SelectItem>
                      <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    {cliente?.tipo_pessoa === 'juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                  </Badge>
                )}
                {cliente?.ativo === false && (
                  <Badge variant="destructive" className="text-xs">Inativo</Badge>
                )}
              </div>
              {!editing && cliente?.cpf_cnpj && (
                <p className="text-xs text-muted-foreground font-mono mt-1">{cliente.cpf_cnpj}</p>
              )}
            </div>
          </div>

          {/* Métricas */}
          {cliente && !editing && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-card rounded-lg p-3 text-center border border-border/40">
                <p className="text-lg font-bold text-primary">{pedidos.length}</p>
                <p className="text-[10px] text-muted-foreground">Pedidos</p>
              </div>
              <div className="bg-card rounded-lg p-3 text-center border border-border/40">
                <p className="text-lg font-bold text-primary">
                  {totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <p className="text-[10px] text-muted-foreground">Total Gasto</p>
              </div>
              <div className="bg-card rounded-lg p-3 text-center border border-border/40">
                <p className="text-lg font-bold text-primary">{orcamentos.length}</p>
                <p className="text-[10px] text-muted-foreground">Orçamentos</p>
              </div>
            </div>
          )}
        </div>

        {loadingCliente ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : !cliente ? (
          <div className="p-6 text-center flex-1 overflow-y-auto">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Este contato ainda não está vinculado a um cliente cadastrado.
            </p>
            {contatoNumero && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                <Phone className="w-3 h-3" /> {contatoNumero}
              </p>
            )}
          </div>
        ) : editing ? (
          /* Modo edição - formulário completo */
          <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documento</h4>
              <FormField icon={Hash} label="CPF/CNPJ" value={form.cpf_cnpj} field="cpf_cnpj" placeholder="000.000.000-00" />
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</h4>
              <FormField icon={Mail} label="Email" value={form.email} field="email" type="email" placeholder="email@exemplo.com" />
              <FormField icon={Phone} label="Telefone" value={form.telefone} field="telefone" placeholder="(00) 0000-0000" />
              <FormField icon={MessageSquare} label="WhatsApp" value={form.whatsapp} field="whatsapp" placeholder="(00) 00000-0000" />
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Endereço</h4>
              <FormField icon={MapPin} label="Endereço" value={form.endereco} field="endereco" placeholder="Rua, número, bairro" />
              <div className="flex gap-2">
                <div className="flex-1">
                  <FormField icon={MapPin} label="Cidade" value={form.cidade} field="cidade" placeholder="Cidade" />
                </div>
                <div className="w-20">
                  <div className="flex items-start gap-3 text-sm">
                    <div className="flex-1">
                      <p className="text-muted-foreground text-xs mb-1">UF</p>
                      <Input value={form.estado} onChange={(e) => setForm(p => ({ ...p, estado: e.target.value }))}
                        placeholder="UF" className="h-8 text-sm" maxLength={2} />
                    </div>
                  </div>
                </div>
              </div>
              <FormField icon={Hash} label="CEP" value={form.cep} field="cep" placeholder="00000-000" />
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Observações</h4>
              <Textarea
                value={form.observacoes}
                onChange={(e) => setForm(p => ({ ...p, observacoes: e.target.value }))}
                placeholder="Informações importantes sobre o cliente..."
                rows={4}
              />
            </div>
          </div>
        ) : (
          <Tabs defaultValue="info" className="px-4 pb-6 flex-1 overflow-y-auto">
            <TabsList className="w-full grid grid-cols-4 mb-4">
              <TabsTrigger value="info" className="text-xs gap-1"><User className="w-3 h-3" />Info</TabsTrigger>
              <TabsTrigger value="pedidos" className="text-xs gap-1"><ShoppingBag className="w-3 h-3" />Pedidos</TabsTrigger>
              <TabsTrigger value="producao" className="text-xs gap-1"><Package className="w-3 h-3" />Produção</TabsTrigger>
              <TabsTrigger value="historico" className="text-xs gap-1"><Clock className="w-3 h-3" />Histórico</TabsTrigger>
            </TabsList>

            {/* Tab Info */}
            <TabsContent value="info" className="space-y-4 mt-0">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</h4>
                <InfoRow icon={Mail} label="Email" value={cliente.email} />
                <InfoRow icon={Phone} label="Telefone" value={cliente.telefone} />
                <InfoRow icon={MessageSquare} label="WhatsApp" value={cliente.whatsapp || contatoNumero} />
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Endereço</h4>
                <InfoRow icon={MapPin} label="Endereço" value={cliente.endereco} />
                <InfoRow icon={MapPin} label="Cidade/Estado" value={
                  [cliente.cidade, cliente.estado].filter(Boolean).join(' - ') || null
                } />
                <InfoRow icon={Hash} label="CEP" value={cliente.cep} />
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Informações Adicionais</h4>
                <InfoRow icon={Calendar} label="Cliente desde" value={
                  format(new Date(cliente.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                } />
                {contato?.tags && contato.tags.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Tag className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-xs">Tags</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {contato.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Observações</h4>
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 min-h-[60px]">
                  {cliente.observacoes || 'Nenhuma observação registrada.'}
                </p>
              </div>
            </TabsContent>

            {/* Tab Pedidos */}
            <TabsContent value="pedidos" className="mt-0">
              {pedidos.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum pedido encontrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pedidos.map((p) => (
                    <div key={p.id} className="bg-muted/30 rounded-lg p-3 border border-border/40">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">Pedido #{p.numero_pedido}</span>
                        <Badge variant="outline" className={cn('text-[10px]', statusColors[p.status] || '')}>
                          {p.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{format(new Date(p.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        <span className="font-medium text-foreground">
                          {Number(p.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab Produção */}
            <TabsContent value="producao" className="mt-0">
              {ordens.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma ordem de produção</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {ordens.map((op) => (
                    <div key={op.id} className="bg-muted/30 rounded-lg p-3 border border-border/40">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">OP #{op.numero_op}</span>
                        <Badge variant="outline" className={cn('text-[10px]', statusColors[op.status] || '')}>
                          {op.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{op.produto_nome}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <Badge variant="secondary" className="text-[10px]">{op.setor}</Badge>
                        <span>{format(new Date(op.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab Histórico */}
            <TabsContent value="historico" className="mt-0">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                <ClipboardList className="w-3 h-3" /> Orçamentos
              </h4>
              {orcamentos.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum orçamento encontrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orcamentos.map((o: any) => (
                    <div key={o.id} className="bg-muted/30 rounded-lg p-3 border border-border/40">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">Orçamento #{o.numero}</span>
                        <Badge variant="outline" className={cn('text-[10px]', statusColors[o.status] || '')}>
                          {o.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{format(new Date(o.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        <span className="font-medium text-foreground">
                          {Number(o.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ClientePerfilPanel;
