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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          base_price_usd: number | null
          contract_signed_at: string | null
          created_at: string
          customer_access_secret_hash: string | null
          customer_email: string | null
          customer_name: string
          customer_whatsapp: string | null
          delivered_at: string | null
          delivery_date_time: string | null
          delivery_location_description: string | null
          delivery_map_link: string | null
          delivery_note: string | null
          delivery_status: string | null
          discount_usd: number | null
          drawn_signature_data: string | null
          dropoff_notes: string | null
          end_date: string
          id: string
          manager_notes: string | null
          motorcycle_id: string
          payment_method: string | null
          payment_status: string | null
          pickup_notes: string | null
          rental_days: number | null
          rental_total_usd: number | null
          reservation_code: string
          security_deposit_usd: number | null
          start_date: string
          status: string
          total_due_usd: number | null
          total_quote: number | null
          typed_signature_name: string | null
          updated_at: string
        }
        Insert: {
          base_price_usd?: number | null
          contract_signed_at?: string | null
          created_at?: string
          customer_access_secret_hash?: string | null
          customer_email?: string | null
          customer_name: string
          customer_whatsapp?: string | null
          delivered_at?: string | null
          delivery_date_time?: string | null
          delivery_location_description?: string | null
          delivery_map_link?: string | null
          delivery_note?: string | null
          delivery_status?: string | null
          discount_usd?: number | null
          drawn_signature_data?: string | null
          dropoff_notes?: string | null
          end_date: string
          id?: string
          manager_notes?: string | null
          motorcycle_id: string
          payment_method?: string | null
          payment_status?: string | null
          pickup_notes?: string | null
          rental_days?: number | null
          rental_total_usd?: number | null
          reservation_code: string
          security_deposit_usd?: number | null
          start_date: string
          status?: string
          total_due_usd?: number | null
          total_quote?: number | null
          typed_signature_name?: string | null
          updated_at?: string
        }
        Update: {
          base_price_usd?: number | null
          contract_signed_at?: string | null
          created_at?: string
          customer_access_secret_hash?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_whatsapp?: string | null
          delivered_at?: string | null
          delivery_date_time?: string | null
          delivery_location_description?: string | null
          delivery_map_link?: string | null
          delivery_note?: string | null
          delivery_status?: string | null
          discount_usd?: number | null
          drawn_signature_data?: string | null
          dropoff_notes?: string | null
          end_date?: string
          id?: string
          manager_notes?: string | null
          motorcycle_id?: string
          payment_method?: string | null
          payment_status?: string | null
          pickup_notes?: string | null
          rental_days?: number | null
          rental_total_usd?: number | null
          reservation_code?: string
          security_deposit_usd?: number | null
          start_date?: string
          status?: string
          total_due_usd?: number | null
          total_quote?: number | null
          typed_signature_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_motorcycle_id_fkey"
            columns: ["motorcycle_id"]
            isOneToOne: false
            referencedRelation: "motorcycles"
            referencedColumns: ["id"]
          },
        ]
      }
      motorcycles: {
        Row: {
          brand: string
          color: string | null
          created_at: string
          daily_rate: number
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          model: string
          name: string
          registration_number: string | null
          slug: string
          transmission: string | null
          year: number | null
        }
        Insert: {
          brand: string
          color?: string | null
          created_at?: string
          daily_rate: number
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          model: string
          name: string
          registration_number?: string | null
          slug: string
          transmission?: string | null
          year?: number | null
        }
        Update: {
          brand?: string
          color?: string | null
          created_at?: string
          daily_rate?: number
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          model?: string
          name?: string
          registration_number?: string | null
          slug?: string
          transmission?: string | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_booking_request:
        | {
            Args: {
              p_customer_email: string
              p_customer_name: string
              p_customer_whatsapp: string
              p_dropoff_notes?: string
              p_end_date: string
              p_motorcycle_id: string
              p_pickup_notes?: string
              p_start_date: string
            }
            Returns: {
              booking_id: string
              reservation_code: string
            }[]
          }
        | {
            Args: {
              p_biweekly_discount_pct?: number
              p_contract_signed_at?: string
              p_customer_email?: string
              p_customer_name: string
              p_customer_whatsapp?: string
              p_daily_rate_usd?: number
              p_delivery_date_time?: string
              p_delivery_location_description?: string
              p_delivery_map_link?: string
              p_drawn_signature_data?: string
              p_end_date: string
              p_monthly_rate_usd?: number
              p_motorcycle_id: string
              p_payment_method?: string
              p_security_deposit_usd?: number
              p_start_date: string
              p_typed_signature_name?: string
              p_weekly_discount_pct?: number
            }
            Returns: Json
          }
      lookup_booking: {
        Args: { p_access_secret: string; p_reservation_code: string }
        Returns: Json
      }
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
