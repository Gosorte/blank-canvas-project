import { useState } from 'react';
import { useCrmConversas } from '@/hooks/use-crm-conversas';
import { useTenant } from '@/hooks/use-tenant';
import CrmConversasList from '@/components/crm/CrmConversasList';
import CrmChatArea from '@/components/crm/CrmChatArea';
import CrmNovaConversaTab from '@/components/crm/CrmNovaConversaTab';
import { Input } from '@/components/ui/input';
import { Search, MessageCircle, Clock, CheckCircle2, Plus, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'ativos' | 'aguardando' | 'finalizados' | 'novo';

const tabs: { key: TabType; label: string; icon: React.ReactNode; activeColor: string }[] = [
  { key: 'novo', label: 'Nova conversa', icon: <Plus className="w-5 h-5" />, activeColor: 'text-primary' },
  { key: 'finalizados', label: 'Finalizados', icon: <CheckCircle2 className="w-5 h-5" />, activeColor: 'text-blue-500' },
  { key: 'ativos', label: 'Ativos', icon: <MessageCircle className="w-5 h-5" />, activeColor: 'text-emerald-500' },
  { key: 'aguardando', label: 'Aguardando', icon: <Clock className="w-5 h-5" />, activeColor: 'text-amber-500' },
];

const ConversasPage = () => {
  const { activeTenantId } = useTenant();
  const [conversaSelecionada, setConversaSelecionada] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('ativos');

  const { conversas, loading, transferirConversa, assumirConversa, finalizarConversa } =
    useCrmConversas(activeTenantId);

  const conversasFiltradas = conversas.filter((c) => {
    if (activeTab === 'ativos' && c.status !== 'em_atendimento') return false;
    if (activeTab === 'aguardando' && c.status !== 'aguardando' && c.status !== 'transferido') return false;
    if (activeTab === 'finalizados' && c.status !== 'finalizado') return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.nome_contato?.toLowerCase().includes(term) ||
      c.numero_contato?.toLowerCase().includes(term) ||
      c.ultima_mensagem?.toLowerCase().includes(term)
    );
  });

  const conversaAtual = conversas.find((c) => c.id === conversaSelecionada) || null;

  const countByTab = {
    ativos: conversas.filter(c => c.status === 'em_atendimento').length,
    aguardando: conversas.filter(c => c.status === 'aguardando' || c.status === 'transferido').length,
    finalizados: conversas.filter(c => c.status === 'finalizado').length,
    novo: 0,
  };

  const showChatOnMobile = conversaSelecionada !== null;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* List panel */}
      <div className={cn(
        'w-full md:w-80 border-r border-border/40 flex flex-col bg-card/30 md:shrink-0 overflow-hidden min-h-0',
        showChatOnMobile ? 'hidden md:flex' : 'flex'
      )}>
        {/* Tab Bar */}
        <div className="bg-background/60 backdrop-blur-md shrink-0">
          <div className="relative grid grid-cols-2 grid-rows-2 gap-0 bg-muted/50 overflow-hidden">
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-primary/40 -translate-x-1/2 z-10" />
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-primary/40 -translate-y-1/2 z-10" />

            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const count = countByTab[tab.key];
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setConversaSelecionada(null); }}
                  className={cn(
                    'relative flex items-center justify-center gap-2 py-3.5 px-3 text-sm font-semibold transition-all duration-200 z-20',
                    isActive ? 'bg-background/80 text-foreground shadow-inner' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                  )}
                >
                  <span className={cn('transition-colors duration-200', isActive ? tab.activeColor : '')}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {tab.key !== 'novo' && count > 0 && (
                    <span className={cn(
                      'min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1',
                      isActive ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' : 'bg-muted text-muted-foreground'
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab !== 'novo' ? (
          <>
            <div className="px-3 py-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                <Input
                  placeholder="Buscar conversa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8 bg-muted/20 border-border/30 text-sm rounded-lg placeholder:text-muted-foreground/40 focus:bg-muted/30"
                />
              </div>
            </div>
            <CrmConversasList
              conversas={conversasFiltradas}
              conversaSelecionada={conversaSelecionada}
              onSelectConversa={setConversaSelecionada}
              loading={loading}
            />
          </>
        ) : (
          <CrmNovaConversaTab
            onConversaCriada={(id) => {
              setConversaSelecionada(id);
              setActiveTab('ativos');
            }}
          />
        )}
      </div>

      {/* Chat panel */}
      <div className={cn(
        'flex-1 flex flex-col min-h-0',
        showChatOnMobile ? 'flex' : 'hidden md:flex'
      )}>
        {showChatOnMobile && (
          <div className="md:hidden flex items-center gap-3 px-3 py-2.5 border-b border-border/30 bg-background/80 backdrop-blur-xl">
            <button onClick={() => setConversaSelecionada(null)} className="p-1.5 rounded-xl hover:bg-muted/60 transition-colors active:scale-95">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold truncate block">
                {conversaAtual?.nome_contato || conversaAtual?.numero_contato || 'Conversa'}
              </span>
            </div>
          </div>
        )}
        <CrmChatArea
          conversa={conversaAtual}
          onTransferir={transferirConversa}
          onAssumir={assumirConversa}
          onFinalizar={finalizarConversa}
        />
      </div>
    </div>
  );
};

export default ConversasPage;
