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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"] | null
          created_at: string
          current_control_method: string | null
          financial_priorities: string[] | null
          full_name: string | null
          help_needs: string[] | null
          id: string
          income_stability:
            | Database["public"]["Enums"]["income_stability"]
            | null
          monthly_income_goal: number | null
          other_medical_activities: string[] | null
          profile_onboarding_completed: boolean | null
          shift_onboarding_completed: boolean | null
          shift_routine_type: Database["public"]["Enums"]["shift_type"] | null
          tax_knowledge: string | null
          updated_at: string
        }
        Insert: {
          activity_type?: Database["public"]["Enums"]["activity_type"] | null
          created_at?: string
          current_control_method?: string | null
          financial_priorities?: string[] | null
          full_name?: string | null
          help_needs?: string[] | null
          id: string
          income_stability?:
            | Database["public"]["Enums"]["income_stability"]
            | null
          monthly_income_goal?: number | null
          other_medical_activities?: string[] | null
          profile_onboarding_completed?: boolean | null
          shift_onboarding_completed?: boolean | null
          shift_routine_type?: Database["public"]["Enums"]["shift_type"] | null
          tax_knowledge?: string | null
          updated_at?: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"] | null
          created_at?: string
          current_control_method?: string | null
          financial_priorities?: string[] | null
          full_name?: string | null
          help_needs?: string[] | null
          id?: string
          income_stability?:
            | Database["public"]["Enums"]["income_stability"]
            | null
          monthly_income_goal?: number | null
          other_medical_activities?: string[] | null
          profile_onboarding_completed?: boolean | null
          shift_onboarding_completed?: boolean | null
          shift_routine_type?: Database["public"]["Enums"]["shift_type"] | null
          tax_knowledge?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shifts: {
        Row: {
          average_monthly_count: number | null
          cooperative_name: string | null
          created_at: string
          days_of_week: string[] | null
          discount_percentage: number | null
          duration_hours: number | null
          end_time: string | null
          gross_value: number | null
          hospital: string
          id: string
          is_paid: boolean | null
          is_realized: boolean | null
          net_value: number | null
          payment_delay_days: number | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_period: string | null
          payment_timing: string | null
          recurrence_pattern: string | null
          sector: string | null
          shift_date: string | null
          shift_type: Database["public"]["Enums"]["shift_type"]
          start_time: string | null
          updated_at: string
          user_id: string
          work_period_closing: string | null
        }
        Insert: {
          average_monthly_count?: number | null
          cooperative_name?: string | null
          created_at?: string
          days_of_week?: string[] | null
          discount_percentage?: number | null
          duration_hours?: number | null
          end_time?: string | null
          gross_value?: number | null
          hospital: string
          id?: string
          is_paid?: boolean | null
          is_realized?: boolean | null
          net_value?: number | null
          payment_delay_days?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_period?: string | null
          payment_timing?: string | null
          recurrence_pattern?: string | null
          sector?: string | null
          shift_date?: string | null
          shift_type: Database["public"]["Enums"]["shift_type"]
          start_time?: string | null
          updated_at?: string
          user_id: string
          work_period_closing?: string | null
        }
        Update: {
          average_monthly_count?: number | null
          cooperative_name?: string | null
          created_at?: string
          days_of_week?: string[] | null
          discount_percentage?: number | null
          duration_hours?: number | null
          end_time?: string | null
          gross_value?: number | null
          hospital?: string
          id?: string
          is_paid?: boolean | null
          is_realized?: boolean | null
          net_value?: number | null
          payment_delay_days?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_period?: string | null
          payment_timing?: string | null
          recurrence_pattern?: string | null
          sector?: string | null
          shift_date?: string | null
          shift_type?: Database["public"]["Enums"]["shift_type"]
          start_time?: string | null
          updated_at?: string
          user_id?: string
          work_period_closing?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      activity_type:
        | "exclusivista"
        | "outras_atividades_medicas"
        | "fora_medicina"
      income_stability: "estavel" | "variavel"
      payment_method: "cooperativa" | "rpa" | "pj" | "clt"
      shift_type: "fixed" | "sporadic" | "hybrid"
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
      activity_type: [
        "exclusivista",
        "outras_atividades_medicas",
        "fora_medicina",
      ],
      income_stability: ["estavel", "variavel"],
      payment_method: ["cooperativa", "rpa", "pj", "clt"],
      shift_type: ["fixed", "sporadic", "hybrid"],
    },
  },
} as const
