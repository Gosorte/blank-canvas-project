import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageSquarePlus, Phone, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/use-tenant';
import { toast } from 'sonner';

interface NovaConversaTabProps {
  onConversaCriada: (id: string) => void;
}

const CrmNovaConversaTab = ({ onConversaCriada }: NovaConversaTabProps) => {
  const { activeTenantId } = useTenant();
  const [numero, setNumero] = useState('');
  const [nome, setNome] = useState('');
  const [buscaTerm, setBuscaTerm] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [criando, setCriando] = useState(false);

  const buscarConversas = async () => {
    if (!buscaTerm.trim() || !activeTenantId) return;
    setBuscando(true);
    const { data } = await supabase
      .from('crm_conversas' as any)
      .select('id, nome_contato, numero_contato, status')
      .eq('tenant_id', activeTenantId)
      .or(`nome_contato.ilike.%${buscaTerm}%,numero_contato.ilike.%${buscaTerm}%`)
      .limit(20);
    setResultados(data || []);
    setBuscando(false);
  };

  const criarConversa = async () => {
    if (!numero.trim() || !activeTenantId) {
      toast.error('Informe o número do contato');
      return;
    }
    setCriando(true);

    const { data: existing } = await supabase
      .from('crm_conversas' as any)
      .select('id')
      .eq('tenant_id', activeTenantId)
      .eq('numero_contato', numero.trim())
      .maybeSingle();

    if (existing) {
      onConversaCriada((existing as any).id);
      setCriando(false);
      return;
    }

    const { data, error } = await supabase
      .from('crm_conversas' as any)
      .insert({
        tenant_id: activeTenantId,
        whatsapp_id: numero.trim(),
        numero_contato: numero.trim(),
        nome_contato: nome.trim() || null,
        status: 'em_atendimento',
      } as any)
      .select('id')
      .single();

    if (error) {
      toast.error(error.message);
    } else if (data) {
      toast.success('Conversa criada!');
      onConversaCriada((data as any).id);
    }
    setCriando(false);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-3 border-b border-border/40 space-y-2">
        <Label className="text-xs text-muted-foreground font-medium">Buscar contato existente</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Nome ou número..."
              value={buscaTerm}
              onChange={(e) => setBuscaTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscarConversas()}
              className="pl-9 h-9 bg-muted/30 border-border/50 text-sm"
            />
          </div>
          <Button size="sm" variant="outline" onClick={buscarConversas} disabled={buscando} className="h-9">
            Buscar
          </Button>
        </div>
      </div>

      {resultados.length > 0 && (
        <ScrollArea className="max-h-48 border-b border-border/40">
          <div className="divide-y divide-border/40">
            {resultados.map((r: any) => (
              <button
                key={r.id}
                className="w-full text-left p-3 hover:bg-muted/50 transition-colors flex items-center gap-3"
                onClick={() => onConversaCriada(r.id)}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                  {r.nome_contato?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.nome_contato || r.numero_contato}</p>
                  <p className="text-xs text-muted-foreground">{r.numero_contato} • {r.status}</p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}

      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MessageSquarePlus className="w-4 h-4 text-primary" />
          Nova conversa
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Número *</Label>
            <Input placeholder="5511999999999" value={numero} onChange={(e) => setNumero(e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Nome (opcional)</Label>
            <Input placeholder="Nome do contato" value={nome} onChange={(e) => setNome(e.target.value)} className="h-9 text-sm" />
          </div>
          <Button onClick={criarConversa} disabled={criando} className="w-full" size="sm">
            <MessageSquarePlus className="w-4 h-4 mr-2" />Iniciar conversa
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CrmNovaConversaTab;
