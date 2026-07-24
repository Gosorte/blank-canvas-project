export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      acabamentos: {
        Row: {
          ativo: boolean
          created_at: string
          custo_unitario: number
          id: string
          nome: string
          tenant_id: string
          tipo_cobranca: string
          tipo_modulo: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          custo_unitario?: number
          id?: string
          nome: string
          tenant_id: string
          tipo_cobranca?: string
          tipo_modulo: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          custo_unitario?: number
          id?: string
          nome?: string
          tenant_id?: string
          tipo_cobranca?: string
          tipo_modulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "acabamentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          ativo: boolean
          auth_user_id: string | null
          cep: string | null
          cidade: string | null
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          tenant_id: string
          tipo_pessoa: string
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean
          auth_user_id?: string | null
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          tenant_id: string
          tipo_pessoa?: string
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean
          auth_user_id?: string | null
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          tenant_id?: string
          tipo_pessoa?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_pagar: {
        Row: {
          categoria: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento: string | null
          fornecedor_id: string | null
          id: string
          observacoes: string | null
          status: string
          tenant_id: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          tenant_id: string
          valor?: number
        }
        Update: {
          categoria?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          tenant_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber: {
        Row: {
          cliente_id: string | null
          created_at: string
          data_recebimento: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          op_id: string | null
          status: string
          tenant_id: string
          valor: number
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data_recebimento?: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          op_id?: string | null
          status?: string
          tenant_id: string
          valor?: number
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data_recebimento?: string | null
          data_vencimento?: string
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          op_id?: string | null
          status?: string
          tenant_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_arquivos: {
        Row: {
          aprovado: boolean
          arquivo_url: string
          cliente_id: string
          created_at: string
          especificacoes: Json | null
          id: string
          nome_arquivo: string
          tenant_id: string
          tipo_produto: string | null
        }
        Insert: {
          aprovado?: boolean
          arquivo_url: string
          cliente_id: string
          created_at?: string
          especificacoes?: Json | null
          id?: string
          nome_arquivo: string
          tenant_id: string
          tipo_produto?: string | null
        }
        Update: {
          aprovado?: boolean
          arquivo_url?: string
          cliente_id?: string
          created_at?: string
          especificacoes?: Json | null
          id?: string
          nome_arquivo?: string
          tenant_id?: string
          tipo_produto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_arquivos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_arquivos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_atividades: {
        Row: {
          concluida: boolean
          created_at: string
          data_agendamento: string | null
          descricao: string
          id: string
          lead_id: string
          tenant_id: string
          tipo: string
        }
        Insert: {
          concluida?: boolean
          created_at?: string
          data_agendamento?: string | null
          descricao: string
          id?: string
          lead_id: string
          tenant_id: string
          tipo: string
        }
        Update: {
          concluida?: boolean
          created_at?: string
          data_agendamento?: string | null
          descricao?: string
          id?: string
          lead_id?: string
          tenant_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_atividades_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_atividades_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          cliente_id: string | null
          created_at: string
          email: string | null
          id: string
          motivo_perda: string | null
          nome: string
          observacoes: string | null
          origem: string
          responsavel_id: string | null
          setor: string | null
          status_funil: string
          telefone: string | null
          tenant_id: string
          tipo: string
          updated_at: string
          valor_estimado: number
          whatsapp: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          motivo_perda?: string | null
          nome: string
          observacoes?: string | null
          origem?: string
          responsavel_id?: string | null
          setor?: string | null
          status_funil?: string
          telefone?: string | null
          tenant_id: string
          tipo?: string
          updated_at?: string
          valor_estimado?: number
          whatsapp?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          motivo_perda?: string | null
          nome?: string
          observacoes?: string | null
          origem?: string
          responsavel_id?: string | null
          setor?: string | null
          status_funil?: string
          telefone?: string | null
          tenant_id?: string
          tipo?: string
          updated_at?: string
          valor_estimado?: number
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque: {
        Row: {
          ativo: boolean
          categoria: string
          created_at: string
          custo_unitario: number
          fornecedor_id: string | null
          id: string
          localizacao: string | null
          nome: string
          observacoes: string | null
          quantidade: number
          quantidade_minima: number
          tenant_id: string
          unidade: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria: string
          created_at?: string
          custo_unitario?: number
          fornecedor_id?: string | null
          id?: string
          localizacao?: string | null
          nome: string
          observacoes?: string | null
          quantidade?: number
          quantidade_minima?: number
          tenant_id: string
          unidade?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          custo_unitario?: number
          fornecedor_id?: string | null
          id?: string
          localizacao?: string | null
          nome?: string
          observacoes?: string | null
          quantidade?: number
          quantidade_minima?: number
          tenant_id?: string
          unidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_movimentacoes: {
        Row: {
          created_at: string
          estoque_id: string
          id: string
          motivo: string | null
          observacoes: string | null
          quantidade: number
          referencia_id: string | null
          tenant_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          estoque_id: string
          id?: string
          motivo?: string | null
          observacoes?: string | null
          quantidade: number
          referencia_id?: string | null
          tenant_id: string
          tipo: string
        }
        Update: {
          created_at?: string
          estoque_id?: string
          id?: string
          motivo?: string | null
          observacoes?: string | null
          quantidade?: number
          referencia_id?: string | null
          tenant_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_movimentacoes_estoque_id_fkey"
            columns: ["estoque_id"]
            isOneToOne: false
            referencedRelation: "estoque"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean
          categorias: string[] | null
          cidade: string | null
          cnpj: string | null
          condicao_pagamento: string | null
          contato_nome: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome_fantasia: string | null
          observacoes: string | null
          razao_social: string
          telefone: string | null
          tenant_id: string
        }
        Insert: {
          ativo?: boolean
          categorias?: string[] | null
          cidade?: string | null
          cnpj?: string | null
          condicao_pagamento?: string | null
          contato_nome?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome_fantasia?: string | null
          observacoes?: string | null
          razao_social: string
          telefone?: string | null
          tenant_id: string
        }
        Update: {
          ativo?: boolean
          categorias?: string[] | null
          cidade?: string | null
          cnpj?: string | null
          condicao_pagamento?: string | null
          contato_nome?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome_fantasia?: string | null
          observacoes?: string | null
          razao_social?: string
          telefone?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      insumos_precos: {
        Row: {
          created_at: string
          custo_base: number
          id: string
          markup_padrao: number
          nome_insumo: string
          tenant_id: string
          tipo_modulo: string
        }
        Insert: {
          created_at?: string
          custo_base?: number
          id?: string
          markup_padrao?: number
          nome_insumo: string
          tenant_id: string
          tipo_modulo: string
        }
        Update: {
          created_at?: string
          custo_base?: number
          id?: string
          markup_padrao?: number
          nome_insumo?: string
          tenant_id?: string
          tipo_modulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "insumos_precos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      loja_pedido_itens: {
        Row: {
          arquivo_url: string | null
          created_at: string
          especificacoes: Json | null
          id: string
          pedido_id: string
          produto_id: string | null
          produto_nome: string
          quantidade: number
          status_arquivo: string
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          arquivo_url?: string | null
          created_at?: string
          especificacoes?: Json | null
          id?: string
          pedido_id: string
          produto_id?: string | null
          produto_nome: string
          quantidade?: number
          status_arquivo?: string
          valor_total?: number
          valor_unitario?: number
        }
        Update: {
          arquivo_url?: string | null
          created_at?: string
          especificacoes?: Json | null
          id?: string
          pedido_id?: string
          produto_id?: string | null
          produto_nome?: string
          quantidade?: number
          status_arquivo?: string
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "loja_pedido_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "loja_pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loja_pedido_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      loja_pedidos: {
        Row: {
          cliente_id: string | null
          created_at: string
          forma_pagamento: string | null
          id: string
          numero_pedido: number
          observacoes: string | null
          op_id: string | null
          status: string
          tenant_id: string
          updated_at: string
          valor_total: number
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          forma_pagamento?: string | null
          id?: string
          numero_pedido?: number
          observacoes?: string | null
          op_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          valor_total?: number
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          forma_pagamento?: string | null
          id?: string
          numero_pedido?: number
          observacoes?: string | null
          op_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "loja_pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loja_pedidos_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loja_pedidos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      module_config: {
        Row: {
          has_crm_advanced: boolean
          has_digital: boolean
          has_offset: boolean
          has_visual: boolean
          id: string
          tenant_id: string
        }
        Insert: {
          has_crm_advanced?: boolean
          has_digital?: boolean
          has_offset?: boolean
          has_visual?: boolean
          id?: string
          tenant_id: string
        }
        Update: {
          has_crm_advanced?: boolean
          has_digital?: boolean
          has_offset?: boolean
          has_visual?: boolean
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      op_historico: {
        Row: {
          created_at: string
          id: string
          observacao: string | null
          op_id: string
          status_anterior: string | null
          status_novo: string
        }
        Insert: {
          created_at?: string
          id?: string
          observacao?: string | null
          op_id: string
          status_anterior?: string | null
          status_novo: string
        }
        Update: {
          created_at?: string
          id?: string
          observacao?: string | null
          op_id?: string
          status_anterior?: string | null
          status_novo?: string
        }
        Relationships: [
          {
            foreignKeyName: "op_historico_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_producao: {
        Row: {
          arquivo_url: string | null
          cliente_id: string | null
          created_at: string
          data_entrega: string | null
          especificacoes: Json | null
          id: string
          numero_op: number
          observacoes: string | null
          prioridade: string
          produto_nome: string
          quantidade: number
          setor: string
          status: string
          tenant_id: string
          updated_at: string
          valor_total: number
        }
        Insert: {
          arquivo_url?: string | null
          cliente_id?: string | null
          created_at?: string
          data_entrega?: string | null
          especificacoes?: Json | null
          id?: string
          numero_op?: number
          observacoes?: string | null
          prioridade?: string
          produto_nome: string
          quantidade?: number
          setor: string
          status?: string
          tenant_id: string
          updated_at?: string
          valor_total?: number
        }
        Update: {
          arquivo_url?: string | null
          cliente_id?: string | null
          created_at?: string
          data_entrega?: string | null
          especificacoes?: Json | null
          id?: string
          numero_op?: number
          observacoes?: string | null
          prioridade?: string
          produto_nome?: string
          quantidade?: number
          setor?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "ordens_producao_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      papeis: {
        Row: {
          altura_cm: number | null
          ativo: boolean
          created_at: string
          custo_folha: number
          custo_kg: number | null
          estoque_atual: number | null
          estoque_minimo: number | null
          formato: string | null
          gramatura: number
          id: string
          largura_cm: number | null
          nome: string
          tenant_id: string
          tipo: string
        }
        Insert: {
          altura_cm?: number | null
          ativo?: boolean
          created_at?: string
          custo_folha?: number
          custo_kg?: number | null
          estoque_atual?: number | null
          estoque_minimo?: number | null
          formato?: string | null
          gramatura?: number
          id?: string
          largura_cm?: number | null
          nome: string
          tenant_id: string
          tipo?: string
        }
        Update: {
          altura_cm?: number | null
          ativo?: boolean
          created_at?: string
          custo_folha?: number
          custo_kg?: number | null
          estoque_atual?: number | null
          estoque_minimo?: number | null
          formato?: string | null
          gramatura?: number
          id?: string
          largura_cm?: number | null
          nome?: string
          tenant_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "papeis_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          created_at: string
          has_crm_advanced: boolean
          has_digital: boolean
          has_offset: boolean
          has_visual: boolean
          id: string
          nome: string
          valor: number
        }
        Insert: {
          created_at?: string
          has_crm_advanced?: boolean
          has_digital?: boolean
          has_offset?: boolean
          has_visual?: boolean
          id?: string
          nome: string
          valor?: number
        }
        Update: {
          created_at?: string
          has_crm_advanced?: boolean
          has_digital?: boolean
          has_offset?: boolean
          has_visual?: boolean
          id?: string
          nome?: string
          valor?: number
        }
        Relationships: []
      }
      produtos: {
        Row: {
          area_minima_m2: number | null
          ativo: boolean
          cores_frente: number | null
          cores_verso: number | null
          created_at: string
          custo_acabamento: number | null
          custo_chapa: number | null
          custo_clique: number | null
          custo_estrutura: number | null
          custo_m2: number | null
          custo_milheiro: number | null
          custo_setup: number | null
          descricao: string | null
          dpi: number | null
          escala_minima: number | null
          id: string
          markup: number
          nome: string
          papel_id: string | null
          pecas_por_folha: number | null
          preco_minimo: number
          substrato: string | null
          substrato_id: string | null
          tenant_id: string
          tipo_modulo: string
        }
        Insert: {
          area_minima_m2?: number | null
          ativo?: boolean
          cores_frente?: number | null
          cores_verso?: number | null
          created_at?: string
          custo_acabamento?: number | null
          custo_chapa?: number | null
          custo_clique?: number | null
          custo_estrutura?: number | null
          custo_m2?: number | null
          custo_milheiro?: number | null
          custo_setup?: number | null
          descricao?: string | null
          dpi?: number | null
          escala_minima?: number | null
          id?: string
          markup?: number
          nome: string
          papel_id?: string | null
          pecas_por_folha?: number | null
          preco_minimo?: number
          substrato?: string | null
          substrato_id?: string | null
          tenant_id: string
          tipo_modulo: string
        }
        Update: {
          area_minima_m2?: number | null
          ativo?: boolean
          cores_frente?: number | null
          cores_verso?: number | null
          created_at?: string
          custo_acabamento?: number | null
          custo_chapa?: number | null
          custo_clique?: number | null
          custo_estrutura?: number | null
          custo_m2?: number | null
          custo_milheiro?: number | null
          custo_setup?: number | null
          descricao?: string | null
          dpi?: number | null
          escala_minima?: number | null
          id?: string
          markup?: number
          nome?: string
          papel_id?: string | null
          pecas_por_folha?: number | null
          preco_minimo?: number
          substrato?: string | null
          substrato_id?: string | null
          tenant_id?: string
          tipo_modulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_papel_id_fkey"
            columns: ["papel_id"]
            isOneToOne: false
            referencedRelation: "papeis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_substrato_id_fkey"
            columns: ["substrato_id"]
            isOneToOne: false
            referencedRelation: "substratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aprovado: boolean
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          nome: string
          tenant_id: string | null
        }
        Insert: {
          aprovado?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string
          id: string
          nome?: string
          tenant_id?: string | null
        }
        Update: {
          aprovado?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      substratos: {
        Row: {
          ativo: boolean
          created_at: string
          custo_m2: number
          estoque_m2: number | null
          estoque_minimo_m2: number | null
          id: string
          largura_max_m: number | null
          nome: string
          tenant_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          custo_m2?: number
          estoque_m2?: number | null
          estoque_minimo_m2?: number | null
          id?: string
          largura_max_m?: number | null
          nome: string
          tenant_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          custo_m2?: number
          estoque_m2?: number | null
          estoque_minimo_m2?: number | null
          id?: string
          largura_max_m?: number | null
          nome?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "substratos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          dominio: string | null
          gmv_mes: number
          id: string
          nome_grafica: string
          pedidos_mes: number
          plano_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          dominio?: string | null
          gmv_mes?: number
          id?: string
          nome_grafica: string
          pedidos_mes?: number
          plano_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          dominio?: string | null
          gmv_mes?: number
          id?: string
          nome_grafica?: string
          pedidos_mes?: number
          plano_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "superadmin" | "operador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["superadmin", "operador"],
    },
  },
} as const
