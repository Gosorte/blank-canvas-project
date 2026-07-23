export interface CrmSetor {
  id: string;
  tenant_id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface CrmContato {
  id: string;
  tenant_id: string;
  cliente_id: string | null;
  nome: string | null;
  numero: string;
  email: string | null;
  foto_url: string | null;
  observacoes: string | null;
  tags: string[];
  ultima_conversa_at: string | null;
  total_conversas: number;
  created_at: string;
  updated_at: string;
}

export interface CrmConversa {
  id: string;
  tenant_id: string;
  whatsapp_id: string | null;
  contato_id: string | null;
  nome_contato: string | null;
  numero_contato: string | null;
  foto_contato: string | null;
  setor_id: string | null;
  atendente_id: string | null;
  status: 'aguardando' | 'em_atendimento' | 'finalizado' | 'transferido';
  ultima_mensagem: string | null;
  ultima_mensagem_at: string | null;
  created_at: string;
  updated_at: string;
  setor?: CrmSetor | null;
}

export interface CrmMensagem {
  id: string;
  tenant_id: string;
  conversa_id: string;
  whatsapp_msg_id: string | null;
  conteudo: string;
  tipo: 'texto' | 'imagem' | 'audio' | 'documento' | 'video';
  direcao: 'entrada' | 'saida' | 'sistema';
  enviado_por: string | null;
  lido: boolean;
  created_at: string;
}

export interface CrmMensagemTemplate {
  id: string;
  tenant_id: string;
  nome: string;
  categoria: string;
  conteudo: string;
  variaveis: string[];
  atalho: string | null;
  ativo: boolean;
  uso_count: number;
  created_at: string;
  updated_at: string;
}

export interface CrmOrcamento {
  id: string;
  tenant_id: string;
  numero: number;
  contato_id: string | null;
  conversa_id: string | null;
  cliente_id: string | null;
  criado_por: string | null;
  status: 'rascunho' | 'enviado' | 'aprovado' | 'recusado' | 'expirado';
  subtotal: number;
  desconto_percentual: number;
  desconto_valor: number;
  total: number;
  validade_dias: number;
  prazo_entrega: string | null;
  observacoes: string | null;
  condicoes: string | null;
  created_at: string;
  updated_at: string;
  contato?: { id: string; nome: string | null; numero: string } | null;
}

export interface CrmOrcamentoItem {
  id: string;
  orcamento_id: string;
  produto_id: string | null;
  descricao: string;
  quantidade: number;
  unidade: string;
  preco_unitario: number;
  subtotal: number;
  ordem: number;
}
