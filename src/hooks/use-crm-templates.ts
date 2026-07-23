import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CrmMensagemTemplate } from '@/types/crm';
import { toast } from 'sonner';

export const useCrmTemplates = (tenantId?: string | null) => {
  const [templates, setTemplates] = useState<CrmMensagemTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    if (!tenantId) { setTemplates([]); setLoading(false); return; }

    const { data, error } = await supabase
      .from('crm_mensagem_templates' as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('categoria')
      .order('nome');

    if (error) toast.error(error.message);
    else setTemplates((data || []) as unknown as CrmMensagemTemplate[]);
    setLoading(false);
  };

  const criarTemplate = async (template: Partial<CrmMensagemTemplate>) => {
    const { error } = await supabase.from('crm_mensagem_templates' as any).insert({ ...template, tenant_id: tenantId } as any);
    if (error) { toast.error(error.message); return false; }
    toast.success('Template criado!');
    fetchTemplates();
    return true;
  };

  const atualizarTemplate = async (id: string, updates: Partial<CrmMensagemTemplate>) => {
    const { error } = await supabase.from('crm_mensagem_templates' as any).update(updates as any).eq('id', id);
    if (error) { toast.error(error.message); return false; }
    toast.success('Template atualizado!');
    fetchTemplates();
    return true;
  };

  const deletarTemplate = async (id: string) => {
    const { error } = await supabase.from('crm_mensagem_templates' as any).delete().eq('id', id);
    if (error) { toast.error(error.message); return false; }
    toast.success('Template excluído!');
    fetchTemplates();
    return true;
  };

  useEffect(() => { fetchTemplates(); }, [tenantId]);

  return { templates, loading, criarTemplate, atualizarTemplate, deletarTemplate };
};
