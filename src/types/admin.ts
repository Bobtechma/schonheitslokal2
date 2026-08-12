export interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  total_price: number
  total_duration_minutes: number
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  notes: string | null
  created_at: string
  is_paid?: boolean
  payment_method?: string
  source?: string
  client: {
    id: string
    full_name: string
    email: string
    phone: string
    address?: string
    birth_date?: string
    gender?: string
    allergies?: string
    preferences?: string
  }
  services: Array<{
    id: string
    name: string
    price: number
    duration_minutes: number
  }>
  appointment_services?: Array<{
    services: {
      name: string
    }
  }>
  professional?: {
    id?: string
    name: string
    photo_url: string | null
  }
  professional_id?: string | null
}

export interface Professional {
  id: string
  name: string
  photo_url: string | null
  bio: string | null
  active: boolean
  created_at?: string
  updated_at?: string
}

export interface Client {
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
  created_at: string | null
  updated_at: string | null
  address?: string | null
  appointments?: Appointment[]
}

export interface BusinessHour {
  id?: string
  day_of_week: number
  open_time: string | null
  close_time: string | null
  is_closed: boolean
}

export interface BlockedDate {
  id: string
  date: string
  reason?: string
}

export interface BlockedSlot {
  id: string
  date: string
  start_time: string
  end_time: string
  reason: string | null
}

export interface CarouselItem {
  id: string
  title: string | null
  description: string | null
  image_url: string
  link_url: string | null
  display_order: number
}

export interface SystemSettings {
  review_email_delay: string | number
  [key: string]: string | number | undefined
}

export interface ShippingOption {
  id: string
  name: string
  price: number
  active: boolean
}

export interface RouletteSettings {
  enabled: boolean
  cooldown_days: number
  options: Array<{
    id: string
    label: string
    probability: number
    color: string
  }>
}

export interface InstagramPost {
  image_url: string
  link: string
}
