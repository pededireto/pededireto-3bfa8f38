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
      admin_action_requests: {
        Row: {
          action_type: string
          created_at: string
          details: string | null
          id: string
          requested_by: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_id: string
          target_name: string | null
          target_table: string
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: string | null
          id?: string
          requested_by: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id: string
          target_name?: string | null
          target_table: string
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: string | null
          id?: string
          requested_by?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id?: string
          target_name?: string | null
          target_table?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          business_id: string | null
          category_id: string | null
          city: string | null
          created_at: string | null
          event_type: string
          id: string
          position: number | null
          search_log_id: string | null
        }
        Insert: {
          business_id?: string | null
          category_id?: string | null
          city?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          position?: number | null
          search_log_id?: string | null
        }
        Update: {
          business_id?: string | null
          category_id?: string | null
          city?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          position?: number | null
          search_log_id?: string | null
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
            foreignKeyName: "analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
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
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          id: string
          target_id: string
          target_name: string | null
          target_table: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          id?: string
          target_id: string
          target_name?: string | null
          target_table: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          id?: string
          target_id?: string
          target_name?: string | null
          target_table?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      business_analytics_events: {
        Row: {
          business_id: string
          created_at: string | null
          event_type: string
          id: string
          search_log_id: string | null
          user_city: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          event_type: string
          id?: string
          search_log_id?: string | null
          user_city?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          event_type?: string
          id?: string
          search_log_id?: string | null
          user_city?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
        ]
      }
      business_claim_requests: {
        Row: {
          business_id: string
          created_at: string
          id: string
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_claim_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_claim_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_claim_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_claim_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_commercial_assignments: {
        Row: {
          assigned_at: string
          business_id: string
          commercial_id: string
          created_at: string
          id: string
          is_active: boolean
          role: string
          unassigned_at: string | null
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          business_id: string
          commercial_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          role: string
          unassigned_at?: string | null
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          business_id?: string
          commercial_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          role?: string
          unassigned_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_commercial_assignments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_commercial_assignments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_commercial_assignments_commercial_id_fkey"
            columns: ["commercial_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
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
          {
            foreignKeyName: "business_contact_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
        ]
      }
      business_highlights: {
        Row: {
          business_id: string
          category_id: string | null
          created_at: string
          display_order: number
          end_date: string | null
          id: string
          is_active: boolean
          level: string
          start_date: string | null
          subcategory_id: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          category_id?: string | null
          created_at?: string
          display_order?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          level: string
          start_date?: string | null
          subcategory_id?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          category_id?: string | null
          created_at?: string
          display_order?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          level?: string
          start_date?: string | null
          subcategory_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_highlights_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_highlights_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_highlights_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_highlights_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      business_invites: {
        Row: {
          accepted: boolean
          accepted_at: string | null
          business_id: string
          created_at: string
          email: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["business_role"]
        }
        Insert: {
          accepted?: boolean
          accepted_at?: string | null
          business_id: string
          created_at?: string
          email: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["business_role"]
        }
        Update: {
          accepted?: boolean
          accepted_at?: string | null
          business_id?: string
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["business_role"]
        }
        Relationships: [
          {
            foreignKeyName: "business_invites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_invites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_module_values: {
        Row: {
          business_id: string
          created_at: string
          id: string
          module_id: string
          updated_at: string
          value: string | null
          value_json: Json | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          module_id: string
          updated_at?: string
          value?: string | null
          value_json?: Json | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          module_id?: string
          updated_at?: string
          value?: string | null
          value_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "business_module_values_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_module_values_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_module_values_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "business_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      business_modules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_public_default: boolean
          is_required: boolean
          label: string
          name: string
          options: Json | null
          order_index: number
          plan_restriction: string | null
          section: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_public_default?: boolean
          is_required?: boolean
          label: string
          name: string
          options?: Json | null
          order_index?: number
          plan_restriction?: string | null
          section: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_public_default?: boolean
          is_required?: boolean
          label?: string
          name?: string
          options?: Json | null
          order_index?: number
          plan_restriction?: string | null
          section?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_notifications: {
        Row: {
          business_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          business_id: string | null
          created_at: string | null
          id: string
          owner_id: string | null
          status: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          owner_id?: string | null
          status?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          owner_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "business_subcategories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
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
      business_users: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["business_role"]
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["business_role"]
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["business_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_users_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_users_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          activated_at: string | null
          address: string | null
          alcance: Database["public"]["Enums"]["alcance_tipo"] | null
          category_id: string | null
          city: string | null
          claim_requested_at: string | null
          claim_requested_by: string | null
          claim_review_notes: string | null
          claim_status: string | null
          claimed: boolean
          claimed_at: string | null
          claimed_by: string | null
          commercial_status: Database["public"]["Enums"]["commercial_status_tipo"]
          contacted_at: string | null
          conversion_date: string | null
          conversion_plan_id: string | null
          conversion_price: number | null
          converted_by: string | null
          coordinates: Json | null
          created_at: string | null
          cta_app: string | null
          cta_email: string | null
          cta_phone: string | null
          cta_website: string | null
          cta_whatsapp: string | null
          description: string | null
          display_order: number | null
          facebook_url: string | null
          id: string
          images: string[] | null
          instagram_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_premium: boolean | null
          logo_url: string | null
          name: string
          nif: string | null
          other_social_url: string | null
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
          verified_at: string | null
          verified_by: string | null
          zone: string | null
        }
        Insert: {
          activated_at?: string | null
          address?: string | null
          alcance?: Database["public"]["Enums"]["alcance_tipo"] | null
          category_id?: string | null
          city?: string | null
          claim_requested_at?: string | null
          claim_requested_by?: string | null
          claim_review_notes?: string | null
          claim_status?: string | null
          claimed?: boolean
          claimed_at?: string | null
          claimed_by?: string | null
          commercial_status?: Database["public"]["Enums"]["commercial_status_tipo"]
          contacted_at?: string | null
          conversion_date?: string | null
          conversion_plan_id?: string | null
          conversion_price?: number | null
          converted_by?: string | null
          coordinates?: Json | null
          created_at?: string | null
          cta_app?: string | null
          cta_email?: string | null
          cta_phone?: string | null
          cta_website?: string | null
          cta_whatsapp?: string | null
          description?: string | null
          display_order?: number | null
          facebook_url?: string | null
          id?: string
          images?: string[] | null
          instagram_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          logo_url?: string | null
          name: string
          nif?: string | null
          other_social_url?: string | null
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
          verified_at?: string | null
          verified_by?: string | null
          zone?: string | null
        }
        Update: {
          activated_at?: string | null
          address?: string | null
          alcance?: Database["public"]["Enums"]["alcance_tipo"] | null
          category_id?: string | null
          city?: string | null
          claim_requested_at?: string | null
          claim_requested_by?: string | null
          claim_review_notes?: string | null
          claim_status?: string | null
          claimed?: boolean
          claimed_at?: string | null
          claimed_by?: string | null
          commercial_status?: Database["public"]["Enums"]["commercial_status_tipo"]
          contacted_at?: string | null
          conversion_date?: string | null
          conversion_plan_id?: string | null
          conversion_price?: number | null
          converted_by?: string | null
          coordinates?: Json | null
          created_at?: string | null
          cta_app?: string | null
          cta_email?: string | null
          cta_phone?: string | null
          cta_website?: string | null
          cta_whatsapp?: string | null
          description?: string | null
          display_order?: number | null
          facebook_url?: string | null
          id?: string
          images?: string[] | null
          instagram_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          logo_url?: string | null
          name?: string
          nif?: string | null
          other_social_url?: string | null
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
          verified_at?: string | null
          verified_by?: string | null
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
            foreignKeyName: "businesses_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_conversion_plan_id_fkey"
            columns: ["conversion_plan_id"]
            isOneToOne: false
            referencedRelation: "commercial_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_converted_by_fkey"
            columns: ["converted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
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
      commercial_commissions: {
        Row: {
          adjustment_type: string | null
          amount: number
          business_id: string
          commercial_id: string
          commission_model_id: string
          created_at: string
          id: string
          original_commission_id: string | null
          paid_at: string | null
          reference_month: string
          revenue_event_id: string | null
          status: string
        }
        Insert: {
          adjustment_type?: string | null
          amount?: number
          business_id: string
          commercial_id: string
          commission_model_id: string
          created_at?: string
          id?: string
          original_commission_id?: string | null
          paid_at?: string | null
          reference_month: string
          revenue_event_id?: string | null
          status?: string
        }
        Update: {
          adjustment_type?: string | null
          amount?: number
          business_id?: string
          commercial_id?: string
          commission_model_id?: string
          created_at?: string
          id?: string
          original_commission_id?: string | null
          paid_at?: string | null
          reference_month?: string
          revenue_event_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_commissions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_commissions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_commissions_commercial_id_fkey"
            columns: ["commercial_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "commercial_commissions_commission_model_id_fkey"
            columns: ["commission_model_id"]
            isOneToOne: false
            referencedRelation: "commission_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_commissions_original_commission_id_fkey"
            columns: ["original_commission_id"]
            isOneToOne: false
            referencedRelation: "commercial_commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_commissions_revenue_event_id_fkey"
            columns: ["revenue_event_id"]
            isOneToOne: false
            referencedRelation: "revenue_events"
            referencedColumns: ["id"]
          },
        ]
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
          plan_type: string
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
          plan_type?: string
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
          plan_type?: string
          premium_level?: string | null
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      commission_audit_logs: {
        Row: {
          changed_by: string
          commission_id: string
          created_at: string
          id: string
          new_amount: number | null
          new_status: string | null
          old_amount: number | null
          old_status: string | null
          reason: string | null
        }
        Insert: {
          changed_by: string
          commission_id: string
          created_at?: string
          id?: string
          new_amount?: number | null
          new_status?: string | null
          old_amount?: number | null
          old_status?: string | null
          reason?: string | null
        }
        Update: {
          changed_by?: string
          commission_id?: string
          created_at?: string
          id?: string
          new_amount?: number | null
          new_status?: string | null
          old_amount?: number | null
          old_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_audit_logs_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commercial_commissions"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_models: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      commission_rules: {
        Row: {
          applies_to: string
          applies_to_event_type: string | null
          applies_to_role: string | null
          applies_to_team: string | null
          applies_to_user: string | null
          commission_model_id: string
          commission_type: string
          created_at: string
          duration_months: number | null
          id: string
          plan_id: string | null
          value: number
        }
        Insert: {
          applies_to: string
          applies_to_event_type?: string | null
          applies_to_role?: string | null
          applies_to_team?: string | null
          applies_to_user?: string | null
          commission_model_id: string
          commission_type: string
          created_at?: string
          duration_months?: number | null
          id?: string
          plan_id?: string | null
          value?: number
        }
        Update: {
          applies_to?: string
          applies_to_event_type?: string | null
          applies_to_role?: string | null
          applies_to_team?: string | null
          applies_to_user?: string | null
          commission_model_id?: string
          commission_type?: string
          created_at?: string
          duration_months?: number | null
          id?: string
          plan_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_rules_applies_to_team_fkey"
            columns: ["applies_to_team"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_commission_model_id_fkey"
            columns: ["commission_model_id"]
            isOneToOne: false
            referencedRelation: "commission_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "commercial_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      consumer_subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          end_date: string | null
          id: string
          plan_id: string | null
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          end_date?: string | null
          id?: string
          plan_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          end_date?: string | null
          id?: string
          plan_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumer_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "commercial_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
          {
            foreignKeyName: "expiration_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
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
      homepage_blocks: {
        Row: {
          config: Json | null
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          order_index: number
          start_date: string | null
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          start_date?: string | null
          title?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          start_date?: string | null
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
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
      intent_categories: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          intent_id: string | null
          priority: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          intent_id?: string | null
          priority?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          intent_id?: string | null
          priority?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "intent_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_business_id: string | null
          target_role: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_business_id?: string | null
          target_role: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_business_id?: string | null
          target_role?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_notifications_related_business_id_fkey"
            columns: ["related_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_notifications_related_business_id_fkey"
            columns: ["related_business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
        ]
      }
      pattern_categories: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          pattern_id: string | null
          priority: number | null
          reasoning: string | null
          subcategory_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          pattern_id?: string | null
          priority?: number | null
          reasoning?: string | null
          subcategory_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          pattern_id?: string | null
          priority?: number | null
          reasoning?: string | null
          subcategory_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pattern_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pattern_categories_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "search_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pattern_categories_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      pattern_keywords: {
        Row: {
          created_at: string | null
          id: string
          keyword: string
          pattern_id: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          keyword: string
          pattern_id?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          keyword?: string
          pattern_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pattern_keywords_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "search_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_rules: {
        Row: {
          allow_analytics_basic: boolean | null
          allow_analytics_pro: boolean
          allow_category_highlight: boolean
          allow_premium_block: boolean
          allow_super_highlight: boolean
          allow_video: boolean
          created_at: string
          id: string
          max_gallery_images: number | null
          max_modules: number | null
          plan_id: string
          updated_at: string
        }
        Insert: {
          allow_analytics_basic?: boolean | null
          allow_analytics_pro?: boolean
          allow_category_highlight?: boolean
          allow_premium_block?: boolean
          allow_super_highlight?: boolean
          allow_video?: boolean
          created_at?: string
          id?: string
          max_gallery_images?: number | null
          max_modules?: number | null
          plan_id: string
          updated_at?: string
        }
        Update: {
          allow_analytics_basic?: boolean | null
          allow_analytics_pro?: boolean
          allow_category_highlight?: boolean
          allow_premium_block?: boolean
          allow_super_highlight?: boolean
          allow_video?: boolean
          created_at?: string
          id?: string
          max_gallery_images?: number | null
          max_modules?: number | null
          plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_rules_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: true
            referencedRelation: "commercial_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_activity_at: string | null
          phone: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_activity_at?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_activity_at?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      request_business_matches: {
        Row: {
          business_id: string
          id: string
          price_quote: string | null
          request_id: string
          responded_at: string | null
          sent_at: string
          status: string
          viewed_at: string | null
        }
        Insert: {
          business_id: string
          id?: string
          price_quote?: string | null
          request_id: string
          responded_at?: string | null
          sent_at?: string
          status?: string
          viewed_at?: string | null
        }
        Update: {
          business_id?: string
          id?: string
          price_quote?: string | null
          request_id?: string
          responded_at?: string | null
          sent_at?: string
          status?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_business_matches_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_business_matches_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_business_matches_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
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
      revenue_events: {
        Row: {
          amount: number
          assigned_user_id: string
          business_id: string
          created_at: string | null
          event_date: string | null
          event_type: string
          id: string
          plan_id: string | null
          triggered_by: string
        }
        Insert: {
          amount: number
          assigned_user_id: string
          business_id: string
          created_at?: string | null
          event_date?: string | null
          event_type: string
          id?: string
          plan_id?: string | null
          triggered_by: string
        }
        Update: {
          amount?: number
          assigned_user_id?: string
          business_id?: string
          created_at?: string | null
          event_date?: string | null
          event_type?: string
          id?: string
          plan_id?: string | null
          triggered_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_events_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_events_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
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
      search_intelligence_logs: {
        Row: {
          created_at: string | null
          detected_pattern_id: string | null
          id: string
          input_text: string
          intent_type: string | null
          results_count: number | null
          urgency_level: number | null
          user_city: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          detected_pattern_id?: string | null
          id?: string
          input_text: string
          intent_type?: string | null
          results_count?: number | null
          urgency_level?: number | null
          user_city?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          detected_pattern_id?: string | null
          id?: string
          input_text?: string
          intent_type?: string | null
          results_count?: number | null
          urgency_level?: number | null
          user_city?: string | null
          user_id?: string | null
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
      search_logs_intelligent: {
        Row: {
          created_at: string | null
          detected_intent: string | null
          id: string
          location_detected: string | null
          raw_query: string
          urgency_detected: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          detected_intent?: string | null
          id?: string
          location_detected?: string | null
          raw_query: string
          urgency_detected?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          detected_intent?: string | null
          id?: string
          location_detected?: string | null
          raw_query?: string
          urgency_detected?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      search_patterns: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          intent_type: string | null
          is_active: boolean | null
          pattern_text: string
          updated_at: string | null
          urgency_level: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          intent_type?: string | null
          is_active?: boolean | null
          pattern_text: string
          updated_at?: string | null
          urgency_level?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          intent_type?: string | null
          is_active?: boolean | null
          pattern_text?: string
          updated_at?: string | null
          urgency_level?: number | null
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
      service_requests: {
        Row: {
          address: string | null
          assigned_to_admin: string | null
          category_id: string | null
          closed_at: string | null
          created_at: string
          description: string | null
          id: string
          location_city: string | null
          location_postal_code: string | null
          status: string
          subcategory_id: string | null
          updated_at: string
          urgency: string
          user_id: string
        }
        Insert: {
          address?: string | null
          assigned_to_admin?: string | null
          category_id?: string | null
          closed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location_city?: string | null
          location_postal_code?: string | null
          status?: string
          subcategory_id?: string | null
          updated_at?: string
          urgency?: string
          user_id: string
        }
        Update: {
          address?: string | null
          assigned_to_admin?: string | null
          category_id?: string | null
          closed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location_city?: string | null
          location_postal_code?: string | null
          status?: string
          subcategory_id?: string | null
          updated_at?: string
          urgency?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
          image_url: string | null
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
          image_url?: string | null
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
          image_url?: string | null
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
      team_members: {
        Row: {
          created_at: string
          id: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
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
          {
            foreignKeyName: "user_favorites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
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
      user_search_context: {
        Row: {
          created_at: string | null
          default_lat: number | null
          default_lng: number | null
          default_radius_km: number | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          default_lat?: number | null
          default_lng?: number | null
          default_radius_km?: number | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          default_lat?: number | null
          default_lng?: number | null
          default_radius_km?: number | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_search_context_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_search_profile: {
        Row: {
          city: string | null
          created_at: string | null
          updated_at: string | null
          user_id: string
          zone: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          updated_at?: string | null
          user_id: string
          zone?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          updated_at?: string | null
          user_id?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_search_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
      analytics_overview: {
        Row: {
          active_businesses: number | null
          total_businesses: number | null
          total_events: number | null
          total_requests: number | null
          total_searches: number | null
          total_users: number | null
        }
        Relationships: []
      }
      commercial_alerts_view: {
        Row: {
          created_at: string | null
          id: string | null
          name: string | null
          nif: string | null
          owner_email: string | null
          owner_name: string | null
          owner_phone: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          nif?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          nif?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
        }
        Relationships: []
      }
      commercial_performance: {
        Row: {
          converted_by: string | null
          revenue_generated: number | null
          total_converted: number | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_converted_by_fkey"
            columns: ["converted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      dashboard_executive: {
        Row: {
          active_businesses: number | null
          new_requests_this_month: number | null
          new_users_this_month: number | null
          revenue_this_month: number | null
          total_businesses: number | null
          total_requests: number | null
          total_searches: number | null
          total_users: number | null
        }
        Relationships: []
      }
      dashboard_growth: {
        Row: {
          new_businesses: number | null
          new_users: number | null
          week: string | null
        }
        Relationships: []
      }
      dashboard_marketplace: {
        Row: {
          request_business_ratio: number | null
          total_businesses: number | null
          total_requests: number | null
        }
        Relationships: []
      }
      dashboard_revenue: {
        Row: {
          average_ticket: number | null
          month: string | null
          total_conversions: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      revenue_monthly: {
        Row: {
          month: string | null
          total_conversions: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      search_insights: {
        Row: {
          search_term: string | null
          searches_without_results: number | null
          total_searches: number | null
        }
        Relationships: []
      }
      view_business_performance: {
        Row: {
          business_id: string | null
          ctr: number | null
          impressions: number | null
          profile_views: number | null
          total_clicks: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
        ]
      }
      view_no_result_opportunities: {
        Row: {
          frequency: number | null
          input_text: string | null
          last_searched: string | null
        }
        Relationships: []
      }
      view_search_overview: {
        Row: {
          emergency_searches: number | null
          info_searches: number | null
          no_result_searches: number | null
          percent_no_results: number | null
          purchase_searches: number | null
          quote_searches: number | null
          total_searches: number | null
        }
        Relationships: []
      }
      view_searches_by_city: {
        Row: {
          total_searches: number | null
          user_city: string | null
        }
        Relationships: []
      }
      view_searches_per_day: {
        Row: {
          search_day: string | null
          total_searches: number | null
        }
        Relationships: []
      }
      view_top_search_terms: {
        Row: {
          frequency: number | null
          input_text: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_approve_claim: {
        Args: { p_admin_notes?: string; p_business_id: string }
        Returns: Json
      }
      admin_reject_claim: {
        Args: { p_admin_notes?: string; p_business_id: string }
        Returns: Json
      }
      admin_revoke_claim: {
        Args: { p_admin_notes?: string; p_business_id: string }
        Returns: Json
      }
      auto_reject_old_claims: { Args: never; Returns: undefined }
      claim_business:
        | { Args: { p_business_id: string }; Returns: undefined }
        | {
            Args: { p_business_id: string; p_claim_message?: string }
            Returns: Json
          }
      create_revenue_event: {
        Args: {
          p_amount: number
          p_assigned_user_id: string
          p_business_id: string
          p_event_type: string
          p_plan_id: string
          p_triggered_by: string
        }
        Returns: string
      }
      detect_best_pattern: {
        Args: { input_text: string }
        Returns: {
          intent_type: string
          pattern_id: string
          pattern_text: string
          total_score: number
          urgency_level: number
        }[]
      }
      get_admin_intelligence: { Args: { p_days?: number }; Returns: Json }
      get_business_favorites_count: {
        Args: { business_uuid: string }
        Returns: number
      }
      get_business_intelligence: {
        Args: { p_business_id: string; p_days?: number }
        Returns: Json
      }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_commercial: { Args: never; Returns: boolean }
      match_request_to_businesses: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      revoke_business_access: {
        Args: { p_business_id: string; p_user_id: string }
        Returns: undefined
      }
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
      search_businesses_by_intent:
        | {
            Args: { input_text: string; user_city?: string }
            Returns: {
              business_city: string
              business_id: string
              business_name: string
              intent_type: string
              is_featured: boolean
              is_premium: boolean
              premium_level: string
              urgency_level: number
            }[]
          }
        | {
            Args: { input_text: string; user_city?: string; user_id?: string }
            Returns: {
              business_city: string
              business_id: string
              business_name: string
              intent_type: string
              is_featured: boolean
              is_premium: boolean
              premium_level: string
              urgency_level: number
            }[]
          }
      search_businesses_for_claim: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          category_id: string
          city: string
          id: string
          name: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
      update_business_full: {
        Args: {
          p_address?: string
          p_business_id: string
          p_description?: string
          p_email?: string
          p_facebook?: string
          p_instagram?: string
          p_other_social?: string
          p_phone?: string
          p_schedule_weekdays?: string
          p_schedule_weekend?: string
          p_website?: string
          p_whatsapp?: string
        }
        Returns: undefined
      }
      update_business_limited: {
        Args: {
          p_business_id: string
          p_description?: string
          p_phone?: string
          p_website?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      alcance_tipo: "local" | "nacional" | "hibrido"
      app_role:
        | "admin"
        | "user"
        | "commercial"
        | "super_admin"
        | "cs"
        | "onboarding"
      business_role: "owner" | "manager" | "staff" | "pending_owner" | "revoked"
      commercial_status_tipo:
        | "nao_contactado"
        | "contactado"
        | "interessado"
        | "cliente"
        | "perdido"
      premium_level_tipo: "SUPER" | "CATEGORIA" | "SUBCATEGORIA"
      revenue_event_type:
        | "sale"
        | "upsell"
        | "churn_recovery"
        | "reactivation"
        | "downgrade"
        | "refund"
        | "bonus"
        | "manual_adjustment"
      subscription_plan_tipo:
        | "free"
        | "1_month"
        | "3_months"
        | "6_months"
        | "1_year"
      subscription_status_tipo: "inactive" | "active" | "expired" | "free"
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
      app_role: [
        "admin",
        "user",
        "commercial",
        "super_admin",
        "cs",
        "onboarding",
      ],
      business_role: ["owner", "manager", "staff", "pending_owner", "revoked"],
      commercial_status_tipo: [
        "nao_contactado",
        "contactado",
        "interessado",
        "cliente",
        "perdido",
      ],
      premium_level_tipo: ["SUPER", "CATEGORIA", "SUBCATEGORIA"],
      revenue_event_type: [
        "sale",
        "upsell",
        "churn_recovery",
        "reactivation",
        "downgrade",
        "refund",
        "bonus",
        "manual_adjustment",
      ],
      subscription_plan_tipo: [
        "free",
        "1_month",
        "3_months",
        "6_months",
        "1_year",
      ],
      subscription_status_tipo: ["inactive", "active", "expired", "free"],
    },
  },
} as const
