export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          user_id: string | null
          full_name: string
          email: string
          phone: string
          birth_date: string | null
          gender: string | null
          allergies: string | null
          preferences: string | null
          terms_accepted: boolean | null
          terms_accepted_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name: string
          email: string
          phone: string
          birth_date?: string | null
          gender?: string | null
          allergies?: string | null
          preferences?: string | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          full_name?: string
          email?: string
          phone?: string
          birth_date?: string | null
          gender?: string | null
          allergies?: string | null
          preferences?: string | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          duration_minutes: number
          price: number
          category: string | null
          active: boolean | null
          display_order: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          duration_minutes: number
          price: number
          category?: string | null
          active?: boolean | null
          display_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          duration_minutes?: number
          price?: number
          category?: string | null
          active?: boolean | null
          display_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      appointments: {
        Row: {
          id: string
          client_id: string
          user_id: string | null
          appointment_date: string
          appointment_time: string
          total_duration_minutes: number
          total_price: number
          status: 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes: string | null
          cancellation_reason: string | null
          created_at: string | null
          updated_at: string | null
          cancelled_at: string | null
        }
        Insert: {
          id?: string
          client_id: string
          user_id?: string | null
          appointment_date: string
          appointment_time: string
          total_duration_minutes: number
          total_price: number
          status?: 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
          cancelled_at?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          user_id?: string | null
          appointment_date?: string
          appointment_time?: string
          total_duration_minutes?: number
          total_price?: number
          status?: 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
          cancelled_at?: string | null
        }
      }
      appointment_services: {
        Row: {
          id: string
          appointment_id: string
          service_id: string
          order_index: number | null
          price_at_time: number
          duration_at_time: number
        }
        Insert: {
          id?: string
          appointment_id: string
          service_id: string
          order_index?: number | null
          price_at_time: number
          duration_at_time: number
        }
        Update: {
          id?: string
          appointment_id?: string
          service_id?: string
          order_index?: number | null
          price_at_time?: number
          duration_at_time?: number
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          client_id: string | null
          action_type: string
          entity_type: string
          entity_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          client_id?: string | null
          action_type: string
          entity_type: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          client_id?: string | null
          action_type?: string
          entity_type?: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
      }
      system_settings: {
        Row: {
          id: string
          key: string
          value: string | null
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          key: string
          value?: string | null
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          key?: string
          value?: string | null
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      business_hours: {
        Row: {
          id: string
          day_of_week: number
          open_time: string
          close_time: string
          is_closed: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          day_of_week: number
          open_time: string
          close_time: string
          is_closed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          day_of_week?: number
          open_time?: string
          close_time?: string
          is_closed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      blocked_times: {
        Row: {
          id: string
          date: string
          start_time: string
          end_time: string
          reason: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          date: string
          start_time: string
          end_time: string
          reason?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          date?: string
          start_time?: string
          end_time?: string
          reason?: string | null
          created_by?: string | null
          created_at?: string | null
        }
      }
    }
    Views: object
    Functions: object
    Enums: object
    CompositeTypes: object
  }
}