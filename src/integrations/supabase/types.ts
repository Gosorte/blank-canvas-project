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
          ativo: boolean
          created_at: string
          custo_acabamento: number | null
          custo_chapa: number | null
          custo_clique: number | null
          custo_estrutura: number | null
          custo_m2: number | null
          custo_milheiro: number | null
          custo_setup: number | null
          descricao: string | null
          escala_minima: number | null
          id: string
          markup: number
          nome: string
          preco_minimo: number
          substrato: string | null
          tenant_id: string
          tipo_modulo: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          custo_acabamento?: number | null
          custo_chapa?: number | null
          custo_clique?: number | null
          custo_estrutura?: number | null
          custo_m2?: number | null
          custo_milheiro?: number | null
          custo_setup?: number | null
          descricao?: string | null
          escala_minima?: number | null
          id?: string
          markup?: number
          nome: string
          preco_minimo?: number
          substrato?: string | null
          tenant_id: string
          tipo_modulo: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          custo_acabamento?: number | null
          custo_chapa?: number | null
          custo_clique?: number | null
          custo_estrutura?: number | null
          custo_m2?: number | null
          custo_milheiro?: number | null
          custo_setup?: number | null
          descricao?: string | null
          escala_minima?: number | null
          id?: string
          markup?: number
          nome?: string
          preco_minimo?: number
          substrato?: string | null
          tenant_id?: string
          tipo_modulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_tenant_id_fkey"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
