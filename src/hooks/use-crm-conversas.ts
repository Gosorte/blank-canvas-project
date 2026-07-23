import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CrmConversa, CrmSetor } from '@/types/crm';
import { useAuth } from './use-auth';
import { toast } from 'sonner';

export const useCrmConversas = (tenantId?: string | null, setorFiltro?: string | null) => {
  const [conversas, setConversas] = useState<(CrmConversa & { setor: CrmSetor | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchConversas = async () => {
    if (!tenantId) { setConversas([]); setLoading(false); return; }

    let query = supabase
      .from('crm_conversas' as any)
      .select('*, setor:crm_setores(*)')
      .eq('tenant_id', tenantId)
      .order('ultima_mensagem_at', { ascending: false });

    if (setorFiltro) query = query.eq('setor_id', setorFiltro);

    const { data, error } = await query;
    if (error) {
      toast.error('Erro ao carregar conversas');
    } else {
      setConversas((data || []) as unknown as (CrmConversa & { setor: CrmSetor | null })[]);
    }
    setLoading(false);
  };

  const transferirConversa = async (conversaId: string, setorDestinoId: string, motivo?: string) => {
    const conversa = conversas.find(c => c.id === conversaId);

    await supabase.from('crm_transferencias' as any).insert({
      tenant_id: tenantId,
      conversa_id: conversaId,
      setor_origem_id: conversa?.setor_id,
      setor_destino_id: setorDestinoId,
      atendente_origem_id: user?.id,
      motivo,
    } as any);

    const { error } = await supabase
      .from('crm_conversas' as any)
      .update({ setor_id: setorDestinoId, status: 'transferido', atendente_id: null } as any)
      .eq('id', conversaId);

    if (error) { toast.error(error.message); return false; }
    toast.success('Conversa transferida!');
    fetchConversas();
    return true;
  };

  const assumirConversa = async (conversaId: string) => {
    const { error } = await supabase
      .from('crm_conversas' as any)
      .update({ atendente_id: user?.id, status: 'em_atendimento' } as any)
      .eq('id', conversaId);

    if (error) { toast.error(error.message); return false; }
    toast.success('Você assumiu esta conversa!');
    fetchConversas();
    return true;
  };

  const finalizarConversa = async (conversaId: string) => {
    const { error } = await supabase
      .from('crm_conversas' as any)
      .update({ status: 'finalizado' } as any)
      .eq('id', conversaId);

    if (error) { toast.error(error.message); return false; }

    // Send system message
    await supabase.from('crm_mensagens' as any).insert({
      tenant_id: tenantId,
      conversa_id: conversaId,
      conteudo: '📋 Conversa finalizada',
      direcao: 'sistema',
      tipo: 'texto',
    } as any);

    toast.success('Conversa finalizada!');
    fetchConversas();
    return true;
  };

  const criarConversa = async (data: { numero: string; nome?: string }) => {
    // Check existing
    const { data: existing } = await supabase
      .from('crm_conversas' as any)
      .select('id')
      .eq('tenant_id', tenantId!)
      .eq('numero_contato', data.numero)
      .maybeSingle();

    if (existing) return (existing as any).id;

    const { data: nova, error } = await supabase
      .from('crm_conversas' as any)
      .insert({
        tenant_id: tenantId,
        whatsapp_id: data.numero,
        numero_contato: data.numero,
        nome_contato: data.nome || null,
        status: 'em_atendimento',
      } as any)
      .select('id')
      .single();

    if (error) { toast.error(error.message); return null; }
    toast.success('Conversa criada!');
    fetchConversas();
    return (nova as any).id;
  };

  useEffect(() => {
    fetchConversas();

    if (!tenantId) return;

    const channel = supabase
      .channel(`crm-conversas-${tenantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_conversas' }, () => fetchConversas())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tenantId, setorFiltro]);

  return { conversas, loading, transferirConversa, assumirConversa, finalizarConversa, criarConversa, refetch: fetchConversas };
};
