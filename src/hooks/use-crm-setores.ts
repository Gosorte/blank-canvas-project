import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CrmSetor } from '@/types/crm';
import { toast } from 'sonner';

export const useCrmSetores = (tenantId?: string | null) => {
  const [setores, setSetores] = useState<CrmSetor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSetores = async () => {
    let query = supabase
      .from('crm_setores' as any)
      .select('*')
      .order('ordem');

    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query;
    if (error) {
      toast.error('Erro ao carregar setores');
    } else {
      setSetores((data || []) as unknown as CrmSetor[]);
    }
    setLoading(false);
  };

  const criarSetor = async (setor: Partial<CrmSetor>) => {
    const { error } = await supabase.from('crm_setores' as any).insert(setor as any);
    if (error) { toast.error(error.message); return false; }
    toast.success('Setor criado!');
    fetchSetores();
    return true;
  };

  const atualizarSetor = async (id: string, updates: Partial<CrmSetor>) => {
    const { error } = await supabase.from('crm_setores' as any).update(updates as any).eq('id', id);
    if (error) { toast.error(error.message); return false; }
    toast.success('Setor atualizado!');
    fetchSetores();
    return true;
  };

  const deletarSetor = async (id: string) => {
    const { error } = await supabase.from('crm_setores' as any).delete().eq('id', id);
    if (error) { toast.error(error.message); return false; }
    toast.success('Setor removido!');
    fetchSetores();
    return true;
  };

  useEffect(() => { fetchSetores(); }, [tenantId]);

  return { setores, loading, criarSetor, atualizarSetor, deletarSetor, refetch: fetchSetores };
};
