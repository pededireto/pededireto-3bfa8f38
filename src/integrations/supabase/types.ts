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
      admin_alerts: {
        Row: {
          action_url: string | null
          category: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          action_url?: string | null
          category?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          action_url?: string | null
          category?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          business_id: string | null
          created_at: string | null
          id: string
          payload: Json | null
          resolved_at: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          payload?: Json | null
          resolved_at?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          payload?: Json | null
          resolved_at?: string | null
          type?: string
          user_id?: string | null
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "businesses_public"
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
            foreignKeyName: "analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
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
      blog_posts: {
        Row: {
          author_avatar_url: string | null
          author_name: string
          category: string
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          featured: boolean
          id: string
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          read_time_minutes: number
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author_avatar_url?: string | null
          author_name?: string
          category?: string
          content: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time_minutes?: number
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_avatar_url?: string | null
          author_name?: string
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time_minutes?: number
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      bug_reports: {
        Row: {
          assigned_to: string | null
          business_id: string | null
          created_at: string | null
          description: string
          id: string
          priority: string | null
          reporter_id: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          business_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          priority?: string | null
          reporter_id: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          business_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          priority?: string | null
          reporter_id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bug_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bug_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bug_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bug_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bug_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_analytics_events: {
        Row: {
          business_id: string
          city: string | null
          country: string | null
          created_at: string | null
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          business_id: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_analytics_metrics: {
        Row: {
          business_id: string
          clicks_email: number | null
          clicks_phone: number | null
          clicks_website: number | null
          clicks_whatsapp: number | null
          conversion_rate: number | null
          conversion_rate_this_month: number | null
          favorites_count: number | null
          last_lead_at: string | null
          last_reset_at: string | null
          last_view_at: string | null
          leads_this_month: number | null
          leads_total: number | null
          most_active_day_of_week: number | null
          most_active_hour: number | null
          shares_count: number | null
          updated_at: string | null
          views_last_month: number | null
          views_this_month: number | null
          views_this_week: number | null
          views_today: number | null
          views_total: number | null
        }
        Insert: {
          business_id: string
          clicks_email?: number | null
          clicks_phone?: number | null
          clicks_website?: number | null
          clicks_whatsapp?: number | null
          conversion_rate?: number | null
          conversion_rate_this_month?: number | null
          favorites_count?: number | null
          last_lead_at?: string | null
          last_reset_at?: string | null
          last_view_at?: string | null
          leads_this_month?: number | null
          leads_total?: number | null
          most_active_day_of_week?: number | null
          most_active_hour?: number | null
          shares_count?: number | null
          updated_at?: string | null
          views_last_month?: number | null
          views_this_month?: number | null
          views_this_week?: number | null
          views_today?: number | null
          views_total?: number | null
        }
        Update: {
          business_id?: string
          clicks_email?: number | null
          clicks_phone?: number | null
          clicks_website?: number | null
          clicks_whatsapp?: number | null
          conversion_rate?: number | null
          conversion_rate_this_month?: number | null
          favorites_count?: number | null
          last_lead_at?: string | null
          last_reset_at?: string | null
          last_view_at?: string | null
          leads_this_month?: number | null
          leads_total?: number | null
          most_active_day_of_week?: number | null
          most_active_hour?: number | null
          shares_count?: number | null
          updated_at?: string | null
          views_last_month?: number | null
          views_this_month?: number | null
          views_this_week?: number | null
          views_today?: number | null
          views_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_analytics_metrics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_analytics_metrics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_analytics_metrics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_analytics_metrics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_analytics_metrics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_badge_progress: {
        Row: {
          badge_id: string
          business_id: string
          current_value: number
          target_value: number
          updated_at: string
        }
        Insert: {
          badge_id: string
          business_id: string
          current_value?: number
          target_value?: number
          updated_at?: string
        }
        Update: {
          badge_id?: string
          business_id?: string
          current_value?: number
          target_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_badge_progress_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "business_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_badge_progress_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_badge_progress_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_badge_progress_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_badge_progress_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_badge_progress_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_badges: {
        Row: {
          color: string | null
          created_at: string | null
          criteria: Json
          description: string | null
          display_order: number | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          is_automatic: boolean | null
          is_public: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          criteria: Json
          description?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_automatic?: boolean | null
          is_public?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          criteria?: Json
          description?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_automatic?: boolean | null
          is_public?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      business_claim_history: {
        Row: {
          approved_at: string | null
          business_id: string
          claimed_for_email: string | null
          claimed_for_name: string | null
          claimed_for_phone: string | null
          created_at: string | null
          discount_percentage: number | null
          id: string
          notes: string | null
          offered_plan: string | null
          processed_by: string
          rejected_at: string | null
          rejection_reason: string | null
          status: string | null
          trial_months: number | null
        }
        Insert: {
          approved_at?: string | null
          business_id: string
          claimed_for_email?: string | null
          claimed_for_name?: string | null
          claimed_for_phone?: string | null
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          notes?: string | null
          offered_plan?: string | null
          processed_by: string
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string | null
          trial_months?: number | null
        }
        Update: {
          approved_at?: string | null
          business_id?: string
          claimed_for_email?: string | null
          claimed_for_name?: string | null
          claimed_for_phone?: string | null
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          notes?: string | null
          offered_plan?: string | null
          processed_by?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string | null
          trial_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_claim_history_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_claim_history_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_claim_history_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_claim_history_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_claim_history_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
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
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "businesses_public"
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
            foreignKeyName: "business_claim_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
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
            foreignKeyName: "business_claim_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_confirmation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_claim_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_claim_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_confirmation"
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
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "businesses_public"
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
            foreignKeyName: "business_commercial_assignments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_commercial_assignments_commercial_id_fkey"
            columns: ["commercial_id"]
            isOneToOne: false
            referencedRelation: "onboarding_users_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_commercial_assignments_commercial_id_fkey"
            columns: ["commercial_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "business_commercial_assignments_commercial_id_fkey"
            columns: ["commercial_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_confirmation"
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
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_contact_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_contact_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_earned_badges: {
        Row: {
          badge_id: string
          business_id: string
          earned_at: string | null
          earned_automatically: boolean | null
          expires_at: string | null
          granted_by: string | null
          id: string
          notes: string | null
        }
        Insert: {
          badge_id: string
          business_id: string
          earned_at?: string | null
          earned_automatically?: boolean | null
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          badge_id?: string
          business_id?: string
          earned_at?: string | null
          earned_automatically?: boolean | null
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_earned_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "business_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_earned_badges_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_earned_badges_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_earned_badges_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_earned_badges_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_earned_badges_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_email_preferences: {
        Row: {
          business_id: string
          updated_at: string | null
          weekly_digest: boolean | null
        }
        Insert: {
          business_id: string
          updated_at?: string | null
          weekly_digest?: boolean | null
        }
        Update: {
          business_id?: string
          updated_at?: string | null
          weekly_digest?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "business_email_preferences_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_email_preferences_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_email_preferences_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_email_preferences_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_email_preferences_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "top_rated_businesses"
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
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "businesses_public"
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
            foreignKeyName: "business_highlights_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
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
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "businesses_public"
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
            foreignKeyName: "business_invites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_confirmation"
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
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "businesses_public"
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
            foreignKeyName: "business_module_values_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
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
          action_label: string | null
          action_url: string | null
          business_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          priority: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          business_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          priority?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          business_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          priority?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_partner_memberships: {
        Row: {
          business_id: string
          discount_amount: number | null
          discount_applied: boolean | null
          free_months_remaining: number | null
          id: string
          is_active: boolean | null
          joined_at: string | null
          member_id: string | null
          member_since: string | null
          membership_type: string | null
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          discount_amount?: number | null
          discount_applied?: boolean | null
          free_months_remaining?: number | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          member_id?: string | null
          member_since?: string | null
          membership_type?: string | null
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          discount_amount?: number | null
          discount_applied?: boolean | null
          free_months_remaining?: number | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          member_id?: string | null
          member_since?: string | null
          membership_type?: string | null
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_partner_memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_partner_memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_partner_memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_partner_memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_partner_memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_partner_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "partner_organizations"
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
          {
            foreignKeyName: "business_profiles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_confirmation"
            referencedColumns: ["id"]
          },
        ]
      }
      business_ranking_snapshots: {
        Row: {
          business_id: string
          id: string
          position: number | null
          score: number
          snapshot_date: string
          subcategory_id: string | null
        }
        Insert: {
          business_id: string
          id?: string
          position?: number | null
          score: number
          snapshot_date?: string
          subcategory_id?: string | null
        }
        Update: {
          business_id?: string
          id?: string
          position?: number | null
          score?: number
          snapshot_date?: string
          subcategory_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_ranking_snapshots_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_ranking_snapshots_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_ranking_snapshots_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_ranking_snapshots_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_ranking_snapshots_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_review_stats: {
        Row: {
          average_rating: number | null
          business_id: string
          first_review_at: string | null
          last_review_at: string | null
          rating_1_count: number | null
          rating_1_percent: number | null
          rating_2_count: number | null
          rating_2_percent: number | null
          rating_3_count: number | null
          rating_3_percent: number | null
          rating_4_count: number | null
          rating_4_percent: number | null
          rating_5_count: number | null
          rating_5_percent: number | null
          total_reviews: number | null
          updated_at: string | null
          verified_reviews_count: number | null
        }
        Insert: {
          average_rating?: number | null
          business_id: string
          first_review_at?: string | null
          last_review_at?: string | null
          rating_1_count?: number | null
          rating_1_percent?: number | null
          rating_2_count?: number | null
          rating_2_percent?: number | null
          rating_3_count?: number | null
          rating_3_percent?: number | null
          rating_4_count?: number | null
          rating_4_percent?: number | null
          rating_5_count?: number | null
          rating_5_percent?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          verified_reviews_count?: number | null
        }
        Update: {
          average_rating?: number | null
          business_id?: string
          first_review_at?: string | null
          last_review_at?: string | null
          rating_1_count?: number | null
          rating_1_percent?: number | null
          rating_2_count?: number | null
          rating_2_percent?: number | null
          rating_3_count?: number | null
          rating_3_percent?: number | null
          rating_4_count?: number | null
          rating_4_percent?: number | null
          rating_5_count?: number | null
          rating_5_percent?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          verified_reviews_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_review_stats_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_review_stats_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_review_stats_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_review_stats_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_review_stats_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_reviews: {
        Row: {
          business_id: string
          business_response: string | null
          business_response_at: string | null
          business_response_user_id: string | null
          comment: string | null
          created_at: string | null
          flag_reason: string | null
          helpful_count: number | null
          id: string
          is_featured: boolean | null
          is_flagged: boolean | null
          is_verified: boolean | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_status: string | null
          not_helpful_count: number | null
          photos: Json | null
          rating: number
          title: string | null
          updated_at: string | null
          user_id: string | null
          verification_data: Json | null
          verification_method: string | null
        }
        Insert: {
          business_id: string
          business_response?: string | null
          business_response_at?: string | null
          business_response_user_id?: string | null
          comment?: string | null
          created_at?: string | null
          flag_reason?: string | null
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_flagged?: boolean | null
          is_verified?: boolean | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_status?: string | null
          not_helpful_count?: number | null
          photos?: Json | null
          rating: number
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_data?: Json | null
          verification_method?: string | null
        }
        Update: {
          business_id?: string
          business_response?: string | null
          business_response_at?: string | null
          business_response_user_id?: string | null
          comment?: string | null
          created_at?: string | null
          flag_reason?: string | null
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_flagged?: boolean | null
          is_verified?: boolean | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_status?: string | null
          not_helpful_count?: number | null
          photos?: Json | null
          rating?: number
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_data?: Json | null
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_scores: {
        Row: {
          business_id: string
          score: number | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          score?: number | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_scores_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_scores_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_scores_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_scores_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_scores_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "top_rated_businesses"
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
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "businesses_public"
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
            foreignKeyName: "business_subcategories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
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
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "businesses_public"
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
            foreignKeyName: "business_users_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_confirmation"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          activated_at: string | null
          address: string | null
          alcance: Database["public"]["Enums"]["alcance_tipo"] | null
          analytics_plan: string | null
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
          is_claimed: boolean | null
          is_featured: boolean | null
          is_premium: boolean | null
          logo_url: string | null
          name: string
          nif: string | null
          other_social_url: string | null
          owner_email: string | null
          owner_id: string | null
          owner_name: string | null
          owner_phone: string | null
          plan_id: string | null
          premium_level:
            | Database["public"]["Enums"]["premium_level_tipo"]
            | null
          public_address: string | null
          ranking_score: number | null
          registration_source: string | null
          schedule_closed: string | null
          schedule_weekdays: string | null
          schedule_weekend: string | null
          show_gallery: boolean | null
          show_schedule: boolean | null
          show_social: boolean | null
          show_whatsapp: boolean | null
          slug: string
          subcategory_id: string | null
          subscription_end_date: string | null
          subscription_plan: Database["public"]["Enums"]["subscription_plan_tipo"]
          subscription_price: number | null
          subscription_start_date: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status_tipo"]
          trial_activated_at: string | null
          trial_activated_by: string | null
          trial_ends_at: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
          zone: string | null
        }
        Insert: {
          activated_at?: string | null
          address?: string | null
          alcance?: Database["public"]["Enums"]["alcance_tipo"] | null
          analytics_plan?: string | null
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
          is_claimed?: boolean | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          logo_url?: string | null
          name: string
          nif?: string | null
          other_social_url?: string | null
          owner_email?: string | null
          owner_id?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          plan_id?: string | null
          premium_level?:
            | Database["public"]["Enums"]["premium_level_tipo"]
            | null
          public_address?: string | null
          ranking_score?: number | null
          registration_source?: string | null
          schedule_closed?: string | null
          schedule_weekdays?: string | null
          schedule_weekend?: string | null
          show_gallery?: boolean | null
          show_schedule?: boolean | null
          show_social?: boolean | null
          show_whatsapp?: boolean | null
          slug: string
          subcategory_id?: string | null
          subscription_end_date?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan_tipo"]
          subscription_price?: number | null
          subscription_start_date?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status_tipo"]
          trial_activated_at?: string | null
          trial_activated_by?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          zone?: string | null
        }
        Update: {
          activated_at?: string | null
          address?: string | null
          alcance?: Database["public"]["Enums"]["alcance_tipo"] | null
          analytics_plan?: string | null
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
          is_claimed?: boolean | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          logo_url?: string | null
          name?: string
          nif?: string | null
          other_social_url?: string | null
          owner_email?: string | null
          owner_id?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          plan_id?: string | null
          premium_level?:
            | Database["public"]["Enums"]["premium_level_tipo"]
            | null
          public_address?: string | null
          ranking_score?: number | null
          registration_source?: string | null
          schedule_closed?: string | null
          schedule_weekdays?: string | null
          schedule_weekend?: string | null
          show_gallery?: boolean | null
          show_schedule?: boolean | null
          show_social?: boolean | null
          show_whatsapp?: boolean | null
          slug?: string
          subcategory_id?: string | null
          subscription_end_date?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan_tipo"]
          subscription_price?: number | null
          subscription_start_date?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status_tipo"]
          trial_activated_at?: string | null
          trial_activated_by?: string | null
          trial_ends_at?: string | null
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
            foreignKeyName: "businesses_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_confirmation"
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
            referencedRelation: "onboarding_users_summary"
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
            foreignKeyName: "businesses_converted_by_fkey"
            columns: ["converted_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_confirmation"
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
          {
            foreignKeyName: "businesses_trial_activated_by_fkey"
            columns: ["trial_activated_by"]
            isOneToOne: false
            referencedRelation: "onboarding_users_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_trial_activated_by_fkey"
            columns: ["trial_activated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "businesses_trial_activated_by_fkey"
            columns: ["trial_activated_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_confirmation"
            referencedColumns: ["user_id"]
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
      cities: {
        Row: {
          created_at: string | null
          district: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          district?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          district?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      claim_audit_log: {
        Row: {
          action: string
          admin_notes: string | null
          business_id: string
          created_at: string
          id: string
          new_status: string | null
          performed_by: string
          previous_status: string | null
        }
        Insert: {
          action: string
          admin_notes?: string | null
          business_id: string
          created_at?: string
          id?: string
          new_status?: string | null
          performed_by: string
          previous_status?: string | null
        }
        Update: {
          action?: string
          admin_notes?: string | null
          business_id?: string
          created_at?: string
          id?: string
          new_status?: string | null
          performed_by?: string
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_audit_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_audit_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_audit_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_audit_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_audit_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "businesses_public"
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
            foreignKeyName: "commercial_commissions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_commissions_commercial_id_fkey"
            columns: ["commercial_id"]
            isOneToOne: false
            referencedRelation: "onboarding_users_summary"
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
            foreignKeyName: "commercial_commissions_commercial_id_fkey"
            columns: ["commercial_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_confirmation"
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
          payment_method: string | null
          plan_type: string
          premium_level: string | null
          price: number
          stripe_price_id: string | null
          stripe_product_id: string | null
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
          payment_method?: string | null
          plan_type?: string
          premium_level?: string | null
          price?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
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
          payment_method?: string | null
          plan_type?: string
          premium_level?: string | null
          price?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
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
      consumer_activity_log: {
        Row: {
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          icon: string | null
          id: string
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          icon?: string | null
          id?: string
          metadata?: Json | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          icon?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      consumer_badge_progress: {
        Row: {
          badge_id: string
          current_value: number | null
          target_value: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          badge_id: string
          current_value?: number | null
          target_value: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          badge_id?: string
          current_value?: number | null
          target_value?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumer_badge_progress_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "consumer_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_badge_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_badge_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_confirmation"
            referencedColumns: ["id"]
          },
        ]
      }
      consumer_badges: {
        Row: {
          category: string
          color: string | null
          created_at: string | null
          criteria_type: string
          criteria_value: number
          description: string | null
          display_order: number | null
          icon: string
          id: string
          is_active: boolean | null
          name: string
          slug: string
        }
        Insert: {
          category?: string
          color?: string | null
          created_at?: string | null
          criteria_type: string
          criteria_value?: number
          description?: string | null
          display_order?: number | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string | null
          criteria_type?: string
          criteria_value?: number
          description?: string | null
          display_order?: number | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      consumer_earned_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumer_earned_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "consumer_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_earned_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_earned_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_confirmation"
            referencedColumns: ["id"]
          },
        ]
      }
      consumer_email_preferences: {
        Row: {
          updated_at: string | null
          user_id: string
          weekly_digest: boolean
        }
        Insert: {
          updated_at?: string | null
          user_id: string
          weekly_digest?: boolean
        }
        Update: {
          updated_at?: string | null
          user_id?: string
          weekly_digest?: boolean
        }
        Relationships: []
      }
      consumer_notification_preferences: {
        Row: {
          email_marketing: boolean | null
          email_on_badge: boolean | null
          email_on_message: boolean | null
          email_on_response: boolean | null
          email_weekly_summary: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          email_marketing?: boolean | null
          email_on_badge?: boolean | null
          email_on_message?: boolean | null
          email_on_response?: boolean | null
          email_weekly_summary?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          email_marketing?: boolean | null
          email_on_badge?: boolean | null
          email_on_message?: boolean | null
          email_on_response?: boolean | null
          email_weekly_summary?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumer_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_with_confirmation"
            referencedColumns: ["id"]
          },
        ]
      }
      consumer_plans: {
        Row: {
          created_at: string | null
          display_order: number | null
          features: Json | null
          id: string
          limits: Json | null
          name: string
          price_monthly: number | null
          price_yearly: number | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          limits?: Json | null
          name: string
          price_monthly?: number | null
          price_yearly?: number | null
          slug: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          limits?: Json | null
          name?: string
          price_monthly?: number | null
          price_yearly?: number | null
          slug?: string
        }
        Relationships: []
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
            referencedRelation: "onboarding_users_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "consumer_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_confirmation"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cs_actions: {
        Row: {
          action_type: string
          business_id: string | null
          created_at: string | null
          cs_user_id: string | null
          id: string
          notes: string | null
        }
        Insert: {
          action_type: string
          business_id?: string | null
          created_at?: string | null
          cs_user_id?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          action_type?: string
          business_id?: string | null
          created_at?: string | null
          cs_user_id?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cs_actions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cs_actions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cs_actions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cs_actions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cs_actions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      email_cadence_enrollments: {
        Row: {
          business_id: string | null
          cadence_id: string
          cancelled_at: string | null
          completed_at: string | null
          converted_at: string | null
          current_step: number | null
          enrolled_at: string | null
          enrolled_by: string | null
          id: string
          pause_on_click: boolean | null
          pause_on_reply: boolean | null
          paused_at: string | null
          paused_reason: string | null
          recipient_email: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          cadence_id: string
          cancelled_at?: string | null
          completed_at?: string | null
          converted_at?: string | null
          current_step?: number | null
          enrolled_at?: string | null
          enrolled_by?: string | null
          id?: string
          pause_on_click?: boolean | null
          pause_on_reply?: boolean | null
          paused_at?: string | null
          paused_reason?: string | null
          recipient_email: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          cadence_id?: string
          cancelled_at?: string | null
          completed_at?: string | null
          converted_at?: string | null
          current_step?: number | null
          enrolled_at?: string | null
          enrolled_by?: string | null
          id?: string
          pause_on_click?: boolean | null
          pause_on_reply?: boolean | null
          paused_at?: string | null
          paused_reason?: string | null
          recipient_email?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_cadence_enrollments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_cadence_enrollments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_cadence_enrollments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_cadence_enrollments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_cadence_enrollments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_cadence_enrollments_cadence_id_fkey"
            columns: ["cadence_id"]
            isOneToOne: false
            referencedRelation: "email_cadences"
            referencedColumns: ["id"]
          },
        ]
      }
      email_cadence_steps: {
        Row: {
          cadence_id: string
          condition_ref_step: number | null
          condition_type: string | null
          delay_days: number
          delay_hours: number | null
          id: string
          step_order: number
          template_id: string
        }
        Insert: {
          cadence_id: string
          condition_ref_step?: number | null
          condition_type?: string | null
          delay_days?: number
          delay_hours?: number | null
          id?: string
          step_order: number
          template_id: string
        }
        Update: {
          cadence_id?: string
          condition_ref_step?: number | null
          condition_type?: string | null
          delay_days?: number
          delay_hours?: number | null
          id?: string
          step_order?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_cadence_steps_cadence_id_fkey"
            columns: ["cadence_id"]
            isOneToOne: false
            referencedRelation: "email_cadences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_cadence_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_cadences: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          recipient_count: number | null
          scheduled_at: string | null
          segment_criteria: Json | null
          sent_at: string | null
          status: string | null
          template_id: string | null
          total_recipients: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          recipient_count?: number | null
          scheduled_at?: string | null
          segment_criteria?: Json | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          total_recipients?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          recipient_count?: number | null
          scheduled_at?: string | null
          segment_criteria?: Json | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          total_recipients?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_inbox: {
        Row: {
          assigned_to: string | null
          body_html: string | null
          body_text: string | null
          business_id: string | null
          from_email: string
          from_name: string | null
          id: string
          provider_message_id: string | null
          received_at: string | null
          status: string | null
          subject: string
          tags: string[] | null
          ticket_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          body_html?: string | null
          body_text?: string | null
          business_id?: string | null
          from_email: string
          from_name?: string | null
          id?: string
          provider_message_id?: string | null
          received_at?: string | null
          status?: string | null
          subject: string
          tags?: string[] | null
          ticket_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          body_html?: string | null
          body_text?: string | null
          business_id?: string | null
          from_email?: string
          from_name?: string | null
          id?: string
          provider_message_id?: string | null
          received_at?: string | null
          status?: string | null
          subject?: string
          tags?: string[] | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_inbox_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_inbox_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_inbox_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_inbox_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_inbox_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_inbox_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "my_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_inbox_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_inbox_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets_with_context"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_inbox_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_sla_violations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          bounce_reason: string | null
          bounced: boolean | null
          campaign_id: string | null
          clicked_at: string | null
          html_content: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          provider: string | null
          provider_id: string | null
          provider_status: string | null
          recipient_email: string
          recipient_id: string | null
          recipient_type: string | null
          replied_at: string | null
          sent_at: string | null
          sent_by: string | null
          subject: string
          template_id: string | null
        }
        Insert: {
          bounce_reason?: string | null
          bounced?: boolean | null
          campaign_id?: string | null
          clicked_at?: string | null
          html_content?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          provider?: string | null
          provider_id?: string | null
          provider_status?: string | null
          recipient_email: string
          recipient_id?: string | null
          recipient_type?: string | null
          replied_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          subject: string
          template_id?: string | null
        }
        Update: {
          bounce_reason?: string | null
          bounced?: boolean | null
          campaign_id?: string | null
          clicked_at?: string | null
          html_content?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          provider?: string | null
          provider_id?: string | null
          provider_status?: string | null
          recipient_email?: string
          recipient_id?: string | null
          recipient_type?: string | null
          replied_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          subject?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_notifications: {
        Row: {
          created_at: string | null
          email_log_id: string | null
          id: string
          inbox_id: string | null
          is_read: boolean | null
          message: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_log_id?: string | null
          id?: string
          inbox_id?: string | null
          is_read?: boolean | null
          message?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_log_id?: string | null
          id?: string
          inbox_id?: string | null
          is_read?: boolean | null
          message?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_notifications_email_log_id_fkey"
            columns: ["email_log_id"]
            isOneToOne: false
            referencedRelation: "email_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_notifications_inbox_id_fkey"
            columns: ["inbox_id"]
            isOneToOne: false
            referencedRelation: "email_inbox"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          text_content: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          text_content?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          text_content?: string | null
          updated_at?: string | null
          variables?: Json | null
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
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expiration_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expiration_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
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
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_notifications_related_business_id_fkey"
            columns: ["related_business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_notifications_related_business_id_fkey"
            columns: ["related_business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          source: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          source?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          source?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          read: boolean | null
          reference_id: string | null
          request_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          reference_id?: string | null
          request_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          reference_id?: string | null
          request_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_organizations: {
        Row: {
          active_businesses_count: number | null
          address: string | null
          businesses_count: number | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string | null
          custom_features: Json | null
          custom_onboarding: boolean | null
          dedicated_manager: boolean | null
          description: string | null
          discount_percentage: number | null
          free_months: number | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          primary_color: string | null
          priority_support: boolean | null
          slug: string
          total_revenue_generated: number | null
          type: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          active_businesses_count?: number | null
          address?: string | null
          businesses_count?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          custom_features?: Json | null
          custom_onboarding?: boolean | null
          dedicated_manager?: boolean | null
          description?: string | null
          discount_percentage?: number | null
          free_months?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          priority_support?: boolean | null
          slug: string
          total_revenue_generated?: number | null
          type: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          active_businesses_count?: number | null
          address?: string | null
          businesses_count?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          custom_features?: Json | null
          custom_onboarding?: boolean | null
          dedicated_manager?: boolean | null
          description?: string | null
          discount_percentage?: number | null
          free_months?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          priority_support?: boolean | null
          slug?: string
          total_revenue_generated?: number | null
          type?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      partner_promo_codes: {
        Row: {
          applies_to_plans: Json | null
          code: string
          created_at: string | null
          current_uses: number | null
          description: string | null
          discount_fixed_amount: number | null
          discount_percentage: number | null
          expires_at: string | null
          free_months: number | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          max_uses_per_business: number | null
          minimum_plan_value: number | null
          organization_id: string | null
          starts_at: string | null
          updated_at: string | null
        }
        Insert: {
          applies_to_plans?: Json | null
          code: string
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_fixed_amount?: number | null
          discount_percentage?: number | null
          expires_at?: string | null
          free_months?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_business?: number | null
          minimum_plan_value?: number | null
          organization_id?: string | null
          starts_at?: string | null
          updated_at?: string | null
        }
        Update: {
          applies_to_plans?: Json | null
          code?: string
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_fixed_amount?: number | null
          discount_percentage?: number | null
          expires_at?: string | null
          free_months?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_business?: number | null
          minimum_plan_value?: number | null
          organization_id?: string | null
          starts_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_promo_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "partner_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          email_sent_at: string | null
          id: string
          reset_by: string | null
          reset_method: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          email_sent_at?: string | null
          id?: string
          reset_by?: string | null
          reset_method: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          email_sent_at?: string | null
          id?: string
          reset_by?: string | null
          reset_method?: string
          user_id?: string
        }
        Relationships: []
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
      plan_changes: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          new_plan_id: string | null
          notes: string | null
          old_plan_id: string | null
          user_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_plan_id?: string | null
          notes?: string | null
          old_plan_id?: string | null
          user_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_plan_id?: string | null
          notes?: string | null
          old_plan_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_changes_new_plan_id_fkey"
            columns: ["new_plan_id"]
            isOneToOne: false
            referencedRelation: "consumer_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_changes_old_plan_id_fkey"
            columns: ["old_plan_id"]
            isOneToOne: false
            referencedRelation: "consumer_plans"
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
          avatar_url: string | null
          city: string | null
          consumer_plan_expires_at: string | null
          consumer_plan_id: string | null
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
          avatar_url?: string | null
          city?: string | null
          consumer_plan_expires_at?: string | null
          consumer_plan_id?: string | null
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
          avatar_url?: string | null
          city?: string | null
          consumer_plan_expires_at?: string | null
          consumer_plan_id?: string | null
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
      promo_code_usage: {
        Row: {
          business_id: string
          discount_applied: number | null
          free_months_applied: number | null
          id: string
          promo_code_id: string
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          business_id: string
          discount_applied?: number | null
          free_months_applied?: number | null
          id?: string
          promo_code_id: string
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: string
          discount_applied?: number | null
          free_months_applied?: number | null
          id?: string
          promo_code_id?: string
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usage_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_usage_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_usage_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_usage_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_usage_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_usage_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "partner_promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      request_business_matches: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          business_id: string
          contact_unlocked: boolean | null
          first_response_at: string | null
          id: string
          is_national_fallback: boolean | null
          price_quote: string | null
          request_id: string
          responded_at: string | null
          sent_at: string
          status: Database["public"]["Enums"]["match_status"]
          viewed_at: string | null
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          business_id: string
          contact_unlocked?: boolean | null
          first_response_at?: string | null
          id?: string
          is_national_fallback?: boolean | null
          price_quote?: string | null
          request_id: string
          responded_at?: string | null
          sent_at?: string
          status?: Database["public"]["Enums"]["match_status"]
          viewed_at?: string | null
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          business_id?: string
          contact_unlocked?: boolean | null
          first_response_at?: string | null
          id?: string
          is_national_fallback?: boolean | null
          price_quote?: string | null
          request_id?: string
          responded_at?: string | null
          sent_at?: string
          status?: Database["public"]["Enums"]["match_status"]
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_business_matches_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_business_matches_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_confirmation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_business_matches_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "businesses_public"
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
            foreignKeyName: "request_business_matches_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
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
      request_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read_at: string | null
          request_id: string | null
          sender_id: string | null
          sender_role: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read_at?: string | null
          request_id?: string | null
          sender_id?: string | null
          sender_role?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read_at?: string | null
          request_id?: string | null
          sender_id?: string | null
          sender_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "onboarding_users_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "request_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_confirmation"
            referencedColumns: ["user_id"]
          },
        ]
      }
      request_ratings: {
        Row: {
          business_id: string | null
          comment: string | null
          consumer_id: string | null
          created_at: string | null
          id: string
          match_id: string | null
          rating: number | null
          request_id: string | null
        }
        Insert: {
          business_id?: string | null
          comment?: string | null
          consumer_id?: string | null
          created_at?: string | null
          id?: string
          match_id?: string | null
          rating?: number | null
          request_id?: string | null
        }
        Update: {
          business_id?: string | null
          comment?: string | null
          consumer_id?: string | null
          created_at?: string | null
          id?: string
          match_id?: string | null
          rating?: number | null
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_ratings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_ratings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_ratings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_ratings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_ratings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_ratings_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "request_business_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_ratings_request_id_fkey"
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
            foreignKeyName: "revenue_events_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_confirmation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard_summary"
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
            referencedRelation: "businesses_public"
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
            foreignKeyName: "revenue_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_events_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_events_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_confirmation"
            referencedColumns: ["id"]
          },
        ]
      }
      review_helpfulness_votes: {
        Row: {
          created_at: string | null
          id: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_helpful?: boolean
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpfulness_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "business_reviews"
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
          type: string
        }
        Insert: {
          created_at?: string
          equivalente: string
          id?: string
          termo: string
          type?: string
        }
        Update: {
          created_at?: string
          equivalente?: string
          id?: string
          termo?: string
          type?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          address: string | null
          assigned_to_admin: string | null
          category_id: string | null
          closed_at: string | null
          consumer_city: string | null
          consumer_email: string | null
          consumer_name: string | null
          consumer_phone: string | null
          contact_unlocked: boolean | null
          created_at: string
          description: string | null
          id: string
          location_city: string | null
          location_postal_code: string | null
          status: Database["public"]["Enums"]["request_status"]
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
          consumer_city?: string | null
          consumer_email?: string | null
          consumer_name?: string | null
          consumer_phone?: string | null
          contact_unlocked?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          location_city?: string | null
          location_postal_code?: string | null
          status?: Database["public"]["Enums"]["request_status"]
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
          consumer_city?: string | null
          consumer_email?: string | null
          consumer_name?: string | null
          consumer_phone?: string | null
          contact_unlocked?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          location_city?: string | null
          location_postal_code?: string | null
          status?: Database["public"]["Enums"]["request_status"]
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
            referencedRelation: "onboarding_users_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "service_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_confirmation"
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
      subcategory_relations: {
        Row: {
          created_at: string
          id: string
          priority: number
          related_subcategory_id: string
          relation_type: string
          subcategory_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          priority?: number
          related_subcategory_id: string
          relation_type?: string
          subcategory_id: string
        }
        Update: {
          created_at?: string
          id?: string
          priority?: number
          related_subcategory_id?: string
          relation_type?: string
          subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategory_relations_related_subcategory_id_fkey"
            columns: ["related_subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcategory_relations_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
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
          status: string | null
        }
        Insert: {
          city_name: string
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          status?: string | null
        }
        Update: {
          city_name?: string
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          status?: string | null
        }
        Relationships: []
      }
      support_ticket_messages: {
        Row: {
          created_at: string | null
          id: string
          is_internal_note: boolean | null
          message: string
          ticket_id: string
          user_id: string
          user_role: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_internal_note?: boolean | null
          message: string
          ticket_id: string
          user_id: string
          user_role?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_internal_note?: boolean | null
          message?: string
          ticket_id?: string
          user_id?: string
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "my_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets_with_context"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_sla_violations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to_department: string
          assigned_to_user: string | null
          business_id: string | null
          category: string | null
          closed_at: string | null
          created_at: string | null
          created_by: string
          created_by_role: string | null
          description: string
          first_response_at: string | null
          id: string
          priority: string | null
          request_id: string | null
          resolved_at: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to_department: string
          assigned_to_user?: string | null
          business_id?: string | null
          category?: string | null
          closed_at?: string | null
          created_at?: string | null
          created_by: string
          created_by_role?: string | null
          description: string
          first_response_at?: string | null
          id?: string
          priority?: string | null
          request_id?: string | null
          resolved_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to_department?: string
          assigned_to_user?: string | null
          business_id?: string | null
          category?: string | null
          closed_at?: string | null
          created_at?: string | null
          created_by?: string
          created_by_role?: string | null
          description?: string
          first_response_at?: string | null
          id?: string
          priority?: string | null
          request_id?: string | null
          resolved_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
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
      ticket_audit_log: {
        Row: {
          change_type: string | null
          changed_by: string
          created_at: string | null
          id: string
          new_value: string | null
          notes: string | null
          old_value: string | null
          ticket_id: string
        }
        Insert: {
          change_type?: string | null
          changed_by: string
          created_at?: string | null
          id?: string
          new_value?: string | null
          notes?: string | null
          old_value?: string | null
          ticket_id: string
        }
        Update: {
          change_type?: string | null
          changed_by?: string
          created_at?: string | null
          id?: string
          new_value?: string | null
          notes?: string | null
          old_value?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_audit_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "my_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_audit_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_audit_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets_with_context"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_audit_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_sla_violations"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          read_at: string | null
          ticket_id: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          read_at?: string | null
          ticket_id: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          read_at?: string | null
          ticket_id?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_notifications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "my_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_notifications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_notifications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets_with_context"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_notifications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_sla_violations"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_response_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          department: string | null
          id: string
          is_active: boolean | null
          shortcut: string | null
          template_text: string
          title: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          id?: string
          is_active?: boolean | null
          shortcut?: string | null
          template_text: string
          title: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          id?: string
          is_active?: boolean | null
          shortcut?: string | null
          template_text?: string
          title?: string
          updated_at?: string | null
          usage_count?: number | null
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
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string
          last_request_at: string | null
          phone: string | null
          requests_count: number
          score: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          last_request_at?: string | null
          phone?: string | null
          requests_count?: number
          score?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          last_request_at?: string | null
          phone?: string | null
          requests_count?: number
          score?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
            referencedRelation: "onboarding_users_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_search_context_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_search_context_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_with_confirmation"
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
            referencedRelation: "onboarding_users_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_search_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_search_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_with_confirmation"
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
      admin_unread_alerts: {
        Row: {
          unread_count: number | null
        }
        Relationships: []
      }
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
      business_dashboard_summary: {
        Row: {
          average_rating: number | null
          badges_count: number | null
          conversion_rate: number | null
          id: string | null
          is_active: boolean | null
          leads_this_month: number | null
          name: string | null
          slug: string | null
          total_reviews: number | null
          unread_notifications: number | null
          verified_reviews: number | null
          views_this_month: number | null
        }
        Relationships: []
      }
      business_performance: {
        Row: {
          accepted: number | null
          business_id: string | null
          ignored: number | null
          responded: number | null
          response_rate: number | null
          total_requests: number | null
        }
        Relationships: [
          {
            foreignKeyName: "request_business_matches_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "businesses_public"
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
            foreignKeyName: "request_business_matches_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses_public: {
        Row: {
          alcance: Database["public"]["Enums"]["alcance_tipo"] | null
          badge: string | null
          category_id: string | null
          city: string | null
          cta_email: string | null
          cta_phone: string | null
          cta_website: string | null
          cta_whatsapp: string | null
          description: string | null
          display_order: number | null
          facebook_url: string | null
          id: string | null
          images: string[] | null
          instagram_url: string | null
          is_featured: boolean | null
          is_premium: boolean | null
          logo_url: string | null
          name: string | null
          other_social_url: string | null
          plan_level: string | null
          premium_level:
            | Database["public"]["Enums"]["premium_level_tipo"]
            | null
          public_address: string | null
          ranking_score: number | null
          schedule_weekdays: string | null
          schedule_weekend: string | null
          slug: string | null
          subcategory_id: string | null
          zone: string | null
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
            foreignKeyName: "businesses_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      cadence_enrollment_summary: {
        Row: {
          active_count: number | null
          cadence_id: string | null
          cadence_name: string | null
          cancelled_count: number | null
          completed_count: number | null
          paused_count: number | null
          total_enrolled: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_cadence_enrollments_cadence_id_fkey"
            columns: ["cadence_id"]
            isOneToOne: false
            referencedRelation: "email_cadences"
            referencedColumns: ["id"]
          },
        ]
      }
      cadence_step_performance: {
        Row: {
          cadence_id: string | null
          click_rate: number | null
          clicked: number | null
          open_rate: number | null
          opened: number | null
          sent: number | null
          step_id: string | null
          step_order: number | null
          template_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_cadence_steps_cadence_id_fkey"
            columns: ["cadence_id"]
            isOneToOne: false
            referencedRelation: "email_cadences"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "onboarding_users_summary"
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
            foreignKeyName: "businesses_converted_by_fkey"
            columns: ["converted_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_confirmation"
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
      email_performance_summary: {
        Row: {
          bounce_rate: number | null
          campaign_id: string | null
          campaign_name: string | null
          click_rate: number | null
          open_rate: number | null
          reply_rate: number | null
          total_bounced: number | null
          total_clicked: number | null
          total_opened: number | null
          total_replied: number | null
          total_sent: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      my_tickets: {
        Row: {
          assigned_to_department: string | null
          business_name: string | null
          created_at: string | null
          id: string | null
          priority: string | null
          relacao: string | null
          status: string | null
          title: string | null
        }
        Relationships: []
      }
      onboarding_users_summary: {
        Row: {
          businesses_member: number | null
          businesses_owned: number | null
          created_at: string | null
          email: string | null
          email_confirmed: boolean | null
          full_name: string | null
          id: string | null
          last_sign_in_at: string | null
          status: string | null
          user_role: Database["public"]["Enums"]["app_role"] | null
          user_type: string | null
        }
        Relationships: []
      }
      popular_templates: {
        Row: {
          category: string | null
          created_at: string | null
          department: string | null
          shortcut: string | null
          title: string | null
          usage_count: number | null
        }
        Relationships: []
      }
      profiles_with_confirmation: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          email_confirmed_at: string | null
          full_name: string | null
          id: string | null
          last_activity_at: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
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
      support_tickets_with_context: {
        Row: {
          assigned_to_department: string | null
          assigned_to_user: string | null
          business_id: string | null
          business_name: string | null
          category: string | null
          closed_at: string | null
          created_at: string | null
          created_by: string | null
          created_by_role: string | null
          description: string | null
          first_response_at: string | null
          id: string | null
          priority: string | null
          request_category: string | null
          request_city: string | null
          request_description: string | null
          request_id: string | null
          request_status: Database["public"]["Enums"]["request_status"] | null
          resolved_at: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "commercial_alerts_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "top_rated_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_history_detailed: {
        Row: {
          change_type: string | null
          changed_by_email: string | null
          changed_by_name: string | null
          created_at: string | null
          id: string | null
          new_value: string | null
          notes: string | null
          old_value: string | null
          ticket_id: string | null
          ticket_title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_audit_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "my_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_audit_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_audit_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets_with_context"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_audit_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_sla_violations"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets_by_department: {
        Row: {
          avg_hours_first_response: number | null
          departamento: string | null
          sem_resposta: number | null
          status: string | null
          total: number | null
        }
        Relationships: []
      }
      tickets_sla_violations: {
        Row: {
          assigned_to_department: string | null
          business_name: string | null
          created_at: string | null
          hours_open: number | null
          id: string | null
          priority: string | null
          sla_hours: number | null
          sla_status: string | null
          status: string | null
          title: string | null
        }
        Relationships: []
      }
      top_rated_businesses: {
        Row: {
          average_rating: number | null
          category_id: string | null
          city: string | null
          id: string | null
          name: string | null
          slug: string | null
          total_reviews: number | null
          verified_reviews_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
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
      admin_assign_business_to_user: {
        Args: { p_business_id: string; p_role?: string; p_user_id: string }
        Returns: undefined
      }
      admin_associate_business_to_user: {
        Args: { p_business_id: string; p_user_id: string }
        Returns: undefined
      }
      admin_confirm_user_email: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      admin_create_user: {
        Args: {
          p_email: string
          p_full_name: string
          p_password: string
          p_phone?: string
        }
        Returns: string
      }
      admin_reject_claim: {
        Args: { p_admin_notes: string; p_business_id: string }
        Returns: Json
      }
      admin_remove_business_from_user: {
        Args: { p_business_id: string; p_user_id: string }
        Returns: undefined
      }
      admin_revoke_claim: {
        Args: { p_admin_notes?: string; p_business_id: string }
        Returns: Json
      }
      admin_set_user_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      auto_escalate_sla_violations: { Args: never; Returns: undefined }
      auto_reject_old_claims: { Args: never; Returns: undefined }
      award_consumer_badges_daily: { Args: never; Returns: undefined }
      calculate_business_conversion_rate: {
        Args: { bid: string; period?: string }
        Returns: number
      }
      calculate_business_ranking_score: {
        Args: { p_business_id: string }
        Returns: number
      }
      calculate_business_score: {
        Args: { p_business_id: string }
        Returns: number
      }
      can_business_send_message: {
        Args: { p_request_id: string; p_user_id: string }
        Returns: boolean
      }
      check_and_award_automatic_badges: {
        Args: { bid: string }
        Returns: number
      }
      check_pending_businesses_48h: { Args: never; Returns: undefined }
      check_unanswered_24h: { Args: never; Returns: undefined }
      check_unmatched_requests: { Args: never; Returns: undefined }
      claim_business: {
        Args: { p_business_id: string; p_claim_message?: string }
        Returns: Json
      }
      cleanup_old_analytics_events: {
        Args: { days_to_keep?: number }
        Returns: number
      }
      compute_badge_progress: {
        Args: { p_business_id: string }
        Returns: undefined
      }
      compute_consumer_badge_progress: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      create_consumer_support_ticket:
        | {
            Args: {
              p_category?: string
              p_description: string
              p_request_id?: string
              p_title: string
            }
            Returns: string
          }
        | {
            Args: {
              p_category?: string
              p_description: string
              p_title: string
            }
            Returns: string
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
      create_test_users: { Args: never; Returns: undefined }
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
      force_cadence_ready: { Args: { p_cadence_id: string }; Returns: number }
      get_admin_intelligence: { Args: { p_days?: number }; Returns: Json }
      get_all_users_for_onboarding: { Args: never; Returns: Json }
      get_business_benchmark: {
        Args: { p_business_id: string; p_days?: number }
        Returns: Json
      }
      get_business_benchmark_v2: {
        Args: {
          p_business_id: string
          p_days?: number
          p_subcategory_id?: string
        }
        Returns: Json
      }
      get_business_favorites_count: {
        Args: { business_uuid: string }
        Returns: number
      }
      get_business_ids_for_user: {
        Args: { p_user_id: string }
        Returns: string[]
      }
      get_business_intelligence: {
        Args: { p_business_id: string; p_days?: number }
        Returns: Json
      }
      get_business_metrics_basic: {
        Args: { p_business_id: string }
        Returns: Json
      }
      get_business_metrics_pro: {
        Args: { p_business_id: string }
        Returns: Json
      }
      get_business_profile_score: {
        Args: { p_business_id: string }
        Returns: Json
      }
      get_business_public_badges: {
        Args: { p_business_id: string }
        Returns: {
          badge_color: string
          badge_icon: string
          badge_name: string
          badge_slug: string
        }[]
      }
      get_business_public_profile: { Args: { p_slug: string }; Returns: Json }
      get_businesses_for_cadence: {
        Args: {
          p_category_id?: string
          p_commercial_status?: string
          p_has_email?: boolean
          p_limit?: number
          p_offset?: number
          p_subcategory_id?: string
        }
        Returns: Json
      }
      get_my_profile_id: { Args: never; Returns: string }
      get_request_ids_for_business: {
        Args: { p_user_id: string }
        Returns: string[]
      }
      get_request_ids_for_consumer: {
        Args: { p_user_id: string }
        Returns: string[]
      }
      get_unlinked_businesses: {
        Args: { p_limit?: number; p_q?: string }
        Returns: {
          city: string
          id: string
          is_active: boolean
          name: string
          slug: string
        }[]
      }
      get_user_business_membership: { Args: never; Returns: Json }
      get_user_context: { Args: never; Returns: Json }
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
      increment_blog_views: { Args: { post_slug: string }; Returns: undefined }
      invite_business_member: {
        Args: {
          p_business_id: string
          p_email: string
          p_role: Database["public"]["Enums"]["business_role"]
        }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      is_business_member: { Args: { p_business_id: string }; Returns: boolean }
      is_commercial: { Args: never; Returns: boolean }
      match_request_to_businesses: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      process_followups: { Args: never; Returns: undefined }
      recalculate_all_ranking_scores: { Args: never; Returns: undefined }
      recalculate_all_scores: { Args: never; Returns: undefined }
      register_business_with_owner: {
        Args: {
          p_address?: string
          p_category_id?: string
          p_city?: string
          p_cta_email?: string
          p_cta_phone?: string
          p_cta_website?: string
          p_cta_whatsapp?: string
          p_name: string
          p_nif?: string
          p_owner_email?: string
          p_owner_name?: string
          p_owner_phone?: string
          p_registration_source?: string
          p_slug: string
          p_subcategory_id?: string
        }
        Returns: string
      }
      remove_business_member: {
        Args: { p_business_id: string; p_user_id: string }
        Returns: undefined
      }
      revoke_business_access: {
        Args: { p_business_id: string; p_user_id: string }
        Returns: undefined
      }
      save_ranking_snapshots: { Args: never; Returns: undefined }
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
      search_cities: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          is_exact: boolean
          name: string
          similarity_score: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      track_business_event: {
        Args: { p_business_id: string; p_event_type: string; p_metadata?: Json }
        Returns: undefined
      }
      unaccent: { Args: { "": string }; Returns: string }
      update_all_ranking_scores: { Args: never; Returns: undefined }
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
      upsert_business_from_import:
        | {
            Args: {
              p_address?: string
              p_category_id?: string
              p_city?: string
              p_cta_email?: string
              p_cta_phone?: string
              p_cta_website?: string
              p_cta_whatsapp?: string
              p_name: string
              p_owner_email?: string
              p_owner_name?: string
              p_owner_phone?: string
              p_registration_source?: string
              p_slug?: string
              p_subcategory_id?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_address?: string
              p_category_id?: string
              p_city?: string
              p_cta_email?: string
              p_cta_phone?: string
              p_cta_website?: string
              p_cta_whatsapp?: string
              p_description?: string
              p_facebook_url?: string
              p_instagram_url?: string
              p_name: string
              p_nif?: string
              p_owner_email?: string
              p_owner_name?: string
              p_owner_phone?: string
              p_registration_source?: string
              p_slug?: string
              p_subcategory_id?: string
            }
            Returns: Json
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
        | "consumer"
        | "business_owner"
      business_role: "owner" | "manager" | "staff" | "pending_owner" | "revoked"
      commercial_status_tipo:
        | "nao_contactado"
        | "contactado"
        | "interessado"
        | "cliente"
        | "perdido"
      match_status:
        | "enviado"
        | "visualizado"
        | "em_conversa"
        | "orcamento_enviado"
        | "aceite"
        | "recusado"
        | "expirado"
        | "sem_resposta"
      premium_level_tipo: "SUPER" | "CATEGORIA" | "SUBCATEGORIA"
      request_status:
        | "aberto"
        | "em_conversa"
        | "propostas_recebidas"
        | "em_negociacao"
        | "fechado"
        | "cancelado"
        | "expirado"
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
        "consumer",
        "business_owner",
      ],
      business_role: ["owner", "manager", "staff", "pending_owner", "revoked"],
      commercial_status_tipo: [
        "nao_contactado",
        "contactado",
        "interessado",
        "cliente",
        "perdido",
      ],
      match_status: [
        "enviado",
        "visualizado",
        "em_conversa",
        "orcamento_enviado",
        "aceite",
        "recusado",
        "expirado",
        "sem_resposta",
      ],
      premium_level_tipo: ["SUPER", "CATEGORIA", "SUBCATEGORIA"],
      request_status: [
        "aberto",
        "em_conversa",
        "propostas_recebidas",
        "em_negociacao",
        "fechado",
        "cancelado",
        "expirado",
      ],
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
