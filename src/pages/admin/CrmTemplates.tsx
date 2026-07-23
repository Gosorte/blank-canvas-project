import { useState } from 'react';
import { useCrmTemplates } from '@/hooks/use-crm-templates';
import { useTenant } from '@/hooks/use-tenant';
import { CrmMensagemTemplate } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Pencil, Trash2, Search, Zap, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

const categorias = [
  { value: 'atendimento', label: 'Atendimento', cor: 'bg-blue-500/15 text-blue-500' },
  { value: 'orcamento', label: 'Orçamento', cor: 'bg-amber-500/15 text-amber-500' },
  { value: 'arte', label: 'Arte', cor: 'bg-purple-500/15 text-purple-500' },
  { value: 'producao', label: 'Produção', cor: 'bg-orange-500/15 text-orange-500' },
  { value: 'entrega', label: 'Entrega', cor: 'bg-emerald-500/15 text-emerald-500' },
  { value: 'geral', label: 'Geral', cor: 'bg-muted text-muted-foreground' },
];

const CrmTemplatesPage = () => {
  const { activeTenantId } = useTenant();
  const { templates, loading, criarTemplate, atualizarTemplate, deletarTemplate } = useCrmTemplates(activeTenantId);
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<CrmMensagemTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('geral');
  const [conteudo, setConteudo] = useState('');
  const [atalho, setAtalho] = useState('');

  const resetForm = () => { setNome(''); setCategoria('geral'); setConteudo(''); setAtalho(''); setEditando(null); };

  const openEdit = (t: CrmMensagemTemplate) => {
    setEditando(t); setNome(t.nome); setCategoria(t.categoria); setConteudo(t.conteudo); setAtalho(t.atalho || ''); setFormOpen(true);
  };

  const extractVars = (text: string) => {
    const matches = text.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
  };

  const handleSave = async () => {
    if (!nome.trim() || !conteudo.trim()) return;
    const vars = extractVars(conteudo);
    const data = { nome: nome.trim(), categoria, conteudo: conteudo.trim(), variaveis: vars, atalho: atalho.trim() || null };
    if (editando) await atualizarTemplate(editando.id, data);
    else await criarTemplate(data);
    setFormOpen(false); resetForm();
  };

  const filtrados = templates.filter(t => {
    if (filtroCategoria !== 'todas' && t.categoria !== filtroCategoria) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return t.nome.toLowerCase().includes(term) || t.conteudo.toLowerCase().includes(term);
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Templates de Mensagem
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{templates.length} templates • Use variáveis {'{{nome}}'} no conteúdo</p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Novo Template
        </Button>
      </div>

      <div className="px-6 flex-1 overflow-hidden flex flex-col gap-4 pb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar templates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {[{ value: 'todas', label: 'Todas' }, ...categorias].map(c => (
              <button
                key={c.value}
                onClick={() => setFiltroCategoria(c.value)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  filtroCategoria === c.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-lg">Nenhum template</h3>
              <p className="text-sm text-muted-foreground mt-1">Crie seu primeiro template de mensagem</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtrados.map(t => {
                const cat = categorias.find(c => c.value === t.categoria) || categorias[5];
                return (
                  <Card key={t.id} className="p-4 flex flex-col gap-3 hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold truncate">{t.nome}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={cn('text-[10px]', cat.cor)}>{cat.label}</Badge>
                          {t.atalho && <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5"><Zap className="w-3 h-3" /> {t.atalho}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(t.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4 bg-muted/30 rounded-md p-2">{t.conteudo.replace(/\{\{(\w+)\}\}/g, '[$1]')}</p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <div className="flex gap-1 flex-wrap">
                        {t.variaveis?.map(v => <span key={v} className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">{v}</span>)}
                      </div>
                      <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {t.uso_count}x</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editando ? 'Editar Template' : 'Novo Template'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome *</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Saudação inicial" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{categorias.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Atalho (opcional)</Label>
              <Input value={atalho} onChange={e => setAtalho(e.target.value)} placeholder="/ola" className="h-9 text-sm font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Conteúdo *</Label>
              <Textarea value={conteudo} onChange={e => setConteudo(e.target.value)} placeholder={'Olá {{nome}}! Como posso ajudar?'} rows={5} className="text-sm font-mono resize-none" />
              <p className="text-[10px] text-muted-foreground">Use {'{{variavel}}'} para campos dinâmicos</p>
            </div>
            {extractVars(conteudo).length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs text-muted-foreground mr-1">Variáveis:</span>
                {extractVars(conteudo).map(v => <Badge key={v} variant="secondary" className="text-[10px] font-mono bg-primary/10 text-primary">{v}</Badge>)}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={!nome.trim() || !conteudo.trim()}>{editando ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (deleteId) { await deletarTemplate(deleteId); setDeleteId(null); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CrmTemplatesPage;
