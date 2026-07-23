import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Orcamento {
  id: string;
  numero: number;
  total: number;
  status: string;
  created_at: string;
  criado_por: string | null;
  contato_id: string | null;
}

interface Conversa {
  id: string;
  setor_id: string | null;
  atendente_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Setor {
  id: string;
  nome: string;
  cor: string;
}

interface Profile {
  id: string;
  nome: string;
}

export interface FaturamentoSetor {
  setor: string;
  cor: string;
  total: number;
  qtdOrcamentos: number;
}

export interface ConversaoOrcamento {
  mes: string;
  total: number;
  aprovados: number;
  taxa: number;
  valorTotal: number;
  valorAprovado: number;
}

export interface ProdutividadeMembro {
  nome: string;
  userId: string;
  conversasAtendidas: number;
  orcamentosCriados: number;
  notaMedia: number | null;
}

export const useRelatoriosCRM = (tenantId: string | null, periodo: number = 30) => {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) { setLoading(false); return; }
    const desde = new Date();
    desde.setDate(desde.getDate() - periodo);
    const desdeISO = desde.toISOString();

    const load = async () => {
      setLoading(true);
      const [r1, r2, r3, r4] = await Promise.all([
        supabase.from('crm_orcamentos').select('id, numero, total, status, created_at, criado_por, contato_id').eq('tenant_id', tenantId).gte('created_at', desdeISO),
        supabase.from('crm_conversas').select('id, setor_id, atendente_id, status, created_at, updated_at').eq('tenant_id', tenantId).gte('created_at', desdeISO),
        supabase.from('crm_setores').select('id, nome, cor').eq('tenant_id', tenantId).eq('ativo', true),
        supabase.from('profiles').select('id, nome'),
      ]);
      setOrcamentos((r1.data as any) || []);
      setConversas((r2.data as any) || []);
      setSetores((r3.data as any) || []);
      setProfiles((r4.data as any) || []);
      setLoading(false);
    };
    load();
  }, [tenantId, periodo]);

  const faturamentoPorSetor = useMemo((): FaturamentoSetor[] => {
    const mapa: Record<string, { total: number; qtd: number }> = {};
    const conversaSetor: Record<string, string | null> = {};
    conversas.forEach(c => { conversaSetor[c.id] = c.setor_id; });

    orcamentos.filter(o => o.status === 'aprovado').forEach(o => {
      const key = '_geral';
      if (!mapa[key]) mapa[key] = { total: 0, qtd: 0 };
      mapa[key].total += Number(o.total) || 0;
      mapa[key].qtd += 1;
    });

    // Group by setor via conversa linkage
    const orcBySetor: Record<string, { total: number; qtd: number }> = {};
    orcamentos.filter(o => o.status === 'aprovado').forEach(o => {
      // Try to find setor through linked conversa
      const conv = conversas.find(c => c.id === (o as any).conversa_id);
      const setorId = conv?.setor_id || '_sem_setor';
      if (!orcBySetor[setorId]) orcBySetor[setorId] = { total: 0, qtd: 0 };
      orcBySetor[setorId].total += Number(o.total) || 0;
      orcBySetor[setorId].qtd += 1;
    });

    return Object.entries(orcBySetor).map(([key, v]) => {
      const setor = setores.find(s => s.id === key);
      return {
        setor: setor?.nome || 'Sem setor',
        cor: setor?.cor || '#6B7280',
        total: v.total,
        qtdOrcamentos: v.qtd,
      };
    }).sort((a, b) => b.total - a.total);
  }, [orcamentos, conversas, setores]);

  const conversaoOrcamentos = useMemo((): ConversaoOrcamento[] => {
    const mapa: Record<string, { total: number; aprovados: number; valorTotal: number; valorAprovado: number }> = {};
    orcamentos.forEach(o => {
      const d = new Date(o.created_at);
      const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!mapa[mes]) mapa[mes] = { total: 0, aprovados: 0, valorTotal: 0, valorAprovado: 0 };
      mapa[mes].total += 1;
      mapa[mes].valorTotal += Number(o.total) || 0;
      if (o.status === 'aprovado' || o.status === 'enviado') {
        mapa[mes].aprovados += 1;
        mapa[mes].valorAprovado += Number(o.total) || 0;
      }
    });
    return Object.entries(mapa)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, v]) => ({
        mes,
        ...v,
        taxa: v.total > 0 ? +(v.aprovados / v.total * 100).toFixed(1) : 0,
      }));
  }, [orcamentos]);

  const produtividadeEquipe = useMemo((): ProdutividadeMembro[] => {
    const membros: Record<string, ProdutividadeMembro> = {};

    const getOrCreate = (userId: string) => {
      if (!membros[userId]) {
        const p = profiles.find(pr => pr.id === userId);
        membros[userId] = {
          nome: p?.nome || 'Desconhecido',
          userId,
          conversasAtendidas: 0,
          orcamentosCriados: 0,
          notaMedia: null,
        };
      }
      return membros[userId];
    };

    conversas.forEach(c => {
      if (c.atendente_id) {
        getOrCreate(c.atendente_id).conversasAtendidas += 1;
      }
    });

    orcamentos.forEach(o => {
      if (o.criado_por) {
        getOrCreate(o.criado_por).orcamentosCriados += 1;
      }
    });

    return Object.values(membros).sort((a, b) => b.conversasAtendidas - a.conversasAtendidas);
  }, [conversas, orcamentos, profiles]);

  const totais = useMemo(() => ({
    faturamentoTotal: orcamentos.filter(o => o.status === 'aprovado').reduce((s, o) => s + (Number(o.total) || 0), 0),
    totalOrcamentos: orcamentos.length,
    totalConversas: conversas.length,
    ticketMedio: (() => {
      const aprovados = orcamentos.filter(o => o.status === 'aprovado');
      return aprovados.length > 0 ? aprovados.reduce((s, o) => s + (Number(o.total) || 0), 0) / aprovados.length : 0;
    })(),
  }), [orcamentos, conversas]);

  return { faturamentoPorSetor, conversaoOrcamentos, produtividadeEquipe, totais, loading, setores };
};
