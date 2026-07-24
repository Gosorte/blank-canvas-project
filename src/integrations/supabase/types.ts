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
      calendar_events: {
        Row: {
          categoria: string
          concluido_em: string | null
          cor: string | null
          created_at: string
          criado_por: string | null
          data_evento: string
          descricao: string | null
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          local: string | null
          prioridade: string
          status: string
          tenant_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria?: string
          concluido_em?: string | null
          cor?: string | null
          created_at?: string
          criado_por?: string | null
          data_evento: string
          descricao?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          local?: string | null
          prioridade?: string
          status?: string
          tenant_id: string
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          concluido_em?: string | null
          cor?: string | null
          created_at?: string
          criado_por?: string | null
          data_evento?: string
          descricao?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          local?: string | null
          prioridade?: string
          status?: string
          tenant_id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cargos: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          permissoes: string[]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          permissoes?: string[]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          permissoes?: string[]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cargos_tenant_id_fkey"
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
          contato_nome: string | null
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          origem: string | null
          razao_social: string | null
          roles: string[]
          segmento: string | null
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
          contato_nome?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          origem?: string | null
          razao_social?: string | null
          roles?: string[]
          segmento?: string | null
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
          contato_nome?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          origem?: string | null
          razao_social?: string | null
          roles?: string[]
          segmento?: string | null
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
      credit_transactions: {
        Row: {
          cliente_id: string
          created_at: string
          credit_account_id: string
          descricao: string | null
          id: string
          saldo_apos: number
          tenant_id: string
          tipo_transacao: string
          usuario_id: string | null
          valor: number
        }
        Insert: {
          cliente_id: string
          created_at?: string
          credit_account_id: string
          descricao?: string | null
          id?: string
          saldo_apos?: number
          tenant_id: string
          tipo_transacao?: string
          usuario_id?: string | null
          valor?: number
        }
        Update: {
          cliente_id?: string
          created_at?: string
          credit_account_id?: string
          descricao?: string | null
          id?: string
          saldo_apos?: number
          tenant_id?: string
          tipo_transacao?: string
          usuario_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_credit_account_id_fkey"
            columns: ["credit_account_id"]
            isOneToOne: false
            referencedRelation: "customer_credits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_ai_config: {
        Row: {
          analise_notas: Json | null
          created_at: string
          id: string
          prompt_classificacao: string | null
          saudacao: string | null
          survey_emojis: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          analise_notas?: Json | null
          created_at?: string
          id?: string
          prompt_classificacao?: string | null
          saudacao?: string | null
          survey_emojis?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          analise_notas?: Json | null
          created_at?: string
          id?: string
          prompt_classificacao?: string | null
          saudacao?: string | null
          survey_emojis?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_ai_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
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
      crm_avaliacoes: {
        Row: {
          atendente_id: string | null
          comentario: string | null
          contato_id: string | null
          conversa_id: string
          created_at: string
          id: string
          nota: number
          tenant_id: string
        }
        Insert: {
          atendente_id?: string | null
          comentario?: string | null
          contato_id?: string | null
          conversa_id: string
          created_at?: string
          id?: string
          nota: number
          tenant_id: string
        }
        Update: {
          atendente_id?: string | null
          comentario?: string | null
          contato_id?: string | null
          conversa_id?: string
          created_at?: string
          id?: string
          nota?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_avaliacoes_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "crm_contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_avaliacoes_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "crm_conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_avaliacoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contatos: {
        Row: {
          cliente_id: string | null
          created_at: string
          email: string | null
          foto_url: string | null
          id: string
          nome: string | null
          numero: string
          observacoes: string | null
          tags: string[] | null
          tenant_id: string
          total_conversas: number
          ultima_conversa_at: string | null
          updated_at: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          email?: string | null
          foto_url?: string | null
          id?: string
          nome?: string | null
          numero: string
          observacoes?: string | null
          tags?: string[] | null
          tenant_id: string
          total_conversas?: number
          ultima_conversa_at?: string | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          email?: string | null
          foto_url?: string | null
          id?: string
          nome?: string | null
          numero?: string
          observacoes?: string | null
          tags?: string[] | null
          tenant_id?: string
          total_conversas?: number
          ultima_conversa_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contatos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contatos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_conversas: {
        Row: {
          atendente_id: string | null
          contato_id: string | null
          created_at: string
          foto_contato: string | null
          id: string
          nome_contato: string | null
          numero_contato: string | null
          setor_id: string | null
          status: string
          tenant_id: string
          ultima_mensagem: string | null
          ultima_mensagem_at: string | null
          updated_at: string
          whatsapp_id: string | null
        }
        Insert: {
          atendente_id?: string | null
          contato_id?: string | null
          created_at?: string
          foto_contato?: string | null
          id?: string
          nome_contato?: string | null
          numero_contato?: string | null
          setor_id?: string | null
          status?: string
          tenant_id: string
          ultima_mensagem?: string | null
          ultima_mensagem_at?: string | null
          updated_at?: string
          whatsapp_id?: string | null
        }
        Update: {
          atendente_id?: string | null
          contato_id?: string | null
          created_at?: string
          foto_contato?: string | null
          id?: string
          nome_contato?: string | null
          numero_contato?: string | null
          setor_id?: string | null
          status?: string
          tenant_id?: string
          ultima_mensagem?: string | null
          ultima_mensagem_at?: string | null
          updated_at?: string
          whatsapp_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_conversas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "crm_contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_conversas_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "crm_setores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_conversas_tenant_id_fkey"
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
      crm_mensagem_templates: {
        Row: {
          atalho: string | null
          ativo: boolean
          categoria: string
          conteudo: string
          created_at: string
          id: string
          nome: string
          tenant_id: string
          updated_at: string
          uso_count: number
          variaveis: string[] | null
        }
        Insert: {
          atalho?: string | null
          ativo?: boolean
          categoria?: string
          conteudo: string
          created_at?: string
          id?: string
          nome: string
          tenant_id: string
          updated_at?: string
          uso_count?: number
          variaveis?: string[] | null
        }
        Update: {
          atalho?: string | null
          ativo?: boolean
          categoria?: string
          conteudo?: string
          created_at?: string
          id?: string
          nome?: string
          tenant_id?: string
          updated_at?: string
          uso_count?: number
          variaveis?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_mensagem_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_mensagens: {
        Row: {
          conteudo: string
          conversa_id: string
          created_at: string
          direcao: string
          enviado_por: string | null
          id: string
          lido: boolean
          tenant_id: string
          tipo: string
          whatsapp_msg_id: string | null
        }
        Insert: {
          conteudo: string
          conversa_id: string
          created_at?: string
          direcao?: string
          enviado_por?: string | null
          id?: string
          lido?: boolean
          tenant_id: string
          tipo?: string
          whatsapp_msg_id?: string | null
        }
        Update: {
          conteudo?: string
          conversa_id?: string
          created_at?: string
          direcao?: string
          enviado_por?: string | null
          id?: string
          lido?: boolean
          tenant_id?: string
          tipo?: string
          whatsapp_msg_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_mensagens_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "crm_conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_mensagens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_orcamento_itens: {
        Row: {
          created_at: string
          descricao: string
          id: string
          orcamento_id: string
          ordem: number
          preco_unitario: number
          produto_id: string | null
          quantidade: number
          subtotal: number
          unidade: string
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          orcamento_id: string
          ordem?: number
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
          subtotal?: number
          unidade?: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          orcamento_id?: string
          ordem?: number
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
          subtotal?: number
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "crm_orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_orcamento_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_orcamentos: {
        Row: {
          cliente_id: string | null
          condicoes: string | null
          contato_id: string | null
          conversa_id: string | null
          created_at: string
          criado_por: string | null
          desconto_percentual: number
          desconto_valor: number
          erp_orcamento_id: string | null
          id: string
          numero: number
          observacoes: string | null
          prazo_entrega: string | null
          status: string
          subtotal: number
          tenant_id: string
          total: number
          updated_at: string
          validade_dias: number
        }
        Insert: {
          cliente_id?: string | null
          condicoes?: string | null
          contato_id?: string | null
          conversa_id?: string | null
          created_at?: string
          criado_por?: string | null
          desconto_percentual?: number
          desconto_valor?: number
          erp_orcamento_id?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          prazo_entrega?: string | null
          status?: string
          subtotal?: number
          tenant_id: string
          total?: number
          updated_at?: string
          validade_dias?: number
        }
        Update: {
          cliente_id?: string | null
          condicoes?: string | null
          contato_id?: string | null
          conversa_id?: string | null
          created_at?: string
          criado_por?: string | null
          desconto_percentual?: number
          desconto_valor?: number
          erp_orcamento_id?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          prazo_entrega?: string | null
          status?: string
          subtotal?: number
          tenant_id?: string
          total?: number
          updated_at?: string
          validade_dias?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_orcamentos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "crm_contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_orcamentos_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "crm_conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_orcamentos_erp_orcamento_id_fkey"
            columns: ["erp_orcamento_id"]
            isOneToOne: false
            referencedRelation: "erp_orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_orcamentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_setores: {
        Row: {
          ativo: boolean
          cor: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cor?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cor?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_setores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_transferencias: {
        Row: {
          atendente_destino_id: string | null
          atendente_origem_id: string | null
          conversa_id: string
          created_at: string
          id: string
          motivo: string | null
          setor_destino_id: string | null
          setor_origem_id: string | null
          tenant_id: string
        }
        Insert: {
          atendente_destino_id?: string | null
          atendente_origem_id?: string | null
          conversa_id: string
          created_at?: string
          id?: string
          motivo?: string | null
          setor_destino_id?: string | null
          setor_origem_id?: string | null
          tenant_id: string
        }
        Update: {
          atendente_destino_id?: string | null
          atendente_origem_id?: string | null
          conversa_id?: string
          created_at?: string
          id?: string
          motivo?: string | null
          setor_destino_id?: string | null
          setor_origem_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_transferencias_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "crm_conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_transferencias_setor_destino_id_fkey"
            columns: ["setor_destino_id"]
            isOneToOne: false
            referencedRelation: "crm_setores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_transferencias_setor_origem_id_fkey"
            columns: ["setor_origem_id"]
            isOneToOne: false
            referencedRelation: "crm_setores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_transferencias_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_credits: {
        Row: {
          cashback_balance: number
          cashback_percent: number
          cashback_release_days: number
          cliente_id: string
          created_at: string
          credit_limit: number
          current_balance: number
          desconto_max_percentual: number
          id: string
          is_vip: boolean
          saldo_cashback: number
          tenant_id: string
          total_creditos_usados: number
          updated_at: string
        }
        Insert: {
          cashback_balance?: number
          cashback_percent?: number
          cashback_release_days?: number
          cliente_id: string
          created_at?: string
          credit_limit?: number
          current_balance?: number
          desconto_max_percentual?: number
          id?: string
          is_vip?: boolean
          saldo_cashback?: number
          tenant_id: string
          total_creditos_usados?: number
          updated_at?: string
        }
        Update: {
          cashback_balance?: number
          cashback_percent?: number
          cashback_release_days?: number
          cliente_id?: string
          created_at?: string
          credit_limit?: number
          current_balance?: number
          desconto_max_percentual?: number
          id?: string
          is_vip?: boolean
          saldo_cashback?: number
          tenant_id?: string
          total_creditos_usados?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_credits_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_credits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_authorizations: {
        Row: {
          autorizado_por: string | null
          cliente_id: string | null
          codigo: string
          created_at: string
          desconto_percentual: number | null
          expira_em: string
          id: string
          status: string
          tenant_id: string
          usado_em: string | null
          usado_por: string | null
          valor_desconto: number | null
          valor_venda: number | null
        }
        Insert: {
          autorizado_por?: string | null
          cliente_id?: string | null
          codigo: string
          created_at?: string
          desconto_percentual?: number | null
          expira_em?: string
          id?: string
          status?: string
          tenant_id: string
          usado_em?: string | null
          usado_por?: string | null
          valor_desconto?: number | null
          valor_venda?: number | null
        }
        Update: {
          autorizado_por?: string | null
          cliente_id?: string | null
          codigo?: string
          created_at?: string
          desconto_percentual?: number | null
          expira_em?: string
          id?: string
          status?: string
          tenant_id?: string
          usado_em?: string | null
          usado_por?: string | null
          valor_desconto?: number | null
          valor_venda?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_authorizations_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_authorizations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_orcamento_itens: {
        Row: {
          categoria: string | null
          created_at: string
          descricao: string
          especificacoes: Json | null
          id: string
          orcamento_id: string
          ordem: number
          preco_unitario: number
          produto_id: string | null
          produto_simples_id: string | null
          quantidade: number
          subtotal: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          descricao: string
          especificacoes?: Json | null
          id?: string
          orcamento_id: string
          ordem?: number
          preco_unitario?: number
          produto_id?: string | null
          produto_simples_id?: string | null
          quantidade?: number
          subtotal?: number
        }
        Update: {
          categoria?: string | null
          created_at?: string
          descricao?: string
          especificacoes?: Json | null
          id?: string
          orcamento_id?: string
          ordem?: number
          preco_unitario?: number
          produto_id?: string | null
          produto_simples_id?: string | null
          quantidade?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "erp_orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "erp_orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_orcamento_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_orcamento_itens_produto_simples_id_fkey"
            columns: ["produto_simples_id"]
            isOneToOne: false
            referencedRelation: "produtos_simples"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_orcamentos: {
        Row: {
          categoria: string
          cliente_id: string | null
          cliente_nome: string
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string
          criado_por: string | null
          crm_orcamento_id: string | null
          data_entrega: string | null
          forma_pagamento: string | null
          hora_entrega: string | null
          id: string
          numero: number
          observacoes: string | null
          origem: string | null
          parceiros: string | null
          status: string
          tenant_id: string
          tipo_entrega: string | null
          transportadora: string | null
          updated_at: string
          valor_total: number
          vendedor: string | null
        }
        Insert: {
          categoria?: string
          cliente_id?: string | null
          cliente_nome: string
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          criado_por?: string | null
          crm_orcamento_id?: string | null
          data_entrega?: string | null
          forma_pagamento?: string | null
          hora_entrega?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          origem?: string | null
          parceiros?: string | null
          status?: string
          tenant_id: string
          tipo_entrega?: string | null
          transportadora?: string | null
          updated_at?: string
          valor_total?: number
          vendedor?: string | null
        }
        Update: {
          categoria?: string
          cliente_id?: string | null
          cliente_nome?: string
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          criado_por?: string | null
          crm_orcamento_id?: string | null
          data_entrega?: string | null
          forma_pagamento?: string | null
          hora_entrega?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          origem?: string | null
          parceiros?: string | null
          status?: string
          tenant_id?: string
          tipo_entrega?: string | null
          transportadora?: string | null
          updated_at?: string
          valor_total?: number
          vendedor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_orcamentos_crm_orcamento_id_fkey"
            columns: ["crm_orcamento_id"]
            isOneToOne: false
            referencedRelation: "crm_orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_orcamentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_pedidos: {
        Row: {
          categoria: string
          cliente_id: string | null
          cliente_nome: string
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string
          criado_por: string | null
          crm_orcamento_id: string | null
          data_entrega: string | null
          forma_pagamento: string | null
          hora_entrega: string | null
          id: string
          numero: number
          observacoes: string | null
          orcamento_id: string | null
          origem: string | null
          parceiros: string | null
          status: string
          tenant_id: string
          tipo_entrega: string | null
          transportadora: string | null
          updated_at: string
          valor_total: number
          vendedor: string | null
        }
        Insert: {
          categoria?: string
          cliente_id?: string | null
          cliente_nome: string
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          criado_por?: string | null
          crm_orcamento_id?: string | null
          data_entrega?: string | null
          forma_pagamento?: string | null
          hora_entrega?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          orcamento_id?: string | null
          origem?: string | null
          parceiros?: string | null
          status?: string
          tenant_id: string
          tipo_entrega?: string | null
          transportadora?: string | null
          updated_at?: string
          valor_total?: number
          vendedor?: string | null
        }
        Update: {
          categoria?: string
          cliente_id?: string | null
          cliente_nome?: string
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          criado_por?: string | null
          crm_orcamento_id?: string | null
          data_entrega?: string | null
          forma_pagamento?: string | null
          hora_entrega?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          orcamento_id?: string | null
          origem?: string | null
          parceiros?: string | null
          status?: string
          tenant_id?: string
          tipo_entrega?: string | null
          transportadora?: string | null
          updated_at?: string
          valor_total?: number
          vendedor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_pedidos_crm_orcamento_id_fkey"
            columns: ["crm_orcamento_id"]
            isOneToOne: false
            referencedRelation: "crm_orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_pedidos_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "erp_orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_pedidos_tenant_id_fkey"
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
          valor_total: number
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
          valor_total?: number
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
          valor_total?: number
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
      formas_pagamento: {
        Row: {
          ativo: boolean
          created_at: string
          icone: string | null
          id: string
          nome: string
          ordem: number
          tenant_id: string
          tipo: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          icone?: string | null
          id?: string
          nome: string
          ordem?: number
          tenant_id: string
          tipo?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number
          tenant_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "formas_pagamento_tenant_id_fkey"
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
      lgpd_consentimentos: {
        Row: {
          aceito: boolean
          cliente_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          revogado_em: string | null
          session_id: string | null
          tenant_id: string
          tipo: string
          user_agent: string | null
        }
        Insert: {
          aceito?: boolean
          cliente_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          revogado_em?: string | null
          session_id?: string | null
          tenant_id: string
          tipo?: string
          user_agent?: string | null
        }
        Update: {
          aceito?: boolean
          cliente_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          revogado_em?: string | null
          session_id?: string | null
          tenant_id?: string
          tipo?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lgpd_consentimentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lgpd_consentimentos_tenant_id_fkey"
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
          crm_arquivo_id: string | null
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
          crm_arquivo_id?: string | null
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
          crm_arquivo_id?: string | null
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
            foreignKeyName: "loja_pedido_itens_crm_arquivo_id_fkey"
            columns: ["crm_arquivo_id"]
            isOneToOne: false
            referencedRelation: "crm_arquivos"
            referencedColumns: ["id"]
          },
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
          crm_conversa_id: string | null
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
          crm_conversa_id?: string | null
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
          crm_conversa_id?: string | null
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
            foreignKeyName: "loja_pedidos_crm_conversa_id_fkey"
            columns: ["crm_conversa_id"]
            isOneToOne: false
            referencedRelation: "crm_conversas"
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
      maquinas: {
        Row: {
          ativa: boolean
          capacidade: string | null
          created_at: string
          custo_hora: number
          id: string
          localizacao: string | null
          marca: string | null
          modelo: string | null
          nome: string
          observacoes: string | null
          status: string
          tenant_id: string
          tipo_modulo: string
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          capacidade?: string | null
          created_at?: string
          custo_hora?: number
          id?: string
          localizacao?: string | null
          marca?: string | null
          modelo?: string | null
          nome: string
          observacoes?: string | null
          status?: string
          tenant_id: string
          tipo_modulo: string
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          capacidade?: string | null
          created_at?: string
          custo_hora?: number
          id?: string
          localizacao?: string | null
          marca?: string | null
          modelo?: string | null
          nome?: string
          observacoes?: string | null
          status?: string
          tenant_id?: string
          tipo_modulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maquinas_tenant_id_fkey"
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
      notificacoes_pendentes: {
        Row: {
          assunto: string | null
          canal: string
          chave_idempotente: string | null
          cliente_id: string | null
          contexto: string | null
          created_at: string
          destinatario: string
          enviado_em: string | null
          erro: string | null
          id: string
          mensagem: string
          referencia_id: string | null
          status: string
          tenant_id: string
          tentativas: number
        }
        Insert: {
          assunto?: string | null
          canal?: string
          chave_idempotente?: string | null
          cliente_id?: string | null
          contexto?: string | null
          created_at?: string
          destinatario: string
          enviado_em?: string | null
          erro?: string | null
          id?: string
          mensagem: string
          referencia_id?: string | null
          status?: string
          tenant_id: string
          tentativas?: number
        }
        Update: {
          assunto?: string | null
          canal?: string
          chave_idempotente?: string | null
          cliente_id?: string | null
          contexto?: string | null
          created_at?: string
          destinatario?: string
          enviado_em?: string | null
          erro?: string | null
          id?: string
          mensagem?: string
          referencia_id?: string | null
          status?: string
          tenant_id?: string
          tentativas?: number
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_pendentes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_pendentes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
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
          loja_pedido_id: string | null
          numero_op: number
          observacoes: string | null
          pedido_id: string | null
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
          loja_pedido_id?: string | null
          numero_op?: number
          observacoes?: string | null
          pedido_id?: string | null
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
          loja_pedido_id?: string | null
          numero_op?: number
          observacoes?: string | null
          pedido_id?: string | null
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
            foreignKeyName: "ordens_producao_loja_pedido_id_fkey"
            columns: ["loja_pedido_id"]
            isOneToOne: false
            referencedRelation: "loja_pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "erp_pedidos"
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
      pdv_caixa: {
        Row: {
          aberto_em: string
          aberto_por: string
          created_at: string
          fechado_em: string | null
          fechado_por: string | null
          id: string
          observacoes_abertura: string | null
          observacoes_fechamento: string | null
          status: string
          tenant_id: string
          total_recebido: number | null
          total_vendas: number | null
          valor_abertura: number
          valor_fechamento: number | null
        }
        Insert: {
          aberto_em?: string
          aberto_por: string
          created_at?: string
          fechado_em?: string | null
          fechado_por?: string | null
          id?: string
          observacoes_abertura?: string | null
          observacoes_fechamento?: string | null
          status?: string
          tenant_id: string
          total_recebido?: number | null
          total_vendas?: number | null
          valor_abertura?: number
          valor_fechamento?: number | null
        }
        Update: {
          aberto_em?: string
          aberto_por?: string
          created_at?: string
          fechado_em?: string | null
          fechado_por?: string | null
          id?: string
          observacoes_abertura?: string | null
          observacoes_fechamento?: string | null
          status?: string
          tenant_id?: string
          total_recebido?: number | null
          total_vendas?: number | null
          valor_abertura?: number
          valor_fechamento?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pdv_caixa_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pdv_vendas: {
        Row: {
          cashback_usado: number
          cliente_id: string | null
          created_at: string
          desconto: number
          forma_pagamento: string
          id: string
          itens: Json
          numero_venda: number
          subtotal: number
          tenant_id: string
          total: number
          usuario_id: string | null
        }
        Insert: {
          cashback_usado?: number
          cliente_id?: string | null
          created_at?: string
          desconto?: number
          forma_pagamento: string
          id?: string
          itens?: Json
          numero_venda?: number
          subtotal?: number
          tenant_id: string
          total?: number
          usuario_id?: string | null
        }
        Update: {
          cashback_usado?: number
          cliente_id?: string | null
          created_at?: string
          desconto?: number
          forma_pagamento?: string
          id?: string
          itens?: Json
          numero_venda?: number
          subtotal?: number
          tenant_id?: string
          total?: number
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdv_vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdv_vendas_tenant_id_fkey"
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
      processos_producao: {
        Row: {
          ativo: boolean
          created_at: string
          custo_processo: number
          descricao: string | null
          id: string
          maquina_id: string | null
          nome: string
          ordem: number
          requer_maquina: boolean
          tempo_estimado_min: number | null
          tenant_id: string
          tipo_modulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          custo_processo?: number
          descricao?: string | null
          id?: string
          maquina_id?: string | null
          nome: string
          ordem?: number
          requer_maquina?: boolean
          tempo_estimado_min?: number | null
          tenant_id: string
          tipo_modulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          custo_processo?: number
          descricao?: string | null
          id?: string
          maquina_id?: string | null
          nome?: string
          ordem?: number
          requer_maquina?: boolean
          tempo_estimado_min?: number | null
          tenant_id?: string
          tipo_modulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processos_producao_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_producao_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_groups: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          tenant_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          tenant_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_estoque_link: {
        Row: {
          bloquear_se_zerado: boolean
          created_at: string
          estoque_id: string
          id: string
          produto_id: string
          quantidade_por_unidade: number
          tenant_id: string
        }
        Insert: {
          bloquear_se_zerado?: boolean
          created_at?: string
          estoque_id: string
          id?: string
          produto_id: string
          quantidade_por_unidade?: number
          tenant_id: string
        }
        Update: {
          bloquear_se_zerado?: boolean
          created_at?: string
          estoque_id?: string
          id?: string
          produto_id?: string
          quantidade_por_unidade?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "produto_estoque_link_estoque_id_fkey"
            columns: ["estoque_id"]
            isOneToOne: false
            referencedRelation: "estoque"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_estoque_link_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_estoque_link_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          area_minima_m2: number | null
          ativo: boolean
          bloqueado_por_estoque: boolean
          bloquear_sem_estoque: boolean
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
          disponivel_loja: boolean
          dpi: number | null
          escala_minima: number | null
          estoque_id: string | null
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
          bloqueado_por_estoque?: boolean
          bloquear_sem_estoque?: boolean
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
          disponivel_loja?: boolean
          dpi?: number | null
          escala_minima?: number | null
          estoque_id?: string | null
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
          bloqueado_por_estoque?: boolean
          bloquear_sem_estoque?: boolean
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
          disponivel_loja?: boolean
          dpi?: number | null
          escala_minima?: number | null
          estoque_id?: string | null
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
            foreignKeyName: "produtos_estoque_id_fkey"
            columns: ["estoque_id"]
            isOneToOne: false
            referencedRelation: "estoque"
            referencedColumns: ["id"]
          },
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
      produtos_simples: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          descricao: string | null
          grupo_id: string | null
          id: string
          nome: string
          observacoes: string | null
          preco_unitario: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          descricao?: string | null
          grupo_id?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          preco_unitario?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          descricao?: string | null
          grupo_id?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          preco_unitario?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_simples_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "product_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_simples_tenant_id_fkey"
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
          cargo_id: string | null
          created_at: string
          email: string
          id: string
          nome: string
          tenant_id: string | null
        }
        Insert: {
          aprovado?: boolean
          avatar_url?: string | null
          cargo_id?: string | null
          created_at?: string
          email?: string
          id: string
          nome?: string
          tenant_id?: string | null
        }
        Update: {
          aprovado?: boolean
          avatar_url?: string | null
          cargo_id?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      recebimentos_parciais: {
        Row: {
          conta_receber_id: string
          created_at: string
          data_recebimento: string
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          registrado_por: string | null
          tenant_id: string
          valor: number
        }
        Insert: {
          conta_receber_id: string
          created_at?: string
          data_recebimento?: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          registrado_por?: string | null
          tenant_id: string
          valor?: number
        }
        Update: {
          conta_receber_id?: string
          created_at?: string
          data_recebimento?: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          registrado_por?: string | null
          tenant_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "recebimentos_parciais_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recebimentos_parciais_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_rules: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          prioridade: number
          produto_origem: string | null
          produto_sugerido: string
          segmento: string | null
          tenant_id: string
          tipo_regra: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          prioridade?: number
          produto_origem?: string | null
          produto_sugerido: string
          segmento?: string | null
          tenant_id: string
          tipo_regra?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          prioridade?: number
          produto_origem?: string | null
          produto_sugerido?: string
          segmento?: string | null
          tenant_id?: string
          tipo_regra?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_quotes: {
        Row: {
          categoria: string
          cliente_nome: string | null
          created_at: string
          criado_por: string | null
          custo_producao: number
          cv_altura: number | null
          cv_custo_acabamento: number | null
          cv_custo_material_m2: number | null
          cv_largura: number | null
          digital_custo_clique: number | null
          digital_custo_papel: number | null
          digital_lados: number | null
          digital_poses: number | null
          digital_quantidade: number | null
          digital_tipo_clique: string | null
          id: string
          lucro_liquido: number
          markup_percentual: number
          observacoes: string | null
          offset_custo_ctp: number | null
          offset_custo_hora: number | null
          offset_custo_papel: number | null
          offset_tempo_rodagem: number | null
          offset_tempo_setup: number | null
          offset_tiragem: number | null
          preco_venda: number
          status: string
          tenant_id: string
        }
        Insert: {
          categoria?: string
          cliente_nome?: string | null
          created_at?: string
          criado_por?: string | null
          custo_producao?: number
          cv_altura?: number | null
          cv_custo_acabamento?: number | null
          cv_custo_material_m2?: number | null
          cv_largura?: number | null
          digital_custo_clique?: number | null
          digital_custo_papel?: number | null
          digital_lados?: number | null
          digital_poses?: number | null
          digital_quantidade?: number | null
          digital_tipo_clique?: string | null
          id?: string
          lucro_liquido?: number
          markup_percentual?: number
          observacoes?: string | null
          offset_custo_ctp?: number | null
          offset_custo_hora?: number | null
          offset_custo_papel?: number | null
          offset_tempo_rodagem?: number | null
          offset_tempo_setup?: number | null
          offset_tiragem?: number | null
          preco_venda?: number
          status?: string
          tenant_id: string
        }
        Update: {
          categoria?: string
          cliente_nome?: string | null
          created_at?: string
          criado_por?: string | null
          custo_producao?: number
          cv_altura?: number | null
          cv_custo_acabamento?: number | null
          cv_custo_material_m2?: number | null
          cv_largura?: number | null
          digital_custo_clique?: number | null
          digital_custo_papel?: number | null
          digital_lados?: number | null
          digital_poses?: number | null
          digital_quantidade?: number | null
          digital_tipo_clique?: string | null
          id?: string
          lucro_liquido?: number
          markup_percentual?: number
          observacoes?: string | null
          offset_custo_ctp?: number | null
          offset_custo_hora?: number | null
          offset_custo_papel?: number | null
          offset_tempo_rodagem?: number | null
          offset_tempo_setup?: number | null
          offset_tiragem?: number | null
          preco_venda?: number
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_quotes_tenant_id_fkey"
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
      task_checklist_items: {
        Row: {
          concluido: boolean
          created_at: string
          id: string
          ordem: number
          task_id: string
          titulo: string
        }
        Insert: {
          concluido?: boolean
          created_at?: string
          id?: string
          ordem?: number
          task_id: string
          titulo: string
        }
        Update: {
          concluido?: boolean
          created_at?: string
          id?: string
          ordem?: number
          task_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          alarme_ativo: boolean
          alarme_minutos: number | null
          atribuido_para: string | null
          atribuido_por: string | null
          categoria: string
          concluido_em: string | null
          created_at: string
          criado_por: string | null
          data_vencimento: string | null
          descricao: string | null
          hora_vencimento: string | null
          id: string
          orcamento_id: string | null
          pedido_id: string | null
          prioridade: string
          status: string
          tenant_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          alarme_ativo?: boolean
          alarme_minutos?: number | null
          atribuido_para?: string | null
          atribuido_por?: string | null
          categoria?: string
          concluido_em?: string | null
          created_at?: string
          criado_por?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          hora_vencimento?: string | null
          id?: string
          orcamento_id?: string | null
          pedido_id?: string | null
          prioridade?: string
          status?: string
          tenant_id: string
          titulo: string
          updated_at?: string
        }
        Update: {
          alarme_ativo?: boolean
          alarme_minutos?: number | null
          atribuido_para?: string | null
          atribuido_por?: string | null
          categoria?: string
          concluido_em?: string | null
          created_at?: string
          criado_por?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          hora_vencimento?: string | null
          id?: string
          orcamento_id?: string | null
          pedido_id?: string | null
          prioridade?: string
          status?: string
          tenant_id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "erp_orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "erp_pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          cep: string | null
          cidade: string | null
          cnpj: string | null
          cor_primaria: string | null
          cor_secundaria: string | null
          created_at: string
          descricao: string | null
          dominio: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          gmv_mes: number
          id: string
          logo_url: string | null
          nome_grafica: string
          notif_email_orcamento: boolean
          notif_email_pedido: boolean
          notif_whatsapp_status: boolean
          pedidos_mes: number
          plano_id: string | null
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string
          descricao?: string | null
          dominio?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          gmv_mes?: number
          id?: string
          logo_url?: string | null
          nome_grafica: string
          notif_email_orcamento?: boolean
          notif_email_pedido?: boolean
          notif_whatsapp_status?: boolean
          pedidos_mes?: number
          plano_id?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string
          descricao?: string | null
          dominio?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          gmv_mes?: number
          id?: string
          logo_url?: string | null
          nome_grafica?: string
          notif_email_orcamento?: boolean
          notif_email_pedido?: boolean
          notif_whatsapp_status?: boolean
          pedidos_mes?: number
          plano_id?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
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
      transportadoras: {
        Row: {
          ativo: boolean
          cidade: string | null
          cnpj: string | null
          contato_nome: string | null
          created_at: string
          email: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cidade?: string | null
          cnpj?: string | null
          contato_nome?: string | null
          created_at?: string
          email?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cidade?: string | null
          cnpj?: string | null
          contato_nome?: string | null
          created_at?: string
          email?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transportadoras_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      vendedores: {
        Row: {
          ativo: boolean
          comissao_percentual: number
          created_at: string
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          comissao_percentual?: number
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          comissao_percentual?: number
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendedores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      is_tenant_admin: { Args: { _user_id: string }; Returns: boolean }
      nextval_pdv_os: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "superadmin" | "operador" | "admin"
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
      app_role: ["superadmin", "operador", "admin"],
    },
  },
} as const
