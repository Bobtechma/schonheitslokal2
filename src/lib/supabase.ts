import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hbgahtifffwpvyhwxguq.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZ2FodGlmZmZ3cHZ5aHd4Z3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0ODY0MDUsImV4cCI6MjA3OTA2MjQwNX0.gW3nLznq5POw3fJT3uISNOFVOWqvsdP5QZpTMHr88Mo'

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'salao-beleza-booking'
    }
  }
})

// Export types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Type aliases for common tables
export type Client = Tables<'clients'>
export type Service = Tables<'services'>
export type Appointment = Tables<'appointments'>
export type AppointmentService = Tables<'appointment_services'>
export type ActivityLog = Tables<'activity_logs'>
export type SystemSetting = Tables<'system_settings'>
export type BusinessHour = Tables<'business_hours'>
export type BlockedTime = Tables<'blocked_times'>

// Custom types
export interface AppointmentWithServices extends Appointment {
  services: (AppointmentService & { service: Service })[]
  client: Client
}

export interface ServiceWithAppointment extends Service {
  appointment_services: AppointmentService[]
}