import { useState, useRef, useEffect } from 'react';
import { CrmConversa, CrmSetor } from '@/types/crm';
import { useCrmMensagens } from '@/hooks/use-crm-mensagens';
import { useCrmSetores } from '@/hooks/use-crm-setores';
import { useTenant } from '@/hooks/use-tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Send, ArrowRightLeft, CheckCircle, UserPlus, Phone, MessageSquare, User, FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import CrmTemplatePicker from './CrmTemplatePicker';
import ClientePerfilPanel from './ClientePerfilPanel';

interface ChatAreaProps {
  conversa: (CrmConversa & { setor: CrmSetor | null }) | null;
  onTransferir: (conversaId: string, setorId: string, motivo?: string) => Promise<boolean>;
  onAssumir: (conversaId: string) => Promise<boolean>;
  onFinalizar: (conversaId: string) => Promise<boolean>;
}

const CrmChatArea = ({ conversa, onTransferir, onAssumir, onFinalizar }: ChatAreaProps) => {
  const { activeTenantId } = useTenant();
  const [mensagemInput, setMensagemInput] = useState('');
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [setorDestino, setSetorDestino] = useState('');
  const [motivoTransfer, setMotivoTransfer] = useState('');
  const [perfilOpen, setPerfilOpen] = useState(false);
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const previousConversaIdRef = useRef<string | null>(null);
  const shouldAutoScrollRef = useRef(true);

  const { mensagens, enviarMensagem, marcarComoLido } = useCrmMensagens(conversa?.id || null, activeTenantId);
  const { setores } = useCrmSetores(activeTenantId);

  useEffect(() => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;

    const conversaAtualId = conversa?.id || null;
    const conversaMudou = previousConversaIdRef.current !== conversaAtualId;
    previousConversaIdRef.current = conversaAtualId;

    if (!conversaMudou && !shouldAutoScrollRef.current) return;

    viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
  }, [mensagens.length, conversa?.id]);

  const handleMessagesScroll = () => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;

    const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 100;
  };

  useEffect(() => {
    if (conversa) marcarComoLido();
  }, [conversa?.id]);

  const handleEnviar = async () => {
    if (!mensagemInput.trim()) return;
    await enviarMensagem(mensagemInput);
    setMensagemInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar(); }
  };

  const handleTransferir = async () => {
    if (!conversa || !setorDestino) return;
    const success = await onTransferir(conversa.id, setorDestino, motivoTransfer);
    if (success) { setTransferModalOpen(false); setSetorDestino(''); setMotivoTransfer(''); }
  };

  if (!conversa) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-muted/30">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <MessageSquare className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-xl font-medium">Atendimento CRM</h3>
        <p className="text-muted-foreground mt-2">Selecione uma conversa para começar o atendimento</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 h-16 shrink-0 border-b border-border/40 px-4 flex items-center justify-between bg-card z-20">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={conversa.foto_contato || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {conversa.nome_contato?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-medium">{conversa.nome_contato || conversa.numero_contato || 'Desconhecido'}</h4>
            <div className="flex items-center gap-2">
              {conversa.numero_contato && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3" />{conversa.numero_contato}
                </span>
              )}
              {conversa.setor && (
                <Badge variant="outline" className="text-xs" style={{ borderColor: conversa.setor.cor, color: conversa.setor.cor }}>
                  {conversa.setor.nome}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" onClick={() => setPerfilOpen(true)}>
                  <User className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">Ver perfil</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm">
                  <FileText className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">Orçamento</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" onClick={() => onAssumir(conversa.id)}>
                  <UserPlus className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">Assumir</p></TooltipContent>
            </Tooltip>
            {conversa.status !== 'finalizado' && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" onClick={() => setTransferModalOpen(true)}>
                      <ArrowRightLeft className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">Transferir</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm text-destructive hover:text-destructive" onClick={() => onFinalizar(conversa.id)}>
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">Finalizar</p></TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </TooltipProvider>
      </div>

      {/* Messages */}
      <div
        ref={messagesViewportRef}
        onScroll={handleMessagesScroll}
        className="flex-1 min-h-0 overflow-y-auto scrollbar-none overscroll-y-contain p-4 bg-muted/20"
      >
        <div className="space-y-4 max-w-3xl mx-auto">
          {mensagens.map((mensagem) => (
            <div
              key={mensagem.id}
              className={cn(
                'flex',
                mensagem.direcao === 'entrada' ? 'justify-start' : 'justify-end',
                mensagem.direcao === 'sistema' && 'justify-center'
              )}
            >
              {mensagem.direcao === 'sistema' ? (
                <div className="bg-muted px-4 py-2 rounded-lg text-sm text-muted-foreground">{mensagem.conteudo}</div>
              ) : (
                <div className={cn(
                  'max-w-[70%] px-4 py-2 rounded-2xl',
                  mensagem.direcao === 'entrada'
                    ? 'bg-card rounded-bl-sm border border-border/40'
                    : 'bg-primary text-primary-foreground rounded-br-sm'
                )}>
                  <p className="whitespace-pre-wrap break-words">{mensagem.conteudo}</p>
                  <p className={cn(
                    'text-xs mt-1',
                    mensagem.direcao === 'entrada' ? 'text-muted-foreground' : 'text-primary-foreground/70'
                  )}>
                    {format(new Date(mensagem.created_at), 'HH:mm', { locale: ptBR })}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/40 bg-card shrink-0">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <CrmTemplatePicker
            contatoNome={conversa.nome_contato}
            onSelect={(content) => setMensagemInput(content)}
          />
          <Input
            placeholder="Digite sua mensagem..."
            value={mensagemInput}
            onChange={(e) => setMensagemInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button onClick={handleEnviar} disabled={!mensagemInput.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Transfer Modal */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Transferir conversa</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Setor de destino</Label>
              <div className="grid grid-cols-2 gap-2">
                {setores.filter(s => s.ativo && s.id !== conversa.setor_id).map((setor) => (
                  <Button
                    key={setor.id}
                    variant={setorDestino === setor.id ? 'default' : 'outline'}
                    className="justify-start gap-2"
                    onClick={() => setSetorDestino(setor.id)}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: setor.cor }} />
                    {setor.nome}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Textarea placeholder="Descreva o motivo da transferência..." value={motivoTransfer} onChange={(e) => setMotivoTransfer(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleTransferir} disabled={!setorDestino}>Transferir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Perfil do Cliente */}
      <ClientePerfilPanel
        open={perfilOpen}
        onOpenChange={setPerfilOpen}
        contatoId={conversa.contato_id}
        contatoNome={conversa.nome_contato}
        contatoFoto={conversa.foto_contato}
        contatoNumero={conversa.numero_contato}
      />
    </div>
  );
};

export default CrmChatArea;
