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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          business_id: string | null
          category_id: string | null
          city: string | null
          created_at: string | null
          event_type: string
          id: string
        }
        Insert: {
          business_id?: string | null
          category_id?: string | null
          city?: string | null
          created_at?: string | null
          event_type: string
          id?: string
        }
        Update: {
          business_id?: string | null
          category_id?: string | null
          city?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      business_contact_logs: {
        Row: {
          business_id: string
          created_at: string
          id: string
          nota: string | null
          tipo_contacto: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          nota?: string | null
          tipo_contacto: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          nota?: string | null
          tipo_contacto?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_contact_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_subcategories: {
        Row: {
          business_id: string
          created_at: string
          id: string
          subcategory_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          subcategory_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_subcategories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_subcategories_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          alcance: Database["public"]["Enums"]["alcance_tipo"] | null
          category_id: string | null
          city: string | null
          commercial_status: Database["public"]["Enums"]["commercial_status_tipo"]
          coordinates: Json | null
          created_at: string | null
          cta_app: string | null
          cta_email: string | null
          cta_phone: string | null
          cta_website: string | null
          cta_whatsapp: string | null
          description: string | null
          display_order: number | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          is_premium: boolean | null
          logo_url: string | null
          name: string
          nif: string | null
          owner_email: string | null
          owner_name: string | null
          owner_phone: string | null
          plan_id: string | null
          premium_level:
            | Database["public"]["Enums"]["premium_level_tipo"]
            | null
          registration_source: string | null
          schedule_weekdays: string | null
          schedule_weekend: string | null
          slug: string
          subcategory_id: string | null
          subscription_end_date: string | null
          subscription_plan: Database["public"]["Enums"]["subscription_plan_tipo"]
          subscription_price: number | null
          subscription_start_date: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status_tipo"]
          updated_at: string | null
          zone: string | null
        }
        Insert: {
          address?: string | null
          alcance?: Database["public"]["Enums"]["alcance_tipo"] | null
          category_id?: string | null
          city?: string | null
          commercial_status?: Database["public"]["Enums"]["commercial_status_tipo"]
          coordinates?: Json | null
          created_at?: string | null
          cta_app?: string | null
          cta_email?: string | null
          cta_phone?: string | null
          cta_website?: string | null
          cta_whatsapp?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          logo_url?: string | null
          name: string
          nif?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          plan_id?: string | null
          premium_level?:
            | Database["public"]["Enums"]["premium_level_tipo"]
            | null
          registration_source?: string | null
          schedule_weekdays?: string | null
          schedule_weekend?: string | null
          slug: string
          subcategory_id?: string | null
          subscription_end_date?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan_tipo"]
          subscription_price?: number | null
          subscription_start_date?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status_tipo"]
          updated_at?: string | null
          zone?: string | null
        }
        Update: {
          address?: string | null
          alcance?: Database["public"]["Enums"]["alcance_tipo"] | null
          category_id?: string | null
          city?: string | null
          commercial_status?: Database["public"]["Enums"]["commercial_status_tipo"]
          coordinates?: Json | null
          created_at?: string | null
          cta_app?: string | null
          cta_email?: string | null
          cta_phone?: string | null
          cta_website?: string | null
          cta_whatsapp?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          logo_url?: string | null
          name?: string
          nif?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          plan_id?: string | null
          premium_level?:
            | Database["public"]["Enums"]["premium_level_tipo"]
            | null
          registration_source?: string | null
          schedule_weekdays?: string | null
          schedule_weekend?: string | null
          slug?: string
          subcategory_id?: string | null
          subscription_end_date?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan_tipo"]
          subscription_price?: number | null
          subscription_start_date?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status_tipo"]
          updated_at?: string | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "commercial_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          alcance_default: Database["public"]["Enums"]["alcance_tipo"] | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          alcance_default?: Database["public"]["Enums"]["alcance_tipo"] | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          alcance_default?: Database["public"]["Enums"]["alcance_tipo"] | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      commercial_plans: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          duration_months: number
          id: string
          is_active: boolean
          name: string
          premium_level: string | null
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          duration_months?: number
          id?: string
          is_active?: boolean
          name: string
          premium_level?: string | null
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          duration_months?: number
          id?: string
          is_active?: boolean
          name?: string
          premium_level?: string | null
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      expiration_logs: {
        Row: {
          business_id: string
          contact_status: string
          contacted_at: string | null
          deactivated_at: string
          expired_at: string
          id: string
          notes: string | null
          plan_name: string
          plan_price: number
        }
        Insert: {
          business_id: string
          contact_status?: string
          contacted_at?: string | null
          deactivated_at?: string
          expired_at: string
          id?: string
          notes?: string | null
          plan_name: string
          plan_price?: number
        }
        Update: {
          business_id?: string
          contact_status?: string
          contacted_at?: string | null
          deactivated_at?: string
          expired_at?: string
          id?: string
          notes?: string | null
          plan_name?: string
          plan_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "expiration_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_categories: {
        Row: {
          category_id: string
          cover_image_url: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          category_id: string
          cover_image_url: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          category_id?: string
          cover_image_url?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: true
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      institutional_pages: {
        Row: {
          blocks: Json | null
          content: string | null
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          meta_description: string | null
          meta_title: string | null
          page_type: string
          show_in_footer: boolean
          show_in_header: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          blocks?: Json | null
          content?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          page_type?: string
          show_in_footer?: boolean
          show_in_header?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          blocks?: Json | null
          content?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          page_type?: string
          show_in_footer?: boolean
          show_in_header?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          category: string
          created_at: string
          cta_app: string | null
          cta_phone: string | null
          cta_website: string | null
          cta_whatsapp: string | null
          delivery_zones: string[] | null
          description: string | null
          display_order: number
          id: string
          images: string[] | null
          is_active: boolean
          is_featured: boolean
          logo_url: string | null
          name: string
          schedule_weekdays: string | null
          schedule_weekend: string | null
          slug: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          category: string
          created_at?: string
          cta_app?: string | null
          cta_phone?: string | null
          cta_website?: string | null
          cta_whatsapp?: string | null
          delivery_zones?: string[] | null
          description?: string | null
          display_order?: number
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          logo_url?: string | null
          name: string
          schedule_weekdays?: string | null
          schedule_weekend?: string | null
          slug: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          category?: string
          created_at?: string
          cta_app?: string | null
          cta_phone?: string | null
          cta_website?: string | null
          cta_whatsapp?: string | null
          delivery_zones?: string[] | null
          description?: string | null
          display_order?: number
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          logo_url?: string | null
          name?: string
          schedule_weekdays?: string | null
          schedule_weekend?: string | null
          slug?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string | null
          filters: Json | null
          id: string
          search_query: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          search_query: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          search_query?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      search_logs: {
        Row: {
          created_at: string
          id: string
          is_reviewed: boolean
          results_count: number
          search_term: string
          search_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_reviewed?: boolean
          results_count?: number
          search_term: string
          search_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_reviewed?: boolean
          results_count?: number
          search_term?: string
          search_type?: string
        }
        Relationships: []
      }
      search_synonyms: {
        Row: {
          created_at: string
          equivalente: string
          id: string
          termo: string
        }
        Insert: {
          created_at?: string
          equivalente: string
          id?: string
          termo: string
        }
        Update: {
          created_at?: string
          equivalente?: string
          id?: string
          termo?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestions: {
        Row: {
          city_name: string
          created_at: string
          email: string | null
          id: string
          message: string | null
        }
        Insert: {
          city_name: string
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
        }
        Update: {
          city_name?: string
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      zones: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_business_favorites_count: {
        Args: { business_uuid: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      search_businesses_and_subcategories: {
        Args: { search_term: string }
        Returns: {
          category_name: string
          category_slug: string
          relevance: number
          result_id: string
          result_name: string
          result_slug: string
          result_type: string
        }[]
      }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      alcance_tipo: "local" | "nacional" | "hibrido"
      app_role: "admin" | "user"
      commercial_status_tipo:
        | "nao_contactado"
        | "contactado"
        | "interessado"
        | "cliente"
      premium_level_tipo: "SUPER" | "CATEGORIA" | "SUBCATEGORIA"
      subscription_plan_tipo:
        | "free"
        | "1_month"
        | "3_months"
        | "6_months"
        | "1_year"
      subscription_status_tipo: "inactive" | "active" | "expired"
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
      alcance_tipo: ["local", "nacional", "hibrido"],
      app_role: ["admin", "user"],
      commercial_status_tipo: [
        "nao_contactado",
        "contactado",
        "interessado",
        "cliente",
      ],
      premium_level_tipo: ["SUPER", "CATEGORIA", "SUBCATEGORIA"],
      subscription_plan_tipo: [
        "free",
        "1_month",
        "3_months",
        "6_months",
        "1_year",
      ],
      subscription_status_tipo: ["inactive", "active", "expired"],
    },
  },
} as const
