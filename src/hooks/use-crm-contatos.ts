import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CrmContato } from '@/types/crm';
import { toast } from 'sonner';

export const useCrmContatos = (tenantId?: string | null) => {
  const [contatos, setContatos] = useState<CrmContato[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContatos = async () => {
    if (!tenantId) { setContatos([]); setLoading(false); return; }

    const { data, error } = await supabase
      .from('crm_contatos' as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false });

    if (error) toast.error(error.message);
    else setContatos((data || []) as unknown as CrmContato[]);
    setLoading(false);
  };

  const atualizarContato = async (id: string, updates: Partial<CrmContato>) => {
    const { error } = await supabase.from('crm_contatos' as any).update(updates as any).eq('id', id);
    if (error) { toast.error(error.message); return false; }
    toast.success('Contato atualizado!');
    fetchContatos();
    return true;
  };

  const deletarContato = async (id: string) => {
    const { error } = await supabase.from('crm_contatos' as any).delete().eq('id', id);
    if (error) { toast.error(error.message); return false; }
    toast.success('Contato excluído!');
    fetchContatos();
    return true;
  };

  useEffect(() => {
    fetchContatos();

    if (!tenantId) return;

    const channel = supabase
      .channel(`crm-contatos-${tenantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_contatos' }, () => fetchContatos())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tenantId]);

  return { contatos, loading, atualizarContato, deletarContato, refetch: fetchContatos };
};
