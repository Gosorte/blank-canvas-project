import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/use-tenant';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Search, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  nome: string;
  categoria: string;
  conteudo: string;
  variaveis: string[];
  atalho: string | null;
}

interface CrmTemplatePickerProps {
  contatoNome?: string | null;
  onSelect: (conteudo: string) => void;
}

const categoriaColors: Record<string, string> = {
  atendimento: 'bg-blue-500/15 text-blue-500',
  orcamento: 'bg-amber-500/15 text-amber-500',
  arte: 'bg-purple-500/15 text-purple-500',
  producao: 'bg-orange-500/15 text-orange-500',
  entrega: 'bg-emerald-500/15 text-emerald-500',
  geral: 'bg-muted text-muted-foreground',
};

const CrmTemplatePicker = ({ contatoNome, onSelect }: CrmTemplatePickerProps) => {
  const { activeTenantId } = useTenant();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [varValues, setVarValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && activeTenantId) {
      supabase
        .from('crm_mensagem_templates' as any)
        .select('id, nome, categoria, conteudo, variaveis, atalho')
        .eq('tenant_id', activeTenantId)
        .eq('ativo', true)
        .order('uso_count', { ascending: false })
        .then(({ data }) => setTemplates((data as unknown as Template[]) || []));
    }
  }, [open, activeTenantId]);

  const filtrados = templates.filter(t => {
    if (!search) return true;
    const term = search.toLowerCase();
    return t.nome.toLowerCase().includes(term) || t.atalho?.toLowerCase().includes(term);
  });

  const handleSelectTemplate = (t: Template) => {
    const preValues: Record<string, string> = {};
    if (contatoNome) preValues['nome'] = contatoNome;

    if (t.variaveis && t.variaveis.length > 0) {
      const unfilled = t.variaveis.filter(v => !preValues[v]);
      if (unfilled.length === 0) {
        let content = t.conteudo;
        t.variaveis.forEach(v => { content = content.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), preValues[v]); });
        onSelect(content);
        setOpen(false);
        return;
      }
      setVarValues(preValues);
      setSelectedTemplate(t);
    } else {
      onSelect(t.conteudo);
      setOpen(false);
    }
  };

  const handleInsertWithVars = () => {
    if (!selectedTemplate) return;
    let content = selectedTemplate.conteudo;
    (selectedTemplate.variaveis || []).forEach(v => {
      content = content.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), varValues[v] || `{{${v}}}`);
    });
    onSelect(content);
    setSelectedTemplate(null);
    setVarValues({});
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" title="Templates">
          <FileText className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start" side="top">
        {!selectedTemplate ? (
          <>
            <div className="p-3 border-b border-border/40">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="Buscar template..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-xs" autoFocus />
              </div>
            </div>
            <ScrollArea className="max-h-64">
              {filtrados.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">Nenhum template encontrado</div>
              ) : (
                <div className="divide-y divide-border/40">
                  {filtrados.map(t => (
                    <button key={t.id} className="w-full text-left p-3 hover:bg-muted/50 transition-colors" onClick={() => handleSelectTemplate(t)}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{t.nome}</span>
                        <Badge variant="secondary" className={cn('text-[9px] px-1 py-0', categoriaColors[t.categoria] || categoriaColors.geral)}>
                          {t.categoria}
                        </Badge>
                        {t.atalho && (
                          <span className="text-[9px] text-muted-foreground font-mono flex items-center gap-0.5 ml-auto">
                            <Zap className="w-2.5 h-2.5" />{t.atalho}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{t.conteudo}</p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <div className="p-3 space-y-3">
            <h4 className="text-sm font-semibold">{selectedTemplate.nome}</h4>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-md p-2 line-clamp-4">{selectedTemplate.conteudo}</p>
            <div className="space-y-2">
              {selectedTemplate.variaveis?.map(v => (
                <div key={v} className="space-y-1">
                  <Label className="text-[10px] font-mono text-primary">{`{{${v}}}`}</Label>
                  <Input value={varValues[v] || ''} onChange={e => setVarValues(prev => ({ ...prev, [v]: e.target.value }))} placeholder={v} className="h-8 text-xs" />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => setSelectedTemplate(null)}>Voltar</Button>
              <Button size="sm" className="flex-1 text-xs h-8" onClick={handleInsertWithVars}>Inserir</Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default CrmTemplatePicker;
