/**
 * Generated from linked remote Supabase project (supabase gen types typescript --linked).
 * Date: Jul 9 2026
 * EduRoleName preserved below for app import compatibility.
 */

export type EduRoleName =
  | "CEO"
  | "FOUNDER"
  | "EXECUTIVE_DIRECTOR"
  | "REGIONAL_DIRECTOR"
  | "SCHOOL_LEADER"
  | "ADMINISTRATOR"
  | "ADMISSIONS"
  | "FINANCE"
  | "ACCOUNTING"
  | "HR"
  | "SCHOLARSHIP_MANAGER"
  | "STATE_FUNDING_MANAGER"
  | "REGISTRAR"
  | "TEACHER"
  | "THERAPIST"
  | "SUPPORT_STAFF"
  | "EMPLOYEE"
  | "TEAM_MEMBER"
  | "PARENT"
  | "STUDENT"
  | "BOARD_MEMBER"
  | "AUDITOR"
  | "GUEST"
  | (string & {});

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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
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
  public: {
    Tables: {
      academic_calendar_events: {
        Row: {
          all_day: boolean
          blocks_scheduling: boolean
          calendar_id: string
          created_at: string
          description: string | null
          ends_at: string
          event_type: string
          id: string
          metadata: Json
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          blocks_scheduling?: boolean
          calendar_id: string
          created_at?: string
          description?: string | null
          ends_at: string
          event_type: string
          id?: string
          metadata?: Json
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          blocks_scheduling?: boolean
          calendar_id?: string
          created_at?: string
          description?: string | null
          ends_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_calendar_events_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "academic_calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_calendars: {
        Row: {
          calendar_scope: string
          campus_id: string | null
          created_at: string
          employee_id: string | null
          id: string
          is_active: boolean
          name: string
          program: string | null
          school_id: string
          school_year_id: string | null
          student_id: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          calendar_scope?: string
          campus_id?: string | null
          created_at?: string
          employee_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          program?: string | null
          school_id: string
          school_year_id?: string | null
          student_id?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          calendar_scope?: string
          campus_id?: string | null
          created_at?: string
          employee_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          program?: string | null
          school_id?: string
          school_year_id?: string | null
          student_id?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_calendars_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_calendars_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_calendars_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_calendars_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_calendars_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_terms: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_current: boolean
          name: string
          school_id: string
          school_year_id: string
          start_date: string
          term_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean
          name: string
          school_id: string
          school_year_id: string
          start_date: string
          term_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean
          name?: string
          school_id?: string
          school_year_id?: string
          start_date?: string
          term_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_terms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_terms_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_application_checklist_items: {
        Row: {
          application_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          document_id: string | null
          id: string
          item_key: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          application_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          document_id?: string | null
          id?: string
          item_key: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          document_id?: string | null
          id?: string
          item_key?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_application_checklist_items_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "admissions_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_application_checklist_items_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_application_checklist_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "application_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_applications: {
        Row: {
          accepted_by_user_id: string | null
          admissions_decision_date: string | null
          application_date: string
          application_status: string
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          id: string
          lead_id: string
          learning_needs_summary: string | null
          previous_school: string | null
          school_year_id: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          accepted_by_user_id?: string | null
          admissions_decision_date?: string | null
          application_date?: string
          application_status?: string
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          lead_id: string
          learning_needs_summary?: string | null
          previous_school?: string | null
          school_year_id: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          accepted_by_user_id?: string | null
          admissions_decision_date?: string | null
          application_date?: string
          application_status?: string
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          lead_id?: string
          learning_needs_summary?: string | null
          previous_school?: string | null
          school_year_id?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_applications_accepted_by_user_id_fkey"
            columns: ["accepted_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_applications_prospect_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "admissions_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_applications_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_automation_audit_log: {
        Row: {
          actor_user_id: string | null
          after_state: Json | null
          application_id: string | null
          before_state: Json | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string | null
          event_category: string
          event_type: string
          execution_id: string | null
          id: string
          ip_address: string | null
          lead_id: string | null
          module: string
          school_id: string | null
          summary: string
          user_role: string | null
        }
        Insert: {
          actor_user_id?: string | null
          after_state?: Json | null
          application_id?: string | null
          before_state?: Json | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          event_category?: string
          event_type: string
          execution_id?: string | null
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          module?: string
          school_id?: string | null
          summary: string
          user_role?: string | null
        }
        Update: {
          actor_user_id?: string | null
          after_state?: Json | null
          application_id?: string | null
          before_state?: Json | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          event_category?: string
          event_type?: string
          execution_id?: string | null
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          module?: string
          school_id?: string | null
          summary?: string
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admissions_automation_audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_automation_audit_log_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "admissions_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_automation_audit_log_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "admissions_workflow_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_automation_audit_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "admissions_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_automation_audit_log_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_checklist_template_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_required: boolean
          item_key: string
          label: string
          school_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          item_key: string
          label: string
          school_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          item_key?: string
          label?: string
          school_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_checklist_template_items_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_communication_queue: {
        Row: {
          application_id: string | null
          channel: string
          created_at: string
          custom_body: string | null
          custom_subject: string | null
          id: string
          lead_id: string
          metadata: Json
          scheduled_for: string
          sent_communication_id: string | null
          status: string
          template_id: string | null
          template_key: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          channel?: string
          created_at?: string
          custom_body?: string | null
          custom_subject?: string | null
          id?: string
          lead_id: string
          metadata?: Json
          scheduled_for: string
          sent_communication_id?: string | null
          status?: string
          template_id?: string | null
          template_key: string
          trigger_event: string
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          channel?: string
          created_at?: string
          custom_body?: string | null
          custom_subject?: string | null
          id?: string
          lead_id?: string
          metadata?: Json
          scheduled_for?: string
          sent_communication_id?: string | null
          status?: string
          template_id?: string | null
          template_key?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_communication_queue_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "admissions_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_communication_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "admissions_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_communication_queue_sent_communication_id_fkey"
            columns: ["sent_communication_id"]
            isOneToOne: false
            referencedRelation: "admissions_communications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_communication_queue_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "admissions_communication_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_communication_templates: {
        Row: {
          body: string
          category: string
          channel: string
          created_at: string
          delay_hours: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          school_id: string | null
          subject: string
          template_key: string
          trigger_event: string
          updated_at: string
          version_number: number
        }
        Insert: {
          body: string
          category?: string
          channel?: string
          created_at?: string
          delay_hours?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          school_id?: string | null
          subject?: string
          template_key: string
          trigger_event: string
          updated_at?: string
          version_number?: number
        }
        Update: {
          body?: string
          category?: string
          channel?: string
          created_at?: string
          delay_hours?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string | null
          subject?: string
          template_key?: string
          trigger_event?: string
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "admissions_communication_templates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_communications: {
        Row: {
          application_id: string | null
          body: string
          communication_type: string
          created_at: string
          delivery_status: string
          id: string
          is_staff_notification: boolean
          lead_id: string
          metadata: Json
          open_status: string
          opened_at: string | null
          recipient_phone: string | null
          sent_at: string
          sent_by: string | null
          sent_to: string
          subject: string
          template_id: string | null
          template_key: string | null
          trigger_event: string | null
        }
        Insert: {
          application_id?: string | null
          body: string
          communication_type?: string
          created_at?: string
          delivery_status?: string
          id?: string
          is_staff_notification?: boolean
          lead_id: string
          metadata?: Json
          open_status?: string
          opened_at?: string | null
          recipient_phone?: string | null
          sent_at?: string
          sent_by?: string | null
          sent_to: string
          subject: string
          template_id?: string | null
          template_key?: string | null
          trigger_event?: string | null
        }
        Update: {
          application_id?: string | null
          body?: string
          communication_type?: string
          created_at?: string
          delivery_status?: string
          id?: string
          is_staff_notification?: boolean
          lead_id?: string
          metadata?: Json
          open_status?: string
          opened_at?: string | null
          recipient_phone?: string | null
          sent_at?: string
          sent_by?: string | null
          sent_to?: string
          subject?: string
          template_id?: string | null
          template_key?: string | null
          trigger_event?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admissions_communications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "admissions_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_communications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "admissions_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_communications_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_decisions: {
        Row: {
          application_id: string | null
          created_at: string
          decided_at: string
          decided_by: string | null
          decision_notes: string | null
          decision_type: string
          email_body: string | null
          email_sent_at: string | null
          email_subject: string | null
          id: string
          lead_id: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          decided_at?: string
          decided_by?: string | null
          decision_notes?: string | null
          decision_type: string
          email_body?: string | null
          email_sent_at?: string | null
          email_subject?: string | null
          id?: string
          lead_id: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          decided_at?: string
          decided_by?: string | null
          decision_notes?: string | null
          decision_type?: string
          email_body?: string | null
          email_sent_at?: string | null
          email_subject?: string | null
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_decisions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "admissions_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_decisions_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_decisions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "admissions_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_escalation_rules: {
        Row: {
          actions: Json
          after_hours: number
          condition_config: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          rule_key: string
          school_id: string | null
          trigger_event: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          after_hours?: number
          condition_config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          rule_key: string
          school_id?: string | null
          trigger_event: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          after_hours?: number
          condition_config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          rule_key?: string
          school_id?: string | null
          trigger_event?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_escalation_rules_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_interviews: {
        Row: {
          application_id: string | null
          campus_id: string | null
          completed_at: string | null
          created_at: string
          host_user_id: string | null
          id: string
          interview_status: string
          interview_type: string
          lead_id: string
          notes: string | null
          scheduled_at: string
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          campus_id?: string | null
          completed_at?: string | null
          created_at?: string
          host_user_id?: string | null
          id?: string
          interview_status?: string
          interview_type?: string
          lead_id: string
          notes?: string | null
          scheduled_at: string
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          campus_id?: string | null
          completed_at?: string | null
          created_at?: string
          host_user_id?: string | null
          id?: string
          interview_status?: string
          interview_type?: string
          lead_id?: string
          notes?: string | null
          scheduled_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "admissions_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_interviews_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_interviews_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_interviews_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "admissions_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_lead_funding_sources: {
        Row: {
          created_at: string
          funding_source_id: string
          lead_id: string
        }
        Insert: {
          created_at?: string
          funding_source_id: string
          lead_id: string
        }
        Update: {
          created_at?: string
          funding_source_id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_lead_funding_sources_funding_source_id_fkey"
            columns: ["funding_source_id"]
            isOneToOne: false
            referencedRelation: "funding_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_lead_funding_sources_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "admissions_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_lead_guardians: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          lead_id: string
          phone: string | null
          primary_guardian: boolean
          receives_billing: boolean
          receives_school_communications: boolean
          relationship_to_student: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          lead_id: string
          phone?: string | null
          primary_guardian?: boolean
          receives_billing?: boolean
          receives_school_communications?: boolean
          relationship_to_student?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          lead_id?: string
          phone?: string | null
          primary_guardian?: boolean
          receives_billing?: boolean
          receives_school_communications?: boolean
          relationship_to_student?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospect_guardians_prospect_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "admissions_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_lead_stage_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          lead_id: string
          new_stage: string
          previous_stage: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          lead_id: string
          new_stage: string
          previous_stage?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          lead_id?: string
          new_stage?: string
          previous_stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admissions_lead_stage_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_lead_stage_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "admissions_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_leads: {
        Row: {
          applying_for_grade: string | null
          assigned_to_user_id: string | null
          created_at: string
          current_grade: string | null
          date_of_birth: string | null
          first_name: string
          guardian_email: string | null
          guardian_first_name: string | null
          guardian_last_name: string | null
          guardian_phone: string | null
          id: string
          inquiry_date: string
          last_name: string
          lead_stage: string
          notes: string | null
          preferred_name: string | null
          program: string | null
          referral_source: string | null
          school_id: string
          stage_entered_at: string
          updated_at: string
        }
        Insert: {
          applying_for_grade?: string | null
          assigned_to_user_id?: string | null
          created_at?: string
          current_grade?: string | null
          date_of_birth?: string | null
          first_name: string
          guardian_email?: string | null
          guardian_first_name?: string | null
          guardian_last_name?: string | null
          guardian_phone?: string | null
          id?: string
          inquiry_date?: string
          last_name: string
          lead_stage?: string
          notes?: string | null
          preferred_name?: string | null
          program?: string | null
          referral_source?: string | null
          school_id: string
          stage_entered_at?: string
          updated_at?: string
        }
        Update: {
          applying_for_grade?: string | null
          assigned_to_user_id?: string | null
          created_at?: string
          current_grade?: string | null
          date_of_birth?: string | null
          first_name?: string
          guardian_email?: string | null
          guardian_first_name?: string | null
          guardian_last_name?: string | null
          guardian_phone?: string | null
          id?: string
          inquiry_date?: string
          last_name?: string
          lead_stage?: string
          notes?: string | null
          preferred_name?: string | null
          program?: string | null
          referral_source?: string | null
          school_id?: string
          stage_entered_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_leads_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_notes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
          note_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
          note_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
          note_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_notes_prospect_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "admissions_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_portal_notifications: {
        Row: {
          application_id: string | null
          body: string
          created_at: string
          id: string
          lead_id: string
          read_at: string | null
          title: string
        }
        Insert: {
          application_id?: string | null
          body: string
          created_at?: string
          id?: string
          lead_id: string
          read_at?: string | null
          title: string
        }
        Update: {
          application_id?: string | null
          body?: string
          created_at?: string
          id?: string
          lead_id?: string
          read_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_portal_notifications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "admissions_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_portal_notifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "admissions_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_staff_notifications: {
        Row: {
          application_id: string | null
          body: string
          created_at: string
          id: string
          lead_id: string | null
          notification_type: string
          read_at: string | null
          school_id: string
          title: string
          user_id: string | null
        }
        Insert: {
          application_id?: string | null
          body: string
          created_at?: string
          id?: string
          lead_id?: string | null
          notification_type: string
          read_at?: string | null
          school_id: string
          title: string
          user_id?: string | null
        }
        Update: {
          application_id?: string | null
          body?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          notification_type?: string
          read_at?: string | null
          school_id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admissions_staff_notifications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "admissions_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_staff_notifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "admissions_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_staff_notifications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_staff_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_tasks: {
        Row: {
          assigned_to_user_id: string | null
          completed_at: string | null
          created_at: string
          due_date: string | null
          id: string
          lead_id: string
          task_name: string
          task_status: string
          updated_at: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          lead_id: string
          task_name: string
          task_status?: string
          updated_at?: string
        }
        Update: {
          assigned_to_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          lead_id?: string
          task_name?: string
          task_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_tasks_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_tasks_prospect_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "admissions_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_template_versions: {
        Row: {
          body: string
          change_notes: string | null
          changed_by: string | null
          created_at: string
          id: string
          subject: string
          template_id: string
          version_number: number
        }
        Insert: {
          body: string
          change_notes?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          subject?: string
          template_id: string
          version_number: number
        }
        Update: {
          body?: string
          change_notes?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          subject?: string
          template_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "admissions_template_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "admissions_communication_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_tours: {
        Row: {
          campus_id: string | null
          completed_at: string | null
          created_at: string
          duration_minutes: number
          host_user_id: string | null
          id: string
          lead_id: string
          notes: string | null
          scheduled_at: string
          tour_status: string
          tour_type: string
          updated_at: string
        }
        Insert: {
          campus_id?: string | null
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number
          host_user_id?: string | null
          id?: string
          lead_id: string
          notes?: string | null
          scheduled_at: string
          tour_status?: string
          tour_type?: string
          updated_at?: string
        }
        Update: {
          campus_id?: string | null
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number
          host_user_id?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
          scheduled_at?: string
          tour_status?: string
          tour_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_tours_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_tours_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_tours_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "admissions_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_workflow_executions: {
        Row: {
          application_id: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          lead_id: string
          metadata: Json
          started_at: string
          status: string
          trigger_event: string
          workflow_id: string | null
        }
        Insert: {
          application_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id: string
          metadata?: Json
          started_at?: string
          status?: string
          trigger_event: string
          workflow_id?: string | null
        }
        Update: {
          application_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id?: string
          metadata?: Json
          started_at?: string
          status?: string
          trigger_event?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admissions_workflow_executions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "admissions_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_workflow_executions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "admissions_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "admissions_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_workflow_queue: {
        Row: {
          application_id: string | null
          completed_at: string | null
          created_at: string
          execution_id: string | null
          id: string
          last_error: string | null
          lead_id: string
          max_retries: number
          retry_count: number
          scheduled_for: string
          status: string
          step_payload: Json
          trigger_event: string
          updated_at: string
          workflow_id: string | null
          workflow_step_id: string | null
        }
        Insert: {
          application_id?: string | null
          completed_at?: string | null
          created_at?: string
          execution_id?: string | null
          id?: string
          last_error?: string | null
          lead_id: string
          max_retries?: number
          retry_count?: number
          scheduled_for: string
          status?: string
          step_payload?: Json
          trigger_event: string
          updated_at?: string
          workflow_id?: string | null
          workflow_step_id?: string | null
        }
        Update: {
          application_id?: string | null
          completed_at?: string | null
          created_at?: string
          execution_id?: string | null
          id?: string
          last_error?: string | null
          lead_id?: string
          max_retries?: number
          retry_count?: number
          scheduled_for?: string
          status?: string
          step_payload?: Json
          trigger_event?: string
          updated_at?: string
          workflow_id?: string | null
          workflow_step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admissions_workflow_queue_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "admissions_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_workflow_queue_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "admissions_workflow_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_workflow_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "admissions_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_workflow_queue_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "admissions_workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_workflow_queue_workflow_step_id_fkey"
            columns: ["workflow_step_id"]
            isOneToOne: false
            referencedRelation: "admissions_workflow_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_workflow_steps: {
        Row: {
          action_type: string | null
          config: Json
          created_at: string
          id: string
          is_active: boolean
          step_order: number
          step_type: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          action_type?: string | null
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          step_order?: number
          step_type: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          action_type?: string | null
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          step_order?: number
          step_type?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "admissions_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_workflows: {
        Row: {
          archived_at: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          lifecycle_status: string
          metadata: Json
          module: string
          name: string
          parent_workflow_id: string | null
          published_at: string | null
          school_id: string | null
          sort_order: number
          trigger_event: string
          updated_at: string
          version_number: number
          workflow_key: string
        }
        Insert: {
          archived_at?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          lifecycle_status?: string
          metadata?: Json
          module?: string
          name: string
          parent_workflow_id?: string | null
          published_at?: string | null
          school_id?: string | null
          sort_order?: number
          trigger_event: string
          updated_at?: string
          version_number?: number
          workflow_key: string
        }
        Update: {
          archived_at?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          lifecycle_status?: string
          metadata?: Json
          module?: string
          name?: string
          parent_workflow_id?: string | null
          published_at?: string | null
          school_id?: string | null
          sort_order?: number
          trigger_event?: string
          updated_at?: string
          version_number?: number
          workflow_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_workflows_parent_workflow_id_fkey"
            columns: ["parent_workflow_id"]
            isOneToOne: false
            referencedRelation: "admissions_workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_workflows_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      ain_audit_log: {
        Row: {
          action_type: string
          actor_user_id: string | null
          created_at: string
          details: Json
          id: string
          organization_id: string | null
        }
        Insert: {
          action_type: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          organization_id?: string | null
        }
        Update: {
          action_type?: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ain_audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ain_audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ain_benchmark_snapshots: {
        Row: {
          benchmark_scope: string
          created_at: string
          id: string
          mean_value: number | null
          metric_category: string
          metric_key: string
          peer_count: number
          percentile_25: number | null
          percentile_50: number | null
          percentile_75: number | null
          percentile_90: number | null
          segment_key: string
          snapshot_date: string
        }
        Insert: {
          benchmark_scope?: string
          created_at?: string
          id?: string
          mean_value?: number | null
          metric_category: string
          metric_key: string
          peer_count?: number
          percentile_25?: number | null
          percentile_50?: number | null
          percentile_75?: number | null
          percentile_90?: number | null
          segment_key: string
          snapshot_date?: string
        }
        Update: {
          benchmark_scope?: string
          created_at?: string
          id?: string
          mean_value?: number | null
          metric_category?: string
          metric_key?: string
          peer_count?: number
          percentile_25?: number | null
          percentile_50?: number | null
          percentile_75?: number | null
          percentile_90?: number | null
          segment_key?: string
          snapshot_date?: string
        }
        Relationships: []
      }
      ain_contributions: {
        Row: {
          anonymized_hash: string
          contribution_period: string
          created_at: string
          id: string
          metric_category: string
          metrics: Json
          organization_id: string
          segment_key: string
        }
        Insert: {
          anonymized_hash: string
          contribution_period?: string
          created_at?: string
          id?: string
          metric_category: string
          metrics?: Json
          organization_id: string
          segment_key?: string
        }
        Update: {
          anonymized_hash?: string
          contribution_period?: string
          created_at?: string
          id?: string
          metric_category?: string
          metrics?: Json
          organization_id?: string
          segment_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "ain_contributions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ain_executive_rankings: {
        Row: {
          created_at: string
          id: string
          ranking_date: string
          ranking_type: string
          rankings: Json
          scope: string
        }
        Insert: {
          created_at?: string
          id?: string
          ranking_date?: string
          ranking_type: string
          rankings?: Json
          scope?: string
        }
        Update: {
          created_at?: string
          id?: string
          ranking_date?: string
          ranking_type?: string
          rankings?: Json
          scope?: string
        }
        Relationships: []
      }
      ain_forecasts: {
        Row: {
          confidence_pct: number
          created_at: string
          forecast_date: string
          forecast_type: string
          horizon_months: number
          id: string
          organization_id: string
          projections: Json
        }
        Insert: {
          confidence_pct?: number
          created_at?: string
          forecast_date?: string
          forecast_type: string
          horizon_months?: number
          id?: string
          organization_id: string
          projections?: Json
        }
        Update: {
          confidence_pct?: number
          created_at?: string
          forecast_date?: string
          forecast_type?: string
          horizon_months?: number
          id?: string
          organization_id?: string
          projections?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ain_forecasts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ain_participation_settings: {
        Row: {
          anonymization_level: string
          consent_at: string | null
          consent_by: string | null
          data_categories: Json
          id: string
          organization_id: string
          participation_status: string
          peer_segments: Json
          share_international: boolean
          share_national: boolean
          share_regional: boolean
          updated_at: string
        }
        Insert: {
          anonymization_level?: string
          consent_at?: string | null
          consent_by?: string | null
          data_categories?: Json
          id?: string
          organization_id: string
          participation_status?: string
          peer_segments?: Json
          share_international?: boolean
          share_national?: boolean
          share_regional?: boolean
          updated_at?: string
        }
        Update: {
          anonymization_level?: string
          consent_at?: string | null
          consent_by?: string | null
          data_categories?: Json
          id?: string
          organization_id?: string
          participation_status?: string
          peer_segments?: Json
          share_international?: boolean
          share_national?: boolean
          share_regional?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ain_participation_settings_consent_by_fkey"
            columns: ["consent_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ain_participation_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ain_recommendations: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          organization_id: string
          priority: string
          recommendation_key: string
          rule_basis: string | null
          status: string
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          organization_id: string
          priority?: string
          recommendation_key: string
          rule_basis?: string | null
          status?: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string
          priority?: string
          recommendation_key?: string
          rule_basis?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ain_recommendations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ain_research_reports: {
        Row: {
          findings: Json
          id: string
          peer_organizations_count: number
          published_at: string
          report_category: string
          report_key: string
          report_title: string
          summary: string | null
        }
        Insert: {
          findings?: Json
          id?: string
          peer_organizations_count?: number
          published_at?: string
          report_category: string
          report_key: string
          report_title: string
          summary?: string | null
        }
        Update: {
          findings?: Json
          id?: string
          peer_organizations_count?: number
          published_at?: string
          report_category?: string
          report_key?: string
          report_title?: string
          summary?: string | null
        }
        Relationships: []
      }
      aip_approvals: {
        Row: {
          approval_type: string
          entity_id: string
          entity_type: string
          id: string
          organization_id: string
          requested_at: string
          requested_by: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          approval_type?: string
          entity_id: string
          entity_type: string
          id?: string
          organization_id: string
          requested_at?: string
          requested_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          approval_type?: string
          entity_id?: string
          entity_type?: string
          id?: string
          organization_id?: string
          requested_at?: string
          requested_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "aip_approvals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_approvals_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_approvals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      aip_audit_logs: {
        Row: {
          approval_status: string | null
          context_sources: Json
          created_at: string
          execution_time_ms: number | null
          id: string
          job_id: string | null
          metadata: Json
          organization_id: string
          prompt_id: string | null
          prompt_version_id: string | null
          provider_key: string | null
          requested_by: string | null
          response_status: string
          school_id: string | null
          user_feedback: string | null
        }
        Insert: {
          approval_status?: string | null
          context_sources?: Json
          created_at?: string
          execution_time_ms?: number | null
          id?: string
          job_id?: string | null
          metadata?: Json
          organization_id: string
          prompt_id?: string | null
          prompt_version_id?: string | null
          provider_key?: string | null
          requested_by?: string | null
          response_status?: string
          school_id?: string | null
          user_feedback?: string | null
        }
        Update: {
          approval_status?: string | null
          context_sources?: Json
          created_at?: string
          execution_time_ms?: number | null
          id?: string
          job_id?: string | null
          metadata?: Json
          organization_id?: string
          prompt_id?: string | null
          prompt_version_id?: string | null
          provider_key?: string | null
          requested_by?: string | null
          response_status?: string
          school_id?: string | null
          user_feedback?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aip_audit_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "aip_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_audit_logs_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "aip_prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_audit_logs_prompt_version_id_fkey"
            columns: ["prompt_version_id"]
            isOneToOne: false
            referencedRelation: "aip_prompt_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_audit_logs_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_audit_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      aip_job_logs: {
        Row: {
          created_at: string
          id: string
          job_id: string
          log_level: string
          message: string
          payload: Json
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          log_level?: string
          message: string
          payload?: Json
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          log_level?: string
          message?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "aip_job_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "aip_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      aip_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          depends_on_job_id: string | null
          error_message: string | null
          id: string
          job_type: string
          max_retries: number
          metadata: Json
          module: string
          organization_id: string
          priority: number
          prompt_id: string | null
          prompt_version_id: string | null
          provider_instance_id: string | null
          requested_by: string | null
          retry_count: number
          scheduled_at: string | null
          school_id: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          depends_on_job_id?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          max_retries?: number
          metadata?: Json
          module: string
          organization_id: string
          priority?: number
          prompt_id?: string | null
          prompt_version_id?: string | null
          provider_instance_id?: string | null
          requested_by?: string | null
          retry_count?: number
          scheduled_at?: string | null
          school_id?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          depends_on_job_id?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          max_retries?: number
          metadata?: Json
          module?: string
          organization_id?: string
          priority?: number
          prompt_id?: string | null
          prompt_version_id?: string | null
          provider_instance_id?: string | null
          requested_by?: string | null
          retry_count?: number
          scheduled_at?: string | null
          school_id?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "aip_jobs_depends_on_job_id_fkey"
            columns: ["depends_on_job_id"]
            isOneToOne: false
            referencedRelation: "aip_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_jobs_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "aip_prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_jobs_prompt_version_id_fkey"
            columns: ["prompt_version_id"]
            isOneToOne: false
            referencedRelation: "aip_prompt_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_jobs_provider_instance_id_fkey"
            columns: ["provider_instance_id"]
            isOneToOne: false
            referencedRelation: "aip_provider_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_jobs_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_jobs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      aip_knowledge_sources: {
        Row: {
          classification: string
          created_at: string
          created_by: string | null
          id: string
          metadata: Json
          organization_id: string
          school_id: string | null
          source_key: string
          source_name: string
          source_type: string
          status: string
        }
        Insert: {
          classification?: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          school_id?: string | null
          source_key: string
          source_name: string
          source_type: string
          status?: string
        }
        Update: {
          classification?: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          school_id?: string | null
          source_key?: string
          source_name?: string
          source_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "aip_knowledge_sources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_knowledge_sources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_knowledge_sources_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      aip_module_settings: {
        Row: {
          ai_enabled: boolean
          allowed_categories: Json
          id: string
          module_key: string
          organization_id: string
          school_id: string | null
          settings: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ai_enabled?: boolean
          allowed_categories?: Json
          id?: string
          module_key: string
          organization_id: string
          school_id?: string | null
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ai_enabled?: boolean
          allowed_categories?: Json
          id?: string
          module_key?: string
          organization_id?: string
          school_id?: string | null
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aip_module_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_module_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_module_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      aip_org_settings: {
        Row: {
          ai_enabled: boolean
          default_provider_key: string | null
          ferpa_masking_enabled: boolean
          max_monthly_cost_usd: number | null
          max_tokens_per_request: number
          organization_id: string
          require_human_review: boolean
          settings: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ai_enabled?: boolean
          default_provider_key?: string | null
          ferpa_masking_enabled?: boolean
          max_monthly_cost_usd?: number | null
          max_tokens_per_request?: number
          organization_id: string
          require_human_review?: boolean
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ai_enabled?: boolean
          default_provider_key?: string | null
          ferpa_masking_enabled?: boolean
          max_monthly_cost_usd?: number | null
          max_tokens_per_request?: number
          organization_id?: string
          require_human_review?: boolean
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aip_org_settings_default_provider_key_fkey"
            columns: ["default_provider_key"]
            isOneToOne: false
            referencedRelation: "aip_provider_definitions"
            referencedColumns: ["provider_key"]
          },
          {
            foreignKeyName: "aip_org_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_org_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      aip_policies: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          organization_id: string
          policy_key: string
          policy_name: string
          policy_type: string
          rules: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          policy_key: string
          policy_name: string
          policy_type?: string
          rules?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          policy_key?: string
          policy_name?: string
          policy_type?: string
          rules?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aip_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      aip_prompt_versions: {
        Row: {
          change_summary: string | null
          created_at: string
          created_by: string | null
          id: string
          input_schema: Json
          output_schema: Json
          prompt_id: string
          prompt_template: string
          system_instructions: string | null
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          input_schema?: Json
          output_schema?: Json
          prompt_id: string
          prompt_template: string
          system_instructions?: string | null
          version_number: number
        }
        Update: {
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          input_schema?: Json
          output_schema?: Json
          prompt_id?: string
          prompt_template?: string
          system_instructions?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "aip_prompt_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_prompt_versions_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "aip_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      aip_prompts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string
          current_version: number
          description: string | null
          id: string
          module: string
          name: string
          organization_id: string | null
          owner_id: string | null
          prompt_key: string
          rollback_version: number | null
          status: string
          tags: Json
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category: string
          created_at?: string
          current_version?: number
          description?: string | null
          id?: string
          module: string
          name: string
          organization_id?: string | null
          owner_id?: string | null
          prompt_key: string
          rollback_version?: number | null
          status?: string
          tags?: Json
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          current_version?: number
          description?: string | null
          id?: string
          module?: string
          name?: string
          organization_id?: string | null
          owner_id?: string | null
          prompt_key?: string
          rollback_version?: number | null
          status?: string
          tags?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aip_prompts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_prompts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_prompts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      aip_provider_definitions: {
        Row: {
          auth_type: string
          default_config: Json
          description: string | null
          display_name: string
          id: string
          provider_key: string
          sort_order: number
          supports_chat: boolean
          supports_document_analysis: boolean
          supports_embeddings: boolean
          supports_image_analysis: boolean
          supports_reasoning: boolean
          supports_speech: boolean
        }
        Insert: {
          auth_type?: string
          default_config?: Json
          description?: string | null
          display_name: string
          id?: string
          provider_key: string
          sort_order?: number
          supports_chat?: boolean
          supports_document_analysis?: boolean
          supports_embeddings?: boolean
          supports_image_analysis?: boolean
          supports_reasoning?: boolean
          supports_speech?: boolean
        }
        Update: {
          auth_type?: string
          default_config?: Json
          description?: string | null
          display_name?: string
          id?: string
          provider_key?: string
          sort_order?: number
          supports_chat?: boolean
          supports_document_analysis?: boolean
          supports_embeddings?: boolean
          supports_image_analysis?: boolean
          supports_reasoning?: boolean
          supports_speech?: boolean
        }
        Relationships: []
      }
      aip_provider_instances: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          credentials_ref: string | null
          health_status: string
          id: string
          instance_name: string
          last_health_check_at: string | null
          organization_id: string
          provider_key: string
          status: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by?: string | null
          credentials_ref?: string | null
          health_status?: string
          id?: string
          instance_name: string
          last_health_check_at?: string | null
          organization_id: string
          provider_key: string
          status?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          credentials_ref?: string | null
          health_status?: string
          id?: string
          instance_name?: string
          last_health_check_at?: string | null
          organization_id?: string
          provider_key?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aip_provider_instances_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_provider_instances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_provider_instances_provider_key_fkey"
            columns: ["provider_key"]
            isOneToOne: false
            referencedRelation: "aip_provider_definitions"
            referencedColumns: ["provider_key"]
          },
        ]
      }
      aip_school_settings: {
        Row: {
          ai_enabled: boolean
          allowed_modules: Json
          id: string
          organization_id: string
          school_id: string
          settings: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ai_enabled?: boolean
          allowed_modules?: Json
          id?: string
          organization_id: string
          school_id: string
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ai_enabled?: boolean
          allowed_modules?: Json
          id?: string
          organization_id?: string
          school_id?: string
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aip_school_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_school_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_school_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      aip_test_runs: {
        Row: {
          created_at: string
          id: string
          latency_ms: number | null
          organization_id: string
          prompt_id: string | null
          prompt_version_id: string | null
          provider_key: string | null
          run_by: string | null
          simulated_output: Json
          status: string
          test_input: Json
          tokens_in: number
          tokens_out: number
        }
        Insert: {
          created_at?: string
          id?: string
          latency_ms?: number | null
          organization_id: string
          prompt_id?: string | null
          prompt_version_id?: string | null
          provider_key?: string | null
          run_by?: string | null
          simulated_output?: Json
          status?: string
          test_input?: Json
          tokens_in?: number
          tokens_out?: number
        }
        Update: {
          created_at?: string
          id?: string
          latency_ms?: number | null
          organization_id?: string
          prompt_id?: string | null
          prompt_version_id?: string | null
          provider_key?: string | null
          run_by?: string | null
          simulated_output?: Json
          status?: string
          test_input?: Json
          tokens_in?: number
          tokens_out?: number
        }
        Relationships: [
          {
            foreignKeyName: "aip_test_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_test_runs_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "aip_prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_test_runs_prompt_version_id_fkey"
            columns: ["prompt_version_id"]
            isOneToOne: false
            referencedRelation: "aip_prompt_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_test_runs_run_by_fkey"
            columns: ["run_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      aip_token_usage: {
        Row: {
          created_at: string
          estimated_cost_usd: number
          execution_time_ms: number | null
          id: string
          job_id: string | null
          module: string
          organization_id: string
          prompt_id: string | null
          provider_key: string | null
          school_id: string | null
          status: string
          tokens_in: number
          tokens_out: number
          usage_date: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          estimated_cost_usd?: number
          execution_time_ms?: number | null
          id?: string
          job_id?: string | null
          module: string
          organization_id: string
          prompt_id?: string | null
          provider_key?: string | null
          school_id?: string | null
          status?: string
          tokens_in?: number
          tokens_out?: number
          usage_date?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          estimated_cost_usd?: number
          execution_time_ms?: number | null
          id?: string
          job_id?: string | null
          module?: string
          organization_id?: string
          prompt_id?: string | null
          provider_key?: string | null
          school_id?: string | null
          status?: string
          tokens_in?: number
          tokens_out?: number
          usage_date?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aip_token_usage_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "aip_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_token_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_token_usage_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "aip_prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_token_usage_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_token_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      application_documents: {
        Row: {
          application_id: string
          created_at: string
          document_status: string
          document_subtype: string | null
          document_type: string
          file_name: string
          file_size_bytes: number | null
          id: string
          mime_type: string | null
          storage_path: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          document_status?: string
          document_subtype?: string | null
          document_type: string
          file_name: string
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          document_status?: string
          document_subtype?: string | null
          document_type?: string
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "admissions_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tuition_bundle_discounts: {
        Row: {
          amount: number
          created_at: string
          id: string
          is_active: boolean
          min_additional_items: number
          name: string
          package_item_id: string
          school_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          is_active?: boolean
          min_additional_items?: number
          name: string
          package_item_id: string
          school_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          is_active?: boolean
          min_additional_items?: number
          name?: string
          package_item_id?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tuition_catalog_items: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          item_code: string
          item_kind: string
          provider_school_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          item_code: string
          item_kind: string
          provider_school_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          item_code?: string
          item_kind?: string
          provider_school_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      tuition_package_items: {
        Row: {
          created_at: string
          id: string
          member_item_id: string
          package_item_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          member_item_id: string
          package_item_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          member_item_id?: string
          package_item_id?: string
          sort_order?: number
        }
        Relationships: []
      }
      tuition_school_prices: {
        Row: {
          billing_frequency: string
          catalog_item_id: string
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          offered_one_to_one: boolean
          one_to_one_amount: number | null
          one_to_one_session_rate: number | null
          school_id: string
          standard_amount: number | null
          updated_at: string
        }
        Insert: {
          billing_frequency?: string
          catalog_item_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          offered_one_to_one?: boolean
          one_to_one_amount?: number | null
          one_to_one_session_rate?: number | null
          school_id: string
          standard_amount?: number | null
          updated_at?: string
        }
        Update: {
          billing_frequency?: string
          catalog_item_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          offered_one_to_one?: boolean
          one_to_one_amount?: number | null
          one_to_one_session_rate?: number | null
          school_id?: string
          standard_amount?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      interschool_tuition_charges: {
        Row: {
          amount: number
          catalog_item_id: string
          created_at: string
          delivery_mode: string
          id: string
          owed_school_id: string
          owing_school_id: string
          period_end: string
          period_start: string
          settled_at: string | null
          status: string
          status_reason: string | null
          student_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          catalog_item_id: string
          created_at?: string
          delivery_mode?: string
          id?: string
          owed_school_id: string
          owing_school_id: string
          period_end: string
          period_start: string
          settled_at?: string | null
          status?: string
          status_reason?: string | null
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          catalog_item_id?: string
          created_at?: string
          delivery_mode?: string
          id?: string
          owed_school_id?: string
          owing_school_id?: string
          period_end?: string
          period_start?: string
          settled_at?: string | null
          status?: string
          status_reason?: string | null
          student_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      person_documents: {
        Row: {
          category: string | null
          created_at: string
          external_url: string | null
          file_name: string | null
          file_size_bytes: number | null
          id: string
          mime_type: string | null
          notes: string | null
          source: string
          storage_path: string | null
          subject_id: string
          subject_type: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          external_url?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          source?: string
          storage_path?: string | null
          subject_id: string
          subject_type: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          external_url?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          source?: string
          storage_path?: string | null
          subject_id?: string
          subject_type?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "person_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_decision_gates: {
        Row: {
          answer: string | null
          answer_notes: string | null
          answered_at: string | null
          answered_by: string | null
          created_at: string
          decision_id: string | null
          gate_key: string
          id: string
          lead_id: string
          notified_at: string | null
          notify_count: number
          status: string
          updated_at: string
        }
        Insert: {
          answer?: string | null
          answer_notes?: string | null
          answered_at?: string | null
          answered_by?: string | null
          created_at?: string
          decision_id?: string | null
          gate_key: string
          id?: string
          lead_id: string
          notified_at?: string | null
          notify_count?: number
          status?: string
          updated_at?: string
        }
        Update: {
          answer?: string | null
          answer_notes?: string | null
          answered_at?: string | null
          answered_by?: string | null
          created_at?: string
          decision_id?: string | null
          gate_key?: string
          id?: string
          lead_id?: string
          notified_at?: string | null
          notify_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_decision_gates_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "admissions_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_adjustments: {
        Row: {
          adjustment_type: string
          amount: number
          approval_status: string
          approved_by: string | null
          billing_account_id: string
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string | null
          reason: string
        }
        Insert: {
          adjustment_type: string
          amount: number
          approval_status?: string
          approved_by?: string | null
          billing_account_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          reason: string
        }
        Update: {
          adjustment_type?: string
          amount?: number
          approval_status?: string
          approved_by?: string | null
          billing_account_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_adjustments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_adjustments_billing_account_id_fkey"
            columns: ["billing_account_id"]
            isOneToOne: false
            referencedRelation: "family_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_adjustments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_adjustments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_credits: {
        Row: {
          amount: number
          billing_account_id: string
          created_at: string
          created_by: string | null
          expires_on: string | null
          id: string
          reason: string | null
          remaining_amount: number
          source_module: string
          status: string
          student_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          billing_account_id: string
          created_at?: string
          created_by?: string | null
          expires_on?: string | null
          id?: string
          reason?: string | null
          remaining_amount: number
          source_module?: string
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_account_id?: string
          created_at?: string
          created_by?: string | null
          expires_on?: string | null
          id?: string
          reason?: string | null
          remaining_amount?: number
          source_module?: string
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_credits_billing_account_id_fkey"
            columns: ["billing_account_id"]
            isOneToOne: false
            referencedRelation: "family_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_credits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_credits_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_forecast_snapshots: {
        Row: {
          actual_grants: number
          actual_payroll: number
          actual_scholarships: number
          actual_state_funding: number
          actual_tuition: number
          created_at: string
          created_by: string | null
          enrollment_count: number
          forecast_grants: number
          forecast_payroll: number
          forecast_scholarships: number
          forecast_state_funding: number
          forecast_tuition: number
          id: string
          period_end: string
          period_start: string
          school_id: string
          snapshot_name: string
          updated_at: string
        }
        Insert: {
          actual_grants?: number
          actual_payroll?: number
          actual_scholarships?: number
          actual_state_funding?: number
          actual_tuition?: number
          created_at?: string
          created_by?: string | null
          enrollment_count?: number
          forecast_grants?: number
          forecast_payroll?: number
          forecast_scholarships?: number
          forecast_state_funding?: number
          forecast_tuition?: number
          id?: string
          period_end: string
          period_start: string
          school_id: string
          snapshot_name: string
          updated_at?: string
        }
        Update: {
          actual_grants?: number
          actual_payroll?: number
          actual_scholarships?: number
          actual_state_funding?: number
          actual_tuition?: number
          created_at?: string
          created_by?: string | null
          enrollment_count?: number
          forecast_grants?: number
          forecast_payroll?: number
          forecast_scholarships?: number
          forecast_state_funding?: number
          forecast_tuition?: number
          id?: string
          period_end?: string
          period_start?: string
          school_id?: string
          snapshot_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_forecast_snapshots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_forecast_snapshots_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      campuses: {
        Row: {
          address: string | null
          code: string | null
          created_at: string
          id: string
          is_primary: boolean
          name: string
          school_id: string
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          code?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          name: string
          school_id: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          name?: string
          school_id?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campuses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      cert_accessibility_checks: {
        Row: {
          cert_run_id: string | null
          check_name: string
          created_at: string
          findings: Json
          id: string
          status: string
          wcag_criterion: string
        }
        Insert: {
          cert_run_id?: string | null
          check_name: string
          created_at?: string
          findings?: Json
          id?: string
          status: string
          wcag_criterion: string
        }
        Update: {
          cert_run_id?: string | null
          check_name?: string
          created_at?: string
          findings?: Json
          id?: string
          status?: string
          wcag_criterion?: string
        }
        Relationships: [
          {
            foreignKeyName: "cert_accessibility_checks_cert_run_id_fkey"
            columns: ["cert_run_id"]
            isOneToOne: false
            referencedRelation: "cert_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      cert_bugs: {
        Row: {
          affected_module: string
          assigned_engineer: string | null
          created_at: string
          description: string | null
          id: string
          organization_id: string | null
          release_fixed: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
          verification_status: string | null
        }
        Insert: {
          affected_module: string
          assigned_engineer?: string | null
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string | null
          release_fixed?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
          verification_status?: string | null
        }
        Update: {
          affected_module?: string
          assigned_engineer?: string | null
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string | null
          release_fixed?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cert_bugs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cert_demo_environments: {
        Row: {
          artifact_summary: Json
          created_at: string
          created_by: string | null
          demo_name: string
          expires_at: string | null
          id: string
          organization_id: string | null
          school_id: string | null
          status: string
        }
        Insert: {
          artifact_summary?: Json
          created_at?: string
          created_by?: string | null
          demo_name: string
          expires_at?: string | null
          id?: string
          organization_id?: string | null
          school_id?: string | null
          status?: string
        }
        Update: {
          artifact_summary?: Json
          created_at?: string
          created_by?: string | null
          demo_name?: string
          expires_at?: string | null
          id?: string
          organization_id?: string | null
          school_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cert_demo_environments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cert_demo_environments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cert_demo_environments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      cert_documentation: {
        Row: {
          auto_generated: boolean
          content_md: string | null
          created_at: string
          doc_category: string
          doc_key: string
          doc_title: string
          id: string
          updated_at: string
          version: string
        }
        Insert: {
          auto_generated?: boolean
          content_md?: string | null
          created_at?: string
          doc_category: string
          doc_key: string
          doc_title: string
          id?: string
          updated_at?: string
          version?: string
        }
        Update: {
          auto_generated?: boolean
          content_md?: string | null
          created_at?: string
          doc_category?: string
          doc_key?: string
          doc_title?: string
          id?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      cert_dr_tests: {
        Row: {
          cert_run_id: string | null
          created_at: string
          evidence: Json
          id: string
          status: string
          test_key: string
          test_name: string
        }
        Insert: {
          cert_run_id?: string | null
          created_at?: string
          evidence?: Json
          id?: string
          status: string
          test_key: string
          test_name: string
        }
        Update: {
          cert_run_id?: string | null
          created_at?: string
          evidence?: Json
          id?: string
          status?: string
          test_key?: string
          test_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cert_dr_tests_cert_run_id_fkey"
            columns: ["cert_run_id"]
            isOneToOne: false
            referencedRelation: "cert_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      cert_health_reports: {
        Row: {
          created_at: string
          health_score: number
          id: string
          organization_id: string | null
          report_date: string
          report_type: string
          summary: Json
        }
        Insert: {
          created_at?: string
          health_score?: number
          id?: string
          organization_id?: string | null
          report_date?: string
          report_type: string
          summary?: Json
        }
        Update: {
          created_at?: string
          health_score?: number
          id?: string
          organization_id?: string | null
          report_date?: string
          report_type?: string
          summary?: Json
        }
        Relationships: [
          {
            foreignKeyName: "cert_health_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cert_health_scans: {
        Row: {
          created_at: string
          domain: string
          findings: Json
          health_score: number
          id: string
          scan_date: string
        }
        Insert: {
          created_at?: string
          domain: string
          findings?: Json
          health_score?: number
          id?: string
          scan_date?: string
        }
        Update: {
          created_at?: string
          domain?: string
          findings?: Json
          health_score?: number
          id?: string
          scan_date?: string
        }
        Relationships: []
      }
      cert_integration_health: {
        Row: {
          cert_run_id: string | null
          details: Json
          id: string
          integration_key: string
          integration_name: string
          last_checked_at: string
          status: string
        }
        Insert: {
          cert_run_id?: string | null
          details?: Json
          id?: string
          integration_key: string
          integration_name: string
          last_checked_at?: string
          status: string
        }
        Update: {
          cert_run_id?: string | null
          details?: Json
          id?: string
          integration_key?: string
          integration_name?: string
          last_checked_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cert_integration_health_cert_run_id_fkey"
            columns: ["cert_run_id"]
            isOneToOne: false
            referencedRelation: "cert_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      cert_mobile_checks: {
        Row: {
          cert_run_id: string | null
          created_at: string
          device_type: string
          id: string
          issues: Json
          orientation: string
          status: string
          viewport_key: string
        }
        Insert: {
          cert_run_id?: string | null
          created_at?: string
          device_type: string
          id?: string
          issues?: Json
          orientation?: string
          status: string
          viewport_key: string
        }
        Update: {
          cert_run_id?: string | null
          created_at?: string
          device_type?: string
          id?: string
          issues?: Json
          orientation?: string
          status?: string
          viewport_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "cert_mobile_checks_cert_run_id_fkey"
            columns: ["cert_run_id"]
            isOneToOne: false
            referencedRelation: "cert_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      cert_performance_metrics: {
        Row: {
          cert_run_id: string | null
          created_at: string
          id: string
          metric_key: string
          metric_name: string
          recommendation: string | null
          status: string
          threshold_ms: number | null
          value_ms: number | null
        }
        Insert: {
          cert_run_id?: string | null
          created_at?: string
          id?: string
          metric_key: string
          metric_name: string
          recommendation?: string | null
          status: string
          threshold_ms?: number | null
          value_ms?: number | null
        }
        Update: {
          cert_run_id?: string | null
          created_at?: string
          id?: string
          metric_key?: string
          metric_name?: string
          recommendation?: string | null
          status?: string
          threshold_ms?: number | null
          value_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cert_performance_metrics_cert_run_id_fkey"
            columns: ["cert_run_id"]
            isOneToOne: false
            referencedRelation: "cert_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      cert_platform_audit_findings: {
        Row: {
          audit_run_id: string | null
          category: string
          created_at: string
          description: string
          domain: string
          file_path: string | null
          finding_key: string
          id: string
          recommendation: string | null
          status: string
          title: string
        }
        Insert: {
          audit_run_id?: string | null
          category: string
          created_at?: string
          description: string
          domain: string
          file_path?: string | null
          finding_key: string
          id?: string
          recommendation?: string | null
          status?: string
          title: string
        }
        Update: {
          audit_run_id?: string | null
          category?: string
          created_at?: string
          description?: string
          domain?: string
          file_path?: string | null
          finding_key?: string
          id?: string
          recommendation?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "cert_platform_audit_findings_audit_run_id_fkey"
            columns: ["audit_run_id"]
            isOneToOne: false
            referencedRelation: "cert_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      cert_pwa_checks: {
        Row: {
          cert_run_id: string | null
          check_key: string
          check_name: string
          created_at: string
          details: Json
          id: string
          status: string
        }
        Insert: {
          cert_run_id?: string | null
          check_key: string
          check_name: string
          created_at?: string
          details?: Json
          id?: string
          status: string
        }
        Update: {
          cert_run_id?: string | null
          check_key?: string
          check_name?: string
          created_at?: string
          details?: Json
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cert_pwa_checks_cert_run_id_fkey"
            columns: ["cert_run_id"]
            isOneToOne: false
            referencedRelation: "cert_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      cert_readiness_snapshots: {
        Row: {
          accessibility_score: number
          cloud_score: number
          documentation_score: number
          domain_scores: Json
          dr_score: number
          id: string
          integration_score: number
          is_v1_certified: boolean
          mobile_score: number
          operational_score: number
          organization_id: string | null
          overall_score: number
          performance_score: number
          pwa_score: number
          security_score: number
          snapshot_date: string
          support_score: number
          testing_score: number
          training_score: number
        }
        Insert: {
          accessibility_score?: number
          cloud_score?: number
          documentation_score?: number
          domain_scores?: Json
          dr_score?: number
          id?: string
          integration_score?: number
          is_v1_certified?: boolean
          mobile_score?: number
          operational_score?: number
          organization_id?: string | null
          overall_score?: number
          performance_score?: number
          pwa_score?: number
          security_score?: number
          snapshot_date?: string
          support_score?: number
          testing_score?: number
          training_score?: number
        }
        Update: {
          accessibility_score?: number
          cloud_score?: number
          documentation_score?: number
          domain_scores?: Json
          dr_score?: number
          id?: string
          integration_score?: number
          is_v1_certified?: boolean
          mobile_score?: number
          operational_score?: number
          organization_id?: string | null
          overall_score?: number
          performance_score?: number
          pwa_score?: number
          security_score?: number
          snapshot_date?: string
          support_score?: number
          testing_score?: number
          training_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "cert_readiness_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cert_runs: {
        Row: {
          completed_at: string | null
          id: string
          organization_id: string | null
          overall_score: number | null
          run_type: string
          started_at: string
          status: string
          summary: Json
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          organization_id?: string | null
          overall_score?: number | null
          run_type?: string
          started_at?: string
          status?: string
          summary?: Json
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          organization_id?: string | null
          overall_score?: number | null
          run_type?: string
          started_at?: string
          status?: string
          summary?: Json
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cert_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cert_runs_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cert_scalability_tests: {
        Row: {
          cert_run_id: string | null
          created_at: string
          db_load_pct: number | null
          id: string
          memory_mb: number | null
          queue_load_pct: number | null
          response_time_ms: number | null
          status: string
          storage_growth_mb: number | null
          user_count: number
        }
        Insert: {
          cert_run_id?: string | null
          created_at?: string
          db_load_pct?: number | null
          id?: string
          memory_mb?: number | null
          queue_load_pct?: number | null
          response_time_ms?: number | null
          status: string
          storage_growth_mb?: number | null
          user_count: number
        }
        Update: {
          cert_run_id?: string | null
          created_at?: string
          db_load_pct?: number | null
          id?: string
          memory_mb?: number | null
          queue_load_pct?: number | null
          response_time_ms?: number | null
          status?: string
          storage_growth_mb?: number | null
          user_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "cert_scalability_tests_cert_run_id_fkey"
            columns: ["cert_run_id"]
            isOneToOne: false
            referencedRelation: "cert_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      cert_security_checks: {
        Row: {
          cert_run_id: string | null
          check_key: string
          check_name: string
          created_at: string
          findings: Json
          id: string
          is_critical: boolean
          recommendations: Json
          score: number | null
          status: string
        }
        Insert: {
          cert_run_id?: string | null
          check_key: string
          check_name: string
          created_at?: string
          findings?: Json
          id?: string
          is_critical?: boolean
          recommendations?: Json
          score?: number | null
          status: string
        }
        Update: {
          cert_run_id?: string | null
          check_key?: string
          check_name?: string
          created_at?: string
          findings?: Json
          id?: string
          is_critical?: boolean
          recommendations?: Json
          score?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cert_security_checks_cert_run_id_fkey"
            columns: ["cert_run_id"]
            isOneToOne: false
            referencedRelation: "cert_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      cert_support_readiness: {
        Row: {
          cert_run_id: string | null
          check_key: string
          check_name: string
          created_at: string
          details: Json
          id: string
          score: number | null
          status: string
        }
        Insert: {
          cert_run_id?: string | null
          check_key: string
          check_name: string
          created_at?: string
          details?: Json
          id?: string
          score?: number | null
          status: string
        }
        Update: {
          cert_run_id?: string | null
          check_key?: string
          check_name?: string
          created_at?: string
          details?: Json
          id?: string
          score?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cert_support_readiness_cert_run_id_fkey"
            columns: ["cert_run_id"]
            isOneToOne: false
            referencedRelation: "cert_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      cert_university_paths: {
        Row: {
          estimated_minutes: number
          id: string
          modules: Json
          path_key: string
          path_title: string
          sort_order: number
          target_role: string
        }
        Insert: {
          estimated_minutes?: number
          id?: string
          modules?: Json
          path_key: string
          path_title: string
          sort_order?: number
          target_role: string
        }
        Update: {
          estimated_minutes?: number
          id?: string
          modules?: Json
          path_key?: string
          path_title?: string
          sort_order?: number
          target_role?: string
        }
        Relationships: []
      }
      cert_university_progress: {
        Row: {
          certificate_issued_at: string | null
          completed_modules: Json
          id: string
          path_key: string
          progress_pct: number
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_issued_at?: string | null
          completed_modules?: Json
          id?: string
          path_key: string
          progress_pct?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_issued_at?: string | null
          completed_modules?: Json
          id?: string
          path_key?: string
          progress_pct?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cert_university_progress_path_key_fkey"
            columns: ["path_key"]
            isOneToOne: false
            referencedRelation: "cert_university_paths"
            referencedColumns: ["path_key"]
          },
          {
            foreignKeyName: "cert_university_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cert_workflow_tests: {
        Row: {
          cert_run_id: string | null
          created_at: string
          errors: Json
          evidence: Json
          execution_time_ms: number | null
          id: string
          last_success_at: string | null
          message: string | null
          status: string
          workflow_key: string
          workflow_name: string
        }
        Insert: {
          cert_run_id?: string | null
          created_at?: string
          errors?: Json
          evidence?: Json
          execution_time_ms?: number | null
          id?: string
          last_success_at?: string | null
          message?: string | null
          status?: string
          workflow_key: string
          workflow_name: string
        }
        Update: {
          cert_run_id?: string | null
          created_at?: string
          errors?: Json
          evidence?: Json
          execution_time_ms?: number | null
          id?: string
          last_success_at?: string | null
          message?: string | null
          status?: string
          workflow_key?: string
          workflow_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cert_workflow_tests_cert_run_id_fkey"
            columns: ["cert_run_id"]
            isOneToOne: false
            referencedRelation: "cert_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string | null
          id: string
          school_id: string | null
          subject: string | null
          teacher_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          school_id?: string | null
          subject?: string | null
          teacher_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          school_id?: string | null
          subject?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_audit_logs: {
        Row: {
          action_type: string
          actor_user_id: string | null
          created_at: string
          customer_id: string | null
          details: Json
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
        }
        Insert: {
          action_type: string
          actor_user_id?: string | null
          created_at?: string
          customer_id?: string | null
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          action_type?: string
          actor_user_id?: string | null
          created_at?: string
          customer_id?: string | null
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cloud_audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_audit_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "cloud_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_audit_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "rpt_cloud_customer_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_contracts: {
        Row: {
          contract_number: string
          contract_type: string
          created_at: string
          customer_id: string
          end_date: string | null
          id: string
          start_date: string
          status: string
          terms: Json
          total_value_usd: number | null
        }
        Insert: {
          contract_number: string
          contract_type?: string
          created_at?: string
          customer_id: string
          end_date?: string | null
          id?: string
          start_date: string
          status?: string
          terms?: Json
          total_value_usd?: number | null
        }
        Update: {
          contract_number?: string
          contract_type?: string
          created_at?: string
          customer_id?: string
          end_date?: string | null
          id?: string
          start_date?: string
          status?: string
          terms?: Json
          total_value_usd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cloud_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "cloud_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "rpt_cloud_customer_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_customer_success_snapshots: {
        Row: {
          active_users: number
          customer_id: string
          feature_adoption: Json
          health_score: number
          id: string
          implementation_progress_pct: number
          inactive_users: number
          open_tickets: number
          platform_adoption_pct: number
          renewal_probability_pct: number | null
          risk_indicators: Json
          snapshot_date: string
          training_completion_pct: number
        }
        Insert: {
          active_users?: number
          customer_id: string
          feature_adoption?: Json
          health_score?: number
          id?: string
          implementation_progress_pct?: number
          inactive_users?: number
          open_tickets?: number
          platform_adoption_pct?: number
          renewal_probability_pct?: number | null
          risk_indicators?: Json
          snapshot_date?: string
          training_completion_pct?: number
        }
        Update: {
          active_users?: number
          customer_id?: string
          feature_adoption?: Json
          health_score?: number
          id?: string
          implementation_progress_pct?: number
          inactive_users?: number
          open_tickets?: number
          platform_adoption_pct?: number
          renewal_probability_pct?: number | null
          risk_indicators?: Json
          snapshot_date?: string
          training_completion_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "cloud_customer_success_snapshots_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "cloud_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_customer_success_snapshots_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "rpt_cloud_customer_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_customers: {
        Row: {
          api_usage_count: number
          created_at: string
          customer_name: string
          customer_slug: string
          customer_success_manager: string | null
          employee_count: number
          go_live_status: string
          health_score: number
          id: string
          implementation_status: string
          is_white_label: boolean
          metadata: Json
          modules_enabled: Json
          organization_id: string | null
          renewal_date: string | null
          risk_level: string
          status: string
          storage_used_bytes: number
          student_count: number
          support_tier: string
          training_status: string
          updated_at: string
        }
        Insert: {
          api_usage_count?: number
          created_at?: string
          customer_name: string
          customer_slug: string
          customer_success_manager?: string | null
          employee_count?: number
          go_live_status?: string
          health_score?: number
          id?: string
          implementation_status?: string
          is_white_label?: boolean
          metadata?: Json
          modules_enabled?: Json
          organization_id?: string | null
          renewal_date?: string | null
          risk_level?: string
          status?: string
          storage_used_bytes?: number
          student_count?: number
          support_tier?: string
          training_status?: string
          updated_at?: string
        }
        Update: {
          api_usage_count?: number
          created_at?: string
          customer_name?: string
          customer_slug?: string
          customer_success_manager?: string | null
          employee_count?: number
          go_live_status?: string
          health_score?: number
          id?: string
          implementation_status?: string
          is_white_label?: boolean
          metadata?: Json
          modules_enabled?: Json
          organization_id?: string | null
          renewal_date?: string | null
          risk_level?: string
          status?: string
          storage_used_bytes?: number
          student_count?: number
          support_tier?: string
          training_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_deployments: {
        Row: {
          approved_by: string | null
          completed_at: string | null
          created_at: string
          deployed_by: string | null
          environment: string
          id: string
          release_id: string | null
          rollback_at: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          deployed_by?: string | null
          environment: string
          id?: string
          release_id?: string | null
          rollback_at?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          deployed_by?: string | null
          environment?: string
          id?: string
          release_id?: string | null
          rollback_at?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_deployments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_deployments_deployed_by_fkey"
            columns: ["deployed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_deployments_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "cloud_releases"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_feature_flags: {
        Row: {
          ab_test_ready: boolean
          created_at: string
          description: string | null
          display_name: string
          flag_key: string
          id: string
          is_beta: boolean
          is_enabled: boolean
          is_internal_only: boolean
          metadata: Json
          scope_id: string | null
          scope_type: string
          updated_at: string
        }
        Insert: {
          ab_test_ready?: boolean
          created_at?: string
          description?: string | null
          display_name: string
          flag_key: string
          id?: string
          is_beta?: boolean
          is_enabled?: boolean
          is_internal_only?: boolean
          metadata?: Json
          scope_id?: string | null
          scope_type?: string
          updated_at?: string
        }
        Update: {
          ab_test_ready?: boolean
          created_at?: string
          description?: string | null
          display_name?: string
          flag_key?: string
          id?: string
          is_beta?: boolean
          is_enabled?: boolean
          is_internal_only?: boolean
          metadata?: Json
          scope_id?: string | null
          scope_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      cloud_incidents: {
        Row: {
          affected_customers: Json
          communications: Json
          id: string
          incident_number: string
          post_incident_review: Json | null
          resolved_at: string | null
          root_cause: string | null
          severity: string
          started_at: string
          status: string
          timeline: Json
          title: string
        }
        Insert: {
          affected_customers?: Json
          communications?: Json
          id?: string
          incident_number: string
          post_incident_review?: Json | null
          resolved_at?: string | null
          root_cause?: string | null
          severity?: string
          started_at?: string
          status?: string
          timeline?: Json
          title: string
        }
        Update: {
          affected_customers?: Json
          communications?: Json
          id?: string
          incident_number?: string
          post_incident_review?: Json | null
          resolved_at?: string | null
          root_cause?: string | null
          severity?: string
          started_at?: string
          status?: string
          timeline?: Json
          title?: string
        }
        Relationships: []
      }
      cloud_invoices: {
        Row: {
          amount_usd: number
          created_at: string
          customer_id: string
          due_date: string | null
          id: string
          invoice_number: string
          line_items: Json
          paid_at: string | null
          status: string
          subscription_id: string | null
        }
        Insert: {
          amount_usd: number
          created_at?: string
          customer_id: string
          due_date?: string | null
          id?: string
          invoice_number: string
          line_items?: Json
          paid_at?: string | null
          status?: string
          subscription_id?: string | null
        }
        Update: {
          amount_usd?: number
          created_at?: string
          customer_id?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          line_items?: Json
          paid_at?: string | null
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cloud_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "cloud_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "rpt_cloud_customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "cloud_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_licenses: {
        Row: {
          api_limit_per_month: number | null
          created_at: string
          customer_id: string
          expires_at: string | null
          feature_limits: Json
          id: string
          license_key: string
          licensed_modules: Json
          renewed_at: string | null
          staff_limit: number | null
          status: string
          storage_limit_gb: number | null
          student_limit: number | null
          subscription_id: string | null
        }
        Insert: {
          api_limit_per_month?: number | null
          created_at?: string
          customer_id: string
          expires_at?: string | null
          feature_limits?: Json
          id?: string
          license_key?: string
          licensed_modules?: Json
          renewed_at?: string | null
          staff_limit?: number | null
          status?: string
          storage_limit_gb?: number | null
          student_limit?: number | null
          subscription_id?: string | null
        }
        Update: {
          api_limit_per_month?: number | null
          created_at?: string
          customer_id?: string
          expires_at?: string | null
          feature_limits?: Json
          id?: string
          license_key?: string
          licensed_modules?: Json
          renewed_at?: string | null
          staff_limit?: number | null
          status?: string
          storage_limit_gb?: number | null
          student_limit?: number | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cloud_licenses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "cloud_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_licenses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "rpt_cloud_customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_licenses_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "cloud_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_marketplace_installations: {
        Row: {
          customer_id: string
          id: string
          installed_at: string
          module_key: string
          status: string
          version: string
        }
        Insert: {
          customer_id: string
          id?: string
          installed_at?: string
          module_key: string
          status?: string
          version: string
        }
        Update: {
          customer_id?: string
          id?: string
          installed_at?: string
          module_key?: string
          status?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_marketplace_installations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "cloud_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_marketplace_installations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "rpt_cloud_customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_marketplace_installations_module_key_fkey"
            columns: ["module_key"]
            isOneToOne: false
            referencedRelation: "cloud_marketplace_modules"
            referencedColumns: ["module_key"]
          },
        ]
      }
      cloud_marketplace_modules: {
        Row: {
          billing_addon_usd: number | null
          dependencies: Json
          description: string | null
          display_name: string
          id: string
          is_published: boolean
          module_key: string
          sort_order: number
          version: string
        }
        Insert: {
          billing_addon_usd?: number | null
          dependencies?: Json
          description?: string | null
          display_name: string
          id?: string
          is_published?: boolean
          module_key: string
          sort_order?: number
          version?: string
        }
        Update: {
          billing_addon_usd?: number | null
          dependencies?: Json
          description?: string | null
          display_name?: string
          id?: string
          is_published?: boolean
          module_key?: string
          sort_order?: number
          version?: string
        }
        Relationships: []
      }
      cloud_onboarding_sessions: {
        Row: {
          assigned_to: string | null
          checklist: Json
          completed_at: string | null
          created_at: string
          current_step: string
          customer_id: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          checklist?: Json
          completed_at?: string | null
          created_at?: string
          current_step?: string
          customer_id: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          checklist?: Json
          completed_at?: string | null
          created_at?: string
          current_step?: string
          customer_id?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_onboarding_sessions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_onboarding_sessions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "cloud_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_onboarding_sessions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "rpt_cloud_customer_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_platform_health: {
        Row: {
          api_health: string
          auth_health: string
          avg_latency_ms: number
          database_health: string
          email_delivery_health: string
          error_rate_pct: number
          id: string
          metrics: Json
          queue_health: string
          snapshot_at: string
          webhook_health: string
        }
        Insert: {
          api_health?: string
          auth_health?: string
          avg_latency_ms?: number
          database_health?: string
          email_delivery_health?: string
          error_rate_pct?: number
          id?: string
          metrics?: Json
          queue_health?: string
          snapshot_at?: string
          webhook_health?: string
        }
        Update: {
          api_health?: string
          auth_health?: string
          avg_latency_ms?: number
          database_health?: string
          email_delivery_health?: string
          error_rate_pct?: number
          id?: string
          metrics?: Json
          queue_health?: string
          snapshot_at?: string
          webhook_health?: string
        }
        Relationships: []
      }
      cloud_product_analytics: {
        Row: {
          avg_session_seconds: number | null
          feature_key: string
          id: string
          metric_date: string
          unique_users: number
          usage_by_device: Json
          usage_by_role: Json
          usage_count: number
        }
        Insert: {
          avg_session_seconds?: number | null
          feature_key: string
          id?: string
          metric_date?: string
          unique_users?: number
          usage_by_device?: Json
          usage_by_role?: Json
          usage_count?: number
        }
        Update: {
          avg_session_seconds?: number | null
          feature_key?: string
          id?: string
          metric_date?: string
          unique_users?: number
          usage_by_device?: Json
          usage_by_role?: Json
          usage_count?: number
        }
        Relationships: []
      }
      cloud_provisioning_jobs: {
        Row: {
          blueprint_key: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          id: string
          progress_pct: number
          provisioned_organization_id: string | null
          result_summary: Json
          started_at: string | null
          status: string
          target_org_name: string
        }
        Insert: {
          blueprint_key?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          progress_pct?: number
          provisioned_organization_id?: string | null
          result_summary?: Json
          started_at?: string | null
          status?: string
          target_org_name: string
        }
        Update: {
          blueprint_key?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          progress_pct?: number
          provisioned_organization_id?: string | null
          result_summary?: Json
          started_at?: string | null
          status?: string
          target_org_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_provisioning_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_provisioning_jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "cloud_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_provisioning_jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "rpt_cloud_customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_provisioning_jobs_provisioned_organization_id_fkey"
            columns: ["provisioned_organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_releases: {
        Row: {
          created_at: string
          deployment_window_end: string | null
          deployment_window_start: string | null
          id: string
          pilot_customer_ids: Json
          release_notes: string | null
          release_type: string
          release_version: string
          released_at: string | null
          rollback_history: Json
          status: string
        }
        Insert: {
          created_at?: string
          deployment_window_end?: string | null
          deployment_window_start?: string | null
          id?: string
          pilot_customer_ids?: Json
          release_notes?: string | null
          release_type?: string
          release_version: string
          released_at?: string | null
          rollback_history?: Json
          status?: string
        }
        Update: {
          created_at?: string
          deployment_window_end?: string | null
          deployment_window_start?: string | null
          id?: string
          pilot_customer_ids?: Json
          release_notes?: string | null
          release_type?: string
          release_version?: string
          released_at?: string | null
          rollback_history?: Json
          status?: string
        }
        Relationships: []
      }
      cloud_subscription_plans: {
        Row: {
          api_limit_per_month: number | null
          base_price_usd: number
          billing_cycle: string
          description: string | null
          display_name: string
          id: string
          included_modules: Json
          is_usage_based: boolean
          plan_key: string
          sort_order: number
          storage_limit_gb: number | null
          student_price_usd: number | null
        }
        Insert: {
          api_limit_per_month?: number | null
          base_price_usd?: number
          billing_cycle?: string
          description?: string | null
          display_name: string
          id?: string
          included_modules?: Json
          is_usage_based?: boolean
          plan_key: string
          sort_order?: number
          storage_limit_gb?: number | null
          student_price_usd?: number | null
        }
        Update: {
          api_limit_per_month?: number | null
          base_price_usd?: number
          billing_cycle?: string
          description?: string | null
          display_name?: string
          id?: string
          included_modules?: Json
          is_usage_based?: boolean
          plan_key?: string
          sort_order?: number
          storage_limit_gb?: number | null
          student_price_usd?: number | null
        }
        Relationships: []
      }
      cloud_subscriptions: {
        Row: {
          api_limit_per_month: number | null
          billing_cycle: string
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          customer_id: string
          id: string
          monthly_amount_usd: number
          plan_key: string
          staff_limit: number | null
          status: string
          storage_limit_gb: number | null
          student_limit: number | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          api_limit_per_month?: number | null
          billing_cycle?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_id: string
          id?: string
          monthly_amount_usd?: number
          plan_key: string
          staff_limit?: number | null
          status?: string
          storage_limit_gb?: number | null
          student_limit?: number | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          api_limit_per_month?: number | null
          billing_cycle?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_id?: string
          id?: string
          monthly_amount_usd?: number
          plan_key?: string
          staff_limit?: number | null
          status?: string
          storage_limit_gb?: number | null
          student_limit?: number | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "cloud_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "rpt_cloud_customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_subscriptions_plan_key_fkey"
            columns: ["plan_key"]
            isOneToOne: false
            referencedRelation: "cloud_subscription_plans"
            referencedColumns: ["plan_key"]
          },
        ]
      }
      cloud_support_tickets: {
        Row: {
          assigned_to: string | null
          attachments: Json
          created_at: string
          created_by: string | null
          customer_id: string
          description: string | null
          id: string
          internal_notes: Json
          knowledge_base_links: Json
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          ticket_number: string
          ticket_type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json
          created_at?: string
          created_by?: string | null
          customer_id: string
          description?: string | null
          id?: string
          internal_notes?: Json
          knowledge_base_links?: Json
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          ticket_number: string
          ticket_type?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json
          created_at?: string
          created_by?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          internal_notes?: Json
          knowledge_base_links?: Json
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          ticket_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_support_tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "cloud_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "rpt_cloud_customer_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_system_status: {
        Row: {
          component_key: string
          display_name: string
          id: string
          last_incident_at: string | null
          status: string
          updated_at: string
          uptime_pct: number
        }
        Insert: {
          component_key: string
          display_name: string
          id?: string
          last_incident_at?: string | null
          status?: string
          updated_at?: string
          uptime_pct?: number
        }
        Update: {
          component_key?: string
          display_name?: string
          id?: string
          last_incident_at?: string | null
          status?: string
          updated_at?: string
          uptime_pct?: number
        }
        Relationships: []
      }
      cloud_usage_analytics: {
        Row: {
          automation_volume: number
          customer_id: string | null
          daily_active_users: number
          export_count: number
          id: string
          import_count: number
          metric_date: string
          module_usage: Json
          monthly_active_users: number
          organization_id: string | null
          storage_bytes: number
          workflow_executions: number
        }
        Insert: {
          automation_volume?: number
          customer_id?: string | null
          daily_active_users?: number
          export_count?: number
          id?: string
          import_count?: number
          metric_date?: string
          module_usage?: Json
          monthly_active_users?: number
          organization_id?: string | null
          storage_bytes?: number
          workflow_executions?: number
        }
        Update: {
          automation_volume?: number
          customer_id?: string | null
          daily_active_users?: number
          export_count?: number
          id?: string
          import_count?: number
          metric_date?: string
          module_usage?: Json
          monthly_active_users?: number
          organization_id?: string | null
          storage_bytes?: number
          workflow_executions?: number
        }
        Relationships: [
          {
            foreignKeyName: "cloud_usage_analytics_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "cloud_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_usage_analytics_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "rpt_cloud_customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_usage_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_white_label_settings: {
        Row: {
          certificate_config: Json
          custom_domain: string | null
          custom_logo_url: string | null
          customer_id: string
          email_branding: Json
          id: string
          login_page_config: Json
          primary_color: string | null
          report_branding: Json
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          certificate_config?: Json
          custom_domain?: string | null
          custom_logo_url?: string | null
          customer_id: string
          email_branding?: Json
          id?: string
          login_page_config?: Json
          primary_color?: string | null
          report_branding?: Json
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          certificate_config?: Json
          custom_domain?: string | null
          custom_logo_url?: string | null
          customer_id?: string
          email_branding?: Json
          id?: string
          login_page_config?: Json
          primary_color?: string | null
          report_branding?: Json
          secondary_color?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_white_label_settings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "cloud_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_white_label_settings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "rpt_cloud_customer_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_audit_log: {
        Row: {
          action_type: string
          actor_user_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string
          id: string
          obligation_id: string
          school_id: string | null
          summary: string
        }
        Insert: {
          action_type: string
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          obligation_id: string
          school_id?: string | null
          summary: string
        }
        Update: {
          action_type?: string
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          obligation_id?: string
          school_id?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_audit_log_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "compliance_obligations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_audit_log_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_calendar_links: {
        Row: {
          calendar_event_id: string | null
          calendar_id: string | null
          calendar_scope: string
          created_at: string
          id: string
          obligation_id: string
        }
        Insert: {
          calendar_event_id?: string | null
          calendar_id?: string | null
          calendar_scope?: string
          created_at?: string
          id?: string
          obligation_id: string
        }
        Update: {
          calendar_event_id?: string | null
          calendar_id?: string | null
          calendar_scope?: string
          created_at?: string
          id?: string
          obligation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_calendar_links_calendar_event_id_fkey"
            columns: ["calendar_event_id"]
            isOneToOne: false
            referencedRelation: "academic_calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_calendar_links_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "academic_calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_calendar_links_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "compliance_obligations"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_categories: {
        Row: {
          audience: string
          category_key: string
          created_at: string
          description: string | null
          domain: string
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          parent_id: string | null
          sort_order: number
        }
        Insert: {
          audience?: string
          category_key: string
          created_at?: string
          description?: string | null
          domain?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          parent_id?: string | null
          sort_order?: number
        }
        Update: {
          audience?: string
          category_key?: string
          created_at?: string
          description?: string | null
          domain?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          parent_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "compliance_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "compliance_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_domain_scores: {
        Row: {
          completed_obligations: number
          created_at: string
          domain: string
          id: string
          metadata: Json
          overdue_obligations: number
          school_id: string | null
          score_date: string
          score_pct: number
          status_indicator: string
          total_obligations: number
        }
        Insert: {
          completed_obligations?: number
          created_at?: string
          domain: string
          id?: string
          metadata?: Json
          overdue_obligations?: number
          school_id?: string | null
          score_date?: string
          score_pct?: number
          status_indicator?: string
          total_obligations?: number
        }
        Update: {
          completed_obligations?: number
          created_at?: string
          domain?: string
          id?: string
          metadata?: Json
          overdue_obligations?: number
          school_id?: string | null
          score_date?: string
          score_pct?: number
          status_indicator?: string
          total_obligations?: number
        }
        Relationships: [
          {
            foreignKeyName: "compliance_domain_scores_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_escalation_rules: {
        Row: {
          created_at: string
          days_overdue: number
          escalate_to_role: string
          id: string
          is_active: boolean
          name: string
          school_id: string | null
          severity: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          days_overdue: number
          escalate_to_role: string
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string | null
          severity?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          days_overdue?: number
          escalate_to_role?: string
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string | null
          severity?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "compliance_escalation_rules_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_obligation_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          id: string
          is_required: boolean
          obligation_id: string
          signature_id: string | null
          storage_path: string
          uploaded_by: string | null
          version_number: number
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          id?: string
          is_required?: boolean
          obligation_id: string
          signature_id?: string | null
          storage_path: string
          uploaded_by?: string | null
          version_number?: number
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          id?: string
          is_required?: boolean
          obligation_id?: string
          signature_id?: string | null
          storage_path?: string
          uploaded_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "compliance_obligation_documents_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "compliance_obligations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_obligation_documents_signature_id_fkey"
            columns: ["signature_id"]
            isOneToOne: false
            referencedRelation: "platform_digital_signatures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_obligation_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_obligation_escalations: {
        Row: {
          created_at: string
          days_overdue: number
          escalated_at: string
          escalated_to_role: string
          id: string
          mission_control_item_id: string | null
          obligation_id: string
        }
        Insert: {
          created_at?: string
          days_overdue: number
          escalated_at?: string
          escalated_to_role: string
          id?: string
          mission_control_item_id?: string | null
          obligation_id: string
        }
        Update: {
          created_at?: string
          days_overdue?: number
          escalated_at?: string
          escalated_to_role?: string
          id?: string
          mission_control_item_id?: string | null
          obligation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_obligation_escalations_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "compliance_obligations"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_obligation_reminders: {
        Row: {
          channel: string
          created_at: string
          days_before: number
          id: string
          obligation_id: string
          recipient_role: string | null
          recipient_user_id: string | null
          reminder_date: string
          sent_at: string | null
          status: string
        }
        Insert: {
          channel?: string
          created_at?: string
          days_before: number
          id?: string
          obligation_id: string
          recipient_role?: string | null
          recipient_user_id?: string | null
          reminder_date: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          channel?: string
          created_at?: string
          days_before?: number
          id?: string
          obligation_id?: string
          recipient_role?: string | null
          recipient_user_id?: string | null
          reminder_date?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_obligation_reminders_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "compliance_obligations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_obligation_reminders_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_obligation_templates: {
        Row: {
          category_id: string | null
          created_at: string
          default_frequency: string
          default_priority: string
          default_reminder_schedule_id: string | null
          default_risk_level: string
          description: string | null
          id: string
          is_active: boolean
          required_document_types: string[]
          school_id: string | null
          title: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          default_frequency?: string
          default_priority?: string
          default_reminder_schedule_id?: string | null
          default_risk_level?: string
          description?: string | null
          id?: string
          is_active?: boolean
          required_document_types?: string[]
          school_id?: string | null
          title: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          default_frequency?: string
          default_priority?: string
          default_reminder_schedule_id?: string | null
          default_risk_level?: string
          description?: string | null
          id?: string
          is_active?: boolean
          required_document_types?: string[]
          school_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_obligation_templat_default_reminder_schedule_id_fkey"
            columns: ["default_reminder_schedule_id"]
            isOneToOne: false
            referencedRelation: "compliance_reminder_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_obligation_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "compliance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_obligation_templates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_obligations: {
        Row: {
          action_href: string | null
          action_type: string | null
          approval_request_id: string | null
          approver_user_id: string | null
          assignee_type: string
          backup_owner_user_id: string | null
          campus_id: string | null
          category_id: string | null
          completion_date: string | null
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          due_date: string
          employee_id: string | null
          family_id: string | null
          frequency: string
          frequency_interval: number | null
          guardian_user_id: string | null
          id: string
          linked_policy_refs: Json
          metadata: Json
          mission_control_item_id: string | null
          notes: string | null
          occurrence_number: number
          owner_user_id: string | null
          parent_can_complete: boolean
          parent_obligation_id: string | null
          priority: string
          program: string | null
          reminder_schedule_id: string | null
          reviewer_user_id: string | null
          risk_level: string
          rrule: string | null
          school_id: string | null
          source_entity_id: string | null
          source_entity_type: string | null
          source_module: string | null
          status: string
          student_id: string | null
          subject_domain: string | null
          template_id: string | null
          title: string
          updated_at: string
          workflow_key: string | null
        }
        Insert: {
          action_href?: string | null
          action_type?: string | null
          approval_request_id?: string | null
          approver_user_id?: string | null
          assignee_type?: string
          backup_owner_user_id?: string | null
          campus_id?: string | null
          category_id?: string | null
          completion_date?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          due_date: string
          employee_id?: string | null
          family_id?: string | null
          frequency?: string
          frequency_interval?: number | null
          guardian_user_id?: string | null
          id?: string
          linked_policy_refs?: Json
          metadata?: Json
          mission_control_item_id?: string | null
          notes?: string | null
          occurrence_number?: number
          owner_user_id?: string | null
          parent_can_complete?: boolean
          parent_obligation_id?: string | null
          priority?: string
          program?: string | null
          reminder_schedule_id?: string | null
          reviewer_user_id?: string | null
          risk_level?: string
          rrule?: string | null
          school_id?: string | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          source_module?: string | null
          status?: string
          student_id?: string | null
          subject_domain?: string | null
          template_id?: string | null
          title: string
          updated_at?: string
          workflow_key?: string | null
        }
        Update: {
          action_href?: string | null
          action_type?: string | null
          approval_request_id?: string | null
          approver_user_id?: string | null
          assignee_type?: string
          backup_owner_user_id?: string | null
          campus_id?: string | null
          category_id?: string | null
          completion_date?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          due_date?: string
          employee_id?: string | null
          family_id?: string | null
          frequency?: string
          frequency_interval?: number | null
          guardian_user_id?: string | null
          id?: string
          linked_policy_refs?: Json
          metadata?: Json
          mission_control_item_id?: string | null
          notes?: string | null
          occurrence_number?: number
          owner_user_id?: string | null
          parent_can_complete?: boolean
          parent_obligation_id?: string | null
          priority?: string
          program?: string | null
          reminder_schedule_id?: string | null
          reviewer_user_id?: string | null
          risk_level?: string
          rrule?: string | null
          school_id?: string | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          source_module?: string | null
          status?: string
          student_id?: string | null
          subject_domain?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string
          workflow_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_obligations_approval_request_id_fkey"
            columns: ["approval_request_id"]
            isOneToOne: false
            referencedRelation: "platform_approval_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_obligations_approver_user_id_fkey"
            columns: ["approver_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_obligations_backup_owner_user_id_fkey"
            columns: ["backup_owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_obligations_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_obligations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "compliance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_obligations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_obligations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_obligations_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_obligations_guardian_user_id_fkey"
            columns: ["guardian_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_obligations_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_obligations_parent_obligation_id_fkey"
            columns: ["parent_obligation_id"]
            isOneToOne: false
            referencedRelation: "compliance_obligations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_obligations_reminder_schedule_id_fkey"
            columns: ["reminder_schedule_id"]
            isOneToOne: false
            referencedRelation: "compliance_reminder_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_obligations_reviewer_user_id_fkey"
            columns: ["reviewer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_obligations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_obligations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_obligations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "compliance_obligation_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_reminder_schedules: {
        Row: {
          created_at: string
          days_before: number[]
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          notify_daily_when_overdue: boolean
          school_id: string | null
        }
        Insert: {
          created_at?: string
          days_before?: number[]
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          notify_daily_when_overdue?: boolean
          school_id?: string | null
        }
        Update: {
          created_at?: string
          days_before?: number[]
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          notify_daily_when_overdue?: boolean
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_reminder_schedules_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      config_go_live_checks: {
        Row: {
          check_category: string
          check_key: string
          checked_at: string
          id: string
          is_required: boolean
          message: string | null
          organization_id: string
          resolve_href: string | null
          status: string
          title: string
        }
        Insert: {
          check_category: string
          check_key: string
          checked_at?: string
          id?: string
          is_required?: boolean
          message?: string | null
          organization_id: string
          resolve_href?: string | null
          status?: string
          title: string
        }
        Update: {
          check_category?: string
          check_key?: string
          checked_at?: string
          id?: string
          is_required?: boolean
          message?: string | null
          organization_id?: string
          resolve_href?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "config_go_live_checks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      config_go_live_launches: {
        Row: {
          created_at: string
          id: string
          launch_status: string
          launched_at: string | null
          launched_by: string | null
          organization_id: string
          validation_snapshot: Json
        }
        Insert: {
          created_at?: string
          id?: string
          launch_status?: string
          launched_at?: string | null
          launched_by?: string | null
          organization_id: string
          validation_snapshot?: Json
        }
        Update: {
          created_at?: string
          id?: string
          launch_status?: string
          launched_at?: string | null
          launched_by?: string | null
          organization_id?: string
          validation_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "config_go_live_launches_launched_by_fkey"
            columns: ["launched_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_go_live_launches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      config_module_definitions: {
        Row: {
          category: string
          created_at: string
          dependencies: Json
          description: string | null
          display_name: string
          id: string
          is_platform_module: boolean
          metadata: Json
          module_key: string
          platform_version: string
          sort_order: number
        }
        Insert: {
          category?: string
          created_at?: string
          dependencies?: Json
          description?: string | null
          display_name: string
          id?: string
          is_platform_module?: boolean
          metadata?: Json
          module_key: string
          platform_version?: string
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string
          dependencies?: Json
          description?: string | null
          display_name?: string
          id?: string
          is_platform_module?: boolean
          metadata?: Json
          module_key?: string
          platform_version?: string
          sort_order?: number
        }
        Relationships: []
      }
      config_module_installations: {
        Row: {
          created_at: string
          disabled_at: string | null
          enabled_at: string | null
          id: string
          installed_at: string | null
          installed_by: string | null
          installed_version: string
          module_key: string
          module_settings: Json
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          disabled_at?: string | null
          enabled_at?: string | null
          id?: string
          installed_at?: string | null
          installed_by?: string | null
          installed_version?: string
          module_key: string
          module_settings?: Json
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          disabled_at?: string | null
          enabled_at?: string | null
          id?: string
          installed_at?: string | null
          installed_by?: string | null
          installed_version?: string
          module_key?: string
          module_settings?: Json
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "config_module_installations_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_module_installations_module_key_fkey"
            columns: ["module_key"]
            isOneToOne: false
            referencedRelation: "config_module_definitions"
            referencedColumns: ["module_key"]
          },
          {
            foreignKeyName: "config_module_installations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      config_organization_templates: {
        Row: {
          created_at: string
          default_config: Json
          default_modules: Json
          description: string | null
          id: string
          is_active: boolean
          name: string
          template_key: string
          tenant_type: string
        }
        Insert: {
          created_at?: string
          default_config?: Json
          default_modules?: Json
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          template_key: string
          tenant_type?: string
        }
        Update: {
          created_at?: string
          default_config?: Json
          default_modules?: Json
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          template_key?: string
          tenant_type?: string
        }
        Relationships: []
      }
      config_packages: {
        Row: {
          created_at: string
          exported_by: string | null
          format: string
          id: string
          imported_by: string | null
          organization_id: string | null
          package_data: Json
          package_name: string
          package_type: string
          source_scope: Json
        }
        Insert: {
          created_at?: string
          exported_by?: string | null
          format?: string
          id?: string
          imported_by?: string | null
          organization_id?: string | null
          package_data?: Json
          package_name: string
          package_type?: string
          source_scope?: Json
        }
        Update: {
          created_at?: string
          exported_by?: string | null
          format?: string
          id?: string
          imported_by?: string | null
          organization_id?: string | null
          package_data?: Json
          package_name?: string
          package_type?: string
          source_scope?: Json
        }
        Relationships: [
          {
            foreignKeyName: "config_packages_exported_by_fkey"
            columns: ["exported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_packages_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_packages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      config_sections: {
        Row: {
          approval_status: string
          config_data: Json
          created_at: string
          id: string
          is_active: boolean
          organization_id: string
          requires_approval: boolean
          schema_version: number
          school_id: string | null
          section_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          approval_status?: string
          config_data?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id: string
          requires_approval?: boolean
          schema_version?: number
          school_id?: string | null
          section_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          approval_status?: string
          config_data?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          requires_approval?: boolean
          schema_version?: number
          school_id?: string | null
          section_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_sections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_sections_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_sections_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      config_setup_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: string
          draft_config: Json
          id: string
          organization_id: string
          started_by: string | null
          status: string
          steps_completed: Json
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: string
          draft_config?: Json
          id?: string
          organization_id: string
          started_by?: string | null
          status?: string
          steps_completed?: Json
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: string
          draft_config?: Json
          id?: string
          organization_id?: string
          started_by?: string | null
          status?: string
          steps_completed?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "config_setup_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_setup_sessions_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      config_version_history: {
        Row: {
          audit_event_id: string | null
          change_summary: string | null
          changed_at: string
          changed_by: string | null
          config_section_id: string | null
          id: string
          is_rollback: boolean
          new_values: Json
          organization_id: string
          previous_values: Json
          school_id: string | null
          section_key: string
          version_number: number
        }
        Insert: {
          audit_event_id?: string | null
          change_summary?: string | null
          changed_at?: string
          changed_by?: string | null
          config_section_id?: string | null
          id?: string
          is_rollback?: boolean
          new_values?: Json
          organization_id: string
          previous_values?: Json
          school_id?: string | null
          section_key: string
          version_number?: number
        }
        Update: {
          audit_event_id?: string | null
          change_summary?: string | null
          changed_at?: string
          changed_by?: string | null
          config_section_id?: string | null
          id?: string
          is_rollback?: boolean
          new_values?: Json
          organization_id?: string
          previous_values?: Json
          school_id?: string | null
          section_key?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "config_version_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_version_history_config_section_id_fkey"
            columns: ["config_section_id"]
            isOneToOne: false
            referencedRelation: "config_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_version_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_version_history_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_pay_ledger: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_id: string
          gross_amount: number
          id: string
          instructional_session_id: string | null
          notes: string | null
          pay_period_end: string
          pay_period_start: string
          pay_rate_per_student: number | null
          payment_status: string
          payroll_batch_date: string | null
          payroll_reported: boolean | null
          school_id: string
          student_count: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id: string
          gross_amount?: number
          id?: string
          instructional_session_id?: string | null
          notes?: string | null
          pay_period_end: string
          pay_period_start: string
          pay_rate_per_student?: number | null
          payment_status?: string
          payroll_batch_date?: string | null
          payroll_reported?: boolean | null
          school_id: string
          student_count?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          gross_amount?: number
          id?: string
          instructional_session_id?: string | null
          notes?: string | null
          pay_period_end?: string
          pay_period_start?: string
          pay_rate_per_student?: number | null
          payment_status?: string
          payroll_batch_date?: string | null
          payroll_reported?: boolean | null
          school_id?: string
          student_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_pay_ledger_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_pay_ledger_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_pay_ledger_instructional_session_id_fkey"
            columns: ["instructional_session_id"]
            isOneToOne: false
            referencedRelation: "instructional_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_pay_ledger_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sections: {
        Row: {
          academy_level: number | null
          campus_id: string | null
          course_id: string
          created_at: string
          day_pattern: string | null
          delivery_mode: string
          end_time_et: string | null
          id: string
          instructional_minutes: number
          instructor_employee_id: string | null
          max_capacity: number
          maximum_student_age: number | null
          meet_link: string | null
          meeting_pattern: Json
          min_capacity: number
          minimum_student_age: number | null
          program: string | null
          room_id: string | null
          school_year_id: string
          section_code: string
          start_time_et: string | null
          status: string
          structured_literacy_level: number | null
          structured_literacy_step: number | null
          term_id: string | null
          updated_at: string
        }
        Insert: {
          academy_level?: number | null
          campus_id?: string | null
          course_id: string
          created_at?: string
          day_pattern?: string | null
          delivery_mode?: string
          end_time_et?: string | null
          id?: string
          instructional_minutes?: number
          instructor_employee_id?: string | null
          max_capacity?: number
          maximum_student_age?: number | null
          meet_link?: string | null
          meeting_pattern?: Json
          min_capacity?: number
          minimum_student_age?: number | null
          program?: string | null
          room_id?: string | null
          school_year_id: string
          section_code: string
          start_time_et?: string | null
          status?: string
          structured_literacy_level?: number | null
          structured_literacy_step?: number | null
          term_id?: string | null
          updated_at?: string
        }
        Update: {
          academy_level?: number | null
          campus_id?: string | null
          course_id?: string
          created_at?: string
          day_pattern?: string | null
          delivery_mode?: string
          end_time_et?: string | null
          id?: string
          instructional_minutes?: number
          instructor_employee_id?: string | null
          max_capacity?: number
          maximum_student_age?: number | null
          meet_link?: string | null
          meeting_pattern?: Json
          min_capacity?: number
          minimum_student_age?: number | null
          program?: string | null
          room_id?: string | null
          school_year_id?: string
          section_code?: string
          start_time_et?: string | null
          status?: string
          structured_literacy_level?: number | null
          structured_literacy_step?: number | null
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sections_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sections_instructor_employee_id_fkey"
            columns: ["instructor_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sections_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "schedule_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sections_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sections_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          academic_level: string | null
          academy_subject: string | null
          code: string
          created_at: string
          credit_hours: number | null
          delivery_mode: string
          description: string | null
          grade_levels: string[]
          id: string
          maximum_age: number | null
          minimum_age: number | null
          name: string
          program: string | null
          school_id: string
          status: string
          subject: string | null
          term_type: string | null
          updated_at: string
        }
        Insert: {
          academic_level?: string | null
          academy_subject?: string | null
          code: string
          created_at?: string
          credit_hours?: number | null
          delivery_mode?: string
          description?: string | null
          grade_levels?: string[]
          id?: string
          maximum_age?: number | null
          minimum_age?: number | null
          name: string
          program?: string | null
          school_id: string
          status?: string
          subject?: string | null
          term_type?: string | null
          updated_at?: string
        }
        Update: {
          academic_level?: string | null
          academy_subject?: string | null
          code?: string
          created_at?: string
          credit_hours?: number | null
          delivery_mode?: string
          description?: string | null
          grade_levels?: string[]
          id?: string
          maximum_age?: number | null
          minimum_age?: number | null
          name?: string
          program?: string | null
          school_id?: string
          status?: string
          subject?: string | null
          term_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      edi_briefings: {
        Row: {
          briefing_type: string
          content: Json
          created_at: string
          expires_at: string | null
          generated_at: string
          id: string
          school_id: string
          summary: string | null
          title: string
        }
        Insert: {
          briefing_type: string
          content?: Json
          created_at?: string
          expires_at?: string | null
          generated_at?: string
          id?: string
          school_id: string
          summary?: string | null
          title: string
        }
        Update: {
          briefing_type?: string
          content?: Json
          created_at?: string
          expires_at?: string | null
          generated_at?: string
          id?: string
          school_id?: string
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "edi_briefings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      edi_capacity_snapshots: {
        Row: {
          available_seats: number
          campus_utilization_pct: number
          created_at: string
          future_capacity_seats: number | null
          id: string
          metrics: Json
          program_utilization_pct: number
          projected_shortages: Json
          room_utilization_pct: number
          schedule_utilization_pct: number
          school_id: string
          snapshot_date: string
          teacher_utilization_pct: number
          used_seats: number
          virtual_capacity_hours: number
        }
        Insert: {
          available_seats?: number
          campus_utilization_pct?: number
          created_at?: string
          future_capacity_seats?: number | null
          id?: string
          metrics?: Json
          program_utilization_pct?: number
          projected_shortages?: Json
          room_utilization_pct?: number
          schedule_utilization_pct?: number
          school_id: string
          snapshot_date?: string
          teacher_utilization_pct?: number
          used_seats?: number
          virtual_capacity_hours?: number
        }
        Update: {
          available_seats?: number
          campus_utilization_pct?: number
          created_at?: string
          future_capacity_seats?: number | null
          id?: string
          metrics?: Json
          program_utilization_pct?: number
          projected_shortages?: Json
          room_utilization_pct?: number
          schedule_utilization_pct?: number
          school_id?: string
          snapshot_date?: string
          teacher_utilization_pct?: number
          used_seats?: number
          virtual_capacity_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "edi_capacity_snapshots_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      edi_decision_history: {
        Row: {
          actual_enrollment_impact: number | null
          actual_financial_impact: number | null
          actual_student_success_impact: number | null
          approved_by: string | null
          created_at: string
          decided_at: string
          decision_made: string
          id: string
          lessons_learned: string | null
          metadata: Json
          outcome_status: string
          projected_enrollment_impact: number | null
          projected_financial_impact: number | null
          projected_student_success_impact: number | null
          reason: string | null
          recommendation_id: string | null
          reviewed_at: string | null
          school_id: string
        }
        Insert: {
          actual_enrollment_impact?: number | null
          actual_financial_impact?: number | null
          actual_student_success_impact?: number | null
          approved_by?: string | null
          created_at?: string
          decided_at?: string
          decision_made: string
          id?: string
          lessons_learned?: string | null
          metadata?: Json
          outcome_status?: string
          projected_enrollment_impact?: number | null
          projected_financial_impact?: number | null
          projected_student_success_impact?: number | null
          reason?: string | null
          recommendation_id?: string | null
          reviewed_at?: string | null
          school_id: string
        }
        Update: {
          actual_enrollment_impact?: number | null
          actual_financial_impact?: number | null
          actual_student_success_impact?: number | null
          approved_by?: string | null
          created_at?: string
          decided_at?: string
          decision_made?: string
          id?: string
          lessons_learned?: string | null
          metadata?: Json
          outcome_status?: string
          projected_enrollment_impact?: number | null
          projected_financial_impact?: number | null
          projected_student_success_impact?: number | null
          reason?: string | null
          recommendation_id?: string | null
          reviewed_at?: string | null
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edi_decision_history_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edi_decision_history_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "edi_recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edi_decision_history_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "rpt_edi_recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edi_decision_history_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      edi_educational_roi: {
        Row: {
          attendance_improvement: number | null
          behavior_improvement: number | null
          computed_at: string
          entity_id: string | null
          entity_key: string | null
          entity_type: string
          financial_roi: number
          goal_achievement: number | null
          id: string
          methodology: Json
          overall_educational_roi: number
          parent_engagement: number | null
          retention: number | null
          school_id: string
          student_growth: number | null
        }
        Insert: {
          attendance_improvement?: number | null
          behavior_improvement?: number | null
          computed_at?: string
          entity_id?: string | null
          entity_key?: string | null
          entity_type: string
          financial_roi?: number
          goal_achievement?: number | null
          id?: string
          methodology?: Json
          overall_educational_roi?: number
          parent_engagement?: number | null
          retention?: number | null
          school_id: string
          student_growth?: number | null
        }
        Update: {
          attendance_improvement?: number | null
          behavior_improvement?: number | null
          computed_at?: string
          entity_id?: string | null
          entity_key?: string | null
          entity_type?: string
          financial_roi?: number
          goal_achievement?: number | null
          id?: string
          methodology?: Json
          overall_educational_roi?: number
          parent_engagement?: number | null
          retention?: number | null
          school_id?: string
          student_growth?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "edi_educational_roi_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      edi_recommendations: {
        Row: {
          alternative_options: Json
          approval_status: string
          break_even_enrollment: number | null
          computed_at: string
          confidence_score: number
          created_at: string
          current_margin: number | null
          decision_owner_role: string | null
          domain: string
          entity_id: string | null
          entity_key: string | null
          entity_type: string | null
          estimated_timeline: string | null
          evidence: string | null
          expires_at: string | null
          financial_impact: number
          id: string
          impact_details: Json
          issue: string
          likely_next: string | null
          mission_control_item_id: string | null
          operational_impact: number
          priority: string
          projected_margin: number | null
          recommendation_score: number
          recommendation_type: string
          recommended_action: string
          recommended_enrollment: number | null
          risk_level: string
          school_id: string
          status: string
          student_success_impact: number
          supporting_metrics: Json
          target_margin: number | null
          updated_at: string
          what_happened: string | null
          why_happened: string | null
        }
        Insert: {
          alternative_options?: Json
          approval_status?: string
          break_even_enrollment?: number | null
          computed_at?: string
          confidence_score?: number
          created_at?: string
          current_margin?: number | null
          decision_owner_role?: string | null
          domain: string
          entity_id?: string | null
          entity_key?: string | null
          entity_type?: string | null
          estimated_timeline?: string | null
          evidence?: string | null
          expires_at?: string | null
          financial_impact?: number
          id?: string
          impact_details?: Json
          issue: string
          likely_next?: string | null
          mission_control_item_id?: string | null
          operational_impact?: number
          priority?: string
          projected_margin?: number | null
          recommendation_score?: number
          recommendation_type: string
          recommended_action: string
          recommended_enrollment?: number | null
          risk_level?: string
          school_id: string
          status?: string
          student_success_impact?: number
          supporting_metrics?: Json
          target_margin?: number | null
          updated_at?: string
          what_happened?: string | null
          why_happened?: string | null
        }
        Update: {
          alternative_options?: Json
          approval_status?: string
          break_even_enrollment?: number | null
          computed_at?: string
          confidence_score?: number
          created_at?: string
          current_margin?: number | null
          decision_owner_role?: string | null
          domain?: string
          entity_id?: string | null
          entity_key?: string | null
          entity_type?: string | null
          estimated_timeline?: string | null
          evidence?: string | null
          expires_at?: string | null
          financial_impact?: number
          id?: string
          impact_details?: Json
          issue?: string
          likely_next?: string | null
          mission_control_item_id?: string | null
          operational_impact?: number
          priority?: string
          projected_margin?: number | null
          recommendation_score?: number
          recommendation_type?: string
          recommended_action?: string
          recommended_enrollment?: number | null
          risk_level?: string
          school_id?: string
          status?: string
          student_success_impact?: number
          supporting_metrics?: Json
          target_margin?: number | null
          updated_at?: string
          what_happened?: string | null
          why_happened?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edi_recommendations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      edi_scenario_results: {
        Row: {
          computed_at: string
          delta_summary: Json
          id: string
          operational_impact: Json
          projected_cash_flow: number
          projected_ebitda: number
          projected_enrollment: number | null
          projected_expenses: number
          projected_margin_pct: number
          projected_revenue: number
          scenario_id: string
          student_success_impact: Json
        }
        Insert: {
          computed_at?: string
          delta_summary?: Json
          id?: string
          operational_impact?: Json
          projected_cash_flow?: number
          projected_ebitda?: number
          projected_enrollment?: number | null
          projected_expenses?: number
          projected_margin_pct?: number
          projected_revenue?: number
          scenario_id: string
          student_success_impact?: Json
        }
        Update: {
          computed_at?: string
          delta_summary?: Json
          id?: string
          operational_impact?: Json
          projected_cash_flow?: number
          projected_ebitda?: number
          projected_enrollment?: number | null
          projected_expenses?: number
          projected_margin_pct?: number
          projected_revenue?: number
          scenario_id?: string
          student_success_impact?: Json
        }
        Relationships: [
          {
            foreignKeyName: "edi_scenario_results_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "edi_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      edi_scenarios: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          inputs: Json
          name: string
          scenario_group: string
          scenario_type: string
          school_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          inputs?: Json
          name: string
          scenario_group?: string
          scenario_type?: string
          school_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          inputs?: Json
          name?: string
          scenario_group?: string
          scenario_type?: string
          school_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "edi_scenarios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edi_scenarios_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      edi_scorecard_snapshots: {
        Row: {
          capacity: number
          compliance: number
          created_at: string
          dimensions: Json
          enrollment_health: number
          financial_health: number
          growth: number
          id: string
          operational_efficiency: number
          overall_enterprise_health: number
          parent_engagement: number
          risk: number
          school_id: string
          snapshot_date: string
          student_success: number
          teacher_effectiveness: number
        }
        Insert: {
          capacity?: number
          compliance?: number
          created_at?: string
          dimensions?: Json
          enrollment_health?: number
          financial_health?: number
          growth?: number
          id?: string
          operational_efficiency?: number
          overall_enterprise_health?: number
          parent_engagement?: number
          risk?: number
          school_id: string
          snapshot_date?: string
          student_success?: number
          teacher_effectiveness?: number
        }
        Update: {
          capacity?: number
          compliance?: number
          created_at?: string
          dimensions?: Json
          enrollment_health?: number
          financial_health?: number
          growth?: number
          id?: string
          operational_efficiency?: number
          overall_enterprise_health?: number
          parent_engagement?: number
          risk?: number
          school_id?: string
          snapshot_date?: string
          student_success?: number
          teacher_effectiveness?: number
        }
        Relationships: [
          {
            foreignKeyName: "edi_scorecard_snapshots_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      edp_api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_name: string
          key_prefix: string
          last_used_at: string | null
          organization_id: string
          rate_limit_per_minute: number
          scopes: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_name: string
          key_prefix: string
          last_used_at?: string | null
          organization_id: string
          rate_limit_per_minute?: number
          scopes?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_name?: string
          key_prefix?: string
          last_used_at?: string | null
          organization_id?: string
          rate_limit_per_minute?: number
          scopes?: Json
        }
        Relationships: [
          {
            foreignKeyName: "edp_api_keys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edp_api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      edp_archives: {
        Row: {
          archive_type: string
          archived_at: string
          archived_by: string | null
          archived_data: Json
          entity_id: string | null
          entity_type: string | null
          expires_at: string | null
          id: string
          organization_id: string
          retention_policy: string | null
        }
        Insert: {
          archive_type: string
          archived_at?: string
          archived_by?: string | null
          archived_data?: Json
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          organization_id: string
          retention_policy?: string | null
        }
        Update: {
          archive_type?: string
          archived_at?: string
          archived_by?: string | null
          archived_data?: Json
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          organization_id?: string
          retention_policy?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edp_archives_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edp_archives_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      edp_backups: {
        Row: {
          backup_size_bytes: number | null
          backup_type: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          restored_at: string | null
          scheduled_at: string | null
          school_id: string | null
          snapshot_data: Json | null
          status: string
          storage_path: string | null
        }
        Insert: {
          backup_size_bytes?: number | null
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          restored_at?: string | null
          scheduled_at?: string | null
          school_id?: string | null
          snapshot_data?: Json | null
          status?: string
          storage_path?: string | null
        }
        Update: {
          backup_size_bytes?: number | null
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          restored_at?: string | null
          scheduled_at?: string | null
          school_id?: string | null
          snapshot_data?: Json | null
          status?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edp_backups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edp_backups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edp_backups_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      edp_clone_jobs: {
        Row: {
          clone_type: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          include_users: boolean
          organization_id: string
          progress_pct: number
          result_summary: Json
          source_scope: Json
          started_at: string | null
          status: string
          target_scope: Json
        }
        Insert: {
          clone_type?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          include_users?: boolean
          organization_id: string
          progress_pct?: number
          result_summary?: Json
          source_scope?: Json
          started_at?: string | null
          status?: string
          target_scope?: Json
        }
        Update: {
          clone_type?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          include_users?: boolean
          organization_id?: string
          progress_pct?: number
          result_summary?: Json
          source_scope?: Json
          started_at?: string | null
          status?: string
          target_scope?: Json
        }
        Relationships: [
          {
            foreignKeyName: "edp_clone_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edp_clone_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      edp_connector_definitions: {
        Row: {
          auth_type: string
          category: string
          connector_key: string
          default_config: Json
          description: string | null
          display_name: string
          id: string
          sort_order: number
          supports_export: boolean
          supports_import: boolean
          supports_sync: boolean
        }
        Insert: {
          auth_type?: string
          category?: string
          connector_key: string
          default_config?: Json
          description?: string | null
          display_name: string
          id?: string
          sort_order?: number
          supports_export?: boolean
          supports_import?: boolean
          supports_sync?: boolean
        }
        Update: {
          auth_type?: string
          category?: string
          connector_key?: string
          default_config?: Json
          description?: string | null
          display_name?: string
          id?: string
          sort_order?: number
          supports_export?: boolean
          supports_import?: boolean
          supports_sync?: boolean
        }
        Relationships: []
      }
      edp_connector_instances: {
        Row: {
          config: Json
          connector_key: string
          created_at: string
          created_by: string | null
          credentials_ref: string | null
          health_status: string
          id: string
          instance_name: string
          last_sync_at: string | null
          organization_id: string
          status: string
          sync_direction: string
          updated_at: string
        }
        Insert: {
          config?: Json
          connector_key: string
          created_at?: string
          created_by?: string | null
          credentials_ref?: string | null
          health_status?: string
          id?: string
          instance_name: string
          last_sync_at?: string | null
          organization_id: string
          status?: string
          sync_direction?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          connector_key?: string
          created_at?: string
          created_by?: string | null
          credentials_ref?: string | null
          health_status?: string
          id?: string
          instance_name?: string
          last_sync_at?: string | null
          organization_id?: string
          status?: string
          sync_direction?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "edp_connector_instances_connector_key_fkey"
            columns: ["connector_key"]
            isOneToOne: false
            referencedRelation: "edp_connector_definitions"
            referencedColumns: ["connector_key"]
          },
          {
            foreignKeyName: "edp_connector_instances_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edp_connector_instances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      edp_export_batches: {
        Row: {
          completed_at: string | null
          export_format: string
          export_type: string
          exported_by: string | null
          file_path: string | null
          id: string
          metadata: Json
          organization_id: string | null
          row_count: number
          school_id: string | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          export_format?: string
          export_type: string
          exported_by?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json
          organization_id?: string | null
          row_count?: number
          school_id?: string | null
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          export_format?: string
          export_type?: string
          exported_by?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json
          organization_id?: string | null
          row_count?: number
          school_id?: string | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "edp_export_batches_exported_by_fkey"
            columns: ["exported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edp_export_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edp_export_batches_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      edp_import_batches: {
        Row: {
          completed_at: string | null
          error_count: number
          file_name: string | null
          id: string
          import_type: string
          imported_by: string | null
          mapping_template_id: string | null
          metadata: Json
          organization_id: string | null
          row_count: number
          school_id: string | null
          source_format: string
          source_system: string | null
          started_at: string
          status: string
          success_count: number
          validation_summary: Json
          warning_count: number
        }
        Insert: {
          completed_at?: string | null
          error_count?: number
          file_name?: string | null
          id?: string
          import_type: string
          imported_by?: string | null
          mapping_template_id?: string | null
          metadata?: Json
          organization_id?: string | null
          row_count?: number
          school_id?: string | null
          source_format?: string
          source_system?: string | null
          started_at?: string
          status?: string
          success_count?: number
          validation_summary?: Json
          warning_count?: number
        }
        Update: {
          completed_at?: string | null
          error_count?: number
          file_name?: string | null
          id?: string
          import_type?: string
          imported_by?: string | null
          mapping_template_id?: string | null
          metadata?: Json
          organization_id?: string | null
          row_count?: number
          school_id?: string | null
          source_format?: string
          source_system?: string | null
          started_at?: string
          status?: string
          success_count?: number
          validation_summary?: Json
          warning_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "edp_import_batches_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edp_import_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edp_import_batches_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      edp_import_records: {
        Row: {
          batch_id: string
          created_at: string
          errors: Json
          id: string
          mapped_data: Json | null
          raw_data: Json
          row_number: number
          status: string
          target_entity_id: string | null
          target_entity_type: string | null
          warnings: Json
        }
        Insert: {
          batch_id: string
          created_at?: string
          errors?: Json
          id?: string
          mapped_data?: Json | null
          raw_data?: Json
          row_number: number
          status?: string
          target_entity_id?: string | null
          target_entity_type?: string | null
          warnings?: Json
        }
        Update: {
          batch_id?: string
          created_at?: string
          errors?: Json
          id?: string
          mapped_data?: Json | null
          raw_data?: Json
          row_number?: number
          status?: string
          target_entity_id?: string | null
          target_entity_type?: string | null
          warnings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "edp_import_records_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "edp_import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      edp_mapping_templates: {
        Row: {
          conditional_mappings: Json
          created_at: string
          created_by: string | null
          field_mappings: Json
          id: string
          import_type: string
          is_default: boolean
          lookup_tables: Json
          organization_id: string | null
          source_format: string
          template_name: string
          transformation_rules: Json
          updated_at: string
        }
        Insert: {
          conditional_mappings?: Json
          created_at?: string
          created_by?: string | null
          field_mappings?: Json
          id?: string
          import_type: string
          is_default?: boolean
          lookup_tables?: Json
          organization_id?: string | null
          source_format?: string
          template_name: string
          transformation_rules?: Json
          updated_at?: string
        }
        Update: {
          conditional_mappings?: Json
          created_at?: string
          created_by?: string | null
          field_mappings?: Json
          id?: string
          import_type?: string
          is_default?: boolean
          lookup_tables?: Json
          organization_id?: string | null
          source_format?: string
          template_name?: string
          transformation_rules?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "edp_mapping_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edp_mapping_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      edp_migration_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: string
          id: string
          import_batch_id: string | null
          mapping_template_id: string | null
          organization_id: string
          session_data: Json
          started_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: string
          id?: string
          import_batch_id?: string | null
          mapping_template_id?: string | null
          organization_id: string
          session_data?: Json
          started_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: string
          id?: string
          import_batch_id?: string | null
          mapping_template_id?: string | null
          organization_id?: string
          session_data?: Json
          started_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "edp_migration_sessions_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "edp_import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edp_migration_sessions_mapping_template_id_fkey"
            columns: ["mapping_template_id"]
            isOneToOne: false
            referencedRelation: "edp_mapping_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edp_migration_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edp_migration_sessions_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      edp_quality_snapshots: {
        Row: {
          broken_relationships: number
          corrective_actions: Json
          created_at: string
          duplicate_families: number
          duplicate_students: number
          id: string
          incomplete_records: number
          issues: Json
          missing_contacts: number
          organization_id: string
          orphaned_files: number
          quality_score: number
          school_id: string | null
          snapshot_date: string
        }
        Insert: {
          broken_relationships?: number
          corrective_actions?: Json
          created_at?: string
          duplicate_families?: number
          duplicate_students?: number
          id?: string
          incomplete_records?: number
          issues?: Json
          missing_contacts?: number
          organization_id: string
          orphaned_files?: number
          quality_score?: number
          school_id?: string | null
          snapshot_date?: string
        }
        Update: {
          broken_relationships?: number
          corrective_actions?: Json
          created_at?: string
          duplicate_families?: number
          duplicate_students?: number
          id?: string
          incomplete_records?: number
          issues?: Json
          missing_contacts?: number
          organization_id?: string
          orphaned_files?: number
          quality_score?: number
          school_id?: string | null
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "edp_quality_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edp_quality_snapshots_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      edp_sync_jobs: {
        Row: {
          completed_at: string | null
          conflicts_detected: number
          connector_instance_id: string | null
          created_at: string
          direction: string
          error_message: string | null
          id: string
          metadata: Json
          organization_id: string
          records_processed: number
          started_at: string | null
          status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          conflicts_detected?: number
          connector_instance_id?: string | null
          created_at?: string
          direction?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          records_processed?: number
          started_at?: string | null
          status?: string
          sync_type?: string
        }
        Update: {
          completed_at?: string | null
          conflicts_detected?: number
          connector_instance_id?: string | null
          created_at?: string
          direction?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          records_processed?: number
          started_at?: string | null
          status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "edp_sync_jobs_connector_instance_id_fkey"
            columns: ["connector_instance_id"]
            isOneToOne: false
            referencedRelation: "edp_connector_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edp_sync_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      edp_sync_logs: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          log_level: string
          message: string
          payload: Json
          sync_job_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          log_level?: string
          message: string
          payload?: Json
          sync_job_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          log_level?: string
          message?: string
          payload?: Json
          sync_job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edp_sync_logs_sync_job_id_fkey"
            columns: ["sync_job_id"]
            isOneToOne: false
            referencedRelation: "edp_sync_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      edp_validation_results: {
        Row: {
          batch_id: string | null
          created_at: string
          field_name: string | null
          id: string
          message: string
          resolution_hint: string | null
          row_number: number | null
          severity: string
          validation_type: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          field_name?: string | null
          id?: string
          message: string
          resolution_hint?: string | null
          row_number?: number | null
          severity: string
          validation_type: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          field_name?: string | null
          id?: string
          message?: string
          resolution_hint?: string | null
          row_number?: number | null
          severity?: string
          validation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "edp_validation_results_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "edp_import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      edp_warehouse_snapshots: {
        Row: {
          created_at: string
          domain: string
          id: string
          metrics: Json
          organization_id: string
          period_type: string
          school_id: string | null
          snapshot_date: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          metrics?: Json
          organization_id: string
          period_type?: string
          school_id?: string | null
          snapshot_date: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          metrics?: Json
          organization_id?: string
          period_type?: string
          school_id?: string | null
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "edp_warehouse_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edp_warehouse_snapshots_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      edp_webhook_deliveries: {
        Row: {
          attempt_count: number
          created_at: string
          delivered_at: string | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_code: number | null
          status: string
          webhook_id: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          delivered_at?: string | null
          event_type: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_code?: number | null
          status?: string
          webhook_id: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          delivered_at?: string | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_code?: number | null
          status?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edp_webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "edp_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      edp_webhooks: {
        Row: {
          created_at: string
          created_by: string | null
          direction: string
          endpoint_url: string | null
          event_types: Json
          id: string
          is_active: boolean
          organization_id: string
          retry_policy: Json
          secret_key_ref: string | null
          signing_enabled: boolean
          updated_at: string
          webhook_name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          direction: string
          endpoint_url?: string | null
          event_types?: Json
          id?: string
          is_active?: boolean
          organization_id: string
          retry_policy?: Json
          secret_key_ref?: string | null
          signing_enabled?: boolean
          updated_at?: string
          webhook_name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          direction?: string
          endpoint_url?: string | null
          event_types?: Json
          id?: string
          is_active?: boolean
          organization_id?: string
          retry_policy?: Json
          secret_key_ref?: string | null
          signing_enabled?: boolean
          updated_at?: string
          webhook_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "edp_webhooks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edp_webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_age_preferences: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          max_age: number
          min_age: number
          notes: string | null
          preference_level: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          max_age: number
          min_age: number
          notes?: string | null
          preference_level?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          max_age?: number
          min_age?: number
          notes?: string | null
          preference_level?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_age_preferences_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_availability: {
        Row: {
          created_at: string
          day_of_week: number
          effective_from: string | null
          effective_to: string | null
          employee_id: string
          end_time: string
          id: string
          is_available: boolean
          notes: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          effective_from?: string | null
          effective_to?: string | null
          employee_id: string
          end_time: string
          id?: string
          is_available?: boolean
          notes?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          effective_from?: string | null
          effective_to?: string | null
          employee_id?: string
          end_time?: string
          id?: string
          is_available?: boolean
          notes?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_availability_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_certifications: {
        Row: {
          certification_name: string
          certification_number: string | null
          certification_type: string | null
          created_at: string
          document_path: string | null
          employee_id: string
          expiration_date: string | null
          id: string
          issued_date: string | null
          issuing_body: string | null
          status: string
          updated_at: string
        }
        Insert: {
          certification_name: string
          certification_number?: string | null
          certification_type?: string | null
          created_at?: string
          document_path?: string | null
          employee_id: string
          expiration_date?: string | null
          id?: string
          issued_date?: string | null
          issuing_body?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          certification_name?: string
          certification_number?: string | null
          certification_type?: string | null
          created_at?: string
          document_path?: string | null
          employee_id?: string
          expiration_date?: string | null
          id?: string
          issued_date?: string | null
          issuing_body?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_certifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          created_at: string
          document_type: string
          employee_id: string
          expires_at: string | null
          file_name: string
          id: string
          signature_id: string | null
          storage_path: string
          uploaded_by: string | null
          version_number: number
        }
        Insert: {
          created_at?: string
          document_type: string
          employee_id: string
          expires_at?: string | null
          file_name: string
          id?: string
          signature_id?: string | null
          storage_path: string
          uploaded_by?: string | null
          version_number?: number
        }
        Update: {
          created_at?: string
          document_type?: string
          employee_id?: string
          expires_at?: string | null
          file_name?: string
          id?: string
          signature_id?: string | null
          storage_path?: string
          uploaded_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_signature_id_fkey"
            columns: ["signature_id"]
            isOneToOne: false
            referencedRelation: "platform_digital_signatures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_positions: {
        Row: {
          created_at: string
          effective_from: string | null
          effective_to: string | null
          employee_id: string
          id: string
          is_primary: boolean
          position_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_from?: string | null
          effective_to?: string | null
          employee_id: string
          id?: string
          is_primary?: boolean
          position_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_from?: string | null
          effective_to?: string | null
          employee_id?: string
          id?: string
          is_primary?: boolean
          position_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_positions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_positions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_profiles: {
        Row: {
          bio: string | null
          campus_id: string | null
          certifications: Json
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          directory_sort_order: number
          directory_visible: boolean
          display_name: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id: string
          first_name: string | null
          id: string
          job_title: string | null
          last_name: string | null
          meet_link: string | null
          phone_extension: string | null
          photo_url: string | null
          specializations: string[] | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          campus_id?: string | null
          certifications?: Json
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          directory_sort_order?: number
          directory_visible?: boolean
          display_name?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id: string
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          meet_link?: string | null
          phone_extension?: string | null
          photo_url?: string | null
          specializations?: string[] | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          campus_id?: string | null
          certifications?: Json
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          directory_sort_order?: number
          directory_visible?: boolean
          display_name?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          meet_link?: string | null
          phone_extension?: string | null
          photo_url?: string | null
          specializations?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_profiles_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_service_history: {
        Row: {
          created_at: string
          description: string | null
          effective_date: string
          employee_id: string
          event_type: string
          id: string
          recorded_by: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          effective_date: string
          employee_id: string
          event_type: string
          id?: string
          recorded_by?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          effective_date?: string
          employee_id?: string
          event_type?: string
          id?: string
          recorded_by?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_service_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_service_history_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_time_entries: {
        Row: {
          approved_by: string | null
          clock_in: string | null
          clock_out: string | null
          created_at: string
          employee_id: string
          entry_date: string
          entry_type: string
          hours_worked: number | null
          id: string
          notes: string | null
          school_id: string
          status: string
        }
        Insert: {
          approved_by?: string | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          employee_id: string
          entry_date: string
          entry_type?: string
          hours_worked?: number | null
          id?: string
          notes?: string | null
          school_id: string
          status?: string
        }
        Update: {
          approved_by?: string | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          employee_id?: string
          entry_date?: string
          entry_type?: string
          hours_worked?: number | null
          id?: string
          notes?: string | null
          school_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_time_entries_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_time_entries_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_training_records: {
        Row: {
          certificate_path: string | null
          ceu_earned: number | null
          completed_at: string | null
          course_id: string | null
          course_title: string
          created_at: string
          employee_id: string
          id: string
          status: string
        }
        Insert: {
          certificate_path?: string | null
          ceu_earned?: number | null
          completed_at?: string | null
          course_id?: string | null
          course_title: string
          created_at?: string
          employee_id: string
          id?: string
          status?: string
        }
        Update: {
          certificate_path?: string | null
          ceu_earned?: number | null
          completed_at?: string | null
          course_id?: string | null
          course_title?: string
          created_at?: string
          employee_id?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_training_records_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "pd_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_training_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          department: string | null
          employee_number: string | null
          employee_type: string
          employment_status: string
          hire_date: string | null
          id: string
          program: string | null
          school_id: string
          separation_date: string | null
          supervisor_employee_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          employee_number?: string | null
          employee_type?: string
          employment_status?: string
          hire_date?: string | null
          id?: string
          program?: string | null
          school_id: string
          separation_date?: string | null
          supervisor_employee_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          employee_number?: string | null
          employee_type?: string
          employment_status?: string
          hire_date?: string | null
          id?: string
          program?: string | null
          school_id?: string
          separation_date?: string | null
          supervisor_employee_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_supervisor_employee_id_fkey"
            columns: ["supervisor_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_packet_signatures: {
        Row: {
          created_at: string
          enrollment_packet_id: string
          id: string
          signature_text: string
          signed_at: string
          signer_email: string
          signer_name: string
          template_key: string
        }
        Insert: {
          created_at?: string
          enrollment_packet_id: string
          id?: string
          signature_text: string
          signed_at?: string
          signer_email: string
          signer_name: string
          template_key: string
        }
        Update: {
          created_at?: string
          enrollment_packet_id?: string
          id?: string
          signature_text?: string
          signed_at?: string
          signer_email?: string
          signer_name?: string
          template_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_packet_signatures_enrollment_packet_id_fkey"
            columns: ["enrollment_packet_id"]
            isOneToOne: false
            referencedRelation: "enrollment_packets"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_packet_templates: {
        Row: {
          body_html: string
          created_at: string
          id: string
          is_active: boolean
          requires_signature: boolean
          school_id: string
          sort_order: number
          state_code: string | null
          template_key: string
          title: string
          updated_at: string
        }
        Insert: {
          body_html: string
          created_at?: string
          id?: string
          is_active?: boolean
          requires_signature?: boolean
          school_id: string
          sort_order?: number
          state_code?: string | null
          template_key: string
          title: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          created_at?: string
          id?: string
          is_active?: boolean
          requires_signature?: boolean
          school_id?: string
          sort_order?: number
          state_code?: string | null
          template_key?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_packet_templates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_packets: {
        Row: {
          application_id: string
          completed_at: string | null
          created_at: string
          generated_at: string
          id: string
          lead_id: string
          packet_status: string
          school_id: string
          updated_at: string
        }
        Insert: {
          application_id: string
          completed_at?: string | null
          created_at?: string
          generated_at?: string
          id?: string
          lead_id: string
          packet_status?: string
          school_id: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          completed_at?: string | null
          created_at?: string
          generated_at?: string
          id?: string
          lead_id?: string
          packet_status?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_packets_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "admissions_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_packets_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "admissions_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_packets_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          class_id: string | null
          enrolled_at: string | null
          id: string
          student_id: string | null
        }
        Insert: {
          class_id?: string | null
          enrolled_at?: string | null
          id?: string
          student_id?: string | null
        }
        Update: {
          class_id?: string | null
          enrolled_at?: string | null
          id?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_compliance_requirements: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          evidence_path: string | null
          id: string
          owner_user_id: string | null
          regulatory_body: string | null
          renewal_date: string | null
          requirement_type: string
          school_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          evidence_path?: string | null
          id?: string
          owner_user_id?: string | null
          regulatory_body?: string | null
          renewal_date?: string | null
          requirement_type: string
          school_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          evidence_path?: string | null
          id?: string
          owner_user_id?: string | null
          regulatory_body?: string | null
          renewal_date?: string | null
          requirement_type?: string
          school_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "executive_compliance_requirements_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_compliance_requirements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_dashboard_layouts: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          layout_name: string
          role_scope: string | null
          updated_at: string
          user_id: string
          widgets: Json
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          layout_name?: string
          role_scope?: string | null
          updated_at?: string
          user_id: string
          widgets?: Json
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          layout_name?: string
          role_scope?: string | null
          updated_at?: string
          user_id?: string
          widgets?: Json
        }
        Relationships: [
          {
            foreignKeyName: "executive_dashboard_layouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_forecast_scenarios: {
        Row: {
          assumptions: Json
          created_at: string
          created_by: string | null
          forecast_capacity: number | null
          forecast_enrollment: number | null
          forecast_payroll: number | null
          forecast_scholarships: number | null
          forecast_staffing: number | null
          forecast_state_funding: number | null
          forecast_tuition: number | null
          id: string
          scenario_name: string
          scenario_type: string
          school_id: string
          updated_at: string
        }
        Insert: {
          assumptions?: Json
          created_at?: string
          created_by?: string | null
          forecast_capacity?: number | null
          forecast_enrollment?: number | null
          forecast_payroll?: number | null
          forecast_scholarships?: number | null
          forecast_staffing?: number | null
          forecast_state_funding?: number | null
          forecast_tuition?: number | null
          id?: string
          scenario_name: string
          scenario_type?: string
          school_id: string
          updated_at?: string
        }
        Update: {
          assumptions?: Json
          created_at?: string
          created_by?: string | null
          forecast_capacity?: number | null
          forecast_enrollment?: number | null
          forecast_payroll?: number | null
          forecast_scholarships?: number | null
          forecast_staffing?: number | null
          forecast_state_funding?: number | null
          forecast_tuition?: number | null
          id?: string
          scenario_name?: string
          scenario_type?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "executive_forecast_scenarios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_forecast_scenarios_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_grants: {
        Row: {
          award_amount: number | null
          campaign_name: string | null
          created_at: string
          donor_name: string | null
          funder_name: string | null
          grant_name: string
          id: string
          notes: string | null
          pipeline_stage: string
          reporting_deadline: string | null
          restricted_fund: boolean
          school_id: string | null
          spent_amount: number
          updated_at: string
        }
        Insert: {
          award_amount?: number | null
          campaign_name?: string | null
          created_at?: string
          donor_name?: string | null
          funder_name?: string | null
          grant_name: string
          id?: string
          notes?: string | null
          pipeline_stage?: string
          reporting_deadline?: string | null
          restricted_fund?: boolean
          school_id?: string | null
          spent_amount?: number
          updated_at?: string
        }
        Update: {
          award_amount?: number | null
          campaign_name?: string | null
          created_at?: string
          donor_name?: string | null
          funder_name?: string | null
          grant_name?: string
          id?: string
          notes?: string | null
          pipeline_stage?: string
          reporting_deadline?: string | null
          restricted_fund?: boolean
          school_id?: string | null
          spent_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "executive_grants_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_insights: {
        Row: {
          body: string
          comparison_value: number | null
          created_at: string
          dismissed_at: string | null
          dismissed_by: string | null
          entity_id: string | null
          entity_type: string | null
          expires_at: string | null
          href: string | null
          id: string
          insight_type: string
          is_dismissed: boolean
          metric_key: string | null
          metric_value: number | null
          recommended_action: string | null
          school_id: string | null
          severity: string
          title: string
        }
        Insert: {
          body: string
          comparison_value?: number | null
          created_at?: string
          dismissed_at?: string | null
          dismissed_by?: string | null
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          href?: string | null
          id?: string
          insight_type: string
          is_dismissed?: boolean
          metric_key?: string | null
          metric_value?: number | null
          recommended_action?: string | null
          school_id?: string | null
          severity?: string
          title: string
        }
        Update: {
          body?: string
          comparison_value?: number | null
          created_at?: string
          dismissed_at?: string | null
          dismissed_by?: string | null
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          href?: string | null
          id?: string
          insight_type?: string
          is_dismissed?: boolean
          metric_key?: string | null
          metric_value?: number | null
          recommended_action?: string | null
          school_id?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "executive_insights_dismissed_by_fkey"
            columns: ["dismissed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_insights_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_kpi_definitions: {
        Row: {
          category: string
          created_at: string
          critical_threshold: number | null
          data_source: string
          display_name: string
          higher_is_better: boolean
          id: string
          is_active: boolean
          kpi_key: string
          sort_order: number
          target_value: number | null
          unit: string
          warning_threshold: number | null
        }
        Insert: {
          category?: string
          created_at?: string
          critical_threshold?: number | null
          data_source?: string
          display_name: string
          higher_is_better?: boolean
          id?: string
          is_active?: boolean
          kpi_key: string
          sort_order?: number
          target_value?: number | null
          unit?: string
          warning_threshold?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          critical_threshold?: number | null
          data_source?: string
          display_name?: string
          higher_is_better?: boolean
          id?: string
          is_active?: boolean
          kpi_key?: string
          sort_order?: number
          target_value?: number | null
          unit?: string
          warning_threshold?: number | null
        }
        Relationships: []
      }
      executive_kpi_snapshots: {
        Row: {
          actual_value: number | null
          campus_id: string | null
          capture_mode: string
          captured_at: string
          confidence: string | null
          created_at: string
          id: string
          kpi_key: string
          metadata: Json
          metric_name: string | null
          organization_id: string | null
          prior_period_value: number | null
          program: string | null
          region_id: string | null
          school_id: string | null
          snapshot_date: string
          source: string | null
          status: string | null
          target_value: number | null
          trend_direction: string | null
          trend_pct: number | null
        }
        Insert: {
          actual_value?: number | null
          campus_id?: string | null
          capture_mode?: string
          captured_at?: string
          confidence?: string | null
          created_at?: string
          id?: string
          kpi_key: string
          metadata?: Json
          metric_name?: string | null
          organization_id?: string | null
          prior_period_value?: number | null
          program?: string | null
          region_id?: string | null
          school_id?: string | null
          snapshot_date: string
          source?: string | null
          status?: string | null
          target_value?: number | null
          trend_direction?: string | null
          trend_pct?: number | null
        }
        Update: {
          actual_value?: number | null
          campus_id?: string | null
          capture_mode?: string
          captured_at?: string
          confidence?: string | null
          created_at?: string
          id?: string
          kpi_key?: string
          metadata?: Json
          metric_name?: string | null
          organization_id?: string | null
          prior_period_value?: number | null
          program?: string | null
          region_id?: string | null
          school_id?: string | null
          snapshot_date?: string
          source?: string | null
          status?: string | null
          target_value?: number | null
          trend_direction?: string | null
          trend_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "executive_kpi_snapshots_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_kpi_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_kpi_snapshots_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "org_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_kpi_snapshots_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_report_runs: {
        Row: {
          created_at: string
          export_format: string
          id: string
          row_count: number | null
          run_by: string | null
          school_id: string | null
          status: string
          storage_path: string | null
          template_id: string | null
        }
        Insert: {
          created_at?: string
          export_format?: string
          id?: string
          row_count?: number | null
          run_by?: string | null
          school_id?: string | null
          status?: string
          storage_path?: string | null
          template_id?: string | null
        }
        Update: {
          created_at?: string
          export_format?: string
          id?: string
          row_count?: number | null
          run_by?: string | null
          school_id?: string | null
          status?: string
          storage_path?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "executive_report_runs_run_by_fkey"
            columns: ["run_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_report_runs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_report_runs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "executive_report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_report_templates: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          description: string | null
          export_formats: string[]
          id: string
          is_active: boolean
          name: string
          report_type: string
          schedule_cron: string | null
          school_id: string | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          export_formats?: string[]
          id?: string
          is_active?: boolean
          name: string
          report_type?: string
          schedule_cron?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          export_formats?: string[]
          id?: string
          is_active?: boolean
          name?: string
          report_type?: string
          schedule_cron?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "executive_report_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_report_templates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_risk_register: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          impact: string
          likelihood: string
          owner_user_id: string | null
          recommended_action: string | null
          resolved_at: string | null
          risk_category: string
          risk_score: number
          school_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          impact?: string
          likelihood?: string
          owner_user_id?: string | null
          recommended_action?: string | null
          resolved_at?: string | null
          risk_category: string
          risk_score?: number
          school_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          impact?: string
          likelihood?: string
          owner_user_id?: string | null
          recommended_action?: string | null
          resolved_at?: string | null
          risk_category?: string
          risk_score?: number
          school_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "executive_risk_register_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_risk_register_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_strategic_goals: {
        Row: {
          budget_amount: number | null
          created_at: string
          description: string | null
          goal_type: string
          id: string
          linked_kpi_key: string | null
          owner_user_id: string | null
          progress_pct: number
          school_id: string | null
          status: string
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          budget_amount?: number | null
          created_at?: string
          description?: string | null
          goal_type?: string
          id?: string
          linked_kpi_key?: string | null
          owner_user_id?: string | null
          progress_pct?: number
          school_id?: string | null
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          budget_amount?: number | null
          created_at?: string
          description?: string | null
          goal_type?: string
          id?: string
          linked_kpi_key?: string | null
          owner_user_id?: string | null
          progress_pct?: number
          school_id?: string | null
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "executive_strategic_goals_linked_kpi_key_fkey"
            columns: ["linked_kpi_key"]
            isOneToOne: false
            referencedRelation: "executive_kpi_definitions"
            referencedColumns: ["kpi_key"]
          },
          {
            foreignKeyName: "executive_strategic_goals_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_strategic_goals_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_strategic_initiatives: {
        Row: {
          budget_amount: number | null
          created_at: string
          description: string | null
          end_date: string | null
          goal_id: string
          id: string
          linked_kpi_key: string | null
          owner_user_id: string | null
          progress_pct: number
          school_id: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          budget_amount?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          goal_id: string
          id?: string
          linked_kpi_key?: string | null
          owner_user_id?: string | null
          progress_pct?: number
          school_id?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          budget_amount?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          goal_id?: string
          id?: string
          linked_kpi_key?: string | null
          owner_user_id?: string | null
          progress_pct?: number
          school_id?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "executive_strategic_initiatives_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "executive_strategic_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_strategic_initiatives_linked_kpi_key_fkey"
            columns: ["linked_kpi_key"]
            isOneToOne: false
            referencedRelation: "executive_kpi_definitions"
            referencedColumns: ["kpi_key"]
          },
          {
            foreignKeyName: "executive_strategic_initiatives_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_strategic_initiatives_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_strategic_milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          due_date: string | null
          id: string
          initiative_id: string
          status: string
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          initiative_id: string
          status?: string
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          initiative_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "executive_strategic_milestones_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "executive_strategic_initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          billing_email: string | null
          billing_phone: string | null
          city: string | null
          created_at: string
          family_name: string
          id: string
          primary_address: string | null
          school_id: string
          state: string | null
          status: string
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          billing_email?: string | null
          billing_phone?: string | null
          city?: string | null
          created_at?: string
          family_name: string
          id?: string
          primary_address?: string | null
          school_id: string
          state?: string | null
          status?: string
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          billing_email?: string | null
          billing_phone?: string | null
          city?: string | null
          created_at?: string
          family_name?: string
          id?: string
          primary_address?: string | null
          school_id?: string
          state?: string | null
          status?: string
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "families_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      family_autopay_enrollments: {
        Row: {
          billing_account_id: string
          cancelled_at: string | null
          created_at: string
          day_of_month: number | null
          enrolled_at: string
          id: string
          payment_method_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          billing_account_id: string
          cancelled_at?: string | null
          created_at?: string
          day_of_month?: number | null
          enrolled_at?: string
          id?: string
          payment_method_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          billing_account_id?: string
          cancelled_at?: string | null
          created_at?: string
          day_of_month?: number | null
          enrolled_at?: string
          id?: string
          payment_method_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_autopay_enrollments_billing_account_id_fkey"
            columns: ["billing_account_id"]
            isOneToOne: false
            referencedRelation: "family_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_autopay_enrollments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "family_payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      family_billing_accounts: {
        Row: {
          account_status: string
          autopay_enabled: boolean
          balance: number
          collections_status: string
          created_at: string
          credit_balance: number
          custody_billing_notes: string | null
          family_id: string
          id: string
          payment_plan_id: string | null
          school_id: string
          sibling_discount_percent: number
          sibling_discount_student_id: string | null
          updated_at: string
        }
        Insert: {
          account_status?: string
          autopay_enabled?: boolean
          balance?: number
          collections_status?: string
          created_at?: string
          credit_balance?: number
          custody_billing_notes?: string | null
          family_id: string
          id?: string
          payment_plan_id?: string | null
          school_id: string
          sibling_discount_percent?: number
          sibling_discount_student_id?: string | null
          updated_at?: string
        }
        Update: {
          account_status?: string
          autopay_enabled?: boolean
          balance?: number
          collections_status?: string
          created_at?: string
          credit_balance?: number
          custody_billing_notes?: string | null
          family_id?: string
          id?: string
          payment_plan_id?: string | null
          school_id?: string
          sibling_discount_percent?: number
          sibling_discount_student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_billing_accounts_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: true
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_billing_accounts_payment_plan_id_fkey"
            columns: ["payment_plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_billing_accounts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_billing_accounts_sibling_discount_student_id_fkey"
            columns: ["sibling_discount_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      family_billing_payers: {
        Row: {
          billing_account_id: string
          created_at: string
          custody_basis: string | null
          guardian_id: string | null
          id: string
          is_active: boolean
          is_primary: boolean
          payer_email: string | null
          payer_name: string
          responsibility_percent: number
          updated_at: string
        }
        Insert: {
          billing_account_id: string
          created_at?: string
          custody_basis?: string | null
          guardian_id?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          payer_email?: string | null
          payer_name: string
          responsibility_percent?: number
          updated_at?: string
        }
        Update: {
          billing_account_id?: string
          created_at?: string
          custody_basis?: string | null
          guardian_id?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          payer_email?: string | null
          payer_name?: string
          responsibility_percent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_billing_payers_billing_account_id_fkey"
            columns: ["billing_account_id"]
            isOneToOne: false
            referencedRelation: "family_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_billing_payers_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
        ]
      }
      family_households: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          family_id: string
          id: string
          is_primary: boolean
          label: string
          state: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          family_id: string
          id?: string
          is_primary?: boolean
          label: string
          state?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          family_id?: string
          id?: string
          is_primary?: boolean
          label?: string
          state?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_households_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_payment_methods: {
        Row: {
          billing_account_id: string
          created_at: string
          exp_month: number | null
          exp_year: number | null
          external_token_ref: string | null
          guardian_id: string | null
          id: string
          is_active: boolean
          is_default: boolean
          last_four: string | null
          method_type: string
          provider: string
          updated_at: string
        }
        Insert: {
          billing_account_id: string
          created_at?: string
          exp_month?: number | null
          exp_year?: number | null
          external_token_ref?: string | null
          guardian_id?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          last_four?: string | null
          method_type: string
          provider?: string
          updated_at?: string
        }
        Update: {
          billing_account_id?: string
          created_at?: string
          exp_month?: number | null
          exp_year?: number | null
          external_token_ref?: string | null
          guardian_id?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          last_four?: string | null
          method_type?: string
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_payment_methods_billing_account_id_fkey"
            columns: ["billing_account_id"]
            isOneToOne: false
            referencedRelation: "family_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_payment_methods_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
        ]
      }
      fi_allocation_rules: {
        Row: {
          allocation_method: string
          allocation_pct: number
          category: string
          created_at: string
          effective_from: string
          effective_to: string | null
          fixed_amount: number | null
          id: string
          is_active: boolean
          metadata: Json
          name: string
          rule_key: string
          school_id: string | null
        }
        Insert: {
          allocation_method?: string
          allocation_pct?: number
          category: string
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          rule_key: string
          school_id?: string | null
        }
        Update: {
          allocation_method?: string
          allocation_pct?: number
          category?: string
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          rule_key?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fi_allocation_rules_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fi_break_even_snapshots: {
        Row: {
          available_seats: number | null
          created_at: string
          current_enrollment: number | null
          entity_id: string | null
          entity_key: string | null
          entity_type: string
          id: string
          is_overstaffed: boolean
          is_underperforming: boolean
          max_profitability_students: number | null
          metrics: Json
          minimum_students: number | null
          optimal_students: number | null
          school_id: string
          snapshot_date: string
          unused_capacity_hours: number | null
        }
        Insert: {
          available_seats?: number | null
          created_at?: string
          current_enrollment?: number | null
          entity_id?: string | null
          entity_key?: string | null
          entity_type: string
          id?: string
          is_overstaffed?: boolean
          is_underperforming?: boolean
          max_profitability_students?: number | null
          metrics?: Json
          minimum_students?: number | null
          optimal_students?: number | null
          school_id: string
          snapshot_date?: string
          unused_capacity_hours?: number | null
        }
        Update: {
          available_seats?: number | null
          created_at?: string
          current_enrollment?: number | null
          entity_id?: string | null
          entity_key?: string | null
          entity_type?: string
          id?: string
          is_overstaffed?: boolean
          is_underperforming?: boolean
          max_profitability_students?: number | null
          metrics?: Json
          minimum_students?: number | null
          optimal_students?: number | null
          school_id?: string
          snapshot_date?: string
          unused_capacity_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fi_break_even_snapshots_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fi_external_accounts: {
        Row: {
          account_name: string
          account_number: string | null
          account_type: string | null
          created_at: string
          external_account_id: string | null
          id: string
          import_batch_id: string | null
          is_active: boolean
          metadata: Json
          parent_account: string | null
          school_id: string | null
          source_system: string
        }
        Insert: {
          account_name: string
          account_number?: string | null
          account_type?: string | null
          created_at?: string
          external_account_id?: string | null
          id?: string
          import_batch_id?: string | null
          is_active?: boolean
          metadata?: Json
          parent_account?: string | null
          school_id?: string | null
          source_system?: string
        }
        Update: {
          account_name?: string
          account_number?: string | null
          account_type?: string | null
          created_at?: string
          external_account_id?: string | null
          id?: string
          import_batch_id?: string | null
          is_active?: boolean
          metadata?: Json
          parent_account?: string | null
          school_id?: string | null
          source_system?: string
        }
        Relationships: [
          {
            foreignKeyName: "fi_external_accounts_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "fi_import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fi_external_accounts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fi_external_transactions: {
        Row: {
          account_name: string | null
          account_number: string | null
          amount: number
          class_name: string | null
          created_at: string
          credit_amount: number
          customer_name: string | null
          debit_amount: number
          description: string | null
          external_transaction_id: string | null
          id: string
          import_batch_id: string | null
          location_name: string | null
          matched_entity_id: string | null
          matched_entity_type: string | null
          metadata: Json
          reconciliation_status: string
          school_id: string | null
          source_system: string
          transaction_date: string
          vendor_name: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          amount?: number
          class_name?: string | null
          created_at?: string
          credit_amount?: number
          customer_name?: string | null
          debit_amount?: number
          description?: string | null
          external_transaction_id?: string | null
          id?: string
          import_batch_id?: string | null
          location_name?: string | null
          matched_entity_id?: string | null
          matched_entity_type?: string | null
          metadata?: Json
          reconciliation_status?: string
          school_id?: string | null
          source_system?: string
          transaction_date: string
          vendor_name?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          amount?: number
          class_name?: string | null
          created_at?: string
          credit_amount?: number
          customer_name?: string | null
          debit_amount?: number
          description?: string | null
          external_transaction_id?: string | null
          id?: string
          import_batch_id?: string | null
          location_name?: string | null
          matched_entity_id?: string | null
          matched_entity_type?: string | null
          metadata?: Json
          reconciliation_status?: string
          school_id?: string | null
          source_system?: string
          transaction_date?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fi_external_transactions_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "fi_import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fi_external_transactions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fi_financial_alerts: {
        Row: {
          alert_type: string
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_resolved: boolean
          mission_control_item_id: string | null
          resolved_at: string | null
          school_id: string | null
          severity: string
          title: string
        }
        Insert: {
          alert_type: string
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_resolved?: boolean
          mission_control_item_id?: string | null
          resolved_at?: string | null
          school_id?: string | null
          severity?: string
          title: string
        }
        Update: {
          alert_type?: string
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_resolved?: boolean
          mission_control_item_id?: string | null
          resolved_at?: string | null
          school_id?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fi_financial_alerts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fi_import_batches: {
        Row: {
          error_message: string | null
          file_format: string | null
          file_name: string | null
          id: string
          import_type: string
          imported_at: string
          imported_by: string | null
          metadata: Json
          row_count: number
          school_id: string | null
          source_system: string
          status: string
        }
        Insert: {
          error_message?: string | null
          file_format?: string | null
          file_name?: string | null
          id?: string
          import_type: string
          imported_at?: string
          imported_by?: string | null
          metadata?: Json
          row_count?: number
          school_id?: string | null
          source_system?: string
          status?: string
        }
        Update: {
          error_message?: string | null
          file_format?: string | null
          file_name?: string | null
          id?: string
          import_type?: string
          imported_at?: string
          imported_by?: string | null
          metadata?: Json
          row_count?: number
          school_id?: string | null
          source_system?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fi_import_batches_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fi_import_batches_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fi_profitability_snapshots: {
        Row: {
          break_even_enrollment: number | null
          capacity: number | null
          computed_at: string
          contribution_margin: number
          cost_per_hour: number | null
          cost_per_seat: number | null
          ebitda_contribution: number | null
          enrollment_count: number | null
          entity_id: string | null
          entity_key: string | null
          entity_type: string
          gross_margin: number
          health_indicator: string
          id: string
          instructional_hours: number | null
          margin_pct: number
          metrics: Json
          net_margin: number
          period_end: string
          period_start: string
          period_type: string
          profit_per_hour: number | null
          profit_per_seat: number | null
          revenue: number
          revenue_per_hour: number | null
          revenue_per_seat: number | null
          school_id: string | null
          total_cost: number
        }
        Insert: {
          break_even_enrollment?: number | null
          capacity?: number | null
          computed_at?: string
          contribution_margin?: number
          cost_per_hour?: number | null
          cost_per_seat?: number | null
          ebitda_contribution?: number | null
          enrollment_count?: number | null
          entity_id?: string | null
          entity_key?: string | null
          entity_type: string
          gross_margin?: number
          health_indicator?: string
          id?: string
          instructional_hours?: number | null
          margin_pct?: number
          metrics?: Json
          net_margin?: number
          period_end: string
          period_start: string
          period_type?: string
          profit_per_hour?: number | null
          profit_per_seat?: number | null
          revenue?: number
          revenue_per_hour?: number | null
          revenue_per_seat?: number | null
          school_id?: string | null
          total_cost?: number
        }
        Update: {
          break_even_enrollment?: number | null
          capacity?: number | null
          computed_at?: string
          contribution_margin?: number
          cost_per_hour?: number | null
          cost_per_seat?: number | null
          ebitda_contribution?: number | null
          enrollment_count?: number | null
          entity_id?: string | null
          entity_key?: string | null
          entity_type?: string
          gross_margin?: number
          health_indicator?: string
          id?: string
          instructional_hours?: number | null
          margin_pct?: number
          metrics?: Json
          net_margin?: number
          period_end?: string
          period_start?: string
          period_type?: string
          profit_per_hour?: number | null
          profit_per_seat?: number | null
          revenue?: number
          revenue_per_hour?: number | null
          revenue_per_seat?: number | null
          school_id?: string | null
          total_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "fi_profitability_snapshots_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fi_scenario_results: {
        Row: {
          computed_at: string
          delta_ebitda: number
          delta_revenue: number
          id: string
          outputs: Json
          projected_cash_flow: number
          projected_ebitda: number
          projected_expenses: number
          projected_margin_pct: number
          projected_payroll: number
          projected_revenue: number
          scenario_id: string
        }
        Insert: {
          computed_at?: string
          delta_ebitda?: number
          delta_revenue?: number
          id?: string
          outputs?: Json
          projected_cash_flow?: number
          projected_ebitda?: number
          projected_expenses?: number
          projected_margin_pct?: number
          projected_payroll?: number
          projected_revenue?: number
          scenario_id: string
        }
        Update: {
          computed_at?: string
          delta_ebitda?: number
          delta_revenue?: number
          id?: string
          outputs?: Json
          projected_cash_flow?: number
          projected_ebitda?: number
          projected_expenses?: number
          projected_margin_pct?: number
          projected_payroll?: number
          projected_revenue?: number
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fi_scenario_results_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "fi_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      fi_scenarios: {
        Row: {
          baseline_period_end: string | null
          baseline_period_start: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          inputs: Json
          name: string
          scenario_type: string
          school_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          baseline_period_end?: string | null
          baseline_period_start?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          inputs?: Json
          name: string
          scenario_type?: string
          school_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          baseline_period_end?: string | null
          baseline_period_start?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          inputs?: Json
          name?: string
          scenario_type?: string
          school_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fi_scenarios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fi_scenarios_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          approval_status: string
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          entity_id: string | null
          entity_type: string | null
          family_id: string | null
          funding_source_code: string | null
          id: string
          invoice_id: string | null
          metadata: Json
          payment_id: string | null
          program: string | null
          scholarship_application_id: string | null
          school_id: string
          source_module: string
          student_id: string | null
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount: number
          approval_status?: string
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          family_id?: string | null
          funding_source_code?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json
          payment_id?: string | null
          program?: string | null
          scholarship_application_id?: string | null
          school_id: string
          source_module: string
          student_id?: string | null
          transaction_date?: string
          transaction_type: string
        }
        Update: {
          amount?: number
          approval_status?: string
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          family_id?: string | null
          funding_source_code?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json
          payment_id?: string | null
          program?: string | null
          scholarship_application_id?: string | null
          school_id?: string
          source_module?: string
          student_id?: string | null
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_scholarship_application_id_fkey"
            columns: ["scholarship_application_id"]
            isOneToOne: false
            referencedRelation: "scholarship_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_program_catalog: {
        Row: {
          created_at: string
          export_format: string
          funding_agency: string
          id: string
          is_active: boolean
          maximum_award: number | null
          payment_schedule: string
          program_code: string
          program_name: string
          renewal_rules: string | null
          required_documents: Json
          school_id: string | null
          state_code: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          export_format?: string
          funding_agency: string
          id?: string
          is_active?: boolean
          maximum_award?: number | null
          payment_schedule?: string
          program_code: string
          program_name: string
          renewal_rules?: string | null
          required_documents?: Json
          school_id?: string | null
          state_code: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          export_format?: string
          funding_agency?: string
          id?: string
          is_active?: boolean
          maximum_award?: number | null
          payment_schedule?: string
          program_code?: string
          program_name?: string
          renewal_rules?: string | null
          required_documents?: Json
          school_id?: string | null
          state_code?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funding_program_catalog_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_sources: {
        Row: {
          code: string
          funding_source_category: string
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          code: string
          funding_source_category: string
          id?: string
          label: string
          sort_order?: number
        }
        Update: {
          code?: string
          funding_source_category?: string
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      guardians: {
        Row: {
          can_pick_up: boolean
          communication_preferences: Json
          contact_type: string
          created_at: string
          custody_status: string | null
          email: string | null
          family_id: string
          financial_responsibility_percent: number | null
          first_name: string
          household_id: string | null
          household_label: string | null
          id: string
          is_emergency_contact: boolean
          is_primary: boolean
          is_transportation_contact: boolean
          last_name: string
          legal_restrictions: string | null
          phone: string | null
          receives_billing: boolean
          receives_communications: boolean
          relationship_to_student: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          can_pick_up?: boolean
          communication_preferences?: Json
          contact_type?: string
          created_at?: string
          custody_status?: string | null
          email?: string | null
          family_id: string
          financial_responsibility_percent?: number | null
          first_name: string
          household_id?: string | null
          household_label?: string | null
          id?: string
          is_emergency_contact?: boolean
          is_primary?: boolean
          is_transportation_contact?: boolean
          last_name: string
          legal_restrictions?: string | null
          phone?: string | null
          receives_billing?: boolean
          receives_communications?: boolean
          relationship_to_student?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          can_pick_up?: boolean
          communication_preferences?: Json
          contact_type?: string
          created_at?: string
          custody_status?: string | null
          email?: string | null
          family_id?: string
          financial_responsibility_percent?: number | null
          first_name?: string
          household_id?: string | null
          household_label?: string | null
          id?: string
          is_emergency_contact?: boolean
          is_primary?: boolean
          is_transportation_contact?: boolean
          last_name?: string
          legal_restrictions?: string | null
          phone?: string | null
          receives_billing?: boolean
          receives_communications?: boolean
          relationship_to_student?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guardians_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardians_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "family_households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardians_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_candidate_interviews: {
        Row: {
          application_id: string
          created_at: string
          id: string
          interview_type: string
          interviewer_user_id: string | null
          location_or_link: string | null
          notes: string | null
          scheduled_at: string
          status: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          interview_type?: string
          interviewer_user_id?: string | null
          location_or_link?: string | null
          notes?: string | null
          scheduled_at: string
          status?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          interview_type?: string
          interviewer_user_id?: string | null
          location_or_link?: string | null
          notes?: string | null
          scheduled_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_candidate_interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "hr_job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_candidate_interviews_interviewer_user_id_fkey"
            columns: ["interviewer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_job_applications: {
        Row: {
          background_check_status: string | null
          candidate_email: string
          candidate_name: string
          candidate_phone: string | null
          created_at: string
          hired_employee_id: string | null
          id: string
          job_posting_id: string
          notes: string | null
          offer_letter_path: string | null
          pipeline_stage: string
          reference_check_status: string | null
          resume_path: string | null
          updated_at: string
        }
        Insert: {
          background_check_status?: string | null
          candidate_email: string
          candidate_name: string
          candidate_phone?: string | null
          created_at?: string
          hired_employee_id?: string | null
          id?: string
          job_posting_id: string
          notes?: string | null
          offer_letter_path?: string | null
          pipeline_stage?: string
          reference_check_status?: string | null
          resume_path?: string | null
          updated_at?: string
        }
        Update: {
          background_check_status?: string | null
          candidate_email?: string
          candidate_name?: string
          candidate_phone?: string | null
          created_at?: string
          hired_employee_id?: string | null
          id?: string
          job_posting_id?: string
          notes?: string | null
          offer_letter_path?: string | null
          pipeline_stage?: string
          reference_check_status?: string | null
          resume_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_job_applications_hired_employee_id_fkey"
            columns: ["hired_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_job_applications_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "hr_job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_job_postings: {
        Row: {
          closes_at: string | null
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          employment_type: string
          id: string
          posted_at: string | null
          program: string | null
          requirements: string | null
          school_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          employment_type?: string
          id?: string
          posted_at?: string | null
          program?: string | null
          requirements?: string | null
          school_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          employment_type?: string
          id?: string
          posted_at?: string | null
          program?: string | null
          requirements?: string | null
          school_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_job_postings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_job_postings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_onboarding_tasks: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string
          due_date: string | null
          employee_id: string
          id: string
          requires_signature: boolean
          signature_id: string | null
          status: string
          task_key: string
          title: string
        }
        Insert: {
          category?: string
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          employee_id: string
          id?: string
          requires_signature?: boolean
          signature_id?: string | null
          status?: string
          task_key: string
          title: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          employee_id?: string
          id?: string
          requires_signature?: boolean
          signature_id?: string | null
          status?: string
          task_key?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_onboarding_tasks_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_onboarding_tasks_signature_id_fkey"
            columns: ["signature_id"]
            isOneToOne: false
            referencedRelation: "platform_digital_signatures"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_api_audit_log: {
        Row: {
          actor_id: string | null
          api_version: string
          auth_type: string | null
          created_at: string
          id: string
          latency_ms: number | null
          method: string
          organization_id: string | null
          path: string
          rate_limited: boolean
          request_id: string | null
          status_code: number | null
        }
        Insert: {
          actor_id?: string | null
          api_version?: string
          auth_type?: string | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          method: string
          organization_id?: string | null
          path: string
          rate_limited?: boolean
          request_id?: string | null
          status_code?: number | null
        }
        Update: {
          actor_id?: string | null
          api_version?: string
          auth_type?: string | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          method?: string
          organization_id?: string | null
          path?: string
          rate_limited?: boolean
          request_id?: string | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ihub_api_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ihub_api_audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_automation_runs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          organization_id: string
          started_at: string
          status: string
          step_results: Json
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          organization_id: string
          started_at?: string
          status?: string
          step_results?: Json
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          organization_id?: string
          started_at?: string
          status?: string
          step_results?: Json
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ihub_automation_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ihub_automation_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "ihub_automation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_automation_workflows: {
        Row: {
          analytics: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_template: boolean
          organization_id: string
          published_at: string | null
          status: string
          steps: Json
          trigger_type: string
          updated_at: string
          variables: Json
          version: number
          workflow_key: string
          workflow_name: string
        }
        Insert: {
          analytics?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_template?: boolean
          organization_id: string
          published_at?: string | null
          status?: string
          steps?: Json
          trigger_type?: string
          updated_at?: string
          variables?: Json
          version?: number
          workflow_key: string
          workflow_name: string
        }
        Update: {
          analytics?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_template?: boolean
          organization_id?: string
          published_at?: string | null
          status?: string
          steps?: Json
          trigger_type?: string
          updated_at?: string
          variables?: Json
          version?: number
          workflow_key?: string
          workflow_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ihub_automation_workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ihub_automation_workflows_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_command_center_snapshots: {
        Row: {
          api_health_pct: number
          avg_latency_ms: number
          bandwidth_usage_mb: number
          connector_health_pct: number
          daily_transactions: number
          dead_letter_count: number
          details: Json
          failure_pct: number
          historical_uptime_pct: number
          hourly_transactions: number
          id: string
          organization_id: string | null
          retry_queue_depth: number
          snapshot_at: string
          storage_usage_mb: number
          success_pct: number
          sync_queue_depth: number
          webhook_health_pct: number
        }
        Insert: {
          api_health_pct?: number
          avg_latency_ms?: number
          bandwidth_usage_mb?: number
          connector_health_pct?: number
          daily_transactions?: number
          dead_letter_count?: number
          details?: Json
          failure_pct?: number
          historical_uptime_pct?: number
          hourly_transactions?: number
          id?: string
          organization_id?: string | null
          retry_queue_depth?: number
          snapshot_at?: string
          storage_usage_mb?: number
          success_pct?: number
          sync_queue_depth?: number
          webhook_health_pct?: number
        }
        Update: {
          api_health_pct?: number
          avg_latency_ms?: number
          bandwidth_usage_mb?: number
          connector_health_pct?: number
          daily_transactions?: number
          dead_letter_count?: number
          details?: Json
          failure_pct?: number
          historical_uptime_pct?: number
          hourly_transactions?: number
          id?: string
          organization_id?: string | null
          retry_queue_depth?: number
          snapshot_at?: string
          storage_usage_mb?: number
          success_pct?: number
          sync_queue_depth?: number
          webhook_health_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "ihub_command_center_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_connector_certifications: {
        Row: {
          certification_status: string
          compatibility: Json
          connector_key: string
          health_rating: number
          id: string
          marketplace_rating: number
          performance_score: number
          reliability_score: number
          security_score: number
          support_status: string
          updated_at: string
          version: string
        }
        Insert: {
          certification_status?: string
          compatibility?: Json
          connector_key: string
          health_rating?: number
          id?: string
          marketplace_rating?: number
          performance_score?: number
          reliability_score?: number
          security_score?: number
          support_status?: string
          updated_at?: string
          version?: string
        }
        Update: {
          certification_status?: string
          compatibility?: Json
          connector_key?: string
          health_rating?: number
          id?: string
          marketplace_rating?: number
          performance_score?: number
          reliability_score?: number
          security_score?: number
          support_status?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "ihub_connector_certifications_connector_key_fkey"
            columns: ["connector_key"]
            isOneToOne: true
            referencedRelation: "edp_connector_definitions"
            referencedColumns: ["connector_key"]
          },
        ]
      }
      ihub_credential_vault: {
        Row: {
          created_at: string
          credential_type: string
          encrypted_ref: string
          expires_at: string | null
          id: string
          is_active: boolean
          last_rotated_at: string | null
          organization_id: string
          rotation_due_at: string | null
          scopes: Json
          vault_key: string
        }
        Insert: {
          created_at?: string
          credential_type: string
          encrypted_ref: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_rotated_at?: string | null
          organization_id: string
          rotation_due_at?: string | null
          scopes?: Json
          vault_key: string
        }
        Update: {
          created_at?: string
          credential_type?: string
          encrypted_ref?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_rotated_at?: string | null
          organization_id?: string
          rotation_due_at?: string | null
          scopes?: Json
          vault_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "ihub_credential_vault_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_custom_connectors: {
        Row: {
          config: Json
          connector_name: string
          created_at: string
          created_by: string | null
          field_mappings: Json
          id: string
          organization_id: string
          protocol: string
          status: string
        }
        Insert: {
          config?: Json
          connector_name: string
          created_at?: string
          created_by?: string | null
          field_mappings?: Json
          id?: string
          organization_id: string
          protocol: string
          status?: string
        }
        Update: {
          config?: Json
          connector_name?: string
          created_at?: string
          created_by?: string | null
          field_mappings?: Json
          id?: string
          organization_id?: string
          protocol?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ihub_custom_connectors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ihub_custom_connectors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_developer_apps: {
        Row: {
          app_name: string
          app_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          organization_id: string
          status: string
        }
        Insert: {
          app_name: string
          app_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id: string
          status?: string
        }
        Update: {
          app_name?: string
          app_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ihub_developer_apps_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ihub_developer_apps_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_dr_backups: {
        Row: {
          backup_type: string
          created_at: string
          id: string
          organization_id: string
          status: string
          storage_path: string | null
          verified_at: string | null
        }
        Insert: {
          backup_type?: string
          created_at?: string
          id?: string
          organization_id: string
          status?: string
          storage_path?: string | null
          verified_at?: string | null
        }
        Update: {
          backup_type?: string
          created_at?: string
          id?: string
          organization_id?: string
          status?: string
          storage_path?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ihub_dr_backups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_dr_drills: {
        Row: {
          completed_at: string | null
          created_at: string
          drill_type: string
          id: string
          organization_id: string
          results: Json
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          drill_type?: string
          id?: string
          organization_id: string
          results?: Json
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          drill_type?: string
          id?: string
          organization_id?: string
          results?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ihub_dr_drills_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_event_dead_letter: {
        Row: {
          created_at: string
          event_id: string | null
          event_type: string
          id: string
          organization_id: string | null
          reason: string | null
          replayable: boolean
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          event_type: string
          id?: string
          organization_id?: string | null
          reason?: string | null
          replayable?: boolean
        }
        Update: {
          created_at?: string
          event_id?: string | null
          event_type?: string
          id?: string
          organization_id?: string | null
          reason?: string | null
          replayable?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ihub_event_dead_letter_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ihub_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ihub_event_dead_letter_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_event_retention_policies: {
        Row: {
          created_at: string
          event_type: string | null
          id: string
          is_active: boolean
          organization_id: string
          retention_days: number
        }
        Insert: {
          created_at?: string
          event_type?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          retention_days?: number
        }
        Update: {
          created_at?: string
          event_type?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          retention_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "ihub_event_retention_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_event_subscriptions: {
        Row: {
          created_at: string
          event_types: Json
          id: string
          is_active: boolean
          organization_id: string
          subscription_name: string
          target_ref: string | null
          target_type: string
        }
        Insert: {
          created_at?: string
          event_types?: Json
          id?: string
          is_active?: boolean
          organization_id: string
          subscription_name: string
          target_ref?: string | null
          target_type: string
        }
        Update: {
          created_at?: string
          event_types?: Json
          id?: string
          is_active?: boolean
          organization_id?: string
          subscription_name?: string
          target_ref?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ihub_event_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_events: {
        Row: {
          correlation_id: string | null
          event_source: string
          event_type: string
          event_version: string
          id: string
          organization_id: string | null
          payload: Json
          published_at: string
          replayable: boolean
        }
        Insert: {
          correlation_id?: string | null
          event_source: string
          event_type: string
          event_version?: string
          id?: string
          organization_id?: string | null
          payload?: Json
          published_at?: string
          replayable?: boolean
        }
        Update: {
          correlation_id?: string | null
          event_source?: string
          event_type?: string
          event_version?: string
          id?: string
          organization_id?: string | null
          payload?: Json
          published_at?: string
          replayable?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ihub_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_executive_snapshots: {
        Row: {
          api_usage_count: number
          connected_systems: number
          connector_health_pct: number
          daily_transactions: number
          external_data_volume_mb: number
          failed_syncs: number
          id: string
          marketplace_revenue: number
          organization_id: string
          snapshot_date: string
          webhook_success_rate: number
        }
        Insert: {
          api_usage_count?: number
          connected_systems?: number
          connector_health_pct?: number
          daily_transactions?: number
          external_data_volume_mb?: number
          failed_syncs?: number
          id?: string
          marketplace_revenue?: number
          organization_id: string
          snapshot_date?: string
          webhook_success_rate?: number
        }
        Update: {
          api_usage_count?: number
          connected_systems?: number
          connector_health_pct?: number
          daily_transactions?: number
          external_data_volume_mb?: number
          failed_syncs?: number
          id?: string
          marketplace_revenue?: number
          organization_id?: string
          snapshot_date?: string
          webhook_success_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "ihub_executive_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_integration_registry: {
        Row: {
          connector_instance_id: string | null
          created_at: string
          id: string
          integration_key: string
          integration_name: string
          integration_type: string
          metadata: Json
          organization_id: string
          status: string
        }
        Insert: {
          connector_instance_id?: string | null
          created_at?: string
          id?: string
          integration_key: string
          integration_name: string
          integration_type: string
          metadata?: Json
          organization_id: string
          status?: string
        }
        Update: {
          connector_instance_id?: string | null
          created_at?: string
          id?: string
          integration_key?: string
          integration_name?: string
          integration_type?: string
          metadata?: Json
          organization_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ihub_integration_registry_connector_instance_id_fkey"
            columns: ["connector_instance_id"]
            isOneToOne: false
            referencedRelation: "edp_connector_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ihub_integration_registry_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_mapping_profiles: {
        Row: {
          connector_key: string | null
          created_at: string
          created_by: string | null
          default_values: Json
          edp_template_id: string | null
          field_mappings: Json
          id: string
          is_template: boolean
          organization_id: string
          profile_name: string
          source_entity: string
          target_entity: string
          transformations: Json
          updated_at: string
          validation_rules: Json
        }
        Insert: {
          connector_key?: string | null
          created_at?: string
          created_by?: string | null
          default_values?: Json
          edp_template_id?: string | null
          field_mappings?: Json
          id?: string
          is_template?: boolean
          organization_id: string
          profile_name: string
          source_entity: string
          target_entity: string
          transformations?: Json
          updated_at?: string
          validation_rules?: Json
        }
        Update: {
          connector_key?: string | null
          created_at?: string
          created_by?: string | null
          default_values?: Json
          edp_template_id?: string | null
          field_mappings?: Json
          id?: string
          is_template?: boolean
          organization_id?: string
          profile_name?: string
          source_entity?: string
          target_entity?: string
          transformations?: Json
          updated_at?: string
          validation_rules?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ihub_mapping_profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ihub_mapping_profiles_edp_template_id_fkey"
            columns: ["edp_template_id"]
            isOneToOne: false
            referencedRelation: "edp_mapping_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ihub_mapping_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_marketplace_listings: {
        Row: {
          approval_status: string
          average_rating: number
          certification_status: string
          connector_key: string | null
          created_at: string
          description: string | null
          id: string
          listing_key: string
          listing_name: string
          publisher_org_id: string | null
          revenue_share_pct: number
          version: string
        }
        Insert: {
          approval_status?: string
          average_rating?: number
          certification_status?: string
          connector_key?: string | null
          created_at?: string
          description?: string | null
          id?: string
          listing_key: string
          listing_name: string
          publisher_org_id?: string | null
          revenue_share_pct?: number
          version?: string
        }
        Update: {
          approval_status?: string
          average_rating?: number
          certification_status?: string
          connector_key?: string | null
          created_at?: string
          description?: string | null
          id?: string
          listing_key?: string
          listing_name?: string
          publisher_org_id?: string | null
          revenue_share_pct?: number
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "ihub_marketplace_listings_connector_key_fkey"
            columns: ["connector_key"]
            isOneToOne: false
            referencedRelation: "edp_connector_definitions"
            referencedColumns: ["connector_key"]
          },
          {
            foreignKeyName: "ihub_marketplace_listings_publisher_org_id_fkey"
            columns: ["publisher_org_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_marketplace_reviews: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          rating: number
          review_text: string | null
          reviewer_org_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          rating: number
          review_text?: string | null
          reviewer_org_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          rating?: number
          review_text?: string | null
          reviewer_org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ihub_marketplace_reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "ihub_marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ihub_marketplace_reviews_reviewer_org_id_fkey"
            columns: ["reviewer_org_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_monitoring_snapshots: {
        Row: {
          api_health_pct: number
          api_usage_count: number
          connector_health_pct: number
          details: Json
          id: string
          organization_id: string | null
          rate_limit_hits: number
          retry_count: number
          snapshot_at: string
          sync_failure_count: number
          sync_latency_ms: number | null
          webhook_failure_count: number
        }
        Insert: {
          api_health_pct?: number
          api_usage_count?: number
          connector_health_pct?: number
          details?: Json
          id?: string
          organization_id?: string | null
          rate_limit_hits?: number
          retry_count?: number
          snapshot_at?: string
          sync_failure_count?: number
          sync_latency_ms?: number | null
          webhook_failure_count?: number
        }
        Update: {
          api_health_pct?: number
          api_usage_count?: number
          connector_health_pct?: number
          details?: Json
          id?: string
          organization_id?: string | null
          rate_limit_hits?: number
          retry_count?: number
          snapshot_at?: string
          sync_failure_count?: number
          sync_latency_ms?: number | null
          webhook_failure_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "ihub_monitoring_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_oauth_clients: {
        Row: {
          api_version: string
          client_id: string
          client_name: string
          client_secret_hash: string
          created_at: string
          created_by: string | null
          grant_types: Json
          id: string
          is_active: boolean
          organization_id: string
          redirect_uris: Json
          scopes: Json
        }
        Insert: {
          api_version?: string
          client_id: string
          client_name: string
          client_secret_hash: string
          created_at?: string
          created_by?: string | null
          grant_types?: Json
          id?: string
          is_active?: boolean
          organization_id: string
          redirect_uris?: Json
          scopes?: Json
        }
        Update: {
          api_version?: string
          client_id?: string
          client_name?: string
          client_secret_hash?: string
          created_at?: string
          created_by?: string | null
          grant_types?: Json
          id?: string
          is_active?: boolean
          organization_id?: string
          redirect_uris?: Json
          scopes?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ihub_oauth_clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ihub_oauth_clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_provisioning_jobs: {
        Row: {
          cloud_provisioning_job_id: string | null
          completed_at: string | null
          config_package: string
          created_at: string
          created_by: string | null
          id: string
          include_demo_data: boolean
          modules_installed: Json
          organization_id: string | null
          started_at: string | null
          status: string
          steps_completed: Json
          tenant_name: string
        }
        Insert: {
          cloud_provisioning_job_id?: string | null
          completed_at?: string | null
          config_package?: string
          created_at?: string
          created_by?: string | null
          id?: string
          include_demo_data?: boolean
          modules_installed?: Json
          organization_id?: string | null
          started_at?: string | null
          status?: string
          steps_completed?: Json
          tenant_name: string
        }
        Update: {
          cloud_provisioning_job_id?: string | null
          completed_at?: string | null
          config_package?: string
          created_at?: string
          created_by?: string | null
          id?: string
          include_demo_data?: boolean
          modules_installed?: Json
          organization_id?: string | null
          started_at?: string | null
          status?: string
          steps_completed?: Json
          tenant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ihub_provisioning_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ihub_provisioning_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_sandbox_keys: {
        Row: {
          created_at: string
          developer_app_id: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_name: string
          key_prefix: string
          organization_id: string
          scopes: Json
        }
        Insert: {
          created_at?: string
          developer_app_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_name: string
          key_prefix: string
          organization_id: string
          scopes?: Json
        }
        Update: {
          created_at?: string
          developer_app_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_name?: string
          key_prefix?: string
          organization_id?: string
          scopes?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ihub_sandbox_keys_developer_app_id_fkey"
            columns: ["developer_app_id"]
            isOneToOne: false
            referencedRelation: "ihub_developer_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ihub_sandbox_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_sdk_packages: {
        Row: {
          architecture_notes: string | null
          download_url: string | null
          id: string
          language: string
          latest_version: string
          package_name: string
          sample_repo: string | null
          updated_at: string
        }
        Insert: {
          architecture_notes?: string | null
          download_url?: string | null
          id?: string
          language: string
          latest_version?: string
          package_name: string
          sample_repo?: string | null
          updated_at?: string
        }
        Update: {
          architecture_notes?: string | null
          download_url?: string | null
          id?: string
          language?: string
          latest_version?: string
          package_name?: string
          sample_repo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ihub_sync_conflicts: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string
          field_name: string
          id: string
          local_value: Json | null
          organization_id: string
          remote_value: Json | null
          resolution: string | null
          resolved_at: string | null
          sync_job_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type: string
          field_name: string
          id?: string
          local_value?: Json | null
          organization_id: string
          remote_value?: Json | null
          resolution?: string | null
          resolved_at?: string | null
          sync_job_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          field_name?: string
          id?: string
          local_value?: Json | null
          organization_id?: string
          remote_value?: Json | null
          resolution?: string | null
          resolved_at?: string | null
          sync_job_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ihub_sync_conflicts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ihub_sync_conflicts_sync_job_id_fkey"
            columns: ["sync_job_id"]
            isOneToOne: false
            referencedRelation: "edp_sync_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_sync_schedules: {
        Row: {
          connector_instance_id: string | null
          created_at: string
          cron_expression: string
          direction: string
          id: string
          is_active: boolean
          last_run_at: string | null
          organization_id: string
          schedule_name: string
          sync_mode: string
        }
        Insert: {
          connector_instance_id?: string | null
          created_at?: string
          cron_expression?: string
          direction?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          organization_id: string
          schedule_name: string
          sync_mode?: string
        }
        Update: {
          connector_instance_id?: string | null
          created_at?: string
          cron_expression?: string
          direction?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          organization_id?: string
          schedule_name?: string
          sync_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "ihub_sync_schedules_connector_instance_id_fkey"
            columns: ["connector_instance_id"]
            isOneToOne: false
            referencedRelation: "edp_connector_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ihub_sync_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_usage_metering: {
        Row: {
          api_calls: number
          automation_runs: number
          bandwidth_mb: number
          connector_executions: number
          forecast: Json
          id: string
          meter_date: string
          organization_id: string
          overages: Json
          storage_mb: number
          students_count: number
          subscription_limit: Json
          sync_jobs: number
          users_count: number
          webhook_calls: number
          workflow_runs: number
        }
        Insert: {
          api_calls?: number
          automation_runs?: number
          bandwidth_mb?: number
          connector_executions?: number
          forecast?: Json
          id?: string
          meter_date?: string
          organization_id: string
          overages?: Json
          storage_mb?: number
          students_count?: number
          subscription_limit?: Json
          sync_jobs?: number
          users_count?: number
          webhook_calls?: number
          workflow_runs?: number
        }
        Update: {
          api_calls?: number
          automation_runs?: number
          bandwidth_mb?: number
          connector_executions?: number
          forecast?: Json
          id?: string
          meter_date?: string
          organization_id?: string
          overages?: Json
          storage_mb?: number
          students_count?: number
          subscription_limit?: Json
          sync_jobs?: number
          users_count?: number
          webhook_calls?: number
          workflow_runs?: number
        }
        Relationships: [
          {
            foreignKeyName: "ihub_usage_metering_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ihub_webhook_dead_letter: {
        Row: {
          attempt_count: number
          created_at: string
          event_type: string
          failure_reason: string | null
          id: string
          organization_id: string | null
          payload: Json
          replayable: boolean
          webhook_id: string | null
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          event_type: string
          failure_reason?: string | null
          id?: string
          organization_id?: string | null
          payload?: Json
          replayable?: boolean
          webhook_id?: string | null
        }
        Update: {
          attempt_count?: number
          created_at?: string
          event_type?: string
          failure_reason?: string | null
          id?: string
          organization_id?: string | null
          payload?: Json
          replayable?: boolean
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ihub_webhook_dead_letter_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ihub_webhook_dead_letter_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "edp_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      instructional_session_deliveries: {
        Row: {
          activities: Json
          attachment_refs: Json
          completed_at: string | null
          completed_by: string | null
          created_at: string
          homework: string | null
          id: string
          instructional_session_id: string
          learning_targets: Json
          lesson_objectives: Json
          lesson_status: string
          session_notes: string | null
          standards: string[]
          started_at: string | null
          started_by: string | null
          updated_at: string
        }
        Insert: {
          activities?: Json
          attachment_refs?: Json
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          homework?: string | null
          id?: string
          instructional_session_id: string
          learning_targets?: Json
          lesson_objectives?: Json
          lesson_status?: string
          session_notes?: string | null
          standards?: string[]
          started_at?: string | null
          started_by?: string | null
          updated_at?: string
        }
        Update: {
          activities?: Json
          attachment_refs?: Json
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          homework?: string | null
          id?: string
          instructional_session_id?: string
          learning_targets?: Json
          lesson_objectives?: Json
          lesson_status?: string
          session_notes?: string | null
          standards?: string[]
          started_at?: string | null
          started_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructional_session_deliveries_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructional_session_deliveries_instructional_session_id_fkey"
            columns: ["instructional_session_id"]
            isOneToOne: true
            referencedRelation: "instructional_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructional_session_deliveries_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      instructional_session_outcomes: {
        Row: {
          created_at: string
          evidence_collected: Json
          follow_up_tasks: Json
          growth_goal_id: string | null
          homework_practice: string | null
          id: string
          instructional_session_id: string
          learning_objectives: Json
          mastery_level: string | null
          recommended_next_steps: string | null
          recorded_by: string | null
          skills_addressed: Json
          student_id: string | null
          student_response: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          evidence_collected?: Json
          follow_up_tasks?: Json
          growth_goal_id?: string | null
          homework_practice?: string | null
          id?: string
          instructional_session_id: string
          learning_objectives?: Json
          mastery_level?: string | null
          recommended_next_steps?: string | null
          recorded_by?: string | null
          skills_addressed?: Json
          student_id?: string | null
          student_response?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          evidence_collected?: Json
          follow_up_tasks?: Json
          growth_goal_id?: string | null
          homework_practice?: string | null
          id?: string
          instructional_session_id?: string
          learning_objectives?: Json
          mastery_level?: string | null
          recommended_next_steps?: string | null
          recorded_by?: string | null
          skills_addressed?: Json
          student_id?: string | null
          student_response?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructional_session_outcomes_growth_goal_id_fkey"
            columns: ["growth_goal_id"]
            isOneToOne: false
            referencedRelation: "student_growth_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructional_session_outcomes_instructional_session_id_fkey"
            columns: ["instructional_session_id"]
            isOneToOne: false
            referencedRelation: "instructional_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructional_session_outcomes_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructional_session_outcomes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      instructional_session_student_records: {
        Row: {
          assessment_result: Json
          behavior_observation: string | null
          created_at: string
          id: string
          instructional_session_id: string
          participation_level: string | null
          session_notes: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          assessment_result?: Json
          behavior_observation?: string | null
          created_at?: string
          id?: string
          instructional_session_id: string
          participation_level?: string | null
          session_notes?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          assessment_result?: Json
          behavior_observation?: string | null
          created_at?: string
          id?: string
          instructional_session_id?: string
          participation_level?: string | null
          session_notes?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructional_session_student_rec_instructional_session_id_fkey"
            columns: ["instructional_session_id"]
            isOneToOne: false
            referencedRelation: "instructional_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructional_session_student_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      instructional_sessions: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          attendance_notes: string | null
          campus_id: string | null
          cancellation_reason: string | null
          course_section_id: string
          created_at: string
          generation_run_id: string | null
          id: string
          instructor_employee_id: string
          meet_link: string | null
          payroll_processed: boolean | null
          rescheduled_from_id: string | null
          room_id: string | null
          scheduled_end: string
          scheduled_start: string
          session_completed: boolean | null
          session_status: string
          session_type: string
          student_count: number | null
          student_id: string | null
          therapy_service_type: string | null
          time_display: string | null
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          attendance_notes?: string | null
          campus_id?: string | null
          cancellation_reason?: string | null
          course_section_id: string
          created_at?: string
          generation_run_id?: string | null
          id?: string
          instructor_employee_id: string
          meet_link?: string | null
          payroll_processed?: boolean | null
          rescheduled_from_id?: string | null
          room_id?: string | null
          scheduled_end: string
          scheduled_start: string
          session_completed?: boolean | null
          session_status?: string
          session_type?: string
          student_count?: number | null
          student_id?: string | null
          therapy_service_type?: string | null
          time_display?: string | null
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          attendance_notes?: string | null
          campus_id?: string | null
          cancellation_reason?: string | null
          course_section_id?: string
          created_at?: string
          generation_run_id?: string | null
          id?: string
          instructor_employee_id?: string
          meet_link?: string | null
          payroll_processed?: boolean | null
          rescheduled_from_id?: string | null
          room_id?: string | null
          scheduled_end?: string
          scheduled_start?: string
          session_completed?: boolean | null
          session_status?: string
          session_type?: string
          student_count?: number | null
          student_id?: string | null
          therapy_service_type?: string | null
          time_display?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructional_sessions_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructional_sessions_course_section_id_fkey"
            columns: ["course_section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructional_sessions_generation_run_fk"
            columns: ["generation_run_id"]
            isOneToOne: false
            referencedRelation: "schedule_session_generation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructional_sessions_instructor_employee_id_fkey"
            columns: ["instructor_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructional_sessions_rescheduled_from_id_fkey"
            columns: ["rescheduled_from_id"]
            isOneToOne: false
            referencedRelation: "instructional_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructional_sessions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "schedule_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructional_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      intervention_effectiveness_records: {
        Row: {
          created_at: string
          effectiveness_rating: string | null
          id: string
          intervention_id: string
          minutes_delivered: number
          outcome_notes: string | null
          period_end: string | null
          period_start: string | null
          progress_score: number | null
          progress_trend: string | null
          recorded_at: string
          recorded_by: string | null
          sessions_delivered: number
          student_id: string
        }
        Insert: {
          created_at?: string
          effectiveness_rating?: string | null
          id?: string
          intervention_id: string
          minutes_delivered?: number
          outcome_notes?: string | null
          period_end?: string | null
          period_start?: string | null
          progress_score?: number | null
          progress_trend?: string | null
          recorded_at?: string
          recorded_by?: string | null
          sessions_delivered?: number
          student_id: string
        }
        Update: {
          created_at?: string
          effectiveness_rating?: string | null
          id?: string
          intervention_id?: string
          minutes_delivered?: number
          outcome_notes?: string | null
          period_end?: string | null
          period_start?: string | null
          progress_score?: number | null
          progress_trend?: string | null
          recorded_at?: string
          recorded_by?: string | null
          sessions_delivered?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intervention_effectiveness_records_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "student_academic_interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intervention_effectiveness_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intervention_effectiveness_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          invoice_id: string
          line_type: string
          quantity: number
          student_id: string | null
          unit_amount: number
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          line_type: string
          quantity?: number
          student_id?: string | null
          unit_amount?: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          line_type?: string
          quantity?: number
          student_id?: string | null
          unit_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          billing_account_id: string
          created_at: string
          description: string | null
          discount_amount: number
          due_date: string
          family_responsibility: number
          funding_source_code: string | null
          grant_credit: number
          id: string
          invoice_number: string
          invoice_status: string
          issued_at: string | null
          late_fee_amount: number
          paid_at: string | null
          payment_plan_id: string | null
          program: string | null
          scholarship_credit: number
          sibling_discount_amount: number
          state_funding_credit: number
          student_id: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          tuition_plan_id: string | null
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          billing_account_id: string
          created_at?: string
          description?: string | null
          discount_amount?: number
          due_date: string
          family_responsibility?: number
          funding_source_code?: string | null
          grant_credit?: number
          id?: string
          invoice_number: string
          invoice_status?: string
          issued_at?: string | null
          late_fee_amount?: number
          paid_at?: string | null
          payment_plan_id?: string | null
          program?: string | null
          scholarship_credit?: number
          sibling_discount_amount?: number
          state_funding_credit?: number
          student_id?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          tuition_plan_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          billing_account_id?: string
          created_at?: string
          description?: string | null
          discount_amount?: number
          due_date?: string
          family_responsibility?: number
          funding_source_code?: string | null
          grant_credit?: number
          id?: string
          invoice_number?: string
          invoice_status?: string
          issued_at?: string | null
          late_fee_amount?: number
          paid_at?: string | null
          payment_plan_id?: string | null
          program?: string | null
          scholarship_credit?: number
          sibling_discount_amount?: number
          state_funding_credit?: number
          student_id?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          tuition_plan_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_billing_account_id_fkey"
            columns: ["billing_account_id"]
            isOneToOne: false
            referencedRelation: "family_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_payment_plan_id_fkey"
            columns: ["payment_plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tuition_plan_id_fkey"
            columns: ["tuition_plan_id"]
            isOneToOne: false
            referencedRelation: "tuition_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_by: string | null
          created_at: string
          employee_id: string
          end_date: string
          hours_requested: number | null
          id: string
          leave_type: string
          reason: string | null
          school_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          employee_id: string
          end_date: string
          hours_requested?: number | null
          id?: string
          leave_type: string
          reason?: string | null
          school_id: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string
          hours_requested?: number | null
          id?: string
          leave_type?: string
          reason?: string | null
          school_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_backup_records: {
        Row: {
          backup_type: string
          created_at: string
          id: string
          organization_id: string | null
          status: string
          verified_at: string | null
        }
        Insert: {
          backup_type?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          status?: string
          verified_at?: string | null
        }
        Update: {
          backup_type?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_backup_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_customer_health_profiles: {
        Row: {
          adoption_score: number
          created_at: string
          customer_id: string
          expansion_opportunity_pct: number
          health_score: number
          id: string
          implementation_progress_pct: number
          profile_date: string
          recommended_actions: Json
          renewal_probability_pct: number
          risk_score: number
          support_satisfaction: number
          training_score: number
        }
        Insert: {
          adoption_score?: number
          created_at?: string
          customer_id: string
          expansion_opportunity_pct?: number
          health_score?: number
          id?: string
          implementation_progress_pct?: number
          profile_date?: string
          recommended_actions?: Json
          renewal_probability_pct?: number
          risk_score?: number
          support_satisfaction?: number
          training_score?: number
        }
        Update: {
          adoption_score?: number
          created_at?: string
          customer_id?: string
          expansion_opportunity_pct?: number
          health_score?: number
          id?: string
          implementation_progress_pct?: number
          profile_date?: string
          recommended_actions?: Json
          renewal_probability_pct?: number
          risk_score?: number
          support_satisfaction?: number
          training_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "ops_customer_health_profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "cloud_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_customer_health_profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "rpt_cloud_customer_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_deployment_rollouts: {
        Row: {
          completed_at: string | null
          created_at: string
          deployment_strategy: string
          feature_flags: Json
          id: string
          maintenance_window: Json
          regions: Json
          release_version: string
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deployment_strategy?: string
          feature_flags?: Json
          id?: string
          maintenance_window?: Json
          regions?: Json
          release_version: string
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deployment_strategy?: string
          feature_flags?: Json
          id?: string
          maintenance_window?: Json
          regions?: Json
          release_version?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      ops_executive_snapshots: {
        Row: {
          arr: number
          churn_pct: number
          created_at: string
          customer_health_pct: number
          employees_managed: number
          forecast_mrr: number
          id: string
          implementation_pipeline: number
          marketplace_revenue: number
          mrr: number
          organizations_count: number
          platform_health_pct: number
          renewals_due: number
          snapshot_date: string
          students_managed: number
          support_health_pct: number
        }
        Insert: {
          arr?: number
          churn_pct?: number
          created_at?: string
          customer_health_pct?: number
          employees_managed?: number
          forecast_mrr?: number
          id?: string
          implementation_pipeline?: number
          marketplace_revenue?: number
          mrr?: number
          organizations_count?: number
          platform_health_pct?: number
          renewals_due?: number
          snapshot_date?: string
          students_managed?: number
          support_health_pct?: number
        }
        Update: {
          arr?: number
          churn_pct?: number
          created_at?: string
          customer_health_pct?: number
          employees_managed?: number
          forecast_mrr?: number
          id?: string
          implementation_pipeline?: number
          marketplace_revenue?: number
          mrr?: number
          organizations_count?: number
          platform_health_pct?: number
          renewals_due?: number
          snapshot_date?: string
          students_managed?: number
          support_health_pct?: number
        }
        Relationships: []
      }
      ops_marketplace_business: {
        Row: {
          active_subscriptions: number
          avg_rating: number
          created_at: string
          developer_payments: number
          id: string
          paid_modules: number
          revenue_sharing_total: number
          snapshot_date: string
          top_modules: Json
          total_downloads: number
        }
        Insert: {
          active_subscriptions?: number
          avg_rating?: number
          created_at?: string
          developer_payments?: number
          id?: string
          paid_modules?: number
          revenue_sharing_total?: number
          snapshot_date?: string
          top_modules?: Json
          total_downloads?: number
        }
        Update: {
          active_subscriptions?: number
          avg_rating?: number
          created_at?: string
          developer_payments?: number
          id?: string
          paid_modules?: number
          revenue_sharing_total?: number
          snapshot_date?: string
          top_modules?: Json
          total_downloads?: number
        }
        Relationships: []
      }
      ops_partners: {
        Row: {
          active_customers: number
          certification_status: string
          created_at: string
          id: string
          is_active: boolean
          partner_name: string
          partner_type: string
          performance_score: number
          revenue_share_pct: number
          total_revenue: number
        }
        Insert: {
          active_customers?: number
          certification_status?: string
          created_at?: string
          id?: string
          is_active?: boolean
          partner_name: string
          partner_type?: string
          performance_score?: number
          revenue_share_pct?: number
          total_revenue?: number
        }
        Update: {
          active_customers?: number
          certification_status?: string
          created_at?: string
          id?: string
          is_active?: boolean
          partner_name?: string
          partner_type?: string
          performance_score?: number
          revenue_share_pct?: number
          total_revenue?: number
        }
        Relationships: []
      }
      ops_platform_snapshots: {
        Row: {
          active_users: number
          api_uptime_pct: number
          avg_response_ms: number
          bandwidth_used_gb: number
          concurrent_users: number
          cpu_usage_pct: number
          database_health: string
          id: string
          memory_usage_pct: number
          organizations_online: number
          platform_uptime_pct: number
          queue_health: string
          regional_health: Json
          snapshot_at: string
          storage_used_gb: number
        }
        Insert: {
          active_users?: number
          api_uptime_pct?: number
          avg_response_ms?: number
          bandwidth_used_gb?: number
          concurrent_users?: number
          cpu_usage_pct?: number
          database_health?: string
          id?: string
          memory_usage_pct?: number
          organizations_online?: number
          platform_uptime_pct?: number
          queue_health?: string
          regional_health?: Json
          snapshot_at?: string
          storage_used_gb?: number
        }
        Update: {
          active_users?: number
          api_uptime_pct?: number
          avg_response_ms?: number
          bandwidth_used_gb?: number
          concurrent_users?: number
          cpu_usage_pct?: number
          database_health?: string
          id?: string
          memory_usage_pct?: number
          organizations_online?: number
          platform_uptime_pct?: number
          queue_health?: string
          regional_health?: Json
          snapshot_at?: string
          storage_used_gb?: number
        }
        Relationships: []
      }
      ops_revenue_snapshots: {
        Row: {
          arr: number
          created_at: string
          customer_acquisition_cost: number
          customer_lifetime_value: number
          expansion_revenue: number
          gross_revenue_retention_pct: number
          id: string
          implementation_revenue: number
          marketplace_revenue: number
          mrr: number
          net_revenue_retention_pct: number
          professional_services_revenue: number
          revenue_growth_pct: number
          snapshot_date: string
          support_revenue: number
          training_revenue: number
        }
        Insert: {
          arr?: number
          created_at?: string
          customer_acquisition_cost?: number
          customer_lifetime_value?: number
          expansion_revenue?: number
          gross_revenue_retention_pct?: number
          id?: string
          implementation_revenue?: number
          marketplace_revenue?: number
          mrr?: number
          net_revenue_retention_pct?: number
          professional_services_revenue?: number
          revenue_growth_pct?: number
          snapshot_date?: string
          support_revenue?: number
          training_revenue?: number
        }
        Update: {
          arr?: number
          created_at?: string
          customer_acquisition_cost?: number
          customer_lifetime_value?: number
          expansion_revenue?: number
          gross_revenue_retention_pct?: number
          id?: string
          implementation_revenue?: number
          marketplace_revenue?: number
          mrr?: number
          net_revenue_retention_pct?: number
          professional_services_revenue?: number
          revenue_growth_pct?: number
          snapshot_date?: string
          support_revenue?: number
          training_revenue?: number
        }
        Relationships: []
      }
      ops_security_snapshots: {
        Row: {
          api_abuse_events: number
          audit_reviews_pending: number
          created_at: string
          credential_rotations_due: number
          ddos_readiness_pct: number
          encryption_health_pct: number
          id: string
          permission_escalations: number
          security_score: number
          snapshot_date: string
          suspicious_logins: number
          threat_alerts: number
        }
        Insert: {
          api_abuse_events?: number
          audit_reviews_pending?: number
          created_at?: string
          credential_rotations_due?: number
          ddos_readiness_pct?: number
          encryption_health_pct?: number
          id?: string
          permission_escalations?: number
          security_score?: number
          snapshot_date?: string
          suspicious_logins?: number
          threat_alerts?: number
        }
        Update: {
          api_abuse_events?: number
          audit_reviews_pending?: number
          created_at?: string
          credential_rotations_due?: number
          ddos_readiness_pct?: number
          encryption_health_pct?: number
          id?: string
          permission_escalations?: number
          security_score?: number
          snapshot_date?: string
          suspicious_logins?: number
          threat_alerts?: number
        }
        Relationships: []
      }
      ops_support_snapshots: {
        Row: {
          avg_resolution_hours: number
          avg_response_minutes: number
          created_at: string
          customer_satisfaction: number
          escalations: number
          id: string
          knowledge_articles: number
          open_tickets: number
          sla_breaches: number
          snapshot_date: string
          support_load_pct: number
        }
        Insert: {
          avg_resolution_hours?: number
          avg_response_minutes?: number
          created_at?: string
          customer_satisfaction?: number
          escalations?: number
          id?: string
          knowledge_articles?: number
          open_tickets?: number
          sla_breaches?: number
          snapshot_date?: string
          support_load_pct?: number
        }
        Update: {
          avg_resolution_hours?: number
          avg_response_minutes?: number
          created_at?: string
          customer_satisfaction?: number
          escalations?: number
          id?: string
          knowledge_articles?: number
          open_tickets?: number
          sla_breaches?: number
          snapshot_date?: string
          support_load_pct?: number
        }
        Relationships: []
      }
      ops_university_courses: {
        Row: {
          certification_credits: number
          course_key: string
          course_name: string
          id: string
          is_required: boolean
          renewal_months: number
          role_path: string
          sort_order: number
        }
        Insert: {
          certification_credits?: number
          course_key: string
          course_name: string
          id?: string
          is_required?: boolean
          renewal_months?: number
          role_path: string
          sort_order?: number
        }
        Update: {
          certification_credits?: number
          course_key?: string
          course_name?: string
          id?: string
          is_required?: boolean
          renewal_months?: number
          role_path?: string
          sort_order?: number
        }
        Relationships: []
      }
      ops_university_enrollments: {
        Row: {
          certified_at: string | null
          course_id: string
          created_at: string
          expires_at: string | null
          id: string
          progress_pct: number
          status: string
          user_id: string | null
        }
        Insert: {
          certified_at?: string | null
          course_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          progress_pct?: number
          status?: string
          user_id?: string | null
        }
        Update: {
          certified_at?: string | null
          course_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          progress_pct?: number
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_university_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "ops_university_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_university_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      org_departments: {
        Row: {
          campus_id: string | null
          code: string
          created_at: string
          id: string
          name: string
          school_id: string
          status: string
          updated_at: string
        }
        Insert: {
          campus_id?: string | null
          code: string
          created_at?: string
          id?: string
          name: string
          school_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          campus_id?: string | null
          code?: string
          created_at?: string
          id?: string
          name?: string
          school_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_departments_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_departments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      org_organizations: {
        Row: {
          branding: Json
          created_at: string
          id: string
          name: string
          org_type: string
          owner_user_id: string | null
          settings: Json
          slug: string
          status: string
          subscription_plan_key: string | null
          subscription_status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          branding?: Json
          created_at?: string
          id?: string
          name: string
          org_type?: string
          owner_user_id?: string | null
          settings?: Json
          slug: string
          status?: string
          subscription_plan_key?: string | null
          subscription_status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          branding?: Json
          created_at?: string
          id?: string
          name?: string
          org_type?: string
          owner_user_id?: string | null
          settings?: Json
          slug?: string
          status?: string
          subscription_plan_key?: string | null
          subscription_status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_organizations_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      org_programs: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          school_id: string
          settings: Json
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          school_id: string
          settings?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          school_id?: string
          settings?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_programs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      org_regions: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_regions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_applications: {
        Row: {
          application_id: string
          created_at: string
          disabled_at: string | null
          enabled_at: string | null
          enabled_by: string | null
          id: string
          metadata: Json
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          disabled_at?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          disabled_at?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_applications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "platform_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_applications_enabled_by_fkey"
            columns: ["enabled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_applications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_plans: {
        Row: {
          billing_account_id: string
          created_at: string
          frequency: string
          id: string
          installment_amount: number
          installment_count: number
          name: string
          start_date: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          billing_account_id: string
          created_at?: string
          frequency?: string
          id?: string
          installment_amount: number
          installment_count: number
          name: string
          start_date: string
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          billing_account_id?: string
          created_at?: string
          frequency?: string
          id?: string
          installment_amount?: number
          installment_count?: number
          name?: string
          start_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_plans_billing_account_id_fkey"
            columns: ["billing_account_id"]
            isOneToOne: false
            referencedRelation: "family_billing_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          external_processor_ref: string | null
          failure_reason: string | null
          id: string
          invoice_id: string
          notes: string | null
          paid_at: string
          payment_method: string
          payment_status: string
          receipt_number: string | null
          recorded_by_user_id: string | null
          reference_number: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          external_processor_ref?: string | null
          failure_reason?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          paid_at?: string
          payment_method?: string
          payment_status?: string
          receipt_number?: string | null
          recorded_by_user_id?: string | null
          reference_number?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          external_processor_ref?: string | null
          failure_reason?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          paid_at?: string
          payment_method?: string
          payment_status?: string
          receipt_number?: string | null
          recorded_by_user_id?: string | null
          reference_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recorded_by_user_id_fkey"
            columns: ["recorded_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_cost_allocations: {
        Row: {
          allocated_amount: number
          allocation_percent: number
          created_at: string
          employee_id: string | null
          funding_source_code: string | null
          grant_code: string | null
          id: string
          instructional_minutes: number
          notes: string | null
          payroll_record_id: string | null
          period_end: string | null
          period_start: string | null
          program: string | null
          school_id: string
          student_id: string | null
        }
        Insert: {
          allocated_amount?: number
          allocation_percent?: number
          created_at?: string
          employee_id?: string | null
          funding_source_code?: string | null
          grant_code?: string | null
          id?: string
          instructional_minutes?: number
          notes?: string | null
          payroll_record_id?: string | null
          period_end?: string | null
          period_start?: string | null
          program?: string | null
          school_id: string
          student_id?: string | null
        }
        Update: {
          allocated_amount?: number
          allocation_percent?: number
          created_at?: string
          employee_id?: string | null
          funding_source_code?: string | null
          grant_code?: string | null
          id?: string
          instructional_minutes?: number
          notes?: string | null
          payroll_record_id?: string | null
          period_end?: string | null
          period_start?: string | null
          program?: string | null
          school_id?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_cost_allocations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_cost_allocations_payroll_record_id_fkey"
            columns: ["payroll_record_id"]
            isOneToOne: false
            referencedRelation: "payroll_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_cost_allocations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_cost_allocations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_records: {
        Row: {
          created_at: string
          deductions: number
          employee_id: string
          gross_pay: number
          hours_worked: number | null
          id: string
          net_pay: number
          notes: string | null
          paid_at: string | null
          pay_period_end: string
          pay_period_start: string
          pay_status: string
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deductions?: number
          employee_id: string
          gross_pay?: number
          hours_worked?: number | null
          id?: string
          net_pay?: number
          notes?: string | null
          paid_at?: string | null
          pay_period_end: string
          pay_period_start: string
          pay_status?: string
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deductions?: number
          employee_id?: string
          gross_pay?: number
          hours_worked?: number | null
          id?: string
          net_pay?: number
          notes?: string | null
          paid_at?: string | null
          pay_period_end?: string
          pay_period_start?: string
          pay_status?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      pd_courses: {
        Row: {
          ceu_credits: number | null
          created_at: string
          delivery_mode: string | null
          description: string | null
          id: string
          is_active: boolean
          is_required: boolean
          school_id: string | null
          title: string
        }
        Insert: {
          ceu_credits?: number | null
          created_at?: string
          delivery_mode?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          school_id?: string | null
          title: string
        }
        Update: {
          ceu_credits?: number | null
          created_at?: string
          delivery_mode?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          school_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pd_courses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_evaluations: {
        Row: {
          coaching_notes: string | null
          created_at: string
          employee_acknowledged_at: string | null
          employee_id: string
          evaluation_period_end: string | null
          evaluation_period_start: string | null
          evaluation_type: string
          evaluator_user_id: string | null
          id: string
          overall_rating: string | null
          school_id: string
          status: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          coaching_notes?: string | null
          created_at?: string
          employee_acknowledged_at?: string | null
          employee_id: string
          evaluation_period_end?: string | null
          evaluation_period_start?: string | null
          evaluation_type?: string
          evaluator_user_id?: string | null
          id?: string
          overall_rating?: string | null
          school_id: string
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          coaching_notes?: string | null
          created_at?: string
          employee_acknowledged_at?: string | null
          employee_id?: string
          evaluation_period_end?: string | null
          evaluation_period_start?: string | null
          evaluation_type?: string
          evaluator_user_id?: string | null
          id?: string
          overall_rating?: string | null
          school_id?: string
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_evaluator_user_id_fkey"
            columns: ["evaluator_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_goals: {
        Row: {
          created_at: string
          description: string | null
          employee_id: string
          evaluation_id: string | null
          id: string
          progress_notes: string | null
          status: string
          target_date: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          employee_id: string
          evaluation_id?: string | null
          id?: string
          progress_notes?: string | null
          status?: string
          target_date?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          employee_id?: string
          evaluation_id?: string | null
          id?: string
          progress_notes?: string | null
          status?: string
          target_date?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_goals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_goals_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "performance_evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_activity_events: {
        Row: {
          actor_type: string
          actor_user_id: string | null
          body: string
          campus_id: string | null
          classification: string
          correlation_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          event_type: string
          event_version: string
          family_id: string | null
          id: string
          module_key: string
          occurred_at: string
          organization_id: string | null
          payload: Json
          related_entity_id: string | null
          related_entity_type: string | null
          school_id: string | null
          searchable_text: string
          severity: string | null
          source_id: string | null
          source_table: string | null
          student_id: string | null
          summary: string
          title: string
          visibility: string
        }
        Insert: {
          actor_type?: string
          actor_user_id?: string | null
          body?: string
          campus_id?: string | null
          classification?: string
          correlation_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          event_type: string
          event_version?: string
          family_id?: string | null
          id?: string
          module_key: string
          occurred_at?: string
          organization_id?: string | null
          payload?: Json
          related_entity_id?: string | null
          related_entity_type?: string | null
          school_id?: string | null
          searchable_text?: string
          severity?: string | null
          source_id?: string | null
          source_table?: string | null
          student_id?: string | null
          summary?: string
          title: string
          visibility?: string
        }
        Update: {
          actor_type?: string
          actor_user_id?: string | null
          body?: string
          campus_id?: string | null
          classification?: string
          correlation_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          event_type?: string
          event_version?: string
          family_id?: string | null
          id?: string
          module_key?: string
          occurred_at?: string
          organization_id?: string | null
          payload?: Json
          related_entity_id?: string | null
          related_entity_type?: string | null
          school_id?: string | null
          searchable_text?: string
          severity?: string | null
          source_id?: string | null
          source_table?: string | null
          student_id?: string | null
          summary?: string
          title?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_activity_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_activity_events_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_activity_events_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_activity_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_activity_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_activity_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_applications: {
        Row: {
          created_at: string
          description: string
          home_route: string | null
          id: string
          key: string
          metadata: Json
          name: string
          permission_pack_key: string | null
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          home_route?: string | null
          id?: string
          key: string
          metadata?: Json
          name: string
          permission_pack_key?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          home_route?: string | null
          id?: string
          key?: string
          metadata?: Json
          name?: string
          permission_pack_key?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_approval_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_notes: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json
          module: string
          requested_by: string | null
          rule_id: string | null
          school_id: string | null
          status: string
          summary: string
          title: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json
          module: string
          requested_by?: string | null
          rule_id?: string | null
          school_id?: string | null
          status?: string
          summary?: string
          title: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json
          module?: string
          requested_by?: string | null
          rule_id?: string | null
          school_id?: string | null
          status?: string
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_approval_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_approval_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_approval_requests_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "platform_approval_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_approval_requests_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_approval_rules: {
        Row: {
          approver_permissions: string[]
          approver_roles: string[]
          condition_config: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          module: string
          name: string
          priority: number
          rule_key: string
          school_id: string | null
          threshold_unit: string | null
          threshold_value: number | null
          updated_at: string
        }
        Insert: {
          approver_permissions?: string[]
          approver_roles?: string[]
          condition_config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          module: string
          name: string
          priority?: number
          rule_key: string
          school_id?: string | null
          threshold_unit?: string | null
          threshold_value?: number | null
          updated_at?: string
        }
        Update: {
          approver_permissions?: string[]
          approver_roles?: string[]
          condition_config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          module?: string
          name?: string
          priority?: number
          rule_key?: string
          school_id?: string | null
          threshold_unit?: string | null
          threshold_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_approval_rules_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_audit_events: {
        Row: {
          action_type: string
          actor_role: string | null
          actor_user_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          is_system_event: boolean
          metadata: Json
          module: string
          school_id: string | null
          summary: string
          workflow_id: string | null
          workflow_key: string | null
        }
        Insert: {
          action_type: string
          actor_role?: string | null
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          is_system_event?: boolean
          metadata?: Json
          module: string
          school_id?: string | null
          summary: string
          workflow_id?: string | null
          workflow_key?: string | null
        }
        Update: {
          action_type?: string
          actor_role?: string | null
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          is_system_event?: boolean
          metadata?: Json
          module?: string
          school_id?: string | null
          summary?: string
          workflow_id?: string | null
          workflow_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_audit_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_audit_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_business_hours: {
        Row: {
          campus_id: string | null
          close_time: string
          created_at: string
          day_of_week: number
          id: string
          is_active: boolean
          open_time: string
          schedule_type: string
          school_id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          campus_id?: string | null
          close_time: string
          created_at?: string
          day_of_week: number
          id?: string
          is_active?: boolean
          open_time: string
          schedule_type?: string
          school_id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          campus_id?: string | null
          close_time?: string
          created_at?: string
          day_of_week?: number
          id?: string
          is_active?: boolean
          open_time?: string
          schedule_type?: string
          school_id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_business_hours_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_business_hours_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_classification_permissions: {
        Row: {
          classification: string
          description: string | null
          required_permission: string
        }
        Insert: {
          classification: string
          description?: string | null
          required_permission: string
        }
        Update: {
          classification?: string
          description?: string | null
          required_permission?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_classification_permissions_required_permission_fkey"
            columns: ["required_permission"]
            isOneToOne: false
            referencedRelation: "platform_permissions"
            referencedColumns: ["permission_key"]
          },
        ]
      }
      platform_decision_records: {
        Row: {
          actor_user_id: string | null
          collected_evidence: Json
          confidence: Json
          decision_type: string
          domain: string
          engine_mode: string
          entity_id: string | null
          entity_type: string | null
          executed_at: string
          execution_id: string
          explanation: Json
          id: string
          inputs: Json
          metadata: Json
          organization_id: string | null
          recommendation: Json
          recorded_at: string
          result: Json
          school_id: string | null
          summary: string
        }
        Insert: {
          actor_user_id?: string | null
          collected_evidence?: Json
          confidence?: Json
          decision_type: string
          domain: string
          engine_mode: string
          entity_id?: string | null
          entity_type?: string | null
          executed_at: string
          execution_id: string
          explanation?: Json
          id?: string
          inputs?: Json
          metadata?: Json
          organization_id?: string | null
          recommendation?: Json
          recorded_at?: string
          result: Json
          school_id?: string | null
          summary?: string
        }
        Update: {
          actor_user_id?: string | null
          collected_evidence?: Json
          confidence?: Json
          decision_type?: string
          domain?: string
          engine_mode?: string
          entity_id?: string | null
          entity_type?: string | null
          executed_at?: string
          execution_id?: string
          explanation?: Json
          id?: string
          inputs?: Json
          metadata?: Json
          organization_id?: string | null
          recommendation?: Json
          recorded_at?: string
          result?: Json
          school_id?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_decision_records_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_decision_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_decision_records_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_digital_signatures: {
        Row: {
          created_at: string
          device_info: Json
          document_hash: string | null
          document_type: string
          document_version: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          module: string
          school_id: string | null
          signature_payload: Json
          signed_at: string
          signer_email: string | null
          signer_name: string
          signer_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          device_info?: Json
          document_hash?: string | null
          document_type: string
          document_version?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          module: string
          school_id?: string | null
          signature_payload?: Json
          signed_at?: string
          signer_email?: string | null
          signer_name: string
          signer_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          device_info?: Json
          document_hash?: string | null
          document_type?: string
          document_version?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          module?: string
          school_id?: string | null
          signature_payload?: Json
          signed_at?: string
          signer_email?: string | null
          signer_name?: string
          signer_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_digital_signatures_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_digital_signatures_signer_user_id_fkey"
            columns: ["signer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_entity_tags: {
        Row: {
          applied_at: string
          applied_by: string | null
          entity_id: string
          entity_type: string
          expires_at: string | null
          id: string
          organization_id: string
          source: string
          tag_id: string
        }
        Insert: {
          applied_at?: string
          applied_by?: string | null
          entity_id: string
          entity_type: string
          expires_at?: string | null
          id?: string
          organization_id: string
          source?: string
          tag_id: string
        }
        Update: {
          applied_at?: string
          applied_by?: string | null
          entity_id?: string
          entity_type?: string
          expires_at?: string | null
          id?: string
          organization_id?: string
          source?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_entity_tags_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_entity_tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_entity_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "platform_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_escalation_rules: {
        Row: {
          actions: Json
          after_hours: number
          condition_config: Json
          created_at: string
          id: string
          is_active: boolean
          module: string
          name: string
          priority: number
          rule_key: string
          school_id: string | null
          trigger_event: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          after_hours?: number
          condition_config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          module: string
          name: string
          priority?: number
          rule_key: string
          school_id?: string | null
          trigger_event: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          after_hours?: number
          condition_config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          module?: string
          name?: string
          priority?: number
          rule_key?: string
          school_id?: string | null
          trigger_event?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_escalation_rules_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_event_records: {
        Row: {
          actor_user_id: string | null
          audit_id: string | null
          causation_id: string | null
          correlation_id: string
          dispatch_mode: string
          domain: string
          entity_id: string
          entity_type: string
          envelope: Json
          envelope_version: number
          event_id: string
          event_type: string
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string | null
          payload: Json
          recorded_at: string
          school_id: string | null
          scope: string
          subscriber_results: Json
          summary: string
        }
        Insert: {
          actor_user_id?: string | null
          audit_id?: string | null
          causation_id?: string | null
          correlation_id: string
          dispatch_mode: string
          domain: string
          entity_id: string
          entity_type: string
          envelope: Json
          envelope_version?: number
          event_id: string
          event_type: string
          id?: string
          metadata?: Json
          occurred_at: string
          organization_id?: string | null
          payload?: Json
          recorded_at?: string
          school_id?: string | null
          scope: string
          subscriber_results?: Json
          summary?: string
        }
        Update: {
          actor_user_id?: string | null
          audit_id?: string | null
          causation_id?: string | null
          correlation_id?: string
          dispatch_mode?: string
          domain?: string
          entity_id?: string
          entity_type?: string
          envelope?: Json
          envelope_version?: number
          event_id?: string
          event_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string | null
          payload?: Json
          recorded_at?: string
          school_id?: string | null
          scope?: string
          subscriber_results?: Json
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_event_records_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_event_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_event_records_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_evidence_records: {
        Row: {
          accommodations_applied: string[]
          ai_assisted: boolean
          ai_validation_status: string | null
          artifact_refs: Json
          captured_at: string
          captured_by_role: string
          captured_by_user_id: string | null
          competency_keys: string[]
          evidence_confidence: number
          evidence_quality: number
          evidence_type_key: string
          expires_at: string | null
          id: string
          jurisdiction_keys: string[]
          locale: string
          metadata: Json
          narrative: string | null
          organization_id: string | null
          recorded_at: string
          relationships: Json
          school_id: string | null
          scores: Json
          skill_keys: string[]
          source_context: Json
          status: string
          student_id: string
          supersedes_evidence_id: string | null
        }
        Insert: {
          accommodations_applied?: string[]
          ai_assisted?: boolean
          ai_validation_status?: string | null
          artifact_refs?: Json
          captured_at: string
          captured_by_role: string
          captured_by_user_id?: string | null
          competency_keys?: string[]
          evidence_confidence: number
          evidence_quality: number
          evidence_type_key: string
          expires_at?: string | null
          id?: string
          jurisdiction_keys?: string[]
          locale?: string
          metadata?: Json
          narrative?: string | null
          organization_id?: string | null
          recorded_at?: string
          relationships?: Json
          school_id?: string | null
          scores?: Json
          skill_keys?: string[]
          source_context?: Json
          status?: string
          student_id: string
          supersedes_evidence_id?: string | null
        }
        Update: {
          accommodations_applied?: string[]
          ai_assisted?: boolean
          ai_validation_status?: string | null
          artifact_refs?: Json
          captured_at?: string
          captured_by_role?: string
          captured_by_user_id?: string | null
          competency_keys?: string[]
          evidence_confidence?: number
          evidence_quality?: number
          evidence_type_key?: string
          expires_at?: string | null
          id?: string
          jurisdiction_keys?: string[]
          locale?: string
          metadata?: Json
          narrative?: string | null
          organization_id?: string | null
          recorded_at?: string
          relationships?: Json
          school_id?: string | null
          scores?: Json
          skill_keys?: string[]
          source_context?: Json
          status?: string
          student_id?: string
          supersedes_evidence_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_evidence_records_captured_by_user_id_fkey"
            columns: ["captured_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_evidence_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_evidence_records_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_evidence_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_evidence_records_supersedes_evidence_id_fkey"
            columns: ["supersedes_evidence_id"]
            isOneToOne: false
            referencedRelation: "platform_evidence_records"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_graph_edges: {
        Row: {
          direction: string
          edge_type: string
          effective_date: string | null
          end_date: string | null
          id: string
          metadata: Json
          organization_id: string | null
          provider_key: string
          recorded_at: string
          school_id: string | null
          source_node_id: string
          status: string
          target_node_id: string
          weight: number
        }
        Insert: {
          direction?: string
          edge_type: string
          effective_date?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json
          organization_id?: string | null
          provider_key: string
          recorded_at?: string
          school_id?: string | null
          source_node_id: string
          status?: string
          target_node_id: string
          weight?: number
        }
        Update: {
          direction?: string
          edge_type?: string
          effective_date?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json
          organization_id?: string | null
          provider_key?: string
          recorded_at?: string
          school_id?: string | null
          source_node_id?: string
          status?: string
          target_node_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "platform_graph_edges_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_graph_edges_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_holidays: {
        Row: {
          created_at: string
          holiday_date: string
          id: string
          is_school_break: boolean
          name: string
          school_id: string | null
          timezone: string
        }
        Insert: {
          created_at?: string
          holiday_date: string
          id?: string
          is_school_break?: boolean
          name: string
          school_id?: string | null
          timezone?: string
        }
        Update: {
          created_at?: string
          holiday_date?: string
          id?: string
          is_school_break?: boolean
          name?: string
          school_id?: string | null
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_holidays_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_identity_providers: {
        Row: {
          config: Json
          created_at: string
          domain_allowlist: string[]
          id: string
          is_enabled: boolean
          name: string
          organization_id: string | null
          provider_key: string
          provider_type: string
          role_mapping: Json
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          domain_allowlist?: string[]
          id?: string
          is_enabled?: boolean
          name: string
          organization_id?: string | null
          provider_key: string
          provider_type: string
          role_mapping?: Json
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          domain_allowlist?: string[]
          id?: string
          is_enabled?: boolean
          name?: string
          organization_id?: string | null
          provider_key?: string
          provider_type?: string
          role_mapping?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_identity_providers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_impersonation_sessions: {
        Row: {
          actor_user_id: string
          ended_at: string | null
          id: string
          ip_address: string | null
          is_active: boolean
          reason: string
          started_at: string
          target_user_id: string
          user_agent: string | null
        }
        Insert: {
          actor_user_id: string
          ended_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          reason?: string
          started_at?: string
          target_user_id: string
          user_agent?: string | null
        }
        Update: {
          actor_user_id?: string
          ended_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          reason?: string
          started_at?: string
          target_user_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_impersonation_sessions_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_impersonation_sessions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_mission_control_items: {
        Row: {
          assigned_role: string | null
          assigned_user_id: string | null
          body: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          href: string | null
          id: string
          is_resolved: boolean
          item_type: string
          metadata: Json
          module: string
          resolved_at: string | null
          school_id: string | null
          severity: string
          title: string
        }
        Insert: {
          assigned_role?: string | null
          assigned_user_id?: string | null
          body?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          href?: string | null
          id?: string
          is_resolved?: boolean
          item_type: string
          metadata?: Json
          module: string
          resolved_at?: string | null
          school_id?: string | null
          severity?: string
          title: string
        }
        Update: {
          assigned_role?: string | null
          assigned_user_id?: string | null
          body?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          href?: string | null
          id?: string
          is_resolved?: boolean
          item_type?: string
          metadata?: Json
          module?: string
          resolved_at?: string | null
          school_id?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_mission_control_items_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_mission_control_items_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_note_visibility_grants: {
        Row: {
          granted_at: string
          id: string
          note_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          id?: string
          note_id: string
          user_id: string
        }
        Update: {
          granted_at?: string
          id?: string
          note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_note_visibility_grants_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "platform_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_note_visibility_grants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_notes: {
        Row: {
          attachments: Json
          author_user_id: string
          body: string
          category: string
          created_at: string
          entity_id: string
          entity_type: string
          family_id: string | null
          id: string
          is_deleted: boolean
          is_pinned: boolean
          mentioned_user_ids: string[]
          metadata: Json
          organization_id: string
          school_id: string | null
          source: string
          student_id: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          attachments?: Json
          author_user_id: string
          body: string
          category?: string
          created_at?: string
          entity_id: string
          entity_type: string
          family_id?: string | null
          id?: string
          is_deleted?: boolean
          is_pinned?: boolean
          mentioned_user_ids?: string[]
          metadata?: Json
          organization_id: string
          school_id?: string | null
          source?: string
          student_id?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          attachments?: Json
          author_user_id?: string
          body?: string
          category?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          family_id?: string | null
          id?: string
          is_deleted?: boolean
          is_pinned?: boolean
          mentioned_user_ids?: string[]
          metadata?: Json
          organization_id?: string
          school_id?: string | null
          source?: string
          student_id?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_notes_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_notes_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_notes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_notification_templates: {
        Row: {
          body: string
          category: string
          channel: string
          created_at: string
          id: string
          is_active: boolean
          lifecycle_status: string
          merge_fields: Json
          module: string
          name: string
          school_id: string | null
          subject: string
          template_key: string
          updated_at: string
          version_number: number
        }
        Insert: {
          body: string
          category?: string
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean
          lifecycle_status?: string
          merge_fields?: Json
          module: string
          name: string
          school_id?: string | null
          subject?: string
          template_key: string
          updated_at?: string
          version_number?: number
        }
        Update: {
          body?: string
          category?: string
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean
          lifecycle_status?: string
          merge_fields?: Json
          module?: string
          name?: string
          school_id?: string | null
          subject?: string
          template_key?: string
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "platform_notification_templates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_paj_competency_progress: {
        Row: {
          competency_key: string
          created_at: string
          domain_key: string
          educator_confirmed_at: string | null
          educator_confirmed_by: string | null
          evidence_count: number
          evidence_type_keys: string[]
          id: string
          journey_id: string
          last_evidence_id: string | null
          mastery_level: number
          metadata: Json
          status: string
          updated_at: string
        }
        Insert: {
          competency_key: string
          created_at?: string
          domain_key: string
          educator_confirmed_at?: string | null
          educator_confirmed_by?: string | null
          evidence_count?: number
          evidence_type_keys?: string[]
          id?: string
          journey_id: string
          last_evidence_id?: string | null
          mastery_level?: number
          metadata?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          competency_key?: string
          created_at?: string
          domain_key?: string
          educator_confirmed_at?: string | null
          educator_confirmed_by?: string | null
          evidence_count?: number
          evidence_type_keys?: string[]
          id?: string
          journey_id?: string
          last_evidence_id?: string | null
          mastery_level?: number
          metadata?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_paj_competency_progress_educator_confirmed_by_fkey"
            columns: ["educator_confirmed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_paj_competency_progress_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "platform_paj_journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_paj_domain_enrollments: {
        Row: {
          active_competency_key: string | null
          created_at: string
          domain_key: string
          id: string
          journey_id: string
          library_key: string
          metadata: Json
          pathway_key: string
          status: string
          updated_at: string
        }
        Insert: {
          active_competency_key?: string | null
          created_at?: string
          domain_key: string
          id?: string
          journey_id: string
          library_key: string
          metadata?: Json
          pathway_key: string
          status?: string
          updated_at?: string
        }
        Update: {
          active_competency_key?: string | null
          created_at?: string
          domain_key?: string
          id?: string
          journey_id?: string
          library_key?: string
          metadata?: Json
          pathway_key?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_paj_domain_enrollments_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "platform_paj_journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_paj_journeys: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          organization_id: string | null
          program_track: string
          school_id: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          program_track?: string
          school_id?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          program_track?: string
          school_id?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_paj_journeys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_paj_journeys_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_paj_journeys_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_paj_placements: {
        Row: {
          created_at: string
          domain_key: string
          id: string
          journey_id: string
          metadata: Json
          placed_by_user_id: string | null
          placed_competency_key: string
          placement_evidence_ids: string[]
          recommended_competency_key: string
          review_date: string
        }
        Insert: {
          created_at?: string
          domain_key: string
          id?: string
          journey_id: string
          metadata?: Json
          placed_by_user_id?: string | null
          placed_competency_key: string
          placement_evidence_ids?: string[]
          recommended_competency_key: string
          review_date?: string
        }
        Update: {
          created_at?: string
          domain_key?: string
          id?: string
          journey_id?: string
          metadata?: Json
          placed_by_user_id?: string | null
          placed_competency_key?: string
          placement_evidence_ids?: string[]
          recommended_competency_key?: string
          review_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_paj_placements_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "platform_paj_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_paj_placements_placed_by_user_id_fkey"
            columns: ["placed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_paj_skill_progress: {
        Row: {
          competency_key: string
          created_at: string
          evidence_count: number
          id: string
          journey_id: string
          last_evidence_id: string | null
          mastery_level: number
          metadata: Json
          skill_key: string
          status: string
          updated_at: string
        }
        Insert: {
          competency_key: string
          created_at?: string
          evidence_count?: number
          id?: string
          journey_id: string
          last_evidence_id?: string | null
          mastery_level?: number
          metadata?: Json
          skill_key: string
          status?: string
          updated_at?: string
        }
        Update: {
          competency_key?: string
          created_at?: string
          evidence_count?: number
          id?: string
          journey_id?: string
          last_evidence_id?: string | null
          mastery_level?: number
          metadata?: Json
          skill_key?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_paj_skill_progress_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "platform_paj_journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_permissions: {
        Row: {
          category: string
          description: string | null
          module: string
          name: string
          permission_key: string
          sort_order: number
        }
        Insert: {
          category?: string
          description?: string | null
          module: string
          name: string
          permission_key: string
          sort_order?: number
        }
        Update: {
          category?: string
          description?: string | null
          module?: string
          name?: string
          permission_key?: string
          sort_order?: number
        }
        Relationships: []
      }
      platform_queue_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          job_type: string
          last_error: string | null
          max_retries: number
          module: string
          payload: Json
          priority: number
          retry_count: number
          scheduled_for: string
          school_id: string | null
          source_id: string | null
          source_table: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          job_type: string
          last_error?: string | null
          max_retries?: number
          module: string
          payload?: Json
          priority?: number
          retry_count?: number
          scheduled_for?: string
          school_id?: string | null
          source_id?: string | null
          source_table?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          job_type?: string
          last_error?: string | null
          max_retries?: number
          module?: string
          payload?: Json
          priority?: number
          retry_count?: number
          scheduled_for?: string
          school_id?: string | null
          source_id?: string | null
          source_table?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_queue_jobs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_record_classifications: {
        Row: {
          classification: string
          classified_by: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          module: string
          school_id: string | null
          updated_at: string
        }
        Insert: {
          classification?: string
          classified_by?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          module: string
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          classification?: string
          classified_by?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          module?: string
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_record_classifications_classified_by_fkey"
            columns: ["classified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_record_classifications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_record_locks: {
        Row: {
          entity_id: string
          entity_type: string
          id: string
          is_active: boolean
          lock_reason: string
          locked_at: string
          locked_by: string | null
          module: string
          school_id: string | null
        }
        Insert: {
          entity_id: string
          entity_type: string
          id?: string
          is_active?: boolean
          lock_reason: string
          locked_at?: string
          locked_by?: string | null
          module: string
          school_id?: string | null
        }
        Update: {
          entity_id?: string
          entity_type?: string
          id?: string
          is_active?: boolean
          lock_reason?: string
          locked_at?: string
          locked_by?: string | null
          module?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_record_locks_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_record_locks_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_record_unlock_events: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          lock_id: string
          unlock_reason: string
          unlocked_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          lock_id: string
          unlock_reason: string
          unlocked_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          lock_id?: string
          unlock_reason?: string
          unlocked_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_record_unlock_events_lock_id_fkey"
            columns: ["lock_id"]
            isOneToOne: false
            referencedRelation: "platform_record_locks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_record_unlock_events_unlocked_by_fkey"
            columns: ["unlocked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_relationship_type_definitions: {
        Row: {
          description: string | null
          from_entity_type: string
          is_system: boolean
          label: string
          sort_order: number
          to_entity_type: string
          type_key: string
        }
        Insert: {
          description?: string | null
          from_entity_type: string
          is_system?: boolean
          label: string
          sort_order?: number
          to_entity_type: string
          type_key: string
        }
        Update: {
          description?: string | null
          from_entity_type?: string
          is_system?: boolean
          label?: string
          sort_order?: number
          to_entity_type?: string
          type_key?: string
        }
        Relationships: []
      }
      platform_relationships: {
        Row: {
          created_at: string
          created_by: string | null
          effective_date: string | null
          end_date: string | null
          from_entity_id: string
          from_entity_type: string
          id: string
          is_primary: boolean
          metadata: Json
          notes: string | null
          organization_id: string
          relationship_type: string
          school_id: string | null
          source: string
          status: string
          to_entity_id: string
          to_entity_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          effective_date?: string | null
          end_date?: string | null
          from_entity_id: string
          from_entity_type: string
          id?: string
          is_primary?: boolean
          metadata?: Json
          notes?: string | null
          organization_id: string
          relationship_type: string
          school_id?: string | null
          source?: string
          status?: string
          to_entity_id: string
          to_entity_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          effective_date?: string | null
          end_date?: string | null
          from_entity_id?: string
          from_entity_type?: string
          id?: string
          is_primary?: boolean
          metadata?: Json
          notes?: string | null
          organization_id?: string
          relationship_type?: string
          school_id?: string | null
          source?: string
          status?: string
          to_entity_id?: string
          to_entity_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_relationships_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_relationships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_relationships_relationship_type_fkey"
            columns: ["relationship_type"]
            isOneToOne: false
            referencedRelation: "platform_relationship_type_definitions"
            referencedColumns: ["type_key"]
          },
          {
            foreignKeyName: "platform_relationships_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_role_permissions: {
        Row: {
          created_at: string
          effect: string
          id: string
          permission_key: string
          role_id: string
        }
        Insert: {
          created_at?: string
          effect?: string
          id?: string
          permission_key: string
          role_id: string
        }
        Update: {
          created_at?: string
          effect?: string
          id?: string
          permission_key?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "platform_permissions"
            referencedColumns: ["permission_key"]
          },
          {
            foreignKeyName: "platform_role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_rule_evaluation_records: {
        Row: {
          actor_user_id: string | null
          domain: string
          entity_id: string | null
          entity_type: string | null
          evaluated_at: string
          evaluation_id: string
          evaluation_mode: string
          explanation: Json
          facts: Json
          id: string
          matched_rule_keys: string[]
          metadata: Json
          organization_id: string | null
          outcome_effects: Json | null
          primary_outcome_key: string | null
          recorded_at: string
          result: Json
          rule_results: Json
          rule_set_key: string
          school_id: string | null
          summary: string
        }
        Insert: {
          actor_user_id?: string | null
          domain: string
          entity_id?: string | null
          entity_type?: string | null
          evaluated_at: string
          evaluation_id: string
          evaluation_mode: string
          explanation?: Json
          facts?: Json
          id?: string
          matched_rule_keys?: string[]
          metadata?: Json
          organization_id?: string | null
          outcome_effects?: Json | null
          primary_outcome_key?: string | null
          recorded_at?: string
          result: Json
          rule_results?: Json
          rule_set_key: string
          school_id?: string | null
          summary?: string
        }
        Update: {
          actor_user_id?: string | null
          domain?: string
          entity_id?: string | null
          entity_type?: string | null
          evaluated_at?: string
          evaluation_id?: string
          evaluation_mode?: string
          explanation?: Json
          facts?: Json
          id?: string
          matched_rule_keys?: string[]
          metadata?: Json
          organization_id?: string | null
          outcome_effects?: Json | null
          primary_outcome_key?: string | null
          recorded_at?: string
          result?: Json
          rule_results?: Json
          rule_set_key?: string
          school_id?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_rule_evaluation_records_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_rule_evaluation_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_rule_evaluation_records_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_scope_grants: {
        Row: {
          classroom_id: string | null
          created_at: string
          denied_permissions: string[]
          department_id: string | null
          grade_band: string | null
          granted_permissions: string[]
          id: string
          is_active: boolean
          label: string | null
          program_id: string | null
          school_id: string
          scope_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          classroom_id?: string | null
          created_at?: string
          denied_permissions?: string[]
          department_id?: string | null
          grade_band?: string | null
          granted_permissions?: string[]
          id?: string
          is_active?: boolean
          label?: string | null
          program_id?: string | null
          school_id: string
          scope_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          classroom_id?: string | null
          created_at?: string
          denied_permissions?: string[]
          department_id?: string | null
          grade_band?: string | null
          granted_permissions?: string[]
          id?: string
          is_active?: boolean
          label?: string | null
          program_id?: string | null
          school_id?: string
          scope_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_scope_grants_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "org_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_scope_grants_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "org_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_scope_grants_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_scope_grants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_security_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json
          school_id: string | null
          summary: string
          user_id: string | null
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          school_id?: string | null
          summary: string
          user_id?: string | null
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          school_id?: string | null
          summary?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_security_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_security_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_security_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_sensitive_access_log: {
        Row: {
          access_action: string
          classification: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json
          record_type: string
          school_id: string | null
          summary: string
          user_id: string | null
        }
        Insert: {
          access_action?: string
          classification?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          record_type: string
          school_id?: string | null
          summary: string
          user_id?: string | null
        }
        Update: {
          access_action?: string
          classification?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          record_type?: string
          school_id?: string | null
          summary?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_sensitive_access_log_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_sensitive_access_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_tags: {
        Row: {
          category: string
          color: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          label: string
          organization_id: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          label: string
          organization_id: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          label?: string
          organization_id?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_template_versions: {
        Row: {
          body: string
          change_notes: string | null
          changed_by: string | null
          created_at: string
          id: string
          subject: string
          template_id: string
          version_number: number
        }
        Insert: {
          body: string
          change_notes?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          subject?: string
          template_id: string
          version_number: number
        }
        Update: {
          body?: string
          change_notes?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          subject?: string
          template_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "platform_template_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "platform_notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_timeline_events: {
        Row: {
          actor_user_id: string | null
          body: string
          created_at: string
          entity_id: string
          entity_type: string
          event_type: string
          id: string
          metadata: Json
          module: string
          occurred_at: string
          related_entity_id: string | null
          related_entity_type: string | null
          school_id: string | null
          title: string
        }
        Insert: {
          actor_user_id?: string | null
          body?: string
          created_at?: string
          entity_id: string
          entity_type: string
          event_type: string
          id?: string
          metadata?: Json
          module: string
          occurred_at?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          school_id?: string | null
          title: string
        }
        Update: {
          actor_user_id?: string | null
          body?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: string
          metadata?: Json
          module?: string
          occurred_at?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          school_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_timeline_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_timeline_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_ulr_atomic_skills: {
        Row: {
          ai_metadata: Json
          competency_key: string
          definition: Json
          domain_key: string
          id: string
          published_at: string | null
          recorded_at: string
          skill_key: string
          sort_order: number
          status: string
          superseded_by: string | null
          title: string
          version: string
        }
        Insert: {
          ai_metadata?: Json
          competency_key: string
          definition: Json
          domain_key: string
          id?: string
          published_at?: string | null
          recorded_at?: string
          skill_key: string
          sort_order?: number
          status?: string
          superseded_by?: string | null
          title: string
          version: string
        }
        Update: {
          ai_metadata?: Json
          competency_key?: string
          definition?: Json
          domain_key?: string
          id?: string
          published_at?: string | null
          recorded_at?: string
          skill_key?: string
          sort_order?: number
          status?: string
          superseded_by?: string | null
          title?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_ulr_atomic_skills_competency_key_fkey"
            columns: ["competency_key"]
            isOneToOne: false
            referencedRelation: "platform_ulr_competencies"
            referencedColumns: ["competency_key"]
          },
          {
            foreignKeyName: "platform_ulr_atomic_skills_domain_key_fkey"
            columns: ["domain_key"]
            isOneToOne: false
            referencedRelation: "platform_ulr_domains"
            referencedColumns: ["domain_key"]
          },
        ]
      }
      platform_ulr_competencies: {
        Row: {
          ai_metadata: Json
          competency_key: string
          definition: Json
          domain_key: string
          id: string
          published_at: string | null
          recorded_at: string
          sort_order: number
          status: string
          strand_key: string
          sub_strand_key: string
          superseded_by: string | null
          title: string
          version: string
        }
        Insert: {
          ai_metadata?: Json
          competency_key: string
          definition: Json
          domain_key: string
          id?: string
          published_at?: string | null
          recorded_at?: string
          sort_order?: number
          status?: string
          strand_key: string
          sub_strand_key: string
          superseded_by?: string | null
          title: string
          version: string
        }
        Update: {
          ai_metadata?: Json
          competency_key?: string
          definition?: Json
          domain_key?: string
          id?: string
          published_at?: string | null
          recorded_at?: string
          sort_order?: number
          status?: string
          strand_key?: string
          sub_strand_key?: string
          superseded_by?: string | null
          title?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_ulr_competencies_domain_key_fkey"
            columns: ["domain_key"]
            isOneToOne: false
            referencedRelation: "platform_ulr_domains"
            referencedColumns: ["domain_key"]
          },
          {
            foreignKeyName: "platform_ulr_competencies_strand_key_fkey"
            columns: ["strand_key"]
            isOneToOne: false
            referencedRelation: "platform_ulr_strands"
            referencedColumns: ["strand_key"]
          },
          {
            foreignKeyName: "platform_ulr_competencies_sub_strand_key_fkey"
            columns: ["sub_strand_key"]
            isOneToOne: false
            referencedRelation: "platform_ulr_sub_strands"
            referencedColumns: ["sub_strand_key"]
          },
        ]
      }
      platform_ulr_domains: {
        Row: {
          description: string
          domain_code: string
          domain_key: string
          id: string
          metadata: Json
          published_at: string | null
          recorded_at: string
          sort_order: number
          status: string
          title: string
          version: string
        }
        Insert: {
          description?: string
          domain_code: string
          domain_key: string
          id?: string
          metadata?: Json
          published_at?: string | null
          recorded_at?: string
          sort_order?: number
          status?: string
          title: string
          version?: string
        }
        Update: {
          description?: string
          domain_code?: string
          domain_key?: string
          id?: string
          metadata?: Json
          published_at?: string | null
          recorded_at?: string
          sort_order?: number
          status?: string
          title?: string
          version?: string
        }
        Relationships: []
      }
      platform_ulr_relationships: {
        Row: {
          id: string
          metadata: Json
          recorded_at: string
          relationship_type: string
          source_key: string
          source_kind: string
          status: string
          target_key: string
          target_kind: string
          weight: number
        }
        Insert: {
          id?: string
          metadata?: Json
          recorded_at?: string
          relationship_type: string
          source_key: string
          source_kind: string
          status?: string
          target_key: string
          target_kind: string
          weight?: number
        }
        Update: {
          id?: string
          metadata?: Json
          recorded_at?: string
          relationship_type?: string
          source_key?: string
          source_kind?: string
          status?: string
          target_key?: string
          target_kind?: string
          weight?: number
        }
        Relationships: []
      }
      platform_ulr_strands: {
        Row: {
          description: string
          domain_key: string
          id: string
          metadata: Json
          published_at: string | null
          recorded_at: string
          sort_order: number
          status: string
          strand_key: string
          title: string
          version: string
        }
        Insert: {
          description?: string
          domain_key: string
          id?: string
          metadata?: Json
          published_at?: string | null
          recorded_at?: string
          sort_order?: number
          status?: string
          strand_key: string
          title: string
          version?: string
        }
        Update: {
          description?: string
          domain_key?: string
          id?: string
          metadata?: Json
          published_at?: string | null
          recorded_at?: string
          sort_order?: number
          status?: string
          strand_key?: string
          title?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_ulr_strands_domain_key_fkey"
            columns: ["domain_key"]
            isOneToOne: false
            referencedRelation: "platform_ulr_domains"
            referencedColumns: ["domain_key"]
          },
        ]
      }
      platform_ulr_sub_strands: {
        Row: {
          description: string
          domain_key: string
          id: string
          metadata: Json
          published_at: string | null
          recorded_at: string
          sort_order: number
          status: string
          strand_key: string
          sub_strand_key: string
          title: string
          version: string
        }
        Insert: {
          description?: string
          domain_key: string
          id?: string
          metadata?: Json
          published_at?: string | null
          recorded_at?: string
          sort_order?: number
          status?: string
          strand_key: string
          sub_strand_key: string
          title: string
          version?: string
        }
        Update: {
          description?: string
          domain_key?: string
          id?: string
          metadata?: Json
          published_at?: string | null
          recorded_at?: string
          sort_order?: number
          status?: string
          strand_key?: string
          sub_strand_key?: string
          title?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_ulr_sub_strands_domain_key_fkey"
            columns: ["domain_key"]
            isOneToOne: false
            referencedRelation: "platform_ulr_domains"
            referencedColumns: ["domain_key"]
          },
          {
            foreignKeyName: "platform_ulr_sub_strands_strand_key_fkey"
            columns: ["strand_key"]
            isOneToOne: false
            referencedRelation: "platform_ulr_strands"
            referencedColumns: ["strand_key"]
          },
        ]
      }
      platform_workflow_approvals: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_notes: string | null
          gate_key: string
          id: string
          instance_id: string
          metadata: Json
          requested_by: string | null
          status: string
          transition_key: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          gate_key: string
          id?: string
          instance_id: string
          metadata?: Json
          requested_by?: string | null
          status?: string
          transition_key: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          gate_key?: string
          id?: string
          instance_id?: string
          metadata?: Json
          requested_by?: string | null
          status?: string
          transition_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_workflow_approvals_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_workflow_approvals_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "platform_workflow_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_workflow_approvals_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_workflow_definitions: {
        Row: {
          created_at: string
          description: string | null
          domain: string
          entity_type: string
          id: string
          metadata: Json
          name: string
          school_id: string | null
          sort_order: number
          status: string
          tags: string[]
          updated_at: string
          workflow_key: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          domain: string
          entity_type: string
          id?: string
          metadata?: Json
          name: string
          school_id?: string | null
          sort_order?: number
          status?: string
          tags?: string[]
          updated_at?: string
          workflow_key: string
        }
        Update: {
          created_at?: string
          description?: string | null
          domain?: string
          entity_type?: string
          id?: string
          metadata?: Json
          name?: string
          school_id?: string | null
          sort_order?: number
          status?: string
          tags?: string[]
          updated_at?: string
          workflow_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_workflow_definitions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_workflow_instances: {
        Row: {
          completed_at: string | null
          created_at: string
          current_state_key: string
          domain: string
          entity_id: string
          entity_type: string
          facts: Json
          id: string
          metadata: Json
          organization_id: string | null
          school_id: string | null
          started_at: string
          started_by: string | null
          status: string
          updated_at: string
          version_id: string
          workflow_key: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_state_key: string
          domain: string
          entity_id: string
          entity_type: string
          facts?: Json
          id?: string
          metadata?: Json
          organization_id?: string | null
          school_id?: string | null
          started_at?: string
          started_by?: string | null
          status?: string
          updated_at?: string
          version_id: string
          workflow_key: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_state_key?: string
          domain?: string
          entity_id?: string
          entity_type?: string
          facts?: Json
          id?: string
          metadata?: Json
          organization_id?: string | null
          school_id?: string | null
          started_at?: string
          started_by?: string | null
          status?: string
          updated_at?: string
          version_id?: string
          workflow_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_workflow_instances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_workflow_instances_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_workflow_instances_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_workflow_instances_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "platform_workflow_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_workflow_marketplace: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          install_count: number
          is_published: boolean
          marketplace_key: string
          module: string
          name: string
          step_definitions: Json
          tags: string[]
          trigger_event: string
          updated_at: string
          workflow_definition: Json
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          install_count?: number
          is_published?: boolean
          marketplace_key: string
          module: string
          name: string
          step_definitions?: Json
          tags?: string[]
          trigger_event: string
          updated_at?: string
          workflow_definition?: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          install_count?: number
          is_published?: boolean
          marketplace_key?: string
          module?: string
          name?: string
          step_definitions?: Json
          tags?: string[]
          trigger_event?: string
          updated_at?: string
          workflow_definition?: Json
        }
        Relationships: []
      }
      platform_workflow_state_history: {
        Row: {
          actor_user_id: string | null
          event_type: string
          from_state_key: string | null
          id: string
          instance_id: string
          metadata: Json
          occurred_at: string
          summary: string
          to_state_key: string
          transition_key: string | null
          version_id: string
        }
        Insert: {
          actor_user_id?: string | null
          event_type: string
          from_state_key?: string | null
          id?: string
          instance_id: string
          metadata?: Json
          occurred_at?: string
          summary?: string
          to_state_key: string
          transition_key?: string | null
          version_id: string
        }
        Update: {
          actor_user_id?: string | null
          event_type?: string
          from_state_key?: string | null
          id?: string
          instance_id?: string
          metadata?: Json
          occurred_at?: string
          summary?: string
          to_state_key?: string
          transition_key?: string | null
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_workflow_state_history_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_workflow_state_history_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "platform_workflow_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_workflow_state_history_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "platform_workflow_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_workflow_tasks: {
        Row: {
          action_key: string | null
          assigned_roles: string[]
          completed_at: string | null
          created_at: string
          due_at: string | null
          id: string
          instance_id: string
          metadata: Json
          state_key: string | null
          task_name: string
          task_status: string
          transition_key: string | null
        }
        Insert: {
          action_key?: string | null
          assigned_roles?: string[]
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          instance_id: string
          metadata?: Json
          state_key?: string | null
          task_name: string
          task_status?: string
          transition_key?: string | null
        }
        Update: {
          action_key?: string | null
          assigned_roles?: string[]
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          instance_id?: string
          metadata?: Json
          state_key?: string | null
          task_name?: string
          task_status?: string
          transition_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_workflow_tasks_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "platform_workflow_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_workflow_timers: {
        Row: {
          created_at: string
          fired_at: string | null
          fires_at: string
          id: string
          instance_id: string
          metadata: Json
          state_key: string | null
          status: string
          timer_key: string
        }
        Insert: {
          created_at?: string
          fired_at?: string | null
          fires_at: string
          id?: string
          instance_id: string
          metadata?: Json
          state_key?: string | null
          status?: string
          timer_key: string
        }
        Update: {
          created_at?: string
          fired_at?: string | null
          fires_at?: string
          id?: string
          instance_id?: string
          metadata?: Json
          state_key?: string | null
          status?: string
          timer_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_workflow_timers_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "platform_workflow_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_workflow_versions: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          definition_id: string
          definition_snapshot: Json
          id: string
          initial_state_key: string
          published_at: string | null
          status: string
          version_number: number
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          definition_id: string
          definition_snapshot: Json
          id?: string
          initial_state_key: string
          published_at?: string | null
          status?: string
          version_number: number
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          definition_id?: string
          definition_snapshot?: Json
          id?: string
          initial_state_key?: string
          published_at?: string | null
          status?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "platform_workflow_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_workflow_versions_definition_id_fkey"
            columns: ["definition_id"]
            isOneToOne: false
            referencedRelation: "platform_workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_calendar_export_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          label: string | null
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          label?: string | null
          token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          label?: string | null
          token_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_calendar_export_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_conference_requests: {
        Row: {
          created_at: string
          id: string
          meeting_id: string | null
          notes: string | null
          preferred_times: Json
          requested_by_user_id: string | null
          school_id: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id?: string | null
          notes?: string | null
          preferred_times?: Json
          requested_by_user_id?: string | null
          school_id: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string | null
          notes?: string | null
          preferred_times?: Json
          requested_by_user_id?: string | null
          school_id?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_conference_requests_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "student_instructional_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_conference_requests_requested_by_user_id_fkey"
            columns: ["requested_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_conference_requests_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_conference_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_conversations: {
        Row: {
          assigned_staff_user_id: string | null
          category: string
          created_at: string
          created_by_user_id: string | null
          family_id: string | null
          id: string
          last_message_at: string | null
          metadata: Json
          school_id: string
          status: string
          student_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_staff_user_id?: string | null
          category?: string
          created_at?: string
          created_by_user_id?: string | null
          family_id?: string | null
          id?: string
          last_message_at?: string | null
          metadata?: Json
          school_id: string
          status?: string
          student_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_staff_user_id?: string | null
          category?: string
          created_at?: string
          created_by_user_id?: string | null
          family_id?: string | null
          id?: string
          last_message_at?: string | null
          metadata?: Json
          school_id?: string
          status?: string
          student_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_conversations_assigned_staff_user_id_fkey"
            columns: ["assigned_staff_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_conversations_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_conversations_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_conversations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_conversations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_family_notifications: {
        Row: {
          body: string
          category: string
          created_at: string
          delivery_method: string
          family_id: string | null
          href: string | null
          id: string
          is_read: boolean
          metadata: Json
          read_at: string | null
          student_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          delivery_method?: string
          family_id?: string | null
          href?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json
          read_at?: string | null
          student_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          delivery_method?: string
          family_id?: string | null
          href?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json
          read_at?: string | null
          student_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_family_notifications_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_family_notifications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_family_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_form_submissions: {
        Row: {
          answers: Json
          created_at: string
          family_id: string | null
          id: string
          signature_id: string | null
          status: string
          student_id: string | null
          submitted_at: string
          submitted_by_user_id: string | null
          template_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          family_id?: string | null
          id?: string
          signature_id?: string | null
          status?: string
          student_id?: string | null
          submitted_at?: string
          submitted_by_user_id?: string | null
          template_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          family_id?: string | null
          id?: string
          signature_id?: string | null
          status?: string
          student_id?: string | null
          submitted_at?: string
          submitted_by_user_id?: string | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_form_submissions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_form_submissions_signature_id_fkey"
            columns: ["signature_id"]
            isOneToOne: false
            referencedRelation: "platform_digital_signatures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_form_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_form_submissions_submitted_by_user_id_fkey"
            columns: ["submitted_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_form_submissions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "portal_form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_form_templates: {
        Row: {
          created_at: string
          description: string | null
          form_key: string
          form_type: string
          id: string
          is_active: boolean
          requires_signature: boolean
          schema: Json
          school_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          form_key: string
          form_type?: string
          id?: string
          is_active?: boolean
          requires_signature?: boolean
          schema?: Json
          school_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          form_key?: string
          form_type?: string
          id?: string
          is_active?: boolean
          requires_signature?: boolean
          schema?: Json
          school_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_form_templates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_message_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size_bytes: number | null
          id: string
          message_id: string
          mime_type: string | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size_bytes?: number | null
          id?: string
          message_id: string
          mime_type?: string | null
          storage_path: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          message_id?: string
          mime_type?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "portal_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_message_reads: {
        Row: {
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "portal_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_message_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          message_category: string
          metadata: Json
          sender_user_id: string | null
          translation_locale: string | null
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          message_category?: string
          metadata?: Json
          sender_user_id?: string | null
          translation_locale?: string | null
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_category?: string
          metadata?: Json
          sender_user_id?: string | null
          translation_locale?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "portal_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          created_at: string
          department: string | null
          description: string | null
          employment_type: string
          id: string
          school_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          description?: string | null
          employment_type?: string
          id?: string
          school_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          description?: string | null
          employment_type?: string
          id?: string
          school_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          description: string | null
          display_name: string | null
          id: string
          is_custom: boolean
          is_immutable: boolean
          is_system: boolean
          name: string
          parent_role_id: string | null
          sort_order: number
        }
        Insert: {
          description?: string | null
          display_name?: string | null
          id?: string
          is_custom?: boolean
          is_immutable?: boolean
          is_system?: boolean
          name: string
          parent_role_id?: string | null
          sort_order?: number
        }
        Update: {
          description?: string | null
          display_name?: string | null
          id?: string
          is_custom?: boolean
          is_immutable?: boolean
          is_system?: boolean
          name?: string
          parent_role_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "roles_parent_role_id_fkey"
            columns: ["parent_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_academy_way_config: {
        Row: {
          allow_hs_in_virtual: boolean
          created_at: string
          id: string
          min_math_size: number
          min_reading_size: number
          min_structured_literacy_size: number
          min_writing_size: number
          rules: Json
          school_id: string
          tutoring_max_size: number
          updated_at: string
          use_12_hour_display: boolean
          virtual_end_at_minute: number
          virtual_start_on_hour: boolean
        }
        Insert: {
          allow_hs_in_virtual?: boolean
          created_at?: string
          id?: string
          min_math_size?: number
          min_reading_size?: number
          min_structured_literacy_size?: number
          min_writing_size?: number
          rules?: Json
          school_id: string
          tutoring_max_size?: number
          updated_at?: string
          use_12_hour_display?: boolean
          virtual_end_at_minute?: number
          virtual_start_on_hour?: boolean
        }
        Update: {
          allow_hs_in_virtual?: boolean
          created_at?: string
          id?: string
          min_math_size?: number
          min_reading_size?: number
          min_structured_literacy_size?: number
          min_writing_size?: number
          rules?: Json
          school_id?: string
          tutoring_max_size?: number
          updated_at?: string
          use_12_hour_display?: boolean
          virtual_end_at_minute?: number
          virtual_start_on_hour?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "schedule_academy_way_config_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_conflicts: {
        Row: {
          conflict_type: string
          description: string | null
          detected_at: string
          entity_id: string
          entity_type: string
          id: string
          is_resolved: boolean
          metadata: Json
          recommendation: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          resolved_at: string | null
          school_id: string
          severity: string
          title: string
        }
        Insert: {
          conflict_type: string
          description?: string | null
          detected_at?: string
          entity_id: string
          entity_type: string
          id?: string
          is_resolved?: boolean
          metadata?: Json
          recommendation?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolved_at?: string | null
          school_id: string
          severity?: string
          title: string
        }
        Update: {
          conflict_type?: string
          description?: string | null
          detected_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          is_resolved?: boolean
          metadata?: Json
          recommendation?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolved_at?: string | null
          school_id?: string
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_conflicts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_room_bookings: {
        Row: {
          booked_end: string
          booked_start: string
          booking_status: string
          created_at: string
          id: string
          instructional_session_id: string | null
          room_id: string
        }
        Insert: {
          booked_end: string
          booked_start: string
          booking_status?: string
          created_at?: string
          id?: string
          instructional_session_id?: string | null
          room_id: string
        }
        Update: {
          booked_end?: string
          booked_start?: string
          booking_status?: string
          created_at?: string
          id?: string
          instructional_session_id?: string | null
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_room_bookings_instructional_session_id_fkey"
            columns: ["instructional_session_id"]
            isOneToOne: false
            referencedRelation: "instructional_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_room_bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "schedule_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_rooms: {
        Row: {
          campus_id: string | null
          capacity: number
          created_at: string
          equipment: Json
          id: string
          is_virtual: boolean
          meet_link: string | null
          name: string
          room_type: string
          school_id: string
          status: string
          updated_at: string
        }
        Insert: {
          campus_id?: string | null
          capacity?: number
          created_at?: string
          equipment?: Json
          id?: string
          is_virtual?: boolean
          meet_link?: string | null
          name: string
          room_type?: string
          school_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          campus_id?: string | null
          capacity?: number
          created_at?: string
          equipment?: Json
          id?: string
          is_virtual?: boolean
          meet_link?: string | null
          name?: string
          room_type?: string
          school_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_rooms_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_rooms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_session_generation_runs: {
        Row: {
          course_section_id: string | null
          created_at: string
          date_from: string
          date_to: string
          error_message: string | null
          generated_by: string | null
          id: string
          metadata: Json
          school_id: string
          sessions_created: number
          sessions_skipped: number
          status: string
        }
        Insert: {
          course_section_id?: string | null
          created_at?: string
          date_from: string
          date_to: string
          error_message?: string | null
          generated_by?: string | null
          id?: string
          metadata?: Json
          school_id: string
          sessions_created?: number
          sessions_skipped?: number
          status?: string
        }
        Update: {
          course_section_id?: string | null
          created_at?: string
          date_from?: string
          date_to?: string
          error_message?: string | null
          generated_by?: string | null
          id?: string
          metadata?: Json
          school_id?: string
          sessions_created?: number
          sessions_skipped?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_session_generation_runs_course_section_id_fkey"
            columns: ["course_section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_session_generation_runs_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_session_generation_runs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarship_applications: {
        Row: {
          application_id: string
          approved_amount: number | null
          approved_at: string | null
          approver_name: string | null
          conditions: string | null
          created_at: string
          expires_on: string | null
          household_income: number | null
          id: string
          remaining_award_balance: number | null
          renewal_date: string | null
          requested_amount: number | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          scholarship_fund_id: string | null
          scholarship_status: string
          scholarship_type: string | null
          student_id: string | null
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          approved_amount?: number | null
          approved_at?: string | null
          approver_name?: string | null
          conditions?: string | null
          created_at?: string
          expires_on?: string | null
          household_income?: number | null
          id?: string
          remaining_award_balance?: number | null
          renewal_date?: string | null
          requested_amount?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          scholarship_fund_id?: string | null
          scholarship_status?: string
          scholarship_type?: string | null
          student_id?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          approved_amount?: number | null
          approved_at?: string | null
          approver_name?: string | null
          conditions?: string | null
          created_at?: string
          expires_on?: string | null
          household_income?: number | null
          id?: string
          remaining_award_balance?: number | null
          renewal_date?: string | null
          requested_amount?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          scholarship_fund_id?: string | null
          scholarship_status?: string
          scholarship_type?: string | null
          student_id?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_applications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "admissions_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_applications_reviewed_by_user_id_fkey"
            columns: ["reviewed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_applications_scholarship_fund_id_fkey"
            columns: ["scholarship_fund_id"]
            isOneToOne: false
            referencedRelation: "scholarship_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarship_applications_legacy: {
        Row: {
          approved_amount: number | null
          created_at: string | null
          family_size: number
          household_income: number
          id: string
          parent_email: string
          sibling_count: number | null
          special_circumstance_score: number | null
          status: string | null
          student_name: string
          suggested_max: number | null
          suggested_min: number | null
        }
        Insert: {
          approved_amount?: number | null
          created_at?: string | null
          family_size: number
          household_income: number
          id?: string
          parent_email: string
          sibling_count?: number | null
          special_circumstance_score?: number | null
          status?: string | null
          student_name: string
          suggested_max?: number | null
          suggested_min?: number | null
        }
        Update: {
          approved_amount?: number | null
          created_at?: string | null
          family_size?: number
          household_income?: number
          id?: string
          parent_email?: string
          sibling_count?: number | null
          special_circumstance_score?: number | null
          status?: string | null
          student_name?: string
          suggested_max?: number | null
          suggested_min?: number | null
        }
        Relationships: []
      }
      scholarship_award_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string | null
          notes: string | null
          paid_at: string
          payment_method: string
          recorded_by: string | null
          scholarship_application_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          paid_at?: string
          payment_method?: string
          recorded_by?: string | null
          scholarship_application_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          paid_at?: string
          payment_method?: string
          recorded_by?: string | null
          scholarship_application_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_award_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_award_payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_award_payments_scholarship_application_id_fkey"
            columns: ["scholarship_application_id"]
            isOneToOne: false
            referencedRelation: "scholarship_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarship_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          id: string
          scholarship_application_id: string
          storage_path: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          id?: string
          scholarship_application_id: string
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          id?: string
          scholarship_application_id?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_documents_scholarship_application_id_fkey"
            columns: ["scholarship_application_id"]
            isOneToOne: false
            referencedRelation: "scholarship_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarship_funds: {
        Row: {
          created_at: string
          donor_name: string | null
          fund_name: string
          fund_type: string
          id: string
          is_active: boolean
          remaining_balance: number
          restrictions: string | null
          school_id: string
          total_allocation: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          donor_name?: string | null
          fund_name: string
          fund_type: string
          id?: string
          is_active?: boolean
          remaining_balance?: number
          restrictions?: string | null
          school_id: string
          total_allocation?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          donor_name?: string | null
          fund_name?: string
          fund_type?: string
          id?: string
          is_active?: boolean
          remaining_balance?: number
          restrictions?: string | null
          school_id?: string
          total_allocation?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_funds_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_admissions_settings: {
        Row: {
          created_at: string
          enrollment_goal: number
          id: string
          marketing_spend_annual: number
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enrollment_goal?: number
          id?: string
          marketing_spend_annual?: number
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enrollment_goal?: number
          id?: string
          marketing_spend_annual?: number
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_admissions_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_branding: {
        Row: {
          accent_color: string | null
          custom_css: string | null
          logo_url: string | null
          primary_color: string | null
          school_id: string
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          custom_css?: string | null
          logo_url?: string | null
          primary_color?: string | null
          school_id: string
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          custom_css?: string | null
          logo_url?: string | null
          primary_color?: string | null
          school_id?: string
          secondary_color?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_branding_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_settings: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          school_id: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          school_id?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_current: boolean
          name: string
          school_id: string
          school_start_month: number | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean
          name: string
          school_id: string
          school_start_month?: number | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean
          name?: string
          school_id?: string
          school_start_month?: number | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          organization_id: string | null
          region_id: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id?: string | null
          region_id?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
          region_id?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schools_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schools_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "org_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      section_staff_assignments: {
        Row: {
          assignment_role: string
          course_section_id: string
          created_at: string
          employee_id: string
          ends_on: string | null
          id: string
          is_active: boolean
          starts_on: string | null
          updated_at: string
        }
        Insert: {
          assignment_role: string
          course_section_id: string
          created_at?: string
          employee_id: string
          ends_on?: string | null
          id?: string
          is_active?: boolean
          starts_on?: string | null
          updated_at?: string
        }
        Update: {
          assignment_role?: string
          course_section_id?: string
          created_at?: string
          employee_id?: string
          ends_on?: string | null
          id?: string
          is_active?: boolean
          starts_on?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_staff_assignments_course_section_id_fkey"
            columns: ["course_section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_staff_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      session_assessment_records: {
        Row: {
          assessed_at: string
          assessment_type: string
          created_at: string
          id: string
          instructional_session_id: string
          mastery_level: string | null
          notes: string | null
          recorded_by: string | null
          rubric: Json
          score: string | null
          sis_assessment_id: string | null
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assessed_at?: string
          assessment_type: string
          created_at?: string
          id?: string
          instructional_session_id: string
          mastery_level?: string | null
          notes?: string | null
          recorded_by?: string | null
          rubric?: Json
          score?: string | null
          sis_assessment_id?: string | null
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assessed_at?: string
          assessment_type?: string
          created_at?: string
          id?: string
          instructional_session_id?: string
          mastery_level?: string | null
          notes?: string | null
          recorded_by?: string | null
          rubric?: Json
          score?: string | null
          sis_assessment_id?: string | null
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_assessment_records_instructional_session_id_fkey"
            columns: ["instructional_session_id"]
            isOneToOne: false
            referencedRelation: "instructional_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_assessment_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_assessment_records_sis_assessment_id_fkey"
            columns: ["sis_assessment_id"]
            isOneToOne: false
            referencedRelation: "student_academic_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_assessment_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      session_attendance_records: {
        Row: {
          attendance_status: string
          id: string
          instructional_session_id: string
          notes: string | null
          recorded_at: string
          recorded_by: string | null
          sis_attendance_record_id: string | null
          student_id: string
        }
        Insert: {
          attendance_status: string
          id?: string
          instructional_session_id: string
          notes?: string | null
          recorded_at?: string
          recorded_by?: string | null
          sis_attendance_record_id?: string | null
          student_id: string
        }
        Update: {
          attendance_status?: string
          id?: string
          instructional_session_id?: string
          notes?: string | null
          recorded_at?: string
          recorded_by?: string | null
          sis_attendance_record_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_attendance_records_instructional_session_id_fkey"
            columns: ["instructional_session_id"]
            isOneToOne: false
            referencedRelation: "instructional_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendance_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendance_records_sis_attendance_record_id_fkey"
            columns: ["sis_attendance_record_id"]
            isOneToOne: false
            referencedRelation: "student_attendance_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      sis_admissions_conversions: {
        Row: {
          application_id: string
          conversion_source: string
          converted_at: string
          converted_by: string | null
          family_id: string | null
          id: string
          lead_id: string
          snapshot: Json
          student_id: string
        }
        Insert: {
          application_id: string
          conversion_source?: string
          converted_at?: string
          converted_by?: string | null
          family_id?: string | null
          id?: string
          lead_id: string
          snapshot?: Json
          student_id: string
        }
        Update: {
          application_id?: string
          conversion_source?: string
          converted_at?: string
          converted_by?: string | null
          family_id?: string | null
          id?: string
          lead_id?: string
          snapshot?: Json
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sis_admissions_conversions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "admissions_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sis_admissions_conversions_converted_by_fkey"
            columns: ["converted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sis_admissions_conversions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sis_admissions_conversions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "admissions_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sis_admissions_conversions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      sis_enrollments: {
        Row: {
          created_at: string
          enrolled_at: string | null
          enrollment_status: string
          id: string
          lead_id: string | null
          program: string
          school_year_id: string
          student_id: string
          updated_at: string
          withdrawn_at: string | null
        }
        Insert: {
          created_at?: string
          enrolled_at?: string | null
          enrollment_status?: string
          id?: string
          lead_id?: string | null
          program: string
          school_year_id: string
          student_id: string
          updated_at?: string
          withdrawn_at?: string | null
        }
        Update: {
          created_at?: string
          enrolled_at?: string | null
          enrollment_status?: string
          id?: string
          lead_id?: string | null
          program?: string
          school_year_id?: string
          student_id?: string
          updated_at?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sis_enrollments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "admissions_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sis_enrollments_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sis_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      sis_sped_review_reminders: {
        Row: {
          created_at: string
          days_before: number
          due_date: string
          id: string
          is_sent: boolean
          mission_control_item_id: string | null
          plan_id: string
          reminder_type: string
          sent_at: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          days_before?: number
          due_date: string
          id?: string
          is_sent?: boolean
          mission_control_item_id?: string | null
          plan_id: string
          reminder_type: string
          sent_at?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          days_before?: number
          due_date?: string
          id?: string
          is_sent?: boolean
          mission_control_item_id?: string | null
          plan_id?: string
          reminder_type?: string
          sent_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sis_sped_review_reminders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "student_special_education_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sis_sped_review_reminders_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      ssis_academic_artifacts: {
        Row: {
          artifact_type: string
          created_at: string
          file_name: string | null
          id: string
          linked_assessment_id: string | null
          notes: string | null
          storage_path: string | null
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          artifact_type?: string
          created_at?: string
          file_name?: string | null
          id?: string
          linked_assessment_id?: string | null
          notes?: string | null
          storage_path?: string | null
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          artifact_type?: string
          created_at?: string
          file_name?: string | null
          id?: string
          linked_assessment_id?: string | null
          notes?: string | null
          storage_path?: string | null
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ssis_academic_artifacts_linked_assessment_id_fkey"
            columns: ["linked_assessment_id"]
            isOneToOne: false
            referencedRelation: "student_academic_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssis_academic_artifacts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      ssis_academic_observations: {
        Row: {
          created_at: string
          domain: string
          id: string
          observation_text: string
          observed_at: string
          observed_by: string | null
          school_year_id: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          observation_text: string
          observed_at?: string
          observed_by?: string | null
          school_year_id?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          observation_text?: string
          observed_at?: string
          observed_by?: string | null
          school_year_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ssis_academic_observations_observed_by_fkey"
            columns: ["observed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssis_academic_observations_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssis_academic_observations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      ssis_behavior_plans: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          plan_summary: string | null
          start_date: string | null
          status: string
          strategies: Json
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          plan_summary?: string | null
          start_date?: string | null
          status?: string
          strategies?: Json
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          plan_summary?: string | null
          start_date?: string | null
          status?: string
          strategies?: Json
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ssis_behavior_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      ssis_communication_events: {
        Row: {
          actor_user_id: string | null
          body: string
          channel: string
          created_at: string
          direction: string
          id: string
          occurred_at: string
          platform_timeline_event_id: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          school_id: string | null
          searchable_text: unknown
          student_id: string
          subject: string
        }
        Insert: {
          actor_user_id?: string | null
          body?: string
          channel: string
          created_at?: string
          direction?: string
          id?: string
          occurred_at?: string
          platform_timeline_event_id?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          school_id?: string | null
          searchable_text?: unknown
          student_id: string
          subject: string
        }
        Update: {
          actor_user_id?: string | null
          body?: string
          channel?: string
          created_at?: string
          direction?: string
          id?: string
          occurred_at?: string
          platform_timeline_event_id?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          school_id?: string | null
          searchable_text?: unknown
          student_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "ssis_communication_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssis_communication_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssis_communication_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      ssis_lifecycle_transitions: {
        Row: {
          created_at: string
          from_stage: string
          id: string
          metadata: Json
          notes: string | null
          student_id: string
          to_stage: string
          trigger_source: string
          triggered_by: string | null
          workflow_execution_id: string | null
        }
        Insert: {
          created_at?: string
          from_stage: string
          id?: string
          metadata?: Json
          notes?: string | null
          student_id: string
          to_stage: string
          trigger_source?: string
          triggered_by?: string | null
          workflow_execution_id?: string | null
        }
        Update: {
          created_at?: string
          from_stage?: string
          id?: string
          metadata?: Json
          notes?: string | null
          student_id?: string
          to_stage?: string
          trigger_source?: string
          triggered_by?: string | null
          workflow_execution_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ssis_lifecycle_transitions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssis_lifecycle_transitions_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ssis_medical_expiry_alerts: {
        Row: {
          alert_type: string
          created_at: string
          document_id: string | null
          expires_on: string
          id: string
          is_resolved: boolean
          mission_control_item_id: string | null
          notified_at: string | null
          student_id: string
        }
        Insert: {
          alert_type?: string
          created_at?: string
          document_id?: string | null
          expires_on: string
          id?: string
          is_resolved?: boolean
          mission_control_item_id?: string | null
          notified_at?: string | null
          student_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          document_id?: string | null
          expires_on?: string
          id?: string
          is_resolved?: boolean
          mission_control_item_id?: string | null
          notified_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ssis_medical_expiry_alerts_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "student_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssis_medical_expiry_alerts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      ssis_medication_administration_logs: {
        Row: {
          administered_at: string
          administered_by: string | null
          created_at: string
          dosage: string | null
          id: string
          medication_name: string
          notes: string | null
          student_id: string
        }
        Insert: {
          administered_at?: string
          administered_by?: string | null
          created_at?: string
          dosage?: string | null
          id?: string
          medication_name: string
          notes?: string | null
          student_id: string
        }
        Update: {
          administered_at?: string
          administered_by?: string | null
          created_at?: string
          dosage?: string | null
          id?: string
          medication_name?: string
          notes?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ssis_medication_administration_logs_administered_by_fkey"
            columns: ["administered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssis_medication_administration_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      ssis_parent_engagement_events: {
        Row: {
          created_at: string
          engagement_score: number
          event_type: string
          family_id: string | null
          guardian_id: string | null
          id: string
          metadata: Json
          occurred_at: string
          student_id: string
          summary: string
        }
        Insert: {
          created_at?: string
          engagement_score?: number
          event_type: string
          family_id?: string | null
          guardian_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          student_id: string
          summary: string
        }
        Update: {
          created_at?: string
          engagement_score?: number
          event_type?: string
          family_id?: string | null
          guardian_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          student_id?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "ssis_parent_engagement_events_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssis_parent_engagement_events_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssis_parent_engagement_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      ssis_sped_objectives: {
        Row: {
          created_at: string
          goal_id: string | null
          id: string
          objective_text: string
          plan_id: string
          progress_notes: string | null
          status: string
          student_id: string
          target_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          goal_id?: string | null
          id?: string
          objective_text: string
          plan_id: string
          progress_notes?: string | null
          status?: string
          student_id: string
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          goal_id?: string | null
          id?: string
          objective_text?: string
          plan_id?: string
          progress_notes?: string | null
          status?: string
          student_id?: string
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ssis_sped_objectives_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "student_special_education_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssis_sped_objectives_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "student_special_education_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssis_sped_objectives_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      ssis_student_funding_records: {
        Row: {
          award_amount: number | null
          award_letter_document_id: string | null
          award_year: string | null
          created_at: string
          funding_category: string
          id: string
          metadata: Json
          notes: string | null
          payment_status: string
          program_name: string | null
          renewal_date: string | null
          source_entity_id: string | null
          source_entity_type: string | null
          state_code: string | null
          student_id: string
          updated_at: string
          verification_status: string
        }
        Insert: {
          award_amount?: number | null
          award_letter_document_id?: string | null
          award_year?: string | null
          created_at?: string
          funding_category: string
          id?: string
          metadata?: Json
          notes?: string | null
          payment_status?: string
          program_name?: string | null
          renewal_date?: string | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          state_code?: string | null
          student_id: string
          updated_at?: string
          verification_status?: string
        }
        Update: {
          award_amount?: number | null
          award_letter_document_id?: string | null
          award_year?: string | null
          created_at?: string
          funding_category?: string
          id?: string
          metadata?: Json
          notes?: string | null
          payment_status?: string
          program_name?: string | null
          renewal_date?: string | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          state_code?: string | null
          student_id?: string
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ssis_student_funding_records_award_letter_document_id_fkey"
            columns: ["award_letter_document_id"]
            isOneToOne: false
            referencedRelation: "student_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssis_student_funding_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      ssis_student_sibling_links: {
        Row: {
          created_at: string
          id: string
          relationship_label: string
          sibling_student_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          relationship_label?: string
          sibling_student_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          relationship_label?: string
          sibling_student_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ssis_student_sibling_links_sibling_student_id_fkey"
            columns: ["sibling_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssis_student_sibling_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      ssis_student_success_scores: {
        Row: {
          component_scores: Json
          computed_at: string
          config_snapshot: Json
          id: string
          overall_score: number
          status_indicator: string
          student_id: string
        }
        Insert: {
          component_scores?: Json
          computed_at?: string
          config_snapshot?: Json
          id?: string
          overall_score: number
          status_indicator: string
          student_id: string
        }
        Update: {
          component_scores?: Json
          computed_at?: string
          config_snapshot?: Json
          id?: string
          overall_score?: number
          status_indicator?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ssis_student_success_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      ssis_success_score_config: {
        Row: {
          created_at: string
          green_threshold: number
          id: string
          school_id: string
          updated_at: string
          weights: Json
          yellow_threshold: number
        }
        Insert: {
          created_at?: string
          green_threshold?: number
          id?: string
          school_id: string
          updated_at?: string
          weights?: Json
          yellow_threshold?: number
        }
        Update: {
          created_at?: string
          green_threshold?: number
          id?: string
          school_id?: string
          updated_at?: string
          weights?: Json
          yellow_threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "ssis_success_score_config_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      state_funding_expected_payments: {
        Row: {
          award_year: string | null
          created_at: string
          expected_amount: number
          expected_date: string
          id: string
          notes: string | null
          school_id: string
          state_funding_verification_id: string
          updated_at: string
        }
        Insert: {
          award_year?: string | null
          created_at?: string
          expected_amount: number
          expected_date: string
          id?: string
          notes?: string | null
          school_id: string
          state_funding_verification_id: string
          updated_at?: string
        }
        Update: {
          award_year?: string | null
          created_at?: string
          expected_amount?: number
          expected_date?: string
          id?: string
          notes?: string | null
          school_id?: string
          state_funding_verification_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "state_funding_expected_paymen_state_funding_verification_i_fkey"
            columns: ["state_funding_verification_id"]
            isOneToOne: false
            referencedRelation: "state_funding_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "state_funding_expected_payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      state_funding_received_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          payment_date: string
          recorded_by_user_id: string | null
          reference_number: string | null
          school_id: string
          state_funding_verification_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date: string
          recorded_by_user_id?: string | null
          reference_number?: string | null
          school_id: string
          state_funding_verification_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          recorded_by_user_id?: string | null
          reference_number?: string | null
          school_id?: string
          state_funding_verification_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "state_funding_received_paymen_state_funding_verification_i_fkey"
            columns: ["state_funding_verification_id"]
            isOneToOne: false
            referencedRelation: "state_funding_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "state_funding_received_payments_recorded_by_user_id_fkey"
            columns: ["recorded_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "state_funding_received_payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      state_funding_verifications: {
        Row: {
          application_id: string
          award_amount: number | null
          award_id: string | null
          award_letter_document_id: string | null
          award_year: string | null
          created_at: string
          funding_program_id: string | null
          funding_source_code: string
          id: string
          lead_id: string | null
          notes: string | null
          rejection_reason: string | null
          renewal_date: string | null
          state_code: string | null
          state_program_id: string | null
          state_student_id: string | null
          student_id: string | null
          updated_at: string
          verification_status: string
          verified_at: string | null
          verified_by_user_id: string | null
        }
        Insert: {
          application_id: string
          award_amount?: number | null
          award_id?: string | null
          award_letter_document_id?: string | null
          award_year?: string | null
          created_at?: string
          funding_program_id?: string | null
          funding_source_code: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          rejection_reason?: string | null
          renewal_date?: string | null
          state_code?: string | null
          state_program_id?: string | null
          state_student_id?: string | null
          student_id?: string | null
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
          verified_by_user_id?: string | null
        }
        Update: {
          application_id?: string
          award_amount?: number | null
          award_id?: string | null
          award_letter_document_id?: string | null
          award_year?: string | null
          created_at?: string
          funding_program_id?: string | null
          funding_source_code?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          rejection_reason?: string | null
          renewal_date?: string | null
          state_code?: string | null
          state_program_id?: string | null
          state_student_id?: string | null
          student_id?: string | null
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
          verified_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "state_funding_verifications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "admissions_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "state_funding_verifications_award_letter_document_id_fkey"
            columns: ["award_letter_document_id"]
            isOneToOne: false
            referencedRelation: "application_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "state_funding_verifications_funding_program_id_fkey"
            columns: ["funding_program_id"]
            isOneToOne: false
            referencedRelation: "funding_program_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "state_funding_verifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "admissions_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "state_funding_verifications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "state_funding_verifications_verified_by_user_id_fkey"
            columns: ["verified_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      structured_literacy_progress: {
        Row: {
          artifact_refs: Json
          created_at: string
          id: string
          instructional_minutes: number
          instructional_session_id: string | null
          lesson_history: Json
          literacy_level: number
          literacy_step: number
          mastery_date: string | null
          next_step_recommendation: string | null
          recorded_by: string | null
          student_id: string
          teacher_notes: string | null
          updated_at: string
        }
        Insert: {
          artifact_refs?: Json
          created_at?: string
          id?: string
          instructional_minutes?: number
          instructional_session_id?: string | null
          lesson_history?: Json
          literacy_level: number
          literacy_step: number
          mastery_date?: string | null
          next_step_recommendation?: string | null
          recorded_by?: string | null
          student_id: string
          teacher_notes?: string | null
          updated_at?: string
        }
        Update: {
          artifact_refs?: Json
          created_at?: string
          id?: string
          instructional_minutes?: number
          instructional_session_id?: string | null
          lesson_history?: Json
          literacy_level?: number
          literacy_step?: number
          mastery_date?: string | null
          next_step_recommendation?: string | null
          recorded_by?: string | null
          student_id?: string
          teacher_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "structured_literacy_progress_instructional_session_id_fkey"
            columns: ["instructional_session_id"]
            isOneToOne: false
            referencedRelation: "instructional_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "structured_literacy_progress_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "structured_literacy_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_academic_assessments: {
        Row: {
          assessed_on: string
          assessment_name: string | null
          assessment_type: string
          created_at: string
          id: string
          notes: string | null
          percentile: number | null
          recorded_by: string | null
          school_year_id: string | null
          score: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          assessed_on: string
          assessment_name?: string | null
          assessment_type: string
          created_at?: string
          id?: string
          notes?: string | null
          percentile?: number | null
          recorded_by?: string | null
          school_year_id?: string | null
          score?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          assessed_on?: string
          assessment_name?: string | null
          assessment_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          percentile?: number | null
          recorded_by?: string | null
          school_year_id?: string | null
          score?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_academic_assessments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_academic_assessments_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_academic_assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_academic_goals: {
        Row: {
          created_at: string
          domain: string
          goal_text: string
          id: string
          progress_notes: string | null
          status: string
          student_id: string
          target_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain: string
          goal_text: string
          id?: string
          progress_notes?: string | null
          status?: string
          student_id: string
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string
          goal_text?: string
          id?: string
          progress_notes?: string | null
          status?: string
          student_id?: string
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_academic_goals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_academic_interventions: {
        Row: {
          assigned_employee_id: string | null
          created_at: string
          duration_weeks: number | null
          end_date: string | null
          evidence: Json
          frequency: string | null
          goal_text: string | null
          id: string
          intervention_category: string | null
          intervention_type: string
          notes: string | null
          outcome: string | null
          provider_name: string | null
          provider_user_id: string | null
          review_date: string | null
          start_date: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          assigned_employee_id?: string | null
          created_at?: string
          duration_weeks?: number | null
          end_date?: string | null
          evidence?: Json
          frequency?: string | null
          goal_text?: string | null
          id?: string
          intervention_category?: string | null
          intervention_type: string
          notes?: string | null
          outcome?: string | null
          provider_name?: string | null
          provider_user_id?: string | null
          review_date?: string | null
          start_date?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          assigned_employee_id?: string | null
          created_at?: string
          duration_weeks?: number | null
          end_date?: string | null
          evidence?: Json
          frequency?: string | null
          goal_text?: string | null
          id?: string
          intervention_category?: string | null
          intervention_type?: string
          notes?: string | null
          outcome?: string | null
          provider_name?: string | null
          provider_user_id?: string | null
          review_date?: string | null
          start_date?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_academic_interventions_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_academic_interventions_provider_user_id_fkey"
            columns: ["provider_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_academic_interventions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_academic_progress_records: {
        Row: {
          assessment_date: string
          created_at: string
          current_level: number
          domain: string
          evidence: Json
          growth_summary: string | null
          id: string
          instructional_session_id: string | null
          previous_level: number | null
          recorded_by: string | null
          student_id: string
          teacher_notes: string | null
          updated_at: string
        }
        Insert: {
          assessment_date?: string
          created_at?: string
          current_level: number
          domain: string
          evidence?: Json
          growth_summary?: string | null
          id?: string
          instructional_session_id?: string | null
          previous_level?: number | null
          recorded_by?: string | null
          student_id: string
          teacher_notes?: string | null
          updated_at?: string
        }
        Update: {
          assessment_date?: string
          created_at?: string
          current_level?: number
          domain?: string
          evidence?: Json
          growth_summary?: string | null
          id?: string
          instructional_session_id?: string | null
          previous_level?: number | null
          recorded_by?: string | null
          student_id?: string
          teacher_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_academic_progress_records_instructional_session_id_fkey"
            columns: ["instructional_session_id"]
            isOneToOne: false
            referencedRelation: "instructional_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_academic_progress_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_academic_progress_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_attendance_records: {
        Row: {
          attendance_context: string
          attendance_date: string
          created_at: string
          id: string
          notes: string | null
          parent_notified: boolean
          parent_notified_at: string | null
          recorded_by: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          attendance_context?: string
          attendance_date: string
          created_at?: string
          id?: string
          notes?: string | null
          parent_notified?: boolean
          parent_notified_at?: string | null
          recorded_by?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          attendance_context?: string
          attendance_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          parent_notified?: boolean
          parent_notified_at?: string | null
          recorded_by?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_attendance_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_authorized_contacts: {
        Row: {
          can_pick_up: boolean
          contact_type: string
          created_at: string
          custody_notes: string | null
          email: string | null
          first_name: string
          guardian_id: string | null
          id: string
          is_active: boolean
          last_name: string
          phone: string | null
          receives_communications: boolean
          student_id: string
        }
        Insert: {
          can_pick_up?: boolean
          contact_type?: string
          created_at?: string
          custody_notes?: string | null
          email?: string | null
          first_name: string
          guardian_id?: string | null
          id?: string
          is_active?: boolean
          last_name: string
          phone?: string | null
          receives_communications?: boolean
          student_id: string
        }
        Update: {
          can_pick_up?: boolean
          contact_type?: string
          created_at?: string
          custody_notes?: string | null
          email?: string | null
          first_name?: string
          guardian_id?: string | null
          id?: string
          is_active?: boolean
          last_name?: string
          phone?: string | null
          receives_communications?: boolean
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_authorized_contacts_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_authorized_contacts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_behavior_events: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          intervention_notes: string | null
          occurred_at: string
          parent_notified_at: string | null
          recorded_by: string | null
          restorative_action: string | null
          severity: string
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          intervention_notes?: string | null
          occurred_at?: string
          parent_notified_at?: string | null
          recorded_by?: string | null
          restorative_action?: string | null
          severity?: string
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          intervention_notes?: string | null
          occurred_at?: string
          parent_notified_at?: string | null
          recorded_by?: string | null
          restorative_action?: string | null
          severity?: string
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_behavior_events_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_behavior_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_collaboration_feed_events: {
        Row: {
          actor_employee_id: string | null
          actor_user_id: string | null
          body: string | null
          classification: string
          created_at: string
          event_type: string
          id: string
          metadata: Json
          occurred_at: string
          related_entity_id: string | null
          related_entity_type: string | null
          school_id: string
          student_id: string
          title: string
        }
        Insert: {
          actor_employee_id?: string | null
          actor_user_id?: string | null
          body?: string | null
          classification?: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          occurred_at?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          school_id: string
          student_id: string
          title: string
        }
        Update: {
          actor_employee_id?: string | null
          actor_user_id?: string | null
          body?: string | null
          classification?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          school_id?: string
          student_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_collaboration_feed_events_actor_employee_id_fkey"
            columns: ["actor_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_collaboration_feed_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_collaboration_feed_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_collaboration_feed_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_documents: {
        Row: {
          application_document_id: string | null
          created_at: string
          document_subtype: string | null
          document_type: string
          expires_at: string | null
          file_name: string
          file_size_bytes: number | null
          id: string
          inherited_at: string | null
          mime_type: string | null
          parent_document_id: string | null
          signature_id: string | null
          source_type: string
          status: string
          storage_path: string
          student_id: string
          updated_at: string
          uploaded_by: string | null
          version_number: number
        }
        Insert: {
          application_document_id?: string | null
          created_at?: string
          document_subtype?: string | null
          document_type: string
          expires_at?: string | null
          file_name: string
          file_size_bytes?: number | null
          id?: string
          inherited_at?: string | null
          mime_type?: string | null
          parent_document_id?: string | null
          signature_id?: string | null
          source_type?: string
          status?: string
          storage_path: string
          student_id: string
          updated_at?: string
          uploaded_by?: string | null
          version_number?: number
        }
        Update: {
          application_document_id?: string | null
          created_at?: string
          document_subtype?: string | null
          document_type?: string
          expires_at?: string | null
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          inherited_at?: string | null
          mime_type?: string | null
          parent_document_id?: string | null
          signature_id?: string | null
          source_type?: string
          status?: string
          storage_path?: string
          student_id?: string
          updated_at?: string
          uploaded_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_application_document_id_fkey"
            columns: ["application_document_id"]
            isOneToOne: false
            referencedRelation: "application_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "student_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_signature_id_fkey"
            columns: ["signature_id"]
            isOneToOne: false
            referencedRelation: "platform_digital_signatures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          course_section_id: string
          created_at: string
          dropped_at: string | null
          enrolled_at: string
          enrollment_status: string
          id: string
          school_year_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          course_section_id: string
          created_at?: string
          dropped_at?: string | null
          enrolled_at?: string
          enrollment_status?: string
          id?: string
          school_year_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          course_section_id?: string
          created_at?: string
          dropped_at?: string | null
          enrolled_at?: string
          enrollment_status?: string
          id?: string
          school_year_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_course_section_id_fkey"
            columns: ["course_section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_family_link: {
        Row: {
          created_at: string | null
          id: string
          relationship_type: string | null
          student_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          relationship_type?: string | null
          student_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          relationship_type?: string | null
          student_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_family_link_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_family_link_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_funding_sources: {
        Row: {
          created_at: string
          funding_source_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          funding_source_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          funding_source_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_funding_sources_funding_source_id_fkey"
            columns: ["funding_source_id"]
            isOneToOne: false
            referencedRelation: "funding_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_funding_sources_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_growth_goals: {
        Row: {
          assigned_employee_id: string | null
          baseline: string | null
          created_at: string
          description: string | null
          evidence: Json
          goal_source: string
          id: string
          progress_notes: string | null
          progress_pct: number
          review_date: string | null
          source_entity_id: string | null
          source_entity_type: string | null
          status: string
          student_id: string
          subject_domain: string | null
          success_criteria: string | null
          target: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_employee_id?: string | null
          baseline?: string | null
          created_at?: string
          description?: string | null
          evidence?: Json
          goal_source: string
          id?: string
          progress_notes?: string | null
          progress_pct?: number
          review_date?: string | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          status?: string
          student_id: string
          subject_domain?: string | null
          success_criteria?: string | null
          target?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_employee_id?: string | null
          baseline?: string | null
          created_at?: string
          description?: string | null
          evidence?: Json
          goal_source?: string
          id?: string
          progress_notes?: string | null
          progress_pct?: number
          review_date?: string | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          status?: string
          student_id?: string
          subject_domain?: string | null
          success_criteria?: string | null
          target?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_growth_goals_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_growth_goals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_instructional_meeting_participants: {
        Row: {
          attended: boolean
          created_at: string
          employee_id: string | null
          id: string
          meeting_id: string
          participant_name: string | null
          participant_role: string | null
        }
        Insert: {
          attended?: boolean
          created_at?: string
          employee_id?: string | null
          id?: string
          meeting_id: string
          participant_name?: string | null
          participant_role?: string | null
        }
        Update: {
          attended?: boolean
          created_at?: string
          employee_id?: string | null
          id?: string
          meeting_id?: string
          participant_name?: string | null
          participant_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_instructional_meeting_participants_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_instructional_meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "student_instructional_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      student_instructional_meeting_tasks: {
        Row: {
          assigned_employee_id: string | null
          created_at: string
          due_date: string | null
          id: string
          meeting_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_employee_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          meeting_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_employee_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          meeting_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_instructional_meeting_tasks_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_instructional_meeting_tasks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "student_instructional_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      student_instructional_meetings: {
        Row: {
          agenda: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          decisions: string | null
          follow_up_date: string | null
          id: string
          meeting_type: string
          notes: string | null
          parent_notes: string | null
          parent_response_status: string | null
          parent_visible: boolean
          scheduled_at: string | null
          school_id: string
          ssis_event_id: string | null
          status: string
          student_id: string
          title: string
          updated_at: string
          virtual_meeting_url: string | null
        }
        Insert: {
          agenda?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          decisions?: string | null
          follow_up_date?: string | null
          id?: string
          meeting_type: string
          notes?: string | null
          parent_notes?: string | null
          parent_response_status?: string | null
          parent_visible?: boolean
          scheduled_at?: string | null
          school_id: string
          ssis_event_id?: string | null
          status?: string
          student_id: string
          title: string
          updated_at?: string
          virtual_meeting_url?: string | null
        }
        Update: {
          agenda?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          decisions?: string | null
          follow_up_date?: string | null
          id?: string
          meeting_type?: string
          notes?: string | null
          parent_notes?: string | null
          parent_response_status?: string | null
          parent_visible?: boolean
          scheduled_at?: string | null
          school_id?: string
          ssis_event_id?: string | null
          status?: string
          student_id?: string
          title?: string
          updated_at?: string
          virtual_meeting_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_instructional_meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_instructional_meetings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_instructional_meetings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_instructional_team_members: {
        Row: {
          created_at: string
          employee_id: string
          ends_on: string | null
          id: string
          is_active: boolean
          is_primary: boolean
          notes: string | null
          starts_on: string | null
          team_id: string
          team_role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          ends_on?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          notes?: string | null
          starts_on?: string | null
          team_id: string
          team_role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          ends_on?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          notes?: string | null
          starts_on?: string | null
          team_id?: string
          team_role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_instructional_team_members_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_instructional_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "student_instructional_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      student_instructional_teams: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          school_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          school_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          school_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_instructional_teams_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_instructional_teams_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_learning_artifacts: {
        Row: {
          artifact_type: string
          assessment_id: string | null
          created_at: string
          description: string | null
          file_name: string | null
          growth_goal_id: string | null
          id: string
          instructional_session_id: string | null
          intervention_id: string | null
          learning_objective: string | null
          lesson_plan_id: string | null
          metadata: Json
          mime_type: string | null
          recorded_by_employee_id: string | null
          storage_path: string
          student_id: string
          subject_domain: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
          visible_to_parent: boolean
        }
        Insert: {
          artifact_type: string
          assessment_id?: string | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          growth_goal_id?: string | null
          id?: string
          instructional_session_id?: string | null
          intervention_id?: string | null
          learning_objective?: string | null
          lesson_plan_id?: string | null
          metadata?: Json
          mime_type?: string | null
          recorded_by_employee_id?: string | null
          storage_path: string
          student_id: string
          subject_domain?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          visible_to_parent?: boolean
        }
        Update: {
          artifact_type?: string
          assessment_id?: string | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          growth_goal_id?: string | null
          id?: string
          instructional_session_id?: string | null
          intervention_id?: string | null
          learning_objective?: string | null
          lesson_plan_id?: string | null
          metadata?: Json
          mime_type?: string | null
          recorded_by_employee_id?: string | null
          storage_path?: string
          student_id?: string
          subject_domain?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          visible_to_parent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "student_learning_artifacts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "student_academic_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_learning_artifacts_growth_goal_id_fkey"
            columns: ["growth_goal_id"]
            isOneToOne: false
            referencedRelation: "student_growth_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_learning_artifacts_instructional_session_id_fkey"
            columns: ["instructional_session_id"]
            isOneToOne: false
            referencedRelation: "instructional_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_learning_artifacts_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "student_academic_interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_learning_artifacts_lesson_plan_fk"
            columns: ["lesson_plan_id"]
            isOneToOne: false
            referencedRelation: "teacher_lesson_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_learning_artifacts_recorded_by_employee_id_fkey"
            columns: ["recorded_by_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_learning_artifacts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_learning_artifacts_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_learning_profiles: {
        Row: {
          accommodations: Json
          adhd: boolean | null
          autism: boolean | null
          career_interests: string | null
          created_at: string
          dyslexia: boolean | null
          executive_function: boolean | null
          gifted: boolean | null
          id: string
          iep_status: string
          learning_style: string | null
          math_level: string | null
          plan_504_status: string
          primary_challenges: string | null
          primary_strengths: string | null
          reading_level: string | null
          science_level: string | null
          structured_literacy_level: string | null
          student_id: string
          support_notes: string | null
          updated_at: string
          writing_level: string | null
        }
        Insert: {
          accommodations?: Json
          adhd?: boolean | null
          autism?: boolean | null
          career_interests?: string | null
          created_at?: string
          dyslexia?: boolean | null
          executive_function?: boolean | null
          gifted?: boolean | null
          id?: string
          iep_status?: string
          learning_style?: string | null
          math_level?: string | null
          plan_504_status?: string
          primary_challenges?: string | null
          primary_strengths?: string | null
          reading_level?: string | null
          science_level?: string | null
          structured_literacy_level?: string | null
          student_id: string
          support_notes?: string | null
          updated_at?: string
          writing_level?: string | null
        }
        Update: {
          accommodations?: Json
          adhd?: boolean | null
          autism?: boolean | null
          career_interests?: string | null
          created_at?: string
          dyslexia?: boolean | null
          executive_function?: boolean | null
          gifted?: boolean | null
          id?: string
          iep_status?: string
          learning_style?: string | null
          math_level?: string | null
          plan_504_status?: string
          primary_challenges?: string | null
          primary_strengths?: string | null
          reading_level?: string | null
          science_level?: string | null
          structured_literacy_level?: string | null
          student_id?: string
          support_notes?: string | null
          updated_at?: string
          writing_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_learning_profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_medical_profiles: {
        Row: {
          allergies: Json
          created_at: string
          diabetes_plan: string | null
          diagnoses: Json
          dietary_restrictions: Json
          emergency_medical_plan: string | null
          health_alerts: Json
          id: string
          immunizations: Json
          insurance_carrier: string | null
          insurance_group_number: string | null
          insurance_policy_number: string | null
          medications: Json
          notes: string | null
          physician_name: string | null
          physician_phone: string | null
          physician_practice: string | null
          primary_physician: Json
          seizure_plan: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          allergies?: Json
          created_at?: string
          diabetes_plan?: string | null
          diagnoses?: Json
          dietary_restrictions?: Json
          emergency_medical_plan?: string | null
          health_alerts?: Json
          id?: string
          immunizations?: Json
          insurance_carrier?: string | null
          insurance_group_number?: string | null
          insurance_policy_number?: string | null
          medications?: Json
          notes?: string | null
          physician_name?: string | null
          physician_phone?: string | null
          physician_practice?: string | null
          primary_physician?: Json
          seizure_plan?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          allergies?: Json
          created_at?: string
          diabetes_plan?: string | null
          diagnoses?: Json
          dietary_restrictions?: Json
          emergency_medical_plan?: string | null
          health_alerts?: Json
          id?: string
          immunizations?: Json
          insurance_carrier?: string | null
          insurance_group_number?: string | null
          insurance_policy_number?: string | null
          medications?: Json
          notes?: string | null
          physician_name?: string | null
          physician_phone?: string | null
          physician_practice?: string | null
          primary_physician?: Json
          seizure_plan?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_medical_profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_period_attendance: {
        Row: {
          attendance_date: string
          created_at: string
          id: string
          notes: string | null
          period_number: number
          recorded_by: string | null
          status: string
          student_id: string
        }
        Insert: {
          attendance_date: string
          created_at?: string
          id?: string
          notes?: string | null
          period_number: number
          recorded_by?: string | null
          status: string
          student_id: string
        }
        Update: {
          attendance_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          period_number?: number
          recorded_by?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_period_attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_period_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_schedule_preferences: {
        Row: {
          availability_notes: string | null
          created_at: string
          day_of_week: number
          id: string
          preferred_end_time_et: string | null
          preferred_end_time_local: string | null
          preferred_start_time_et: string | null
          preferred_start_time_local: string | null
          school_year_id: string | null
          student_id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          availability_notes?: string | null
          created_at?: string
          day_of_week: number
          id?: string
          preferred_end_time_et?: string | null
          preferred_end_time_local?: string | null
          preferred_start_time_et?: string | null
          preferred_start_time_local?: string | null
          school_year_id?: string | null
          student_id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          availability_notes?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          preferred_end_time_et?: string | null
          preferred_end_time_local?: string | null
          preferred_start_time_et?: string | null
          preferred_start_time_local?: string | null
          school_year_id?: string | null
          student_id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_schedule_preferences_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_schedule_preferences_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_service_sessions: {
        Row: {
          created_at: string
          delivered_at: string | null
          duration_minutes: number | null
          id: string
          minutes_delivered: number | null
          missed_reason: string | null
          notes: string | null
          progress_notes: string | null
          provider_name: string | null
          provider_user_id: string | null
          scheduled_at: string | null
          service_type: string
          session_status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          duration_minutes?: number | null
          id?: string
          minutes_delivered?: number | null
          missed_reason?: string | null
          notes?: string | null
          progress_notes?: string | null
          provider_name?: string | null
          provider_user_id?: string | null
          scheduled_at?: string | null
          service_type: string
          session_status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          duration_minutes?: number | null
          id?: string
          minutes_delivered?: number | null
          missed_reason?: string | null
          notes?: string | null
          progress_notes?: string | null
          provider_name?: string | null
          provider_user_id?: string | null
          scheduled_at?: string | null
          service_type?: string
          session_status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_service_sessions_provider_user_id_fkey"
            columns: ["provider_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_service_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_special_education_goals: {
        Row: {
          created_at: string
          goal_area: string
          goal_text: string
          id: string
          plan_id: string | null
          progress_notes: string | null
          status: string
          student_id: string
          target_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          goal_area: string
          goal_text: string
          id?: string
          plan_id?: string | null
          progress_notes?: string | null
          status?: string
          student_id: string
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          goal_area?: string
          goal_text?: string
          id?: string
          plan_id?: string | null
          progress_notes?: string | null
          status?: string
          student_id?: string
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_special_education_goals_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "student_special_education_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_special_education_goals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_special_education_plans: {
        Row: {
          accommodations: Json
          annual_review_date: string | null
          created_at: string
          document_storage_path: string | null
          eligibility_category: string | null
          evaluation_date: string | null
          id: string
          last_meeting_date: string | null
          meeting_dates: Json
          modifications: Json
          notes: string | null
          plan_type: string
          present_levels: Json
          progress_monitoring: Json
          reevaluation_date: string | null
          related_services: Json
          service_minutes: Json
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          accommodations?: Json
          annual_review_date?: string | null
          created_at?: string
          document_storage_path?: string | null
          eligibility_category?: string | null
          evaluation_date?: string | null
          id?: string
          last_meeting_date?: string | null
          meeting_dates?: Json
          modifications?: Json
          notes?: string | null
          plan_type: string
          present_levels?: Json
          progress_monitoring?: Json
          reevaluation_date?: string | null
          related_services?: Json
          service_minutes?: Json
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          accommodations?: Json
          annual_review_date?: string | null
          created_at?: string
          document_storage_path?: string | null
          eligibility_category?: string | null
          evaluation_date?: string | null
          id?: string
          last_meeting_date?: string | null
          meeting_dates?: Json
          modifications?: Json
          notes?: string | null
          plan_type?: string
          present_levels?: Json
          progress_monitoring?: Json
          reevaluation_date?: string | null
          related_services?: Json
          service_minutes?: Json
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_special_education_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          admissions_application_id: string | null
          admissions_lead_id: string | null
          campus_id: string | null
          created_at: string
          date_of_birth: string | null
          enrollment_exit_date: string | null
          enrollment_start_date: string | null
          enrollment_status: string
          family_id: string | null
          first_name: string
          gender: string | null
          grade_level: string | null
          graduation_year: number | null
          id: string
          last_name: string
          legal_middle_name: string | null
          lifecycle_stage: string
          photo_storage_path: string | null
          photo_url: string | null
          preferred_name: string | null
          program: string | null
          school_id: string | null
          school_year_id: string | null
          state_student_ids: Json
          status: string | null
          student_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admissions_application_id?: string | null
          admissions_lead_id?: string | null
          campus_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          enrollment_exit_date?: string | null
          enrollment_start_date?: string | null
          enrollment_status?: string
          family_id?: string | null
          first_name: string
          gender?: string | null
          grade_level?: string | null
          graduation_year?: number | null
          id?: string
          last_name: string
          legal_middle_name?: string | null
          lifecycle_stage?: string
          photo_storage_path?: string | null
          photo_url?: string | null
          preferred_name?: string | null
          program?: string | null
          school_id?: string | null
          school_year_id?: string | null
          state_student_ids?: Json
          status?: string | null
          student_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admissions_application_id?: string | null
          admissions_lead_id?: string | null
          campus_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          enrollment_exit_date?: string | null
          enrollment_start_date?: string | null
          enrollment_status?: string
          family_id?: string | null
          first_name?: string
          gender?: string | null
          grade_level?: string | null
          graduation_year?: number | null
          id?: string
          last_name?: string
          legal_middle_name?: string | null
          lifecycle_stage?: string
          photo_storage_path?: string | null
          photo_url?: string | null
          preferred_name?: string | null
          program?: string | null
          school_id?: string | null
          school_year_id?: string | null
          state_student_ids?: Json
          status?: string | null
          student_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_admissions_application_id_fkey"
            columns: ["admissions_application_id"]
            isOneToOne: false
            referencedRelation: "admissions_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_admissions_lead_id_fkey"
            columns: ["admissions_lead_id"]
            isOneToOne: false
            referencedRelation: "admissions_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      substitute_assignments: {
        Row: {
          assigned_at: string
          created_at: string
          hours_worked: number | null
          id: string
          instructional_session_id: string | null
          lesson_plan_notes: string | null
          performance_notes: string | null
          status: string
          substitute_id: string
        }
        Insert: {
          assigned_at?: string
          created_at?: string
          hours_worked?: number | null
          id?: string
          instructional_session_id?: string | null
          lesson_plan_notes?: string | null
          performance_notes?: string | null
          status?: string
          substitute_id: string
        }
        Update: {
          assigned_at?: string
          created_at?: string
          hours_worked?: number | null
          id?: string
          instructional_session_id?: string | null
          lesson_plan_notes?: string | null
          performance_notes?: string | null
          status?: string
          substitute_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "substitute_assignments_instructional_session_id_fkey"
            columns: ["instructional_session_id"]
            isOneToOne: false
            referencedRelation: "instructional_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "substitute_assignments_substitute_id_fkey"
            columns: ["substitute_id"]
            isOneToOne: false
            referencedRelation: "substitute_pool_members"
            referencedColumns: ["id"]
          },
        ]
      }
      substitute_pool_members: {
        Row: {
          availability_notes: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          credentials_verified: boolean
          employee_id: string | null
          id: string
          school_id: string
          status: string
          substitute_name: string
        }
        Insert: {
          availability_notes?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          credentials_verified?: boolean
          employee_id?: string | null
          id?: string
          school_id: string
          status?: string
          substitute_name: string
        }
        Update: {
          availability_notes?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          credentials_verified?: boolean
          employee_id?: string | null
          id?: string
          school_id?: string
          status?: string
          substitute_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "substitute_pool_members_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "substitute_pool_members_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_ai_readiness_config: {
        Row: {
          capabilities: Json
          created_at: string
          id: string
          integration_hooks: Json
          notes: string | null
          school_id: string
          updated_at: string
        }
        Insert: {
          capabilities?: Json
          created_at?: string
          id?: string
          integration_hooks?: Json
          notes?: string | null
          school_id: string
          updated_at?: string
        }
        Update: {
          capabilities?: Json
          created_at?: string
          id?: string
          integration_hooks?: Json
          notes?: string | null
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_ai_readiness_config_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_instructional_notes: {
        Row: {
          body: string
          category: string
          created_at: string
          created_by: string | null
          employee_id: string
          id: string
          instructional_session_id: string | null
          is_private: boolean
          student_id: string | null
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          category: string
          created_at?: string
          created_by?: string | null
          employee_id: string
          id?: string
          instructional_session_id?: string | null
          is_private?: boolean
          student_id?: string | null
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          created_by?: string | null
          employee_id?: string
          id?: string
          instructional_session_id?: string | null
          is_private?: boolean
          student_id?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_instructional_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_instructional_notes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_instructional_notes_instructional_session_id_fkey"
            columns: ["instructional_session_id"]
            isOneToOne: false
            referencedRelation: "instructional_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_instructional_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_lesson_plan_sections: {
        Row: {
          course_section_id: string
          created_at: string
          id: string
          lesson_plan_id: string
        }
        Insert: {
          course_section_id: string
          created_at?: string
          id?: string
          lesson_plan_id: string
        }
        Update: {
          course_section_id?: string
          created_at?: string
          id?: string
          lesson_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_lesson_plan_sections_course_section_id_fkey"
            columns: ["course_section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_lesson_plan_sections_lesson_plan_id_fkey"
            columns: ["lesson_plan_id"]
            isOneToOne: false
            referencedRelation: "teacher_lesson_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_lesson_plans: {
        Row: {
          accommodations: string | null
          activities: Json
          artifact_refs: Json
          assessments: Json
          created_at: string
          differentiation: string | null
          employee_id: string
          homework: string | null
          id: string
          is_reusable: boolean
          materials: Json
          objectives: Json
          school_id: string
          status: string
          subject_domain: string | null
          title: string
          updated_at: string
        }
        Insert: {
          accommodations?: string | null
          activities?: Json
          artifact_refs?: Json
          assessments?: Json
          created_at?: string
          differentiation?: string | null
          employee_id: string
          homework?: string | null
          id?: string
          is_reusable?: boolean
          materials?: Json
          objectives?: Json
          school_id: string
          status?: string
          subject_domain?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          accommodations?: string | null
          activities?: Json
          artifact_refs?: Json
          assessments?: Json
          created_at?: string
          differentiation?: string | null
          employee_id?: string
          homework?: string | null
          id?: string
          is_reusable?: boolean
          materials?: Json
          objectives?: Json
          school_id?: string
          status?: string
          subject_domain?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_lesson_plans_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_lesson_plans_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_parent_outreach: {
        Row: {
          artifact_ids: string[]
          body: string
          created_at: string
          created_by: string | null
          employee_id: string
          id: string
          message_type: string
          sent_at: string | null
          ssis_event_id: string | null
          status: string
          student_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          artifact_ids?: string[]
          body: string
          created_at?: string
          created_by?: string | null
          employee_id: string
          id?: string
          message_type: string
          sent_at?: string | null
          ssis_event_id?: string | null
          status?: string
          student_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          artifact_ids?: string[]
          body?: string
          created_at?: string
          created_by?: string | null
          employee_id?: string
          id?: string
          message_type?: string
          sent_at?: string | null
          ssis_event_id?: string | null
          status?: string
          student_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_parent_outreach_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_parent_outreach_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_parent_outreach_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      tuition_plans: {
        Row: {
          annual_amount: number
          billing_frequency: string
          created_at: string
          description: string | null
          hourly_rate: number | null
          id: string
          name: string
          payment_schedule: string
          program: string | null
          school_id: string
          service_type: string
          status: string
          tax_rate_percent: number
          updated_at: string
        }
        Insert: {
          annual_amount: number
          billing_frequency?: string
          created_at?: string
          description?: string | null
          hourly_rate?: number | null
          id?: string
          name: string
          payment_schedule?: string
          program?: string | null
          school_id: string
          service_type?: string
          status?: string
          tax_rate_percent?: number
          updated_at?: string
        }
        Update: {
          annual_amount?: number
          billing_frequency?: string
          created_at?: string
          description?: string | null
          hourly_rate?: number | null
          id?: string
          name?: string
          payment_schedule?: string
          program?: string | null
          school_id?: string
          service_type?: string
          status?: string
          tax_rate_percent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tuition_plans_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mfa_settings: {
        Row: {
          email_verification_enabled: boolean
          last_verified_at: string | null
          metadata: Json
          mfa_required: boolean
          passkey_enabled: boolean
          preferred_method: string | null
          sms_enabled: boolean
          totp_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          email_verification_enabled?: boolean
          last_verified_at?: string | null
          metadata?: Json
          mfa_required?: boolean
          passkey_enabled?: boolean
          preferred_method?: string | null
          sms_enabled?: boolean
          totp_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          email_verification_enabled?: boolean
          last_verified_at?: string | null
          metadata?: Json
          mfa_required?: boolean
          passkey_enabled?: boolean
          preferred_method?: string | null
          sms_enabled?: boolean
          totp_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mfa_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_org_assignments: {
        Row: {
          all_campuses: boolean
          all_programs: boolean
          campus_id: string | null
          created_at: string
          department_id: string | null
          id: string
          is_primary: boolean
          program_id: string | null
          school_id: string
          user_id: string
        }
        Insert: {
          all_campuses?: boolean
          all_programs?: boolean
          campus_id?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          is_primary?: boolean
          program_id?: string | null
          school_id: string
          user_id: string
        }
        Update: {
          all_campuses?: boolean
          all_programs?: boolean
          campus_id?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          is_primary?: boolean
          program_id?: string | null
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_org_assignments_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_org_assignments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "org_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_org_assignments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "org_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_org_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_org_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organization_memberships: {
        Row: {
          created_at: string
          id: string
          invited_at: string | null
          is_primary: boolean
          joined_at: string | null
          membership_role: string
          organization_id: string
          permissions: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string | null
          is_primary?: boolean
          joined_at?: string | null
          membership_role?: string
          organization_id: string
          permissions?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string | null
          is_primary?: boolean
          joined_at?: string | null
          membership_role?: string
          organization_id?: string
          permissions?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_organization_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          accessibility: Json
          communication: Json
          dashboard_layout: Json
          language: string
          mission_control_widgets: Json
          notifications: Json
          theme: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accessibility?: Json
          communication?: Json
          dashboard_layout?: Json
          language?: string
          mission_control_widgets?: Json
          notifications?: Json
          theme?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accessibility?: Json
          communication?: Json
          dashboard_layout?: Json
          language?: string
          mission_control_widgets?: Json
          notifications?: Json
          theme?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          role_id: string
          user_id: string
        }
        Insert: {
          role_id: string
          user_id: string
        }
        Update: {
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_schools: {
        Row: {
          created_at: string | null
          id: string
          school_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          school_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          school_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_schools_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_schools_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email: string
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          title?: string | null
        }
        Relationships: []
      }
      volunteer_hours: {
        Row: {
          assignment_description: string
          created_at: string
          hours_served: number
          id: string
          served_at: string
          volunteer_id: string
        }
        Insert: {
          assignment_description: string
          created_at?: string
          hours_served: number
          id?: string
          served_at: string
          volunteer_id: string
        }
        Update: {
          assignment_description?: string
          created_at?: string
          hours_served?: number
          id?: string
          served_at?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_hours_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteers: {
        Row: {
          background_check_status: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          id: string
          last_name: string
          school_id: string
          status: string
          training_completed: boolean
        }
        Insert: {
          background_check_status?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          id?: string
          last_name: string
          school_id: string
          status?: string
          training_completed?: boolean
        }
        Update: {
          background_check_status?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          id?: string
          last_name?: string
          school_id?: string
          status?: string
          training_completed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "volunteers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      work_activity_log: {
        Row: {
          action_type: string
          actor_user_id: string | null
          after_state: Json | null
          before_state: Json | null
          id: string
          metadata: Json
          occurred_at: string
          project_id: string | null
          summary: string
          task_id: string | null
        }
        Insert: {
          action_type: string
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          id?: string
          metadata?: Json
          occurred_at?: string
          project_id?: string | null
          summary: string
          task_id?: string | null
        }
        Update: {
          action_type?: string
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          id?: string
          metadata?: Json
          occurred_at?: string
          project_id?: string | null
          summary?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_activity_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "work_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "work_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      work_checklist_items: {
        Row: {
          checklist_id: string
          completed_at: string | null
          completed_by: string | null
          id: string
          is_completed: boolean
          label: string
          sort_order: number
        }
        Insert: {
          checklist_id: string
          completed_at?: string | null
          completed_by?: string | null
          id?: string
          is_completed?: boolean
          label: string
          sort_order?: number
        }
        Update: {
          checklist_id?: string
          completed_at?: string | null
          completed_by?: string | null
          id?: string
          is_completed?: boolean
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "work_checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "work_task_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_checklist_items_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      work_milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          project_id: string
          sort_order: number
          status: string
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          project_id: string
          sort_order?: number
          status?: string
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          project_id?: string
          sort_order?: number
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "work_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      work_playbook_runs: {
        Row: {
          completed_at: string | null
          id: string
          metadata: Json
          playbook_id: string
          project_id: string | null
          school_id: string | null
          started_at: string
          started_by: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          metadata?: Json
          playbook_id: string
          project_id?: string | null
          school_id?: string | null
          started_at?: string
          started_by?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          metadata?: Json
          playbook_id?: string
          project_id?: string | null
          school_id?: string | null
          started_at?: string
          started_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_playbook_runs_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "work_playbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_playbook_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "work_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_playbook_runs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_playbook_runs_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      work_playbook_steps: {
        Row: {
          assigned_role: string | null
          checklist: Json
          compliance_category_key: string | null
          created_at: string
          creates_compliance: boolean
          creates_meeting: boolean
          default_priority: string
          default_risk: string
          description: string | null
          estimated_hours: number | null
          id: string
          metadata: Json
          offset_days: number
          playbook_id: string
          requires_approval: boolean
          step_order: number
          task_type: string
          title: string
        }
        Insert: {
          assigned_role?: string | null
          checklist?: Json
          compliance_category_key?: string | null
          created_at?: string
          creates_compliance?: boolean
          creates_meeting?: boolean
          default_priority?: string
          default_risk?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          metadata?: Json
          offset_days?: number
          playbook_id: string
          requires_approval?: boolean
          step_order?: number
          task_type?: string
          title: string
        }
        Update: {
          assigned_role?: string | null
          checklist?: Json
          compliance_category_key?: string | null
          created_at?: string
          creates_compliance?: boolean
          creates_meeting?: boolean
          default_priority?: string
          default_risk?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          metadata?: Json
          offset_days?: number
          playbook_id?: string
          requires_approval?: boolean
          step_order?: number
          task_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_playbook_steps_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "work_playbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      work_playbooks: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          estimated_duration_days: number | null
          id: string
          is_active: boolean
          is_system: boolean
          metadata: Json
          name: string
          playbook_key: string
          project_type: string
          school_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_duration_days?: number | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          metadata?: Json
          name: string
          playbook_key: string
          project_type?: string
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_duration_days?: number | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          metadata?: Json
          name?: string
          playbook_key?: string
          project_type?: string
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_playbooks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_playbooks_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      work_project_risks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          impact: string
          likelihood: string
          mitigation_plan: string | null
          owner_user_id: string | null
          project_id: string
          risk_score: number
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          impact?: string
          likelihood?: string
          mitigation_plan?: string | null
          owner_user_id?: string | null
          project_id: string
          risk_score?: number
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          impact?: string
          likelihood?: string
          mitigation_plan?: string | null
          owner_user_id?: string | null
          project_id?: string
          risk_score?: number
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_project_risks_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_project_risks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "work_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      work_projects: {
        Row: {
          budget_amount: number | null
          budget_spent: number
          campus_id: string | null
          completed_date: string | null
          completion_pct: number
          compliance_requirement_id: string | null
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          employee_id: string | null
          family_id: string | null
          grant_id: string | null
          health_indicator: string
          id: string
          metadata: Json
          name: string
          owner_user_id: string | null
          playbook_id: string | null
          playbook_run_id: string | null
          priority: string
          program: string | null
          project_key: string | null
          project_type: string
          risk_level: string
          scholarship_application_id: string | null
          school_id: string | null
          source_entity_id: string | null
          source_entity_type: string | null
          source_module: string | null
          start_date: string | null
          status: string
          student_id: string | null
          target_date: string | null
          updated_at: string
        }
        Insert: {
          budget_amount?: number | null
          budget_spent?: number
          campus_id?: string | null
          completed_date?: string | null
          completion_pct?: number
          compliance_requirement_id?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          employee_id?: string | null
          family_id?: string | null
          grant_id?: string | null
          health_indicator?: string
          id?: string
          metadata?: Json
          name: string
          owner_user_id?: string | null
          playbook_id?: string | null
          playbook_run_id?: string | null
          priority?: string
          program?: string | null
          project_key?: string | null
          project_type?: string
          risk_level?: string
          scholarship_application_id?: string | null
          school_id?: string | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          source_module?: string | null
          start_date?: string | null
          status?: string
          student_id?: string | null
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          budget_amount?: number | null
          budget_spent?: number
          campus_id?: string | null
          completed_date?: string | null
          completion_pct?: number
          compliance_requirement_id?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          employee_id?: string | null
          family_id?: string | null
          grant_id?: string | null
          health_indicator?: string
          id?: string
          metadata?: Json
          name?: string
          owner_user_id?: string | null
          playbook_id?: string | null
          playbook_run_id?: string | null
          priority?: string
          program?: string | null
          project_key?: string | null
          project_type?: string
          risk_level?: string
          scholarship_application_id?: string | null
          school_id?: string | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          source_module?: string | null
          start_date?: string | null
          status?: string
          student_id?: string | null
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_projects_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_projects_compliance_requirement_id_fkey"
            columns: ["compliance_requirement_id"]
            isOneToOne: false
            referencedRelation: "executive_compliance_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_projects_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_projects_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_projects_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_projects_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "work_playbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_projects_playbook_run_id_fkey"
            columns: ["playbook_run_id"]
            isOneToOne: false
            referencedRelation: "work_playbook_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_projects_scholarship_application_id_fkey"
            columns: ["scholarship_application_id"]
            isOneToOne: false
            referencedRelation: "scholarship_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_projects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_projects_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      work_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          entity_id: string
          entity_type: string
          from_status: string | null
          id: string
          reason: string | null
          to_status: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          entity_id: string
          entity_type: string
          from_status?: string | null
          id?: string
          reason?: string | null
          to_status: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          entity_id?: string
          entity_type?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      work_task_assignees: {
        Row: {
          assigned_at: string
          id: string
          role: string
          task_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          role?: string
          task_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          role?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "work_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_task_assignees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      work_task_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          task_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          task_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          task_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "work_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_task_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      work_task_checklists: {
        Row: {
          created_at: string
          id: string
          sort_order: number
          task_id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          sort_order?: number
          task_id: string
          title?: string
        }
        Update: {
          created_at?: string
          id?: string
          sort_order?: number
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_task_checklists_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "work_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      work_task_comments: {
        Row: {
          author_user_id: string | null
          body: string
          created_at: string
          id: string
          is_internal: boolean
          task_id: string
          updated_at: string
        }
        Insert: {
          author_user_id?: string | null
          body: string
          created_at?: string
          id?: string
          is_internal?: boolean
          task_id: string
          updated_at?: string
        }
        Update: {
          author_user_id?: string | null
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_task_comments_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "work_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      work_task_dependencies: {
        Row: {
          created_at: string
          dependency_type: string
          depends_on_task_id: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          dependency_type?: string
          depends_on_task_id: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          dependency_type?: string
          depends_on_task_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "work_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "work_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      work_tasks: {
        Row: {
          actual_hours: number
          approval_request_id: string | null
          calendar_event_id: string | null
          campus_id: string | null
          completed_date: string | null
          completion_pct: number
          compliance_obligation_id: string | null
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          due_date: string | null
          employee_id: string | null
          estimated_hours: number | null
          family_id: string | null
          financial_transaction_id: string | null
          id: string
          meeting_id: string | null
          metadata: Json
          mission_control_item_id: string | null
          owner_user_id: string | null
          parent_task_id: string | null
          playbook_step_id: string | null
          priority: string
          program: string | null
          project_id: string | null
          risk_level: string
          school_id: string | null
          sort_order: number
          start_date: string | null
          status: string
          student_id: string | null
          tags: string[]
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number
          approval_request_id?: string | null
          calendar_event_id?: string | null
          campus_id?: string | null
          completed_date?: string | null
          completion_pct?: number
          compliance_obligation_id?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          due_date?: string | null
          employee_id?: string | null
          estimated_hours?: number | null
          family_id?: string | null
          financial_transaction_id?: string | null
          id?: string
          meeting_id?: string | null
          metadata?: Json
          mission_control_item_id?: string | null
          owner_user_id?: string | null
          parent_task_id?: string | null
          playbook_step_id?: string | null
          priority?: string
          program?: string | null
          project_id?: string | null
          risk_level?: string
          school_id?: string | null
          sort_order?: number
          start_date?: string | null
          status?: string
          student_id?: string | null
          tags?: string[]
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number
          approval_request_id?: string | null
          calendar_event_id?: string | null
          campus_id?: string | null
          completed_date?: string | null
          completion_pct?: number
          compliance_obligation_id?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          due_date?: string | null
          employee_id?: string | null
          estimated_hours?: number | null
          family_id?: string | null
          financial_transaction_id?: string | null
          id?: string
          meeting_id?: string | null
          metadata?: Json
          mission_control_item_id?: string | null
          owner_user_id?: string | null
          parent_task_id?: string | null
          playbook_step_id?: string | null
          priority?: string
          program?: string | null
          project_id?: string | null
          risk_level?: string
          school_id?: string | null
          sort_order?: number
          start_date?: string | null
          status?: string
          student_id?: string | null
          tags?: string[]
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_tasks_approval_request_id_fkey"
            columns: ["approval_request_id"]
            isOneToOne: false
            referencedRelation: "platform_approval_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_tasks_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_tasks_compliance_obligation_id_fkey"
            columns: ["compliance_obligation_id"]
            isOneToOne: false
            referencedRelation: "compliance_obligations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_tasks_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_tasks_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_tasks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "student_instructional_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_tasks_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "work_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_tasks_playbook_step_id_fkey"
            columns: ["playbook_step_id"]
            isOneToOne: false
            referencedRelation: "work_playbook_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "work_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_tasks_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_tasks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      work_time_entries: {
        Row: {
          created_at: string
          entry_date: string
          funding_source: string | null
          grant_allocation: string | null
          hours: number
          id: string
          is_billable: boolean
          notes: string | null
          payroll_allocation: string | null
          project_id: string | null
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_date?: string
          funding_source?: string | null
          grant_allocation?: string | null
          hours: number
          id?: string
          is_billable?: boolean
          notes?: string | null
          payroll_allocation?: string | null
          project_id?: string | null
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          funding_source?: string | null
          grant_allocation?: string | null
          hours?: number
          id?: string
          is_billable?: boolean
          notes?: string | null
          payroll_allocation?: string | null
          project_id?: string | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "work_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "work_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      rpt_admissions_pipeline: {
        Row: {
          lead_count: number | null
          lead_stage: string | null
          program: string | null
          school_id: string | null
          school_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_aip_cost_summary: {
        Row: {
          organization_id: string | null
          request_count: number | null
          school_id: string | null
          total_cost_usd: number | null
          total_tokens_in: number | null
          total_tokens_out: number | null
          usage_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aip_token_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aip_token_usage_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_aip_queue_health: {
        Row: {
          avg_duration_sec: number | null
          job_count: number | null
          organization_id: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aip_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_aip_usage_by_module: {
        Row: {
          module: string | null
          month: string | null
          organization_id: string | null
          total_cost_usd: number | null
          total_tokens: number | null
        }
        Relationships: [
          {
            foreignKeyName: "aip_token_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_cert_readiness_summary: {
        Row: {
          is_v1_certified: boolean | null
          organization_id: string | null
          overall_score: number | null
          quality_avg: number | null
          snapshot_date: string | null
        }
        Insert: {
          is_v1_certified?: boolean | null
          organization_id?: string | null
          overall_score?: number | null
          quality_avg?: never
          snapshot_date?: string | null
        }
        Update: {
          is_v1_certified?: boolean | null
          organization_id?: string | null
          overall_score?: number | null
          quality_avg?: never
          snapshot_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cert_readiness_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_cloud_customer_summary: {
        Row: {
          customer_name: string | null
          health_score: number | null
          id: string | null
          plan_key: string | null
          renewal_date: string | null
          risk_level: string | null
          status: string | null
          student_count: number | null
          subscription_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cloud_subscriptions_plan_key_fkey"
            columns: ["plan_key"]
            isOneToOne: false
            referencedRelation: "cloud_subscription_plans"
            referencedColumns: ["plan_key"]
          },
        ]
      }
      rpt_cloud_mrr: {
        Row: {
          month: string | null
          total_mrr: number | null
        }
        Relationships: []
      }
      rpt_compliance_summary: {
        Row: {
          category_name: string | null
          completed_count: number | null
          department: string | null
          domain: string | null
          due_next_30: number | null
          obligation_count: number | null
          overdue_count: number | null
          priority: string | null
          risk_level: string | null
          school_id: string | null
          school_name: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_obligations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_config_go_live_summary: {
        Row: {
          blocking_count: number | null
          green_count: number | null
          last_checked_at: string | null
          organization_id: string | null
          red_count: number | null
          yellow_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "config_go_live_checks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_config_module_status: {
        Row: {
          dependencies: Json | null
          display_name: string | null
          enabled_at: string | null
          installed_version: string | null
          module_key: string | null
          organization_id: string | null
          organization_name: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_module_installations_module_key_fkey"
            columns: ["module_key"]
            isOneToOne: false
            referencedRelation: "config_module_definitions"
            referencedColumns: ["module_key"]
          },
          {
            foreignKeyName: "config_module_installations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_edi_capacity: {
        Row: {
          available_seats: number | null
          campus_utilization_pct: number | null
          future_capacity_seats: number | null
          program_utilization_pct: number | null
          projected_shortages: Json | null
          room_utilization_pct: number | null
          schedule_utilization_pct: number | null
          school_id: string | null
          school_name: string | null
          snapshot_date: string | null
          teacher_utilization_pct: number | null
          used_seats: number | null
        }
        Relationships: [
          {
            foreignKeyName: "edi_capacity_snapshots_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_edi_recommendations: {
        Row: {
          approval_status: string | null
          computed_at: string | null
          confidence_score: number | null
          domain: string | null
          entity_id: string | null
          entity_key: string | null
          entity_type: string | null
          financial_impact: number | null
          id: string | null
          issue: string | null
          operational_impact: number | null
          priority: string | null
          recommendation_score: number | null
          recommendation_type: string | null
          recommended_action: string | null
          risk_level: string | null
          school_id: string | null
          school_name: string | null
          status: string | null
          student_success_impact: number | null
        }
        Relationships: [
          {
            foreignKeyName: "edi_recommendations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_edi_scorecard: {
        Row: {
          capacity: number | null
          compliance: number | null
          enrollment_health: number | null
          financial_health: number | null
          growth: number | null
          operational_efficiency: number | null
          overall_enterprise_health: number | null
          parent_engagement: number | null
          risk: number | null
          school_id: string | null
          school_name: string | null
          snapshot_date: string | null
          student_success: number | null
          teacher_effectiveness: number | null
        }
        Relationships: [
          {
            foreignKeyName: "edi_scorecard_snapshots_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_edp_connector_health: {
        Row: {
          connector_key: string | null
          display_name: string | null
          health_status: string | null
          last_sync_at: string | null
          organization_id: string | null
          status: string | null
          sync_direction: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edp_connector_instances_connector_key_fkey"
            columns: ["connector_key"]
            isOneToOne: false
            referencedRelation: "edp_connector_definitions"
            referencedColumns: ["connector_key"]
          },
          {
            foreignKeyName: "edp_connector_instances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_edp_import_summary: {
        Row: {
          batch_count: number | null
          import_type: string | null
          last_import_at: string | null
          organization_id: string | null
          source_format: string | null
          status: string | null
          total_errors: number | null
          total_rows: number | null
          total_success: number | null
        }
        Relationships: [
          {
            foreignKeyName: "edp_import_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_edp_quality_summary: {
        Row: {
          data_gaps: number | null
          duplicate_count: number | null
          organization_id: string | null
          quality_score: number | null
          school_id: string | null
          snapshot_date: string | null
        }
        Insert: {
          data_gaps?: never
          duplicate_count?: never
          organization_id?: string | null
          quality_score?: number | null
          school_id?: string | null
          snapshot_date?: string | null
        }
        Update: {
          data_gaps?: never
          duplicate_count?: never
          organization_id?: string | null
          quality_score?: number | null
          school_id?: string | null
          snapshot_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edp_quality_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edp_quality_snapshots_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_enrollment_summary: {
        Row: {
          active_students: number | null
          campus_id: string | null
          campus_name: string | null
          grade_level: string | null
          inactive_students: number | null
          program: string | null
          school_id: string | null
          school_name: string | null
          total_students: number | null
        }
        Relationships: [
          {
            foreignKeyName: "students_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_fi_class_profitability: {
        Row: {
          break_even_enrollment: number | null
          capacity: number | null
          course_section_id: string | null
          enrollment_count: number | null
          gross_margin: number | null
          health_indicator: string | null
          margin_pct: number | null
          metrics: Json | null
          net_margin: number | null
          period_start: string | null
          period_type: string | null
          profit_per_seat: number | null
          revenue: number | null
          revenue_per_seat: number | null
          school_id: string | null
          section_code: string | null
          total_cost: number | null
        }
        Insert: {
          break_even_enrollment?: number | null
          capacity?: number | null
          course_section_id?: string | null
          enrollment_count?: number | null
          gross_margin?: number | null
          health_indicator?: string | null
          margin_pct?: number | null
          metrics?: Json | null
          net_margin?: number | null
          period_start?: string | null
          period_type?: string | null
          profit_per_seat?: number | null
          revenue?: number | null
          revenue_per_seat?: number | null
          school_id?: string | null
          section_code?: string | null
          total_cost?: number | null
        }
        Update: {
          break_even_enrollment?: number | null
          capacity?: number | null
          course_section_id?: string | null
          enrollment_count?: number | null
          gross_margin?: number | null
          health_indicator?: string | null
          margin_pct?: number | null
          metrics?: Json | null
          net_margin?: number | null
          period_start?: string | null
          period_type?: string | null
          profit_per_seat?: number | null
          revenue?: number | null
          revenue_per_seat?: number | null
          school_id?: string | null
          section_code?: string | null
          total_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fi_profitability_snapshots_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_fi_program_profitability: {
        Row: {
          ebitda_contribution: number | null
          enrollment_count: number | null
          health_indicator: string | null
          margin_pct: number | null
          metrics: Json | null
          net_margin: number | null
          period_start: string | null
          program: string | null
          revenue: number | null
          school_id: string | null
          total_cost: number | null
        }
        Insert: {
          ebitda_contribution?: number | null
          enrollment_count?: number | null
          health_indicator?: string | null
          margin_pct?: number | null
          metrics?: Json | null
          net_margin?: number | null
          period_start?: string | null
          program?: string | null
          revenue?: number | null
          school_id?: string | null
          total_cost?: number | null
        }
        Update: {
          ebitda_contribution?: number | null
          enrollment_count?: number | null
          health_indicator?: string | null
          margin_pct?: number | null
          metrics?: Json | null
          net_margin?: number | null
          period_start?: string | null
          program?: string | null
          revenue?: number | null
          school_id?: string | null
          total_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fi_profitability_snapshots_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_fi_school_summary: {
        Row: {
          ebitda_contribution: number | null
          enrollment_count: number | null
          gross_margin: number | null
          health_indicator: string | null
          margin_pct: number | null
          metrics: Json | null
          net_margin: number | null
          period_start: string | null
          revenue: number | null
          school_id: string | null
          school_name: string | null
          total_cost: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fi_profitability_snapshots_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_financial_kpis: {
        Row: {
          invoice_count: number | null
          outstanding_ar: number | null
          program: string | null
          scholarships_applied: number | null
          school_id: string | null
          school_name: string | null
          state_funding_applied: number | null
          total_billed: number | null
          total_collected: number | null
        }
        Relationships: [
          {
            foreignKeyName: "family_billing_accounts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_ihub_monitoring_summary: {
        Row: {
          avg_api_health: number | null
          avg_connector_health: number | null
          last_snapshot: string | null
          organization_id: string | null
          total_sync_failures: number | null
          total_webhook_failures: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ihub_monitoring_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_student_outcomes: {
        Row: {
          attendance_present: number | null
          attendance_total: number | null
          avg_success_score: number | null
          campus_id: string | null
          campus_name: string | null
          grade_level: string | null
          program: string | null
          school_id: string | null
          school_name: string | null
          scored_students: number | null
        }
        Relationships: [
          {
            foreignKeyName: "students_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_work_project_summary: {
        Row: {
          avg_completion_pct: number | null
          delayed_count: number | null
          department: string | null
          health_indicator: string | null
          project_count: number | null
          project_type: string | null
          school_id: string | null
          school_name: string | null
          status: string | null
          total_budget: number | null
          total_spent: number | null
        }
        Relationships: [
          {
            foreignKeyName: "work_projects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_work_task_summary: {
        Row: {
          overdue_count: number | null
          priority: string | null
          school_id: string | null
          status: string | null
          task_count: number | null
          total_actual_hours: number | null
          total_estimated_hours: number | null
        }
        Relationships: [
          {
            foreignKeyName: "work_tasks_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      rpt_workforce_kpis: {
        Row: {
          active_staff: number | null
          department: string | null
          employee_type: string | null
          program: string | null
          school_id: string | null
          school_name: string | null
          terminated_staff: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admissions_staff_can_manage: { Args: never; Returns: boolean }
      admissions_staff_can_view: { Args: never; Returns: boolean }
      apply_sibling_discount: {
        Args: {
          p_billing_account_id: string
          p_student_id: string
          p_subtotal: number
        }
        Returns: number
      }
      attach_updated_at_trigger: {
        Args: { p_table_name: string }
        Returns: undefined
      }
      calculate_tuition_invoice_totals: {
        Args: {
          p_billing_account_id: string
          p_discount_amount?: number
          p_grant_credit?: number
          p_late_fee?: number
          p_scholarship_credit?: number
          p_state_funding_credit?: number
          p_student_id: string
          p_subtotal: number
          p_tax_rate_percent?: number
        }
        Returns: {
          family_responsibility: number
          sibling_discount: number
          tax_amount: number
          total_amount: number
        }[]
      }
      can_access_classification: {
        Args: { check_classification: string }
        Returns: boolean
      }
      can_access_school: { Args: { school_id: string }; Returns: boolean }
      can_access_student_record: {
        Args: { check_student_id: string }
        Returns: boolean
      }
      current_employee_id: { Args: never; Returns: string }
      detect_admission_duplicates: {
        Args: {
          p_date_of_birth?: string
          p_exclude_lead_id?: string
          p_first_name: string
          p_guardian_email?: string
          p_guardian_phone?: string
          p_last_name: string
        }
        Returns: {
          detail: string
          display_name: string
          entity_id: string
          entity_type: string
          match_type: string
        }[]
      }
      ensure_state_funding_verifications: {
        Args: { p_application_id: string }
        Returns: undefined
      }
      finance_account_policy: {
        Args: { p_account_id: string }
        Returns: boolean
      }
      generate_student_number: {
        Args: { p_school_id: string }
        Returns: string
      }
      has_permission: { Args: { permission_key: string }; Returns: boolean }
      has_role: { Args: { role_name: string }; Returns: boolean }
      provision_auth_user: {
        Args: {
          p_user_id: string
          p_email?: string | null
          p_full_name?: string | null
          p_meta?: Json | null
        }
        Returns: undefined
      }
      provision_current_auth_user: { Args: never; Returns: undefined }
      provision_jag_only_identity: {
        Args: {
          p_user_id: string
          p_role: string
          p_strip_default_org?: boolean
        }
        Returns: undefined
      }
      instruction_student_policy: {
        Args: { check_permission?: string; check_student_id: string }
        Returns: boolean
      }
      is_assigned_to_school: { Args: { school_id: string }; Returns: boolean }
      is_ceo: { Args: never; Returns: boolean }
      is_enterprise_admin: { Args: never; Returns: boolean }
      is_founder: { Args: never; Returns: boolean }
      is_guardian_of_family: { Args: { p_family_id: string }; Returns: boolean }
      is_guardian_of_lead: { Args: { p_lead_id: string }; Returns: boolean }
      is_guardian_of_prospect: {
        Args: { p_prospect_id: string }
        Returns: boolean
      }
      is_parent_of_student: {
        Args: { check_student_id: string }
        Returns: boolean
      }
      is_record_locked: {
        Args: { check_entity_id: string; check_entity_type: string }
        Returns: boolean
      }
      is_school_member: { Args: { school: string }; Returns: boolean }
      is_self_employee: { Args: { p_employee_id: string }; Returns: boolean }
      is_student_team_member: {
        Args: { check_student_id: string }
        Returns: boolean
      }
      list_admissions_lead_funding_sources: {
        Args: { p_lead_ids: string[] }
        Returns: Database["public"]["CompositeTypes"]["lead_funding_link"][]
        SetofOptions: {
          from: "*"
          to: "lead_funding_link"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_student_funding_sources: {
        Args: { p_student_ids: string[] }
        Returns: {
          funding_source_id: string
          student_id: string
        }[]
      }
      replace_admissions_lead_funding_sources: {
        Args: { p_funding_source_ids: string[]; p_lead_id: string }
        Returns: undefined
      }
      replace_student_funding_sources: {
        Args: { p_funding_source_ids: string[]; p_student_id: string }
        Returns: undefined
      }
      create_student_record: {
        Args: {
          p_school_id: string
          p_first_name: string
          p_last_name: string
          p_family_id?: string | null
          p_preferred_name?: string | null
          p_date_of_birth?: string | null
          p_grade_level?: string | null
          p_gender?: string | null
          p_program?: string | null
          p_enrollment_status?: string | null
          p_funding_source_codes?: string[]
        }
        Returns: string
      }
      create_family_with_guardians: {
        Args: {
          p_school_id: string
          p_family_name: string
          p_guardians?: Json
          p_student_id?: string | null
          p_billing_email?: string | null
          p_billing_phone?: string | null
        }
        Returns: Json
      }
      link_student_to_family: {
        Args: { p_student_id: string; p_family_id: string }
        Returns: string
      }
      scheduling_policy: {
        Args: { check_permission?: string; check_school_id: string }
        Returns: boolean
      }
      school_id_for_admission_lead: {
        Args: { p_lead_id: string }
        Returns: string
      }
      school_id_for_admissions_application: {
        Args: { p_application_id: string }
        Returns: string
      }
      school_id_for_billing_account: {
        Args: { p_account_id: string }
        Returns: string
      }
      school_id_for_course: { Args: { p_course_id: string }; Returns: string }
      school_id_for_course_section: {
        Args: { p_section_id: string }
        Returns: string
      }
      school_id_for_employee: {
        Args: { p_employee_id: string }
        Returns: string
      }
      school_id_for_family: { Args: { p_family_id: string }; Returns: string }
      school_id_for_position: {
        Args: { p_position_id: string }
        Returns: string
      }
      school_id_for_prospect: {
        Args: { p_prospect_id: string }
        Returns: string
      }
      school_id_for_student: { Args: { p_student_id: string }; Returns: string }
      seed_admissions_checklist_for_school: {
        Args: { p_school_id: string }
        Returns: undefined
      }
      sis_student_policy: {
        Args: { check_permission?: string; check_student_id: string }
        Returns: boolean
      }
      list_schools_for_public_inquiry:
        | {
            Args: Record<string, never>
            Returns: { id: string; name: string }[]
          }
        | {
            Args: { p_organization_id: string }
            Returns: { id: string; name: string }[]
          }
      list_programs_for_public_inquiry: {
        Args: { p_organization_id: string; p_school_id: string }
        Returns: { code: string; name: string }[]
      }
      submit_public_admissions_inquiry: {
        Args: {
          p_applying_for_grade: string
          p_current_grade: string
          p_date_of_birth: string
          p_first_name: string
          p_funding_source_codes?: string[]
          p_guardian_email: string
          p_guardian_first_name: string
          p_guardian_last_name: string
          p_guardian_phone: string
          p_last_name: string
          p_preferred_name: string
          p_program: string
          p_referral_source: string
          p_school_id: string
        }
        Returns: string
      }
      sync_application_checklist: {
        Args: { p_application_id: string }
        Returns: undefined
      }
      sync_billing_account_balance: {
        Args: { p_account_id: string }
        Returns: undefined
      }
      teacher_can_access_session: {
        Args: { check_session_id: string }
        Returns: boolean
      }
      teacher_student_policy: {
        Args: { check_permission?: string; check_student_id: string }
        Returns: boolean
      }
      user_can_access_school: {
        Args: { check_school_id: string; check_user_id: string }
        Returns: boolean
      }
      user_role_ids: { Args: { check_user_id: string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      lead_funding_link: {
        lead_id: string | null
        funding_source_id: string | null
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
