import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CrmMensagem } from '@/types/crm';
import { useAuth } from './use-auth';
import { toast } from 'sonner';

export const useCrmMensagens = (conversaId: string | null, tenantId?: string | null) => {
  const [mensagens, setMensagens] = useState<CrmMensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMensagens = async () => {
    if (!conversaId) { setMensagens([]); setLoading(false); return; }

    const { data, error } = await supabase
      .from('crm_mensagens' as any)
      .select('*')
      .eq('conversa_id', conversaId)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Erro ao carregar mensagens');
    } else {
      setMensagens((data || []) as unknown as CrmMensagem[]);
    }
    setLoading(false);
  };

  const enviarMensagem = async (conteudo: string) => {
    if (!conversaId || !conteudo.trim()) return null;

    const { data, error } = await supabase
      .from('crm_mensagens' as any)
      .insert({
        tenant_id: tenantId,
        conversa_id: conversaId,
        conteudo: conteudo.trim(),
        tipo: 'texto',
        direcao: 'saida',
        enviado_por: user?.id,
      } as any)
      .select()
      .single();

    if (error) { toast.error(error.message); return null; }

    // Update conversation last message
    await supabase
      .from('crm_conversas' as any)
      .update({
        ultima_mensagem: conteudo.trim(),
        ultima_mensagem_at: new Date().toISOString(),
      } as any)
      .eq('id', conversaId);

    return data;
  };

  const marcarComoLido = async () => {
    if (!conversaId) return;
    await supabase
      .from('crm_mensagens' as any)
      .update({ lido: true } as any)
      .eq('conversa_id', conversaId)
      .eq('direcao', 'entrada')
      .eq('lido', false);
  };

  useEffect(() => {
    fetchMensagens();

    if (!conversaId) return;

    const channel = supabase
      .channel(`crm-mensagens-${conversaId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'crm_mensagens',
        filter: `conversa_id=eq.${conversaId}`,
      }, (payload) => {
        setMensagens(prev => [...prev, payload.new as unknown as CrmMensagem]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversaId]);

  return { mensagens, loading, enviarMensagem, marcarComoLido, refetch: fetchMensagens };
};
