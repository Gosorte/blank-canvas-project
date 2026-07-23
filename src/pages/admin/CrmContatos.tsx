import { useState } from 'react';
import { useCrmContatos } from '@/hooks/use-crm-contatos';
import { useTenant } from '@/hooks/use-tenant';
import { CrmContato } from '@/types/crm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BookUser, Search, Download, ArrowLeft, Phone, Mail, Tag, Calendar, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CrmContatosPage = () => {
  const { activeTenantId } = useTenant();
  const { contatos, loading, atualizarContato, deletarContato } = useCrmContatos(activeTenantId);
  const [searchTerm, setSearchTerm] = useState('');
  const [contatoSelecionado, setContatoSelecionado] = useState<string | null>(null);

  const contatosFiltrados = contatos.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return c.nome?.toLowerCase().includes(term) || c.numero?.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term) || c.tags?.some(t => t.toLowerCase().includes(term));
  });

  const contatoAtual = contatos.find(c => c.id === contatoSelecionado) || null;
  const showDetailOnMobile = contatoSelecionado !== null;

  const exportarCSV = () => {
    const headers = ['Nome', 'Número', 'Email', 'Tags', 'Total Conversas'];
    const rows = contatos.map(c => [c.nome || '', c.numero, c.email || '', (c.tags || []).join('; '), c.total_conversas]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'contatos.csv'; a.click();
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookUser className="w-6 h-6 text-primary" /> Agenda de Contatos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{contatos.length} contatos salvos</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportarCSV}>
          <Download className="w-4 h-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden px-6 pb-6 gap-4">
        {/* Lista */}
        <div className={cn(
          'w-full md:w-96 flex flex-col border rounded-xl bg-card overflow-hidden md:shrink-0',
          showDetailOnMobile ? 'hidden md:flex' : 'flex'
        )}>
          <div className="p-3 border-b border-border/40">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, número, tag..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 h-9 bg-muted/30 border-border/50 text-sm" />
            </div>
            <p className="text-xs text-muted-foreground mt-2 px-1">{contatosFiltrados.length} contato{contatosFiltrados.length !== 1 ? 's' : ''}</p>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
            ) : contatosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookUser className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-medium">Nenhum contato</h3>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {contatosFiltrados.map(c => (
                  <button key={c.id} className={cn('w-full text-left p-3 hover:bg-muted/50 transition-colors flex items-center gap-3', contatoSelecionado === c.id && 'bg-muted')} onClick={() => setContatoSelecionado(c.id)}>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={c.foto_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">{c.nome?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.nome || c.numero}</p>
                      <p className="text-xs text-muted-foreground">{c.numero}</p>
                      {c.tags?.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {c.tags.slice(0, 3).map(t => <Badge key={t} variant="secondary" className="text-[9px] px-1 py-0">{t}</Badge>)}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {c.total_conversas}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Detalhes */}
        <div className={cn('flex-1 border rounded-xl bg-card overflow-hidden', showDetailOnMobile ? 'flex flex-col' : 'hidden md:block')}>
          {showDetailOnMobile && (
            <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-border/40">
              <button onClick={() => setContatoSelecionado(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><ArrowLeft className="w-5 h-5" /></button>
              <span className="text-sm font-medium">Voltar</span>
            </div>
          )}
          {contatoAtual ? (
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-lg mx-auto space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={contatoAtual.foto_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">{contatoAtual.nome?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold">{contatoAtual.nome || 'Sem nome'}</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{contatoAtual.numero}</p>
                    {contatoAtual.email && <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{contatoAtual.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Conversas</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{contatoAtual.total_conversas}</p></CardContent></Card>
                  <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Última conversa</CardTitle></CardHeader><CardContent><p className="text-sm">{contatoAtual.ultima_conversa_at ? formatDistanceToNow(new Date(contatoAtual.ultima_conversa_at), { addSuffix: true, locale: ptBR }) : 'Nunca'}</p></CardContent></Card>
                </div>

                {contatoAtual.tags?.length > 0 && (
                  <div>
                    <Label className="text-xs flex items-center gap-1 mb-2"><Tag className="w-3.5 h-3.5" /> Tags</Label>
                    <div className="flex gap-1 flex-wrap">{contatoAtual.tags.map(t => <Badge key={t} variant="outline">{t}</Badge>)}</div>
                  </div>
                )}

                {contatoAtual.observacoes && (
                  <div>
                    <Label className="text-xs mb-2 block">Observações</Label>
                    <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{contatoAtual.observacoes}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <BookUser className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Selecione um contato</h3>
              <p className="text-sm text-muted-foreground mt-1">Detalhes aparecerão aqui</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrmContatosPage;
