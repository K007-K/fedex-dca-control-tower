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
      account_deletion_requests: {
        Row: {
          created_at: string | null
          handled_at: string | null
          handled_by: string | null
          handler_notes: string | null
          id: string
          reason: string | null
          requester_dca_id: string | null
          requester_email: string
          requester_name: string | null
          requester_role: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          handled_at?: string | null
          handled_by?: string | null
          handler_notes?: string | null
          id?: string
          reason?: string | null
          requester_dca_id?: string | null
          requester_email: string
          requester_name?: string | null
          requester_role: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          handled_at?: string | null
          handled_by?: string | null
          handler_notes?: string | null
          id?: string
          reason?: string | null
          requester_dca_id?: string | null
          requester_email?: string
          requester_name?: string | null
          requester_role?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agent_notifications: {
        Row: {
          agent_id: string
          case_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          read_at: string | null
          title: string
        }
        Insert: {
          agent_id: string
          case_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
          read_at?: string | null
          title: string
        }
        Update: {
          agent_id?: string
          case_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          read_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_notifications_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_notifications_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_notifications_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases_with_dpd"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          organization_id: string | null
          revoked_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name?: string
          organization_id?: string | null
          revoked_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          organization_id?: string | null
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_role: string | null
          actor_service_name: string | null
          actor_type: Database["public"]["Enums"]["actor_type"] | null
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          region_id: string
          request_source: string | null
          resource_id: string | null
          resource_type: string | null
          service_name: string | null
          severity: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor_role?: string | null
          actor_service_name?: string | null
          actor_type?: Database["public"]["Enums"]["actor_type"] | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          region_id: string
          request_source?: string | null
          resource_id?: string | null
          resource_type?: string | null
          service_name?: string | null
          severity?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_role?: string | null
          actor_service_name?: string | null
          actor_type?: Database["public"]["Enums"]["actor_type"] | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          region_id?: string
          request_source?: string | null
          resource_id?: string | null
          resource_type?: string | null
          service_name?: string | null
          severity?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      case_actions: {
        Row: {
          action_description: string | null
          action_type: string
          attached_documents: Json | null
          case_id: string | null
          contact_duration_seconds: number | null
          contact_method: Database["public"]["Enums"]["contact_method"] | null
          contact_notes: string | null
          contact_outcome: Database["public"]["Enums"]["contact_outcome"] | null
          created_at: string | null
          id: string
          metadata: Json | null
          new_status: Database["public"]["Enums"]["case_status"] | null
          next_contact_scheduled: string | null
          old_status: Database["public"]["Enums"]["case_status"] | null
          payment_amount: number | null
          payment_method: string | null
          payment_reference: string | null
          performed_by: string | null
          performed_by_dca_id: string | null
          performed_by_role: Database["public"]["Enums"]["user_role"] | null
          roe_recommendation_id: string | null
          roe_recommendation_used: boolean | null
          sentiment_label: string | null
          sentiment_score: number | null
          status_change_reason: string | null
        }
        Insert: {
          action_description?: string | null
          action_type: string
          attached_documents?: Json | null
          case_id?: string | null
          contact_duration_seconds?: number | null
          contact_method?: Database["public"]["Enums"]["contact_method"] | null
          contact_notes?: string | null
          contact_outcome?:
            | Database["public"]["Enums"]["contact_outcome"]
            | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_status?: Database["public"]["Enums"]["case_status"] | null
          next_contact_scheduled?: string | null
          old_status?: Database["public"]["Enums"]["case_status"] | null
          payment_amount?: number | null
          payment_method?: string | null
          payment_reference?: string | null
          performed_by?: string | null
          performed_by_dca_id?: string | null
          performed_by_role?: Database["public"]["Enums"]["user_role"] | null
          roe_recommendation_id?: string | null
          roe_recommendation_used?: boolean | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          status_change_reason?: string | null
        }
        Update: {
          action_description?: string | null
          action_type?: string
          attached_documents?: Json | null
          case_id?: string | null
          contact_duration_seconds?: number | null
          contact_method?: Database["public"]["Enums"]["contact_method"] | null
          contact_notes?: string | null
          contact_outcome?:
            | Database["public"]["Enums"]["contact_outcome"]
            | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_status?: Database["public"]["Enums"]["case_status"] | null
          next_contact_scheduled?: string | null
          old_status?: Database["public"]["Enums"]["case_status"] | null
          payment_amount?: number | null
          payment_method?: string | null
          payment_reference?: string | null
          performed_by?: string | null
          performed_by_dca_id?: string | null
          performed_by_role?: Database["public"]["Enums"]["user_role"] | null
          roe_recommendation_id?: string | null
          roe_recommendation_used?: boolean | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          status_change_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_actions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_actions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases_with_dpd"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_actions_performed_by_dca_id_fkey"
            columns: ["performed_by_dca_id"]
            isOneToOne: false
            referencedRelation: "dca_performance_metrics"
            referencedColumns: ["dca_id"]
          },
          {
            foreignKeyName: "case_actions_performed_by_dca_id_fkey"
            columns: ["performed_by_dca_id"]
            isOneToOne: false
            referencedRelation: "dcas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_actions_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      case_activities: {
        Row: {
          activity_type: string
          case_id: string
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          metadata: Json | null
        }
        Insert: {
          activity_type: string
          case_id: string
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          activity_type?: string
          case_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "case_activities_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_activities_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases_with_dpd"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      case_documents: {
        Row: {
          case_id: string
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          case_id: string
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          case_id?: string
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases_with_dpd"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      case_timeline: {
        Row: {
          case_id: string
          created_at: string | null
          description: string
          event_category: string
          event_type: string
          id: string
          idempotency_key: string | null
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          performed_by: string
          performed_by_dca_id: string | null
          performed_by_role: string | null
        }
        Insert: {
          case_id: string
          created_at?: string | null
          description: string
          event_category: string
          event_type: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          performed_by: string
          performed_by_dca_id?: string | null
          performed_by_role?: string | null
        }
        Update: {
          case_id?: string
          created_at?: string | null
          description?: string
          event_category?: string
          event_type?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          performed_by?: string
          performed_by_dca_id?: string | null
          performed_by_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_timeline_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_timeline_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases_with_dpd"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_timeline_performed_by_dca_id_fkey"
            columns: ["performed_by_dca_id"]
            isOneToOne: false
            referencedRelation: "dca_performance_metrics"
            referencedColumns: ["dca_id"]
          },
          {
            foreignKeyName: "case_timeline_performed_by_dca_id_fkey"
            columns: ["performed_by_dca_id"]
            isOneToOne: false
            referencedRelation: "dcas"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          actor_type: Database["public"]["Enums"]["actor_type"]
          ai_confidence_score: number | null
          assigned_agent_id: string | null
          assigned_at: string | null
          assigned_dca_id: string | null
          assignment_method: string | null
          bankruptcy_flag: boolean | null
          case_number: string
          closed_at: string | null
          closure_reason: string | null
          contact_attempts: number | null
          created_at: string | null
          created_by: string | null
          created_by_role: string | null
          created_source: Database["public"]["Enums"]["created_source"]
          currency: string | null
          customer_city: string | null
          customer_contact: Json | null
          customer_country: string | null
          customer_credit_score: number | null
          customer_id: string
          customer_industry: string | null
          customer_name: string
          customer_payment_history: Json | null
          customer_segment: string | null
          customer_state: string | null
          customer_type: string | null
          days_past_due_cached: number | null
          dispute_opened_at: string | null
          dispute_reason: string | null
          dispute_resolution: string | null
          dispute_resolved_at: string | null
          document_urls: Json | null
          due_date: string
          escalated_at: string | null
          escalated_by_manager: boolean | null
          escalated_reason: string | null
          escalation_priority: string | null
          external_case_id: string | null
          first_contact_date: string | null
          fraud_suspected: boolean | null
          high_priority_flag: boolean | null
          id: string
          ingestion_timestamp: string | null
          internal_notes: string | null
          invoice_date: string
          invoice_number: string
          is_disputed: boolean | null
          judgement_amount: number | null
          judgement_date: string | null
          last_contact_date: string | null
          last_payment_date: string | null
          last_scored_at: string | null
          legal_action_date: string | null
          legal_action_initiated: boolean | null
          legal_case_number: string | null
          metadata: Json | null
          original_amount: number
          outstanding_amount: number
          payment_plan_active: boolean | null
          payment_plan_details: Json | null
          priority: Database["public"]["Enums"]["case_priority"] | null
          priority_score: number | null
          recovered_amount: number | null
          recovery_probability: number | null
          region: Database["public"]["Enums"]["region_type"] | null
          region_id: string
          risk_score: number | null
          roe_last_updated: string | null
          roe_recommendations: Json | null
          source_system: string | null
          status: Database["public"]["Enums"]["case_status"] | null
          successful_contacts: number | null
          tags: string[] | null
          updated_at: string | null
          updated_by: string | null
          vip_customer: boolean | null
          write_off_amount: number | null
          write_off_date: string | null
        }
        Insert: {
          actor_type?: Database["public"]["Enums"]["actor_type"]
          ai_confidence_score?: number | null
          assigned_agent_id?: string | null
          assigned_at?: string | null
          assigned_dca_id?: string | null
          assignment_method?: string | null
          bankruptcy_flag?: boolean | null
          case_number: string
          closed_at?: string | null
          closure_reason?: string | null
          contact_attempts?: number | null
          created_at?: string | null
          created_by?: string | null
          created_by_role?: string | null
          created_source?: Database["public"]["Enums"]["created_source"]
          currency?: string | null
          customer_city?: string | null
          customer_contact?: Json | null
          customer_country?: string | null
          customer_credit_score?: number | null
          customer_id: string
          customer_industry?: string | null
          customer_name: string
          customer_payment_history?: Json | null
          customer_segment?: string | null
          customer_state?: string | null
          customer_type?: string | null
          days_past_due_cached?: number | null
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          dispute_resolution?: string | null
          dispute_resolved_at?: string | null
          document_urls?: Json | null
          due_date: string
          escalated_at?: string | null
          escalated_by_manager?: boolean | null
          escalated_reason?: string | null
          escalation_priority?: string | null
          external_case_id?: string | null
          first_contact_date?: string | null
          fraud_suspected?: boolean | null
          high_priority_flag?: boolean | null
          id?: string
          ingestion_timestamp?: string | null
          internal_notes?: string | null
          invoice_date: string
          invoice_number: string
          is_disputed?: boolean | null
          judgement_amount?: number | null
          judgement_date?: string | null
          last_contact_date?: string | null
          last_payment_date?: string | null
          last_scored_at?: string | null
          legal_action_date?: string | null
          legal_action_initiated?: boolean | null
          legal_case_number?: string | null
          metadata?: Json | null
          original_amount: number
          outstanding_amount: number
          payment_plan_active?: boolean | null
          payment_plan_details?: Json | null
          priority?: Database["public"]["Enums"]["case_priority"] | null
          priority_score?: number | null
          recovered_amount?: number | null
          recovery_probability?: number | null
          region?: Database["public"]["Enums"]["region_type"] | null
          region_id: string
          risk_score?: number | null
          roe_last_updated?: string | null
          roe_recommendations?: Json | null
          source_system?: string | null
          status?: Database["public"]["Enums"]["case_status"] | null
          successful_contacts?: number | null
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
          vip_customer?: boolean | null
          write_off_amount?: number | null
          write_off_date?: string | null
        }
        Update: {
          actor_type?: Database["public"]["Enums"]["actor_type"]
          ai_confidence_score?: number | null
          assigned_agent_id?: string | null
          assigned_at?: string | null
          assigned_dca_id?: string | null
          assignment_method?: string | null
          bankruptcy_flag?: boolean | null
          case_number?: string
          closed_at?: string | null
          closure_reason?: string | null
          contact_attempts?: number | null
          created_at?: string | null
          created_by?: string | null
          created_by_role?: string | null
          created_source?: Database["public"]["Enums"]["created_source"]
          currency?: string | null
          customer_city?: string | null
          customer_contact?: Json | null
          customer_country?: string | null
          customer_credit_score?: number | null
          customer_id?: string
          customer_industry?: string | null
          customer_name?: string
          customer_payment_history?: Json | null
          customer_segment?: string | null
          customer_state?: string | null
          customer_type?: string | null
          days_past_due_cached?: number | null
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          dispute_resolution?: string | null
          dispute_resolved_at?: string | null
          document_urls?: Json | null
          due_date?: string
          escalated_at?: string | null
          escalated_by_manager?: boolean | null
          escalated_reason?: string | null
          escalation_priority?: string | null
          external_case_id?: string | null
          first_contact_date?: string | null
          fraud_suspected?: boolean | null
          high_priority_flag?: boolean | null
          id?: string
          ingestion_timestamp?: string | null
          internal_notes?: string | null
          invoice_date?: string
          invoice_number?: string
          is_disputed?: boolean | null
          judgement_amount?: number | null
          judgement_date?: string | null
          last_contact_date?: string | null
          last_payment_date?: string | null
          last_scored_at?: string | null
          legal_action_date?: string | null
          legal_action_initiated?: boolean | null
          legal_case_number?: string | null
          metadata?: Json | null
          original_amount?: number
          outstanding_amount?: number
          payment_plan_active?: boolean | null
          payment_plan_details?: Json | null
          priority?: Database["public"]["Enums"]["case_priority"] | null
          priority_score?: number | null
          recovered_amount?: number | null
          recovery_probability?: number | null
          region?: Database["public"]["Enums"]["region_type"] | null
          region_id?: string
          risk_score?: number | null
          roe_last_updated?: string | null
          roe_recommendations?: Json | null
          source_system?: string | null
          status?: Database["public"]["Enums"]["case_status"] | null
          successful_contacts?: number | null
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
          vip_customer?: boolean | null
          write_off_amount?: number | null
          write_off_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cases_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_assigned_dca_id_fkey"
            columns: ["assigned_dca_id"]
            isOneToOne: false
            referencedRelation: "dca_performance_metrics"
            referencedColumns: ["dca_id"]
          },
          {
            foreignKeyName: "cases_assigned_dca_id_fkey"
            columns: ["assigned_dca_id"]
            isOneToOne: false
            referencedRelation: "dcas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dca_user_region_access: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          region_id: string
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          region_id: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          region_id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dca_user_region_access_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dca_user_region_access_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dca_user_region_access_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dca_user_region_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dcas: {
        Row: {
          allowed_email_domains: string[]
          audit_score: number | null
          avg_recovery_time_days: number | null
          capacity_limit: number | null
          capacity_used: number | null
          certifications: Json | null
          commission_rate: number | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string | null
          created_by: string | null
          geographic_coverage: Json | null
          id: string
          insurance_valid_until: string | null
          last_audit_date: string | null
          legal_name: string | null
          license_expiry: string | null
          max_case_value: number | null
          metadata: Json | null
          min_case_value: number | null
          name: string
          organization_id: string | null
          performance_score: number | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          recovery_rate: number | null
          region: Database["public"]["Enums"]["region_type"] | null
          region_id: string
          registration_number: string | null
          sla_compliance_rate: number | null
          specializations: Json | null
          status: Database["public"]["Enums"]["dca_status"] | null
          total_amount_recovered: number | null
          total_cases_handled: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          allowed_email_domains?: string[]
          audit_score?: number | null
          avg_recovery_time_days?: number | null
          capacity_limit?: number | null
          capacity_used?: number | null
          certifications?: Json | null
          commission_rate?: number | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          created_by?: string | null
          geographic_coverage?: Json | null
          id?: string
          insurance_valid_until?: string | null
          last_audit_date?: string | null
          legal_name?: string | null
          license_expiry?: string | null
          max_case_value?: number | null
          metadata?: Json | null
          min_case_value?: number | null
          name: string
          organization_id?: string | null
          performance_score?: number | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          recovery_rate?: number | null
          region?: Database["public"]["Enums"]["region_type"] | null
          region_id: string
          registration_number?: string | null
          sla_compliance_rate?: number | null
          specializations?: Json | null
          status?: Database["public"]["Enums"]["dca_status"] | null
          total_amount_recovered?: number | null
          total_cases_handled?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          allowed_email_domains?: string[]
          audit_score?: number | null
          avg_recovery_time_days?: number | null
          capacity_limit?: number | null
          capacity_used?: number | null
          certifications?: Json | null
          commission_rate?: number | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          created_by?: string | null
          geographic_coverage?: Json | null
          id?: string
          insurance_valid_until?: string | null
          last_audit_date?: string | null
          legal_name?: string | null
          license_expiry?: string | null
          max_case_value?: number | null
          metadata?: Json | null
          min_case_value?: number | null
          name?: string
          organization_id?: string | null
          performance_score?: number | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          recovery_rate?: number | null
          region?: Database["public"]["Enums"]["region_type"] | null
          region_id?: string
          registration_number?: string | null
          sla_compliance_rate?: number | null
          specializations?: Json | null
          status?: Database["public"]["Enums"]["dca_status"] | null
          total_amount_recovered?: number | null
          total_cases_handled?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dcas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dcas_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      escalation_matrices: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          region_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          region_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          region_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escalation_matrices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_matrices_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_matrices_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      escalation_matrix_levels: {
        Row: {
          additional_recipients: string[] | null
          assigned_role: string | null
          assigned_user_id: string | null
          auto_change_priority: boolean | null
          auto_reassign_dca: boolean | null
          created_at: string | null
          escalation_type: string
          id: string
          level: number
          level_name: string
          matrix_id: string
          new_priority: string | null
          notification_channels: string[] | null
          notification_template_id: string | null
          send_to_case_owner: boolean | null
          send_to_previous_assignee: boolean | null
          trigger_after_hours: number
          trigger_condition: Json | null
          updated_at: string | null
        }
        Insert: {
          additional_recipients?: string[] | null
          assigned_role?: string | null
          assigned_user_id?: string | null
          auto_change_priority?: boolean | null
          auto_reassign_dca?: boolean | null
          created_at?: string | null
          escalation_type: string
          id?: string
          level: number
          level_name: string
          matrix_id: string
          new_priority?: string | null
          notification_channels?: string[] | null
          notification_template_id?: string | null
          send_to_case_owner?: boolean | null
          send_to_previous_assignee?: boolean | null
          trigger_after_hours: number
          trigger_condition?: Json | null
          updated_at?: string | null
        }
        Update: {
          additional_recipients?: string[] | null
          assigned_role?: string | null
          assigned_user_id?: string | null
          auto_change_priority?: boolean | null
          auto_reassign_dca?: boolean | null
          created_at?: string | null
          escalation_type?: string
          id?: string
          level?: number
          level_name?: string
          matrix_id?: string
          new_priority?: string | null
          notification_channels?: string[] | null
          notification_template_id?: string | null
          send_to_case_owner?: boolean | null
          send_to_previous_assignee?: boolean | null
          trigger_after_hours?: number
          trigger_condition?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escalation_matrix_levels_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_matrix_levels_matrix_id_fkey"
            columns: ["matrix_id"]
            isOneToOne: false
            referencedRelation: "escalation_matrices"
            referencedColumns: ["id"]
          },
        ]
      }
      escalations: {
        Row: {
          case_id: string | null
          case_reallocated: boolean | null
          created_at: string | null
          dca_penalized: boolean | null
          description: string
          escalated_at: string | null
          escalated_from: string | null
          escalated_to: string | null
          escalation_type: Database["public"]["Enums"]["escalation_type"]
          id: string
          metadata: Json | null
          new_dca_id: string | null
          penalty_details: Json | null
          resolution: string | null
          resolution_time_hours: number | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          status: Database["public"]["Enums"]["escalation_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          case_id?: string | null
          case_reallocated?: boolean | null
          created_at?: string | null
          dca_penalized?: boolean | null
          description: string
          escalated_at?: string | null
          escalated_from?: string | null
          escalated_to?: string | null
          escalation_type: Database["public"]["Enums"]["escalation_type"]
          id?: string
          metadata?: Json | null
          new_dca_id?: string | null
          penalty_details?: Json | null
          resolution?: string | null
          resolution_time_hours?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: Database["public"]["Enums"]["escalation_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          case_id?: string | null
          case_reallocated?: boolean | null
          created_at?: string | null
          dca_penalized?: boolean | null
          description?: string
          escalated_at?: string | null
          escalated_from?: string | null
          escalated_to?: string | null
          escalation_type?: Database["public"]["Enums"]["escalation_type"]
          id?: string
          metadata?: Json | null
          new_dca_id?: string | null
          penalty_details?: Json | null
          resolution?: string | null
          resolution_time_hours?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: Database["public"]["Enums"]["escalation_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escalations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases_with_dpd"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_escalated_from_fkey"
            columns: ["escalated_from"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_new_dca_id_fkey"
            columns: ["new_dca_id"]
            isOneToOne: false
            referencedRelation: "dca_performance_metrics"
            referencedColumns: ["dca_id"]
          },
          {
            foreignKeyName: "escalations_new_dca_id_fkey"
            columns: ["new_dca_id"]
            isOneToOne: false
            referencedRelation: "dcas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      geography_region_rules: {
        Row: {
          city_pattern: string | null
          country_code: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          postal_code_pattern: string | null
          priority: number | null
          region_id: string
          rule_name: string
          state_code: string | null
          updated_at: string | null
        }
        Insert: {
          city_pattern?: string | null
          country_code?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          postal_code_pattern?: string | null
          priority?: number | null
          region_id: string
          rule_name: string
          state_code?: string | null
          updated_at?: string | null
        }
        Update: {
          city_pattern?: string | null
          country_code?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          postal_code_pattern?: string | null
          priority?: number | null
          region_id?: string
          rule_name?: string
          state_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "geography_region_rules_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          body: string
          created_at: string | null
          created_by: string | null
          dca_id: string | null
          id: string
          is_active: boolean | null
          is_compliance_approved: boolean | null
          name: string
          subject: string | null
          template_type: string
          variables: Json | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          body: string
          created_at?: string | null
          created_by?: string | null
          dca_id?: string | null
          id?: string
          is_active?: boolean | null
          is_compliance_approved?: boolean | null
          name: string
          subject?: string | null
          template_type: string
          variables?: Json | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          body?: string
          created_at?: string | null
          created_by?: string | null
          dca_id?: string | null
          id?: string
          is_active?: boolean | null
          is_compliance_approved?: boolean | null
          name?: string
          subject?: string | null
          template_type?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_templates_dca_id_fkey"
            columns: ["dca_id"]
            isOneToOne: false
            referencedRelation: "dca_performance_metrics"
            referencedColumns: ["dca_id"]
          },
          {
            foreignKeyName: "message_templates_dca_id_fkey"
            columns: ["dca_id"]
            isOneToOne: false
            referencedRelation: "dcas"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          channels: Database["public"]["Enums"]["notification_channel"][]
          created_at: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          expires_at: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          priority: string | null
          read_at: string | null
          recipient_id: string | null
          related_case_id: string | null
          related_dca_id: string | null
          related_escalation_id: string | null
          sms_sent: boolean | null
          sms_sent_at: string | null
          title: string
        }
        Insert: {
          action_url?: string | null
          channels: Database["public"]["Enums"]["notification_channel"][]
          created_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          priority?: string | null
          read_at?: string | null
          recipient_id?: string | null
          related_case_id?: string | null
          related_dca_id?: string | null
          related_escalation_id?: string | null
          sms_sent?: boolean | null
          sms_sent_at?: string | null
          title: string
        }
        Update: {
          action_url?: string | null
          channels?: Database["public"]["Enums"]["notification_channel"][]
          created_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          priority?: string | null
          read_at?: string | null
          recipient_id?: string | null
          related_case_id?: string | null
          related_dca_id?: string | null
          related_escalation_id?: string | null
          sms_sent?: boolean | null
          sms_sent_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_case_id_fkey"
            columns: ["related_case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_case_id_fkey"
            columns: ["related_case_id"]
            isOneToOne: false
            referencedRelation: "cases_with_dpd"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_dca_id_fkey"
            columns: ["related_dca_id"]
            isOneToOne: false
            referencedRelation: "dca_performance_metrics"
            referencedColumns: ["dca_id"]
          },
          {
            foreignKeyName: "notifications_related_dca_id_fkey"
            columns: ["related_dca_id"]
            isOneToOne: false
            referencedRelation: "dcas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_escalation_id_fkey"
            columns: ["related_escalation_id"]
            isOneToOne: false
            referencedRelation: "escalations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: Json | null
          created_at: string | null
          email: string | null
          id: string
          metadata: Json | null
          name: string
          phone: string | null
          region: Database["public"]["Enums"]["region_type"] | null
          type: string
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name: string
          phone?: string | null
          region?: Database["public"]["Enums"]["region_type"] | null
          type: string
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          phone?: string | null
          region?: Database["public"]["Enums"]["region_type"] | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_plans: {
        Row: {
          amount_paid: number | null
          approved_by: string | null
          case_id: string
          created_at: string | null
          created_by: string | null
          currency: string
          frequency: string
          id: string
          installment_amount: number
          installment_count: number
          next_payment_date: string | null
          payments_made: number | null
          start_date: string
          status: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          approved_by?: string | null
          case_id: string
          created_at?: string | null
          created_by?: string | null
          currency?: string
          frequency?: string
          id?: string
          installment_amount: number
          installment_count: number
          next_payment_date?: string | null
          payments_made?: number | null
          start_date: string
          status?: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          approved_by?: string | null
          case_id?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string
          frequency?: string
          id?: string
          installment_amount?: number
          installment_count?: number
          next_payment_date?: string | null
          payments_made?: number | null
          start_date?: string
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_plans_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases_with_dpd"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      region_audit_log: {
        Row: {
          action: string
          change_reason: string | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          performed_at: string | null
          performed_by: string | null
          performed_by_role: string | null
          request_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          change_reason?: string | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string | null
          performed_by?: string | null
          performed_by_role?: string | null
          request_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          change_reason?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string | null
          performed_by?: string | null
          performed_by_role?: string | null
          request_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "region_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      region_dca_assignments: {
        Row: {
          allocation_priority: number | null
          capacity_allocation_pct: number | null
          created_at: string | null
          created_by: string | null
          dca_id: string
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          region_amount_recovered: number | null
          region_avg_recovery_days: number | null
          region_cases_handled: number | null
          region_id: string
          region_recovery_rate: number | null
          region_sla_compliance: number | null
          suspended_at: string | null
          suspension_reason: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          allocation_priority?: number | null
          capacity_allocation_pct?: number | null
          created_at?: string | null
          created_by?: string | null
          dca_id: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          region_amount_recovered?: number | null
          region_avg_recovery_days?: number | null
          region_cases_handled?: number | null
          region_id: string
          region_recovery_rate?: number | null
          region_sla_compliance?: number | null
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          allocation_priority?: number | null
          capacity_allocation_pct?: number | null
          created_at?: string | null
          created_by?: string | null
          dca_id?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          region_amount_recovered?: number | null
          region_avg_recovery_days?: number | null
          region_cases_handled?: number | null
          region_id?: string
          region_recovery_rate?: number | null
          region_sla_compliance?: number | null
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "region_dca_assignments_dca_id_fkey"
            columns: ["dca_id"]
            isOneToOne: false
            referencedRelation: "dca_performance_metrics"
            referencedColumns: ["dca_id"]
          },
          {
            foreignKeyName: "region_dca_assignments_dca_id_fkey"
            columns: ["dca_id"]
            isOneToOne: false
            referencedRelation: "dcas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "region_dca_assignments_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          business_hours: Json | null
          country_codes: string[]
          created_at: string | null
          created_by: string | null
          default_currency: string
          default_sla_template_id: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          escalation_matrix_id: string | null
          id: string
          name: string
          region_code: string
          state_codes: string[] | null
          status: string | null
          timezone: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          business_hours?: Json | null
          country_codes: string[]
          created_at?: string | null
          created_by?: string | null
          default_currency?: string
          default_sla_template_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          escalation_matrix_id?: string | null
          id?: string
          name: string
          region_code: string
          state_codes?: string[] | null
          status?: string | null
          timezone?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          business_hours?: Json | null
          country_codes?: string[]
          created_at?: string | null
          created_by?: string | null
          default_currency?: string
          default_sla_template_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          escalation_matrix_id?: string | null
          id?: string
          name?: string
          region_code?: string
          state_codes?: string[] | null
          status?: string | null
          timezone?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_regions_escalation_matrix"
            columns: ["escalation_matrix_id"]
            isOneToOne: false
            referencedRelation: "escalation_matrices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_regions_sla_template"
            columns: ["default_sla_template_id"]
            isOneToOne: false
            referencedRelation: "sla_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_callbacks: {
        Row: {
          agent_id: string
          case_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          scheduled_for: string
          status: string
        }
        Insert: {
          agent_id: string
          case_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          scheduled_for: string
          status?: string
        }
        Update: {
          agent_id?: string
          case_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          scheduled_for?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_callbacks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_callbacks_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_callbacks_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases_with_dpd"
            referencedColumns: ["id"]
          },
        ]
      }
      service_actors: {
        Row: {
          allowed_operations: string[] | null
          created_at: string | null
          description: string | null
          id: string
          ip_whitelist: unknown[] | null
          is_active: boolean | null
          last_used_at: string | null
          service_name: string
          updated_at: string | null
        }
        Insert: {
          allowed_operations?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_whitelist?: unknown[] | null
          is_active?: boolean | null
          last_used_at?: string | null
          service_name: string
          updated_at?: string | null
        }
        Update: {
          allowed_operations?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_whitelist?: unknown[] | null
          is_active?: boolean | null
          last_used_at?: string | null
          service_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sla_logs: {
        Row: {
          breach_duration_minutes: number | null
          breach_notification_sent: boolean | null
          case_id: string | null
          completed_at: string | null
          created_at: string | null
          due_at: string
          exempted_at: string | null
          exempted_by: string | null
          exemption_reason: string | null
          id: string
          is_exempt: boolean | null
          metadata: Json | null
          sla_template_id: string | null
          sla_type: Database["public"]["Enums"]["sla_type"]
          started_at: string
          status: Database["public"]["Enums"]["sla_status"] | null
          warning_sent: boolean | null
          warning_sent_at: string | null
        }
        Insert: {
          breach_duration_minutes?: number | null
          breach_notification_sent?: boolean | null
          case_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_at: string
          exempted_at?: string | null
          exempted_by?: string | null
          exemption_reason?: string | null
          id?: string
          is_exempt?: boolean | null
          metadata?: Json | null
          sla_template_id?: string | null
          sla_type: Database["public"]["Enums"]["sla_type"]
          started_at: string
          status?: Database["public"]["Enums"]["sla_status"] | null
          warning_sent?: boolean | null
          warning_sent_at?: string | null
        }
        Update: {
          breach_duration_minutes?: number | null
          breach_notification_sent?: boolean | null
          case_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_at?: string
          exempted_at?: string | null
          exempted_by?: string | null
          exemption_reason?: string | null
          id?: string
          is_exempt?: boolean | null
          metadata?: Json | null
          sla_template_id?: string | null
          sla_type?: Database["public"]["Enums"]["sla_type"]
          started_at?: string
          status?: Database["public"]["Enums"]["sla_status"] | null
          warning_sent?: boolean | null
          warning_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sla_logs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_logs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases_with_dpd"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_logs_exempted_by_fkey"
            columns: ["exempted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_logs_sla_template_id_fkey"
            columns: ["sla_template_id"]
            isOneToOne: false
            referencedRelation: "sla_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_templates: {
        Row: {
          applicable_to: Json | null
          auto_escalate_on_breach: boolean | null
          breach_notification_to: string[] | null
          business_hours_only: boolean | null
          created_at: string | null
          description: string | null
          duration_hours: number
          escalation_rules: Json | null
          id: string
          is_active: boolean | null
          name: string
          region_id: string | null
          sla_type: Database["public"]["Enums"]["sla_type"]
          updated_at: string | null
        }
        Insert: {
          applicable_to?: Json | null
          auto_escalate_on_breach?: boolean | null
          breach_notification_to?: string[] | null
          business_hours_only?: boolean | null
          created_at?: string | null
          description?: string | null
          duration_hours: number
          escalation_rules?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          region_id?: string | null
          sla_type: Database["public"]["Enums"]["sla_type"]
          updated_at?: string | null
        }
        Update: {
          applicable_to?: Json | null
          auto_escalate_on_breach?: boolean | null
          breach_notification_to?: string[] | null
          business_hours_only?: boolean | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number
          escalation_rules?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          region_id?: string | null
          sla_type?: Database["public"]["Enums"]["sla_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sla_templates_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_region_access: {
        Row: {
          access_level: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_primary_region: boolean | null
          region_id: string
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          user_id: string
        }
        Insert: {
          access_level?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_primary_region?: boolean | null
          region_id: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          user_id: string
        }
        Update: {
          access_level?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_primary_region?: boolean | null
          region_id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_region_access_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_region_access_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_region_access_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_region_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          can_create_agents: boolean | null
          created_at: string | null
          created_by_user_id: string | null
          dca_id: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          last_login_at: string | null
          last_login_ip: unknown
          locale: string | null
          metadata: Json | null
          mfa_enabled: boolean | null
          notification_preferences: Json | null
          organization_id: string | null
          permissions: Json | null
          phone: string | null
          primary_region_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          state_code: string | null
          timezone: string | null
          ui_preferences: Json | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          avatar_url?: string | null
          can_create_agents?: boolean | null
          created_at?: string | null
          created_by_user_id?: string | null
          dca_id?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_login_at?: string | null
          last_login_ip?: unknown
          locale?: string | null
          metadata?: Json | null
          mfa_enabled?: boolean | null
          notification_preferences?: Json | null
          organization_id?: string | null
          permissions?: Json | null
          phone?: string | null
          primary_region_id?: string | null
          role: Database["public"]["Enums"]["user_role"]
          state_code?: string | null
          timezone?: string | null
          ui_preferences?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          avatar_url?: string | null
          can_create_agents?: boolean | null
          created_at?: string | null
          created_by_user_id?: string | null
          dca_id?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_login_at?: string | null
          last_login_ip?: unknown
          locale?: string | null
          metadata?: Json | null
          mfa_enabled?: boolean | null
          notification_preferences?: Json | null
          organization_id?: string | null
          permissions?: Json | null
          phone?: string | null
          primary_region_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          state_code?: string | null
          timezone?: string | null
          ui_preferences?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_dca_id_fkey"
            columns: ["dca_id"]
            isOneToOne: false
            referencedRelation: "dca_performance_metrics"
            referencedColumns: ["dca_id"]
          },
          {
            foreignKeyName: "users_dca_id_fkey"
            columns: ["dca_id"]
            isOneToOne: false
            referencedRelation: "dcas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_primary_region_id_fkey"
            columns: ["primary_region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          delivered_at: string | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          retry_count: number | null
          success: boolean | null
          webhook_id: string | null
        }
        Insert: {
          delivered_at?: string | null
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          retry_count?: number | null
          success?: boolean | null
          webhook_id?: string | null
        }
        Update: {
          delivered_at?: string | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          retry_count?: number | null
          success?: boolean | null
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string | null
          created_by: string | null
          events: string[]
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          secret: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          events?: string[]
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          secret?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          events?: string[]
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          secret?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      audit_logs_with_users: {
        Row: {
          action: string | null
          actor_role: string | null
          actor_service_name: string | null
          actor_type: Database["public"]["Enums"]["actor_type"] | null
          created_at: string | null
          details: Json | null
          id: string | null
          ip_address: unknown
          region_id: string | null
          request_source: string | null
          resource_id: string | null
          resource_type: string | null
          service_name: string | null
          severity: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
          user_role: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      cases_with_dpd: {
        Row: {
          actor_type: Database["public"]["Enums"]["actor_type"] | null
          aging_bucket: string | null
          ai_confidence_score: number | null
          assigned_agent_id: string | null
          assigned_at: string | null
          assigned_dca_id: string | null
          assignment_method: string | null
          bankruptcy_flag: boolean | null
          case_number: string | null
          closed_at: string | null
          closure_reason: string | null
          contact_attempts: number | null
          created_at: string | null
          created_by: string | null
          created_by_role: string | null
          created_source: Database["public"]["Enums"]["created_source"] | null
          currency: string | null
          customer_city: string | null
          customer_contact: Json | null
          customer_country: string | null
          customer_credit_score: number | null
          customer_id: string | null
          customer_industry: string | null
          customer_name: string | null
          customer_payment_history: Json | null
          customer_segment: string | null
          customer_state: string | null
          customer_type: string | null
          days_past_due: number | null
          days_past_due_cached: number | null
          dispute_opened_at: string | null
          dispute_reason: string | null
          dispute_resolution: string | null
          dispute_resolved_at: string | null
          document_urls: Json | null
          due_date: string | null
          escalated_at: string | null
          escalated_by_manager: boolean | null
          escalated_reason: string | null
          escalation_priority: string | null
          external_case_id: string | null
          first_contact_date: string | null
          fraud_suspected: boolean | null
          high_priority_flag: boolean | null
          id: string | null
          ingestion_timestamp: string | null
          internal_notes: string | null
          invoice_date: string | null
          invoice_number: string | null
          is_disputed: boolean | null
          judgement_amount: number | null
          judgement_date: string | null
          last_contact_date: string | null
          last_payment_date: string | null
          last_scored_at: string | null
          legal_action_date: string | null
          legal_action_initiated: boolean | null
          legal_case_number: string | null
          metadata: Json | null
          original_amount: number | null
          outstanding_amount: number | null
          payment_plan_active: boolean | null
          payment_plan_details: Json | null
          priority: Database["public"]["Enums"]["case_priority"] | null
          priority_score: number | null
          recovered_amount: number | null
          recovery_probability: number | null
          region: Database["public"]["Enums"]["region_type"] | null
          region_id: string | null
          risk_score: number | null
          roe_last_updated: string | null
          roe_recommendations: Json | null
          source_system: string | null
          status: Database["public"]["Enums"]["case_status"] | null
          successful_contacts: number | null
          tags: string[] | null
          updated_at: string | null
          updated_by: string | null
          vip_customer: boolean | null
          write_off_amount: number | null
          write_off_date: string | null
        }
        Insert: {
          actor_type?: Database["public"]["Enums"]["actor_type"] | null
          aging_bucket?: never
          ai_confidence_score?: number | null
          assigned_agent_id?: string | null
          assigned_at?: string | null
          assigned_dca_id?: string | null
          assignment_method?: string | null
          bankruptcy_flag?: boolean | null
          case_number?: string | null
          closed_at?: string | null
          closure_reason?: string | null
          contact_attempts?: number | null
          created_at?: string | null
          created_by?: string | null
          created_by_role?: string | null
          created_source?: Database["public"]["Enums"]["created_source"] | null
          currency?: string | null
          customer_city?: string | null
          customer_contact?: Json | null
          customer_country?: string | null
          customer_credit_score?: number | null
          customer_id?: string | null
          customer_industry?: string | null
          customer_name?: string | null
          customer_payment_history?: Json | null
          customer_segment?: string | null
          customer_state?: string | null
          customer_type?: string | null
          days_past_due?: never
          days_past_due_cached?: number | null
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          dispute_resolution?: string | null
          dispute_resolved_at?: string | null
          document_urls?: Json | null
          due_date?: string | null
          escalated_at?: string | null
          escalated_by_manager?: boolean | null
          escalated_reason?: string | null
          escalation_priority?: string | null
          external_case_id?: string | null
          first_contact_date?: string | null
          fraud_suspected?: boolean | null
          high_priority_flag?: boolean | null
          id?: string | null
          ingestion_timestamp?: string | null
          internal_notes?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          is_disputed?: boolean | null
          judgement_amount?: number | null
          judgement_date?: string | null
          last_contact_date?: string | null
          last_payment_date?: string | null
          last_scored_at?: string | null
          legal_action_date?: string | null
          legal_action_initiated?: boolean | null
          legal_case_number?: string | null
          metadata?: Json | null
          original_amount?: number | null
          outstanding_amount?: number | null
          payment_plan_active?: boolean | null
          payment_plan_details?: Json | null
          priority?: Database["public"]["Enums"]["case_priority"] | null
          priority_score?: number | null
          recovered_amount?: number | null
          recovery_probability?: number | null
          region?: Database["public"]["Enums"]["region_type"] | null
          region_id?: string | null
          risk_score?: number | null
          roe_last_updated?: string | null
          roe_recommendations?: Json | null
          source_system?: string | null
          status?: Database["public"]["Enums"]["case_status"] | null
          successful_contacts?: number | null
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
          vip_customer?: boolean | null
          write_off_amount?: number | null
          write_off_date?: string | null
        }
        Update: {
          actor_type?: Database["public"]["Enums"]["actor_type"] | null
          aging_bucket?: never
          ai_confidence_score?: number | null
          assigned_agent_id?: string | null
          assigned_at?: string | null
          assigned_dca_id?: string | null
          assignment_method?: string | null
          bankruptcy_flag?: boolean | null
          case_number?: string | null
          closed_at?: string | null
          closure_reason?: string | null
          contact_attempts?: number | null
          created_at?: string | null
          created_by?: string | null
          created_by_role?: string | null
          created_source?: Database["public"]["Enums"]["created_source"] | null
          currency?: string | null
          customer_city?: string | null
          customer_contact?: Json | null
          customer_country?: string | null
          customer_credit_score?: number | null
          customer_id?: string | null
          customer_industry?: string | null
          customer_name?: string | null
          customer_payment_history?: Json | null
          customer_segment?: string | null
          customer_state?: string | null
          customer_type?: string | null
          days_past_due?: never
          days_past_due_cached?: number | null
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          dispute_resolution?: string | null
          dispute_resolved_at?: string | null
          document_urls?: Json | null
          due_date?: string | null
          escalated_at?: string | null
          escalated_by_manager?: boolean | null
          escalated_reason?: string | null
          escalation_priority?: string | null
          external_case_id?: string | null
          first_contact_date?: string | null
          fraud_suspected?: boolean | null
          high_priority_flag?: boolean | null
          id?: string | null
          ingestion_timestamp?: string | null
          internal_notes?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          is_disputed?: boolean | null
          judgement_amount?: number | null
          judgement_date?: string | null
          last_contact_date?: string | null
          last_payment_date?: string | null
          last_scored_at?: string | null
          legal_action_date?: string | null
          legal_action_initiated?: boolean | null
          legal_case_number?: string | null
          metadata?: Json | null
          original_amount?: number | null
          outstanding_amount?: number | null
          payment_plan_active?: boolean | null
          payment_plan_details?: Json | null
          priority?: Database["public"]["Enums"]["case_priority"] | null
          priority_score?: number | null
          recovered_amount?: number | null
          recovery_probability?: number | null
          region?: Database["public"]["Enums"]["region_type"] | null
          region_id?: string | null
          risk_score?: number | null
          roe_last_updated?: string | null
          roe_recommendations?: Json | null
          source_system?: string | null
          status?: Database["public"]["Enums"]["case_status"] | null
          successful_contacts?: number | null
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
          vip_customer?: boolean | null
          write_off_amount?: number | null
          write_off_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cases_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_assigned_dca_id_fkey"
            columns: ["assigned_dca_id"]
            isOneToOne: false
            referencedRelation: "dca_performance_metrics"
            referencedColumns: ["dca_id"]
          },
          {
            foreignKeyName: "cases_assigned_dca_id_fkey"
            columns: ["assigned_dca_id"]
            isOneToOne: false
            referencedRelation: "dcas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_metrics: {
        Row: {
          avg_ageing: number | null
          avg_priority_score: number | null
          avg_recovery_probability: number | null
          case_count: number | null
          date: string | null
          priority: Database["public"]["Enums"]["case_priority"] | null
          region_id: string | null
          status: Database["public"]["Enums"]["case_status"] | null
          total_outstanding: number | null
          total_recovered: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cases_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      dca_performance_metrics: {
        Row: {
          avg_resolution_days: number | null
          dca_id: string | null
          dca_name: string | null
          recovered_cases: number | null
          region_id: string | null
          sla_breaches: number | null
          sla_compliance_rate: number | null
          sla_met: number | null
          total_cases: number | null
          total_outstanding: number | null
          total_recovered: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dcas_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_and_create_escalation: {
        Args: { p_case_id: string; p_escalation_type: string }
        Returns: string
      }
      cleanup_old_audit_logs: {
        Args: { days_to_keep?: number }
        Returns: number
      }
      get_current_user_dca: { Args: never; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_days_past_due: { Args: { case_id: string }; Returns: number }
      get_user_allowed_regions: {
        Args: { p_user_id: string }
        Returns: string[]
      }
      is_admin_role: { Args: never; Returns: boolean }
      is_fedex_role: { Args: never; Returns: boolean }
      log_human_audit: {
        Args: {
          p_action: string
          p_details?: Json
          p_ip_address?: unknown
          p_region_id: string
          p_resource_id: string
          p_resource_type: string
          p_user_agent?: string
          p_user_email: string
          p_user_id: string
          p_user_role: string
        }
        Returns: string
      }
      log_system_audit: {
        Args: {
          p_action: string
          p_details?: Json
          p_region_id: string
          p_resource_id: string
          p_resource_type: string
          p_service_name: string
        }
        Returns: string
      }
      refresh_all_days_past_due: { Args: never; Returns: number }
      resolve_region_from_geography: {
        Args: {
          p_city?: string
          p_country_code: string
          p_postal_code?: string
          p_state_code?: string
        }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      user_has_region_access: {
        Args: {
          p_region_id: string
          p_required_level?: string
          p_user_id: string
        }
        Returns: boolean
      }
      validate_region_subset: {
        Args: { p_allowed_regions: string[]; p_requested_regions: string[] }
        Returns: boolean
      }
    }
    Enums: {
      actor_type: "SYSTEM" | "HUMAN"
      case_priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
      case_status:
        | "PENDING_ALLOCATION"
        | "ALLOCATED"
        | "IN_PROGRESS"
        | "CUSTOMER_CONTACTED"
        | "PAYMENT_PROMISED"
        | "PARTIAL_RECOVERY"
        | "FULL_RECOVERY"
        | "DISPUTED"
        | "ESCALATED"
        | "LEGAL_ACTION"
        | "WRITTEN_OFF"
        | "CLOSED"
      contact_method:
        | "PHONE"
        | "EMAIL"
        | "SMS"
        | "LETTER"
        | "IN_PERSON"
        | "LEGAL_NOTICE"
      contact_outcome:
        | "NO_ANSWER"
        | "WRONG_NUMBER"
        | "VOICEMAIL"
        | "SPOKE_WITH_CUSTOMER"
        | "PAYMENT_COMMITTED"
        | "DISPUTE_RAISED"
        | "CALLBACK_REQUESTED"
        | "REFUSED_TO_PAY"
        | "BANKRUPTCY_DECLARED"
      created_source: "SYSTEM" | "MANUAL"
      currency_type:
        | "USD"
        | "INR"
        | "EUR"
        | "GBP"
        | "AUD"
        | "CAD"
        | "AED"
        | "SGD"
      dca_status: "ACTIVE" | "SUSPENDED" | "TERMINATED" | "PENDING_APPROVAL"
      escalation_status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
      escalation_type:
        | "SLA_BREACH"
        | "REPEATED_BREACH"
        | "NO_PROGRESS"
        | "CUSTOMER_COMPLAINT"
        | "DCA_PERFORMANCE"
        | "HIGH_VALUE"
        | "FRAUD_SUSPECTED"
        | "LEGAL_REQUIRED"
        | "MANUAL"
      notification_channel: "IN_APP" | "EMAIL" | "SMS" | "PUSH"
      notification_type:
        | "SLA_WARNING"
        | "SLA_BREACH"
        | "CASE_ASSIGNED"
        | "PAYMENT_RECEIVED"
        | "ESCALATION_CREATED"
        | "DISPUTE_RAISED"
        | "PERFORMANCE_ALERT"
        | "SYSTEM_ALERT"
      region_type:
        | "INDIA"
        | "AMERICA"
        | "EUROPE"
        | "APAC"
        | "LATAM"
        | "MIDDLE_EAST"
        | "AFRICA"
      sla_status: "PENDING" | "MET" | "BREACHED" | "EXEMPT"
      sla_type:
        | "FIRST_CONTACT"
        | "WEEKLY_UPDATE"
        | "MONTHLY_REPORT"
        | "RESPONSE_TO_DISPUTE"
        | "RECOVERY_TARGET"
        | "DOCUMENTATION_SUBMISSION"
      user_role:
        | "SUPER_ADMIN"
        | "FEDEX_ADMIN"
        | "FEDEX_MANAGER"
        | "FEDEX_ANALYST"
        | "DCA_ADMIN"
        | "DCA_MANAGER"
        | "DCA_AGENT"
        | "AUDITOR"
        | "READONLY"
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
      actor_type: ["SYSTEM", "HUMAN"],
      case_priority: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      case_status: [
        "PENDING_ALLOCATION",
        "ALLOCATED",
        "IN_PROGRESS",
        "CUSTOMER_CONTACTED",
        "PAYMENT_PROMISED",
        "PARTIAL_RECOVERY",
        "FULL_RECOVERY",
        "DISPUTED",
        "ESCALATED",
        "LEGAL_ACTION",
        "WRITTEN_OFF",
        "CLOSED",
      ],
      contact_method: [
        "PHONE",
        "EMAIL",
        "SMS",
        "LETTER",
        "IN_PERSON",
        "LEGAL_NOTICE",
      ],
      contact_outcome: [
        "NO_ANSWER",
        "WRONG_NUMBER",
        "VOICEMAIL",
        "SPOKE_WITH_CUSTOMER",
        "PAYMENT_COMMITTED",
        "DISPUTE_RAISED",
        "CALLBACK_REQUESTED",
        "REFUSED_TO_PAY",
        "BANKRUPTCY_DECLARED",
      ],
      created_source: ["SYSTEM", "MANUAL"],
      currency_type: ["USD", "INR", "EUR", "GBP", "AUD", "CAD", "AED", "SGD"],
      dca_status: ["ACTIVE", "SUSPENDED", "TERMINATED", "PENDING_APPROVAL"],
      escalation_status: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      escalation_type: [
        "SLA_BREACH",
        "REPEATED_BREACH",
        "NO_PROGRESS",
        "CUSTOMER_COMPLAINT",
        "DCA_PERFORMANCE",
        "HIGH_VALUE",
        "FRAUD_SUSPECTED",
        "LEGAL_REQUIRED",
        "MANUAL",
      ],
      notification_channel: ["IN_APP", "EMAIL", "SMS", "PUSH"],
      notification_type: [
        "SLA_WARNING",
        "SLA_BREACH",
        "CASE_ASSIGNED",
        "PAYMENT_RECEIVED",
        "ESCALATION_CREATED",
        "DISPUTE_RAISED",
        "PERFORMANCE_ALERT",
        "SYSTEM_ALERT",
      ],
      region_type: [
        "INDIA",
        "AMERICA",
        "EUROPE",
        "APAC",
        "LATAM",
        "MIDDLE_EAST",
        "AFRICA",
      ],
      sla_status: ["PENDING", "MET", "BREACHED", "EXEMPT"],
      sla_type: [
        "FIRST_CONTACT",
        "WEEKLY_UPDATE",
        "MONTHLY_REPORT",
        "RESPONSE_TO_DISPUTE",
        "RECOVERY_TARGET",
        "DOCUMENTATION_SUBMISSION",
      ],
      user_role: [
        "SUPER_ADMIN",
        "FEDEX_ADMIN",
        "FEDEX_MANAGER",
        "FEDEX_ANALYST",
        "DCA_ADMIN",
        "DCA_MANAGER",
        "DCA_AGENT",
        "AUDITOR",
        "READONLY",
      ],
    },
  },
} as const
