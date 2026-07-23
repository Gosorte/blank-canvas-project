import { CrmConversa, CrmSetor } from '@/types/crm';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

interface ConversasListProps {
  conversas: (CrmConversa & { setor: CrmSetor | null })[];
  conversaSelecionada: string | null;
  onSelectConversa: (id: string) => void;
  loading: boolean;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  aguardando: { label: 'Aguardando', color: 'bg-yellow-500' },
  em_atendimento: { label: 'Em atendimento', color: 'bg-green-500' },
  finalizado: { label: 'Finalizado', color: 'bg-muted-foreground' },
  transferido: { label: 'Transferido', color: 'bg-blue-500' },
};

const CrmConversasList = ({ conversas, conversaSelecionada, onSelectConversa, loading }: ConversasListProps) => {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (conversas.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="font-medium text-lg">Nenhuma conversa</h3>
        <p className="text-sm text-muted-foreground mt-1">As conversas aparecerão aqui quando chegarem</p>
      </div>
    );
  }

  return (
      <div className="flex-1 overflow-y-auto scrollbar-none overscroll-y-contain">
        <div className="divide-y divide-border/40">
          {conversas.map((conversa) => {
            const status = statusConfig[conversa.status] || statusConfig.aguardando;
            const isFinalizado = conversa.status === 'finalizado';
            return (
              <div
                key={conversa.id}
                className={cn(
                  'p-3 cursor-pointer hover:bg-muted/50 transition-colors group',
                  conversaSelecionada === conversa.id && 'bg-muted'
                )}
                onClick={() => onSelectConversa(conversa.id)}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarImage src={conversa.foto_contato || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {conversa.nome_contato?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium truncate text-sm">
                        {conversa.nome_contato || conversa.numero_contato || 'Desconhecido'}
                      </h4>
                      {conversa.ultima_mensagem_at && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(conversa.ultima_mensagem_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {conversa.ultima_mensagem || 'Sem mensagens'}
                    </p>
                    <div className="flex items-center mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className={cn('w-1.5 h-1.5 rounded-full', status.color)} />
                        <span className="text-[10px] text-muted-foreground">{status.label}</span>
                        {conversa.setor && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4" style={{ borderColor: conversa.setor.cor, color: conversa.setor.cor }}>
                            {conversa.setor.nome}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
  );
};

export default CrmConversasList;
