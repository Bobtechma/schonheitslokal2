import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import ProtectedRoute from '@/components/ProtectedRoute'
import { supabase, type Service } from '@/lib/supabase'
import { getAvailabilityPerProfessional } from '@/lib/availability'
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils'
import {
  Sparkles,
  Users,
  Award,
  CheckCircle,
  ChevronDown,
  AlertTriangle,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Phone,
  Mail,
  XCircle,
  RefreshCw,
  Settings,
  Shield,
  Plus,
  Save,
  X,
  Clock,
  Ban,
  Image as ImageIcon,
  Upload,
  ToggleLeft,
  Scissors,
  Package,
  Home,
  Star,
  QrCode,
  Truck,
  PauseCircle,
  PlayCircle,
  TrendingUp,
  Tag,
  Trophy,
  Gift,
  Send,
  UserCircle,
  Ticket,
  Layout,
  Instagram,
  ZapOff,
  MessageSquare,
  Copy,
  Monitor,
  Play,
  CreditCard,
  Wallet,
  Clipboard,
  FileText,
  MapPin,
  Building,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import ClientSearch from '@/components/ClientSearch'
import DashboardStats from '@/components/DashboardStats' // Added
import { sendBookingConfirmation, sendRescheduleNotification } from '@/lib/email'
import { sendBookingConfirmationWhatsApp, sendRescheduleWhatsApp } from '@/lib/whatsapp'


import { translations } from '@/lib/translations'

const KNOWN_SUBCATEGORIES = [
  'Gesichtsbehandlungen',
  'Körperbehandlungen',
  'Wimpern & Augenbrauen',
  'Microneedling',
  'Massage',
  'Gesichtspflege',
  'Körperpflege',
  'Sets',
  'Gutscheine'
]

interface Appointment {
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

interface Professional {
  id: string
  name: string
  photo_url: string | null
  bio: string | null
  active: boolean
  created_at?: string
  updated_at?: string
}

interface Client {
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

interface BusinessHour {
  id?: string
  day_of_week: number
  open_time: string | null
  close_time: string | null
  is_closed: boolean
}

interface BlockedDate {
  id: string
  date: string
  reason?: string
}

interface BlockedSlot {
  id: string
  date: string
  start_time: string
  end_time: string
  reason: string | null
}

interface CarouselItem {
  id: string
  title: string | null
  description: string | null
  image_url: string
  link_url: string | null
  display_order: number
}

interface SystemSettings {
  review_email_delay: string | number
  [key: string]: string | number | undefined
}

interface ShippingOption {
  id: string
  name: string
  price: number
  active: boolean
}

export default function AdminDashboard() {
  const { user, signOut, checkSession } = useAuthStore()
  const { t, language } = useLanguageStore()
  const isPt = language === 'pt-BR'
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'people' | 'marketing' | 'settings' | 'system' | 'whatsapp' | 'partner_requests'>('overview')
  const [services, setServices] = useState<Service[]>([])
  const [serviceFormOpen, setServiceFormOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', name_pt: '', description_pt: '', name_de: '', description_de: '', duration_minutes: 30, price: 0, category: 'service', active: true, display_order: 0, image_url: '', stock: 0, weight: 0, subcategory: '' })
  const [isCustomSubcategory, setIsCustomSubcategory] = useState(false)
  const [manualModalOpen, setManualModalOpen] = useState(false)
  const [manualCategory, setManualCategory] = useState<'service' | 'product'>('service')
  const [manualForm, setManualForm] = useState<{
    clientIdentifier: string;
    date: string;
    time: string;
    notes: string;
    selectedServiceIds: string[];
    email: string;
    phone: string;
    birthDate: string;
    address: string;
    payment_method?: string;
  }>({ 
    clientIdentifier: '', 
    date: new Date().toISOString().split('T')[0], 
    time: '', 
    notes: '', 
    selectedServiceIds: [] as string[], 
    email: '', 
    phone: '',
    birthDate: '',
    address: '',
    payment_method: 'salon'
  })
  const [manualProfessionalId, setManualProfessionalId] = useState<string | null>(null)
  const [manualAvailableTimes, setManualAvailableTimes] = useState<string[]>([])
  const [manualTimesLoading, setManualTimesLoading] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [promoStorePct, setPromoStorePct] = useState<number>(0)
  const [promoPerService, setPromoPerService] = useState<Record<string, number>>({})
  const [newUserForm, setNewUserForm] = useState({ email: '', password: '', fullName: '', role: 'client' })
  const [users, setUsers] = useState<any[]>([])

  // New Settings State
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([])
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [bookingPaused, setBookingPaused] = useState(false)
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([])
  const [newBlockedDate, setNewBlockedDate] = useState('')
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([])
  const [newBlockedSlot, setNewBlockedSlot] = useState({ date: '', start_time: '', end_time: '', reason: '' })
  const [newCarouselItem, setNewCarouselItem] = useState({ title: '', description: '', image_url: '', link_url: '', display_order: 0 })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false)
  const [selectedAppointmentForDetails, setSelectedAppointmentForDetails] = useState<Appointment | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [twintQrUrl, setTwintQrUrl] = useState('')
  const [twintPhone, setTwintPhone] = useState('')

  const [isEditingAppointment, setIsEditingAppointment] = useState(false)
  const [editAppointmentForm, setEditAppointmentForm] = useState({
    date: '',
    time: '',
    professional_id: '' as string | null,
    notes: '',
    status: 'confirmed' as any
  })
  const [availableRescheduleSlots, setAvailableRescheduleSlots] = useState<string[]>([])
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false)

  const loadRescheduleSlots = async (date: string, professionalId: string | null) => {
    if (!selectedAppointmentForDetails || !date || !professionalId) {
      setAvailableRescheduleSlots([])
      return
    }

    try {
      setLoadingRescheduleSlots(true)
      const totalDuration = selectedAppointmentForDetails.total_duration_minutes
      const servicesList = selectedAppointmentForDetails.services.map(s => ({ id: s.id, duration_minutes: s.duration_minutes }))

      const availabilityMap = await getAvailabilityPerProfessional(
        date,
        servicesList,
        totalDuration,
        professionalId
      )

      const proAvail = availabilityMap.get(professionalId)
      let slots = proAvail?.availableSlots || []

      if (
        selectedAppointmentForDetails.appointment_date === date &&
        selectedAppointmentForDetails.professional_id === professionalId
      ) {
        const originalTime = selectedAppointmentForDetails.appointment_time.slice(0, 5)
        if (!slots.includes(originalTime)) {
          slots = [...slots, originalTime].sort()
        }
      }

      setAvailableRescheduleSlots(slots)
    } catch (error) {
      console.error('Error loading reschedule slots:', error)
    } finally {
      setLoadingRescheduleSlots(false)
    }
  }

  useEffect(() => {
    if (!isDetailsModalOpen) {
      setIsEditingAppointment(false)
      setAvailableRescheduleSlots([])
    }
  }, [isDetailsModalOpen])

  const [instagramPosts, setInstagramPosts] = useState<{ image_url: string, link: string }[]>([
    { image_url: '', link: 'https://www.instagram.com/schoenheits_lokal/' },
    { image_url: '', link: 'https://www.instagram.com/schoenheits_lokal/' },
    { image_url: '', link: 'https://www.instagram.com/schoenheits_lokal/' },
    { image_url: '', link: 'https://www.instagram.com/schoenheits_lokal/' }
  ])
  const [roulettePreviewOpen, setRoulettePreviewOpen] = useState(false)
  const [instagramUsername, setInstagramUsername] = useState('')
  const [instagramEmbedId, setInstagramEmbedId] = useState('')
  const [savingInstagram, setSavingInstagram] = useState(false)
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)
  
  // WhatsApp Settings State
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [whatsappQueueActive, setWhatsappQueueActive] = useState(false)
  const [whatsappStatus, setWhatsappStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading')
  const [whatsappPairingCode, setWhatsappPairingCode] = useState('')
  const [whatsappQrCode, setWhatsappQrCode] = useState('')
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const isWorkerRunning = useRef(false)

  // Upselling Settings State
  const [upsellingEnabled, setUpsellingEnabled] = useState(false)
  const [upsellingDiscountPct, setUpsellingDiscountPct] = useState('10')

  // Birthday Voucher Settings State
  const [birthdayVoucherEnabled, setBirthdayVoucherEnabled] = useState(false)
  const [birthdayVoucherType, setBirthdayVoucherType] = useState('discount_percentage')
  const [birthdayVoucherValue, setBirthdayVoucherValue] = useState('10')
  const [birthdayVoucherServiceId, setBirthdayVoucherServiceId] = useState<string | null>(null)
  const [birthdayVoucherValidity, setBirthdayVoucherValidity] = useState('30')
  const [birthdayMessageTemplateDe, setBirthdayMessageTemplateDe] = useState('')
  const [birthdayMessageTemplatePt, setBirthdayMessageTemplatePt] = useState('')

  // Partner Settings State
  const [partnerDiscountPct, setPartnerDiscountPct] = useState('30')
  const [partnerMinOrderAmount, setPartnerMinOrderAmount] = useState('100.00')
  const [partnerContractTextDe, setPartnerContractTextDe] = useState('')
  const [partnerContractTextPt, setPartnerContractTextPt] = useState('')

  // Partner Requests State
  const [partnerRequests, setPartnerRequests] = useState<any[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  // Roulette Settings State
  const [rouletteEnabled, setRouletteEnabled] = useState(false)
  const [rouletteSettings, setRouletteSettings] = useState({
    enabled: false,
    cooldown_days: 30,
    options: [
      { id: '1', label: '10% Off', probability: 50, color: '#FF69B4' },
      { id: '2', label: 'Free Item', probability: 10, color: '#4169E1' },
      { id: '3', label: 'Try Again', probability: 40, color: '#9CA3AF' }
    ]
  })

  // Professionals State
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null)
  const [professionalFormOpen, setProfessionalFormOpen] = useState(false)
  const [professionalForm, setProfessionalForm] = useState({ name: '', bio: '', photo_url: '', active: true })
  const [profServices, setProfServices] = useState<string[]>([])
  const [profSchedule, setProfSchedule] = useState<any[]>([])
  const [allProfessionalServices, setAllProfessionalServices] = useState<{professional_id: string, service_id: string}[]>([])

  // Shipping State
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [newShippingOption, setNewShippingOption] = useState({ name: '', price: 0 })

  // Clients Tab State
  const [clientsList, setClientsList] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [raffleWinner, setRaffleWinner] = useState<Client | null>(null)
  const [isRaffling, setIsRaffling] = useState(false)
  const [clientFilter, setClientFilter] = useState<'all' | 'website' | 'manual'>('all')
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [clientFormOpen, setClientFormOpen] = useState(false)
  const [clientForm, setClientForm] = useState({ full_name: '', email: '', phone: '', birth_date: '' })

  // Campaign State
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
  const [campaignModalOpen, setCampaignModalOpen] = useState(false)
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    message: '',
    includeVoucher: false,
    voucherType: 'discount_percentage',
    voucherValue: '',
    voucherValidity: '30',
    serviceId: ''
  })
  const [sendingCampaign, setSendingCampaign] = useState(false)
  const campaignMessageRef = useRef<HTMLTextAreaElement>(null)

  const handleSupabaseError = async (error: any, context: string) => {
    if (error?.code === 'PGRST303') {
      console.warn(`JWT Expired while fetching ${context}, refreshing...`)
      await checkSession()
      return true // Indicates we should retry or that refresh was attempted
    }
    console.error(`Error fetching ${context}:`, error)
    return false
  }

  useEffect(() => {
    const init = async () => {
      await checkSession()
      fetchSettingsData()
      if (activeTab === 'appointments') {
        fetchAppointments()
        fetchServices()
        fetchProfessionals()
      }
      if (activeTab === 'settings' || activeTab === 'marketing') {
        fetchServices()
        loadPromotions()
      }
      if (activeTab === 'people') {
        fetchProfessionals()
        fetchClientsList()
        fetchUsers()
      }
      if (activeTab === 'system') {
        fetchWhatsAppData()
      }
      if (activeTab === 'partner_requests') {
        fetchPartnerRequests()
      }
    }
    init()
  }, [activeTab, selectedDate, viewMode, statusFilter, searchTerm])

  // Fetch available times for manual booking modal
  useEffect(() => {
    if (!manualForm.date || manualForm.selectedServiceIds.length === 0) {
      setManualAvailableTimes([])
      return
    }
    const fetchManualTimes = async () => {
      setManualTimesLoading(true)
      try {
        const selectedSvcs = services.filter(s => manualForm.selectedServiceIds.includes(s.id))
        const totalDuration = selectedSvcs.reduce((sum: number, s: any) => sum + Number(s.duration_minutes || 0), 0) || 30
        
        const availabilityMap = await getAvailabilityPerProfessional(
          manualForm.date,
          selectedSvcs,
          totalDuration,
          manualProfessionalId
        )

        // Aggregar todos os slots disponíveis de todos os profissionais capazes
        const allAvailableSlots = new Set<string>()
        availabilityMap.forEach(proAvail => {
          proAvail.availableSlots.forEach(slot => allAvailableSlots.add(slot))
        })

        const sortedSlots = Array.from(allAvailableSlots).sort()
        setManualAvailableTimes(sortedSlots)
      } catch (error) {
        console.error('Error fetching manual available times:', error)
        setManualAvailableTimes([])
      } finally {
        setManualTimesLoading(false)
      }
    }
    fetchManualTimes()
  }, [manualForm.date, manualForm.selectedServiceIds, services, manualProfessionalId])

  // Compute all available subcategories (Standard + Custom from existing data)
  const allSubcategories = Array.from(new Set([
    ...KNOWN_SUBCATEGORIES,
    ...(services || []).map(s => s.subcategory).filter(Boolean)
  ])).sort()

  const fetchSettingsData = async () => {
    try {
      // Fetch Business Hours
      const { data: hours, error: hoursError } = await supabase.from('business_hours').select('*').order('day_of_week')
      if (hoursError) await handleSupabaseError(hoursError, 'hours')

      if (hours && hours.length > 0) {
        setBusinessHours(hours)
      } else {
        // Initialize with defaults if empty
        const defaultHours = [
          { day_of_week: 0, open_time: null, close_time: null, is_closed: true }, // Sunday
          { day_of_week: 1, open_time: '09:00', close_time: '18:00', is_closed: false },
          { day_of_week: 2, open_time: '09:00', close_time: '18:00', is_closed: false },
          { day_of_week: 3, open_time: '09:00', close_time: '18:00', is_closed: false },
          { day_of_week: 4, open_time: '09:00', close_time: '18:00', is_closed: false },
          { day_of_week: 5, open_time: '09:00', close_time: '18:00', is_closed: false },
          { day_of_week: 6, open_time: '09:00', close_time: '15:00', is_closed: false },
        ]
        setBusinessHours(defaultHours)
      }

      // Fetch Blocked Dates
      const { data: dates, error: datesError } = await supabase.from('blocked_dates').select('*').order('date')
      if (datesError) console.error('Error fetching dates:', datesError)
      if (dates) setBlockedDates(dates)

      // Fetch Booking Paused Status
      const { data: settings, error: settingsError } = await supabase.from('system_settings').select('*').eq('key', 'booking_paused').maybeSingle()
      if (settingsError && settingsError.code !== 'PGRST116') await handleSupabaseError(settingsError, 'settings')
      if (settings) setBookingPaused(settings.value === 'true')

      // Fetch Carousel Items
      const { data: carousel, error: carouselError } = await supabase.from('carousel_items').select('*').order('display_order')
      if (carouselError) await handleSupabaseError(carouselError, 'carousel')
      if (carousel) setCarouselItems(carousel)

      // Fetch Blocked Slots
      const { data: slots, error: slotsError } = await supabase.from('blocked_slots').select('*').order('start_time')
      if (slotsError) await handleSupabaseError(slotsError, 'blocked slots')
      if (slots) setBlockedSlots(slots)

      // Fetch Review Email Delay and General Settings
      const { data: revDelay } = await supabase.from('system_settings').select('*').eq('key', 'review_email_delay').maybeSingle()
      setSettings({ review_email_delay: revDelay?.value || '2' })

      // Fetch Shipping Options
      const { data: shipping, error: shippingError } = await supabase.from('shipping_options').select('*').order('created_at')
      if (shippingError) await handleSupabaseError(shippingError, 'shipping')
      if (shipping) setShippingOptions(shipping)

      // Fetch Instagram Posts
      const { data: instaSettings } = await supabase.from('system_settings').select('*').eq('key', 'instagram_posts').maybeSingle()
      if (instaSettings && instaSettings.value) {
        try {
          const parsed = JSON.parse(instaSettings.value)
          if (Array.isArray(parsed) && parsed.length === 4) {
            setInstagramPosts(parsed)
          }
        } catch (e) {
          console.error('Error parsing instagram posts', e)
        }
      }

      // Fetch Roulette Settings
      const { data: rouletteEnabledData } = await supabase.from('system_settings').select('*').eq('key', 'roulette_enabled').maybeSingle()
      if (rouletteEnabledData) setRouletteEnabled(rouletteEnabledData.value === 'true')

      const { data: rouletteSettingsData } = await supabase.from('system_settings').select('*').eq('key', 'roulette_settings').maybeSingle()
      if (rouletteSettingsData && rouletteSettingsData.value) {
        try {
          const parsed = JSON.parse(rouletteSettingsData.value)
          if (parsed.options) {
            setRouletteSettings(prev => ({ 
              ...prev, 
              options: parsed.options, 
              cooldown_days: parsed.cooldown_days || 30 
            }))
          }
        } catch (e) {
          console.error('Error parsing roulette settings', e)
        }
      }

      // Fetch Upselling Settings
      const { data: upsellingEnabledData } = await supabase.from('system_settings').select('*').eq('key', 'upselling_enabled').maybeSingle()
      if (upsellingEnabledData) setUpsellingEnabled(upsellingEnabledData.value === 'true')

      const { data: upsellingDiscountData } = await supabase.from('system_settings').select('*').eq('key', 'upselling_discount_pct').maybeSingle()
      if (upsellingDiscountData) setUpsellingDiscountPct(upsellingDiscountData.value || '10')

      // Fetch Birthday Settings
      const { data: bEnabled } = await supabase.from('system_settings').select('*').eq('key', 'birthday_voucher_enabled').maybeSingle()
      if (bEnabled) setBirthdayVoucherEnabled(bEnabled.value === 'true')

      const { data: bType } = await supabase.from('system_settings').select('*').eq('key', 'birthday_voucher_type').maybeSingle()
      if (bType) setBirthdayVoucherType(bType.value || 'discount_percentage')

      const { data: bVal } = await supabase.from('system_settings').select('*').eq('key', 'birthday_voucher_value').maybeSingle()
      if (bVal) setBirthdayVoucherValue(bVal.value || '10')

      const { data: bSvc } = await supabase.from('system_settings').select('*').eq('key', 'birthday_voucher_service_id').maybeSingle()
      if (bSvc) setBirthdayVoucherServiceId(bSvc.value || null)

      const { data: bVali } = await supabase.from('system_settings').select('*').eq('key', 'birthday_voucher_validity').maybeSingle()
      if (bVali) setBirthdayVoucherValidity(bVali.value || '30')

      const { data: bTemplDe } = await supabase.from('system_settings').select('*').eq('key', 'birthday_message_template_de').maybeSingle()
      if (bTemplDe) setBirthdayMessageTemplateDe(bTemplDe.value || '')

      const { data: bTemplPt } = await supabase.from('system_settings').select('*').eq('key', 'birthday_message_template_pt').maybeSingle()
      if (bTemplPt) setBirthdayMessageTemplatePt(bTemplPt.value || '')

    } catch (error) {
      console.error('Error in fetchSettingsData:', error)
      toast.error('Fehler beim Laden der Einstellungen')
    }
  }

  const fetchWhatsAppData = async () => {
    try {
      // Fetch Saved Number
      const { data: numSetting } = await supabase.from('system_settings').select('*').eq('key', 'whatsapp_number').maybeSingle()
      if (numSetting) setWhatsappNumber(numSetting.value)

      // Fetch Saved Queue Status
      const { data: queueActiveSetting } = await supabase.from('system_settings').select('*').eq('key', 'whatsapp_queue_active').maybeSingle()
      if (queueActiveSetting) setWhatsappQueueActive(queueActiveSetting.value === 'true')

      // Fetch Status from Evolution API
      const res = await fetch('http://localhost:8085/instance/fetchInstances', {
        headers: { 'apikey': 'salon_key_123' }
      })
      if (res.ok) {
        const instances = await res.json()
        const salonInst = instances.find((i: any) => i.instance.instanceName === 'salon')
        if (salonInst) {
          setWhatsappStatus(salonInst.instance.status === 'open' ? 'connected' : 'disconnected')
          setWhatsappQrCode(salonInst.qrcode?.base64 || null)
        }
      }
    } catch (error) {
      console.log('WhatsApp logic skipped (Local API not available)')
      setWhatsappStatus('disconnected')
    }
  }

  const saveWhatsappNumber = async () => {
    try {
      const { error } = await supabase.from('system_settings').upsert(
        { key: 'whatsapp_number', value: whatsappNumber },
        { onConflict: 'key' }
      )
      if (error) throw error
      toast.success(t('whatsappNumberSaved'))
    } catch (e) {
      toast.error(t('error'))
    }
  }

  const generateWhatsappPairingCode = async () => {
    if (!whatsappNumber) {
      toast.error(t('fillWhatsappNumberError' as any))
      return
    }
    try {
      setIsGeneratingCode(true)
      setWhatsappPairingCode('')

      // 1. Recreate/Restart instance to be sure
      await fetch('http://localhost:8085/instance/delete/salon', { 
        method: 'DELETE', 
        headers: { 'apikey': 'salon_key_123' } 
      }).catch(() => {})

      const createRes = await fetch('http://localhost:8085/instance/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'apikey': 'salon_key_123' 
        },
        body: JSON.stringify({ instanceName: 'salon', token: 'salon_key_123', qrcode: true })
      })

      if (!createRes.ok) {
        const errText = await createRes.text()
        console.error('Create response:', errText)
        
        // If it already exists, we can proceed
        if (createRes.status === 400 && errText.includes('already exists')) {
          console.log('Instance already exists, proceeding to pairing...')
        } else {
          throw new Error(`Create failed: ${errText}`)
        }
      }
      
      // Wait for Baileys to init
      await new Promise(r => setTimeout(r, 3000))

      // 2. Request Pairing Code
      const pairingRes = await fetch(`http://localhost:8085/instance/connect/salon?number=${whatsappNumber}`, {
        headers: { 'apikey': 'salon_key_123' }
      })

      if (!pairingRes.ok) throw new Error('Pairing failed')
      
      const data = await pairingRes.json()
      if (data.pairingCode) {
        setWhatsappPairingCode(data.pairingCode)
      } else {
        throw new Error('No code returned')
      }
    } catch (e) {
      console.error(e)
      toast.error(t('whatsappPairingError'))
    } finally {
      setIsGeneratingCode(false)
    }
  }

  const generateWhatsappQRCode = async () => {
    try {
      setIsGeneratingCode(true)
      setWhatsappQrCode('')
      setWhatsappPairingCode('')

      // 1. Recreate instance
      await fetch('http://localhost:8085/instance/delete/salon', { 
        method: 'DELETE', 
        headers: { 'apikey': 'salon_key_123' } 
      }).catch(() => {})

      const createRes = await fetch('http://localhost:8085/instance/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'apikey': 'salon_key_123' 
        },
        body: JSON.stringify({ instanceName: 'salon', token: 'salon_key_123', qrcode: true })
      })

      if (!createRes.ok) {
        const errText = await createRes.text()
        if (createRes.status !== 400 || !errText.includes('already exists')) {
          throw new Error(`Create failed: ${errText}`)
        }
      }
      
      // 2. Fetch QR Code
      const qrRes = await fetch('http://localhost:8085/instance/connect/salon', {
        headers: { 'apikey': 'salon_key_123' }
      })

      if (!qrRes.ok) throw new Error('QR Fetch failed')
      
      const data = await qrRes.json()
      if (data.base64) {
        setWhatsappQrCode(data.base64)
      } else {
        throw new Error('No QR base64 returned')
      }
    } catch (e) {
      console.error(e)
      toast.error(t('whatsappPairingError'))
    } finally {
      setIsGeneratingCode(false)
    }
  }

  const disconnectWhatsapp = async () => {
    if (!confirm(t('confirm') + '?')) return
    try {
      await fetch('http://localhost:8085/instance/logout/salon', {
        method: 'DELETE',
        headers: { 'apikey': 'salon_key_123' }
      })
      setWhatsappStatus('disconnected')
      setWhatsappPairingCode('')
      toast.success(t('whatsappDisconnected'))
    } catch (e) {
      toast.error(t('error'))
    }
  }

  const addShippingOption = async () => {
    if (!newShippingOption.name || newShippingOption.price < 0) {
      toast.error('Bitte Name und gültigen Preis angeben')
      return
    }

    try {
      const { error } = await supabase.from('shipping_options').insert({
        name: newShippingOption.name,
        price: Number(newShippingOption.price),
        active: true
      })
      if (error) throw error

      toast.success('Versandart hinzugefügt')
      setNewShippingOption({ name: '', price: 0 })
      fetchSettingsData()
    } catch (error) {
      console.error('Error adding shipping option:', error)
      toast.error('Fehler beim Hinzufügen')
    }
  }

  const deleteShippingOption = async (id: string) => {
    if (!confirm('Sind Sie sicher?')) return
    try {
      const { error } = await supabase.from('shipping_options').delete().eq('id', id)
      if (error) throw error
      toast.success('Versandart gelöscht')
      fetchSettingsData()
    } catch (error) {
      toast.error('Fehler beim Löschen')
    }
  }

  const toggleShippingOption = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('shipping_options').update({ active: !currentStatus }).eq('id', id)
      if (error) throw error
      toast.success('Status aktualisiert')
      fetchSettingsData()
    } catch (error) {
      toast.error('Fehler beim Aktualisieren')
    }
  }

  const saveBusinessHours = async () => {
    try {
      const { error } = await supabase.from('business_hours').upsert(businessHours, { onConflict: 'day_of_week' })
      if (error) throw error
      toast.success('Öffnungszeiten gespeichert')
    } catch (error) {
      toast.error('Fehler beim Speichern der Öffnungszeiten')
    }
  }

  const toggleBookingPaused = async () => {
    try {
      const newValue = !bookingPaused
      const { error } = await supabase.from('system_settings').upsert({ key: 'booking_paused', value: String(newValue) }, { onConflict: 'key' })
      if (error) throw error
      setBookingPaused(newValue)
      toast.success(newValue ? 'Buchungen pausiert' : 'Buchungen aktiviert')
    } catch (error: any) {
      console.error('Error toggling booking status:', error)
      toast.error(`Fehler beim Ändern des Status: ${error.message || error}`)
    }
  }

  const addBlockedDate = async () => {
    if (!newBlockedDate) return
    try {
      const { error } = await supabase.from('blocked_dates').insert({ date: newBlockedDate })
      if (error) throw error
      toast.success('Datum blockiert')
      setNewBlockedDate('')
      fetchSettingsData()
    } catch (error) {
      toast.error('Fehler beim Blockieren des Datums')
    }
  }

  const removeBlockedDate = async (id: string) => {
    try {
      const { error } = await supabase.from('blocked_dates').delete().eq('id', id)
      if (error) throw error
      toast.success('Blockierung aufgehoben')
      fetchSettingsData()
    } catch (error) {
      toast.error('Fehler beim Löschen')
    }
  }

  const addBlockedSlot = async () => {
    if (!newBlockedSlot.date || !newBlockedSlot.start_time || !newBlockedSlot.end_time) {
      toast.error('Bitte Datum, Startzeit und Endzeit ausfüllen')
      return
    }

    try {
      const startDateTimeStr = `${newBlockedSlot.date} ${newBlockedSlot.start_time}:00 Europe/Zurich`;
      const endDateTimeStr = `${newBlockedSlot.date} ${newBlockedSlot.end_time}:00 Europe/Zurich`;

      const { error } = await supabase.from('blocked_slots').insert({
        start_time: startDateTimeStr,
        end_time: endDateTimeStr,
        reason: newBlockedSlot.reason
      })

      if (error) throw error

      toast.success('Pause hinzugefügt')
      setNewBlockedSlot({ date: '', start_time: '', end_time: '', reason: '' })
      fetchSettingsData()
    } catch (error) {
      console.error('Error adding blocked slot:', error)
      toast.error('Fehler beim Hinzufügen der Pause')
    }
  }

  const deleteBlockedSlot = async (id: string) => {
    try {
      const { error } = await supabase.from('blocked_slots').delete().eq('id', id)
      if (error) throw error
      toast.success('Pause entfernt')
      fetchSettingsData()
    } catch (error) {
      console.error('Error deleting blocked slot:', error)
      toast.error('Fehler beim Entfernen der Pause')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    try {
      setUploadingImage(true)
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('carousel-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('carousel-images')
        .getPublicUrl(filePath)

      setNewCarouselItem({ ...newCarouselItem, image_url: publicUrl })
      toast.success('Bild hochgeladen')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Fehler beim Hochladen des Bildes')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleInstagramImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    try {
      setUploadingImage(true)
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `insta_${Date.now()}_${index}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('carousel-images')
        .upload(`instagram/${fileName}`, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('carousel-images')
        .getPublicUrl(`instagram/${fileName}`)

      const newPosts = [...instagramPosts]
      newPosts[index].image_url = publicUrl
      setInstagramPosts(newPosts)
      toast.success('Bild hochgeladen')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Fehler beim Hochladen des Bildes')
    } finally {
      setUploadingImage(false)
    }
  }

  const saveInstagramPosts = async () => {
    try {
      setSavingInstagram(true)
      const { error } = await supabase.from('system_settings').upsert(
        { key: 'instagram_posts', value: JSON.stringify(instagramPosts) },
        { onConflict: 'key' }
      )
      if (error) throw error
      toast.success('Instagram Feed gespeichert')
    } catch (error) {
      toast.error('Fehler beim Speichern')
    } finally {
      setSavingInstagram(false)
    }
  }

  const addCarouselItem = async () => {
    if (!newCarouselItem.image_url) {
      toast.error('Bild ist erforderlich')
      return
    }
    try {
      const { error } = await supabase.from('carousel_items').insert(newCarouselItem)
      if (error) throw error
      toast.success('Karussell-Element hinzugefügt')
      setNewCarouselItem({ title: '', description: '', image_url: '', link_url: '', display_order: 0 })
      fetchSettingsData()
    } catch (error: any) {
      console.error('Error adding carousel item:', error)
      toast.error(`Fehler beim Hinzufügen: ${error.message || 'Unbekannter Fehler'}`)
    }
  }

  const saveRouletteSettings = async () => {
    try {
      const { error: enabledError } = await supabase.from('system_settings').upsert(
        { key: 'roulette_enabled', value: String(rouletteEnabled) },
        { onConflict: 'key' }
      )
      if (enabledError) throw enabledError

      const { error: settingsError } = await supabase.from('system_settings').upsert(
        {
          key: 'roulette_settings',
          value: JSON.stringify({
            options: rouletteSettings.options,
            cooldown_days: rouletteSettings.cooldown_days
          })
        },
        { onConflict: 'key' }
      )
      if (settingsError) throw settingsError

      toast.success(t('settingsSaved'))
      await fetchSettingsData()
    } catch (error) {
      console.error('Error saving roulette settings:', error)
      toast.error(t('error'))
    }
  }

  const deleteCarouselItem = async (id: string) => {
    try {
      const { error } = await supabase.from('carousel_items').delete().eq('id', id)
      if (error) throw error
      toast.success('Element gelöscht')
      fetchSettingsData()
    } catch (error) {
      toast.error('Fehler beim Löschen')
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      // Call RPC to get users. If it fails, we might need to create it.
      const { data, error } = await supabase.rpc('get_users_list')

      if (error) {
        console.error('Error fetching users:', error)
        // Fallback or error handling
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          toast.error('Systemfunktion "get_users_list" fehlt. Bitte Datenbank aktualisieren.')
        } else {
          toast.error(`Fehler: ${error.message}`)
        }
        return
      }

      setUsers(data || [])
    } catch (error) {
      await handleSupabaseError(error, 'users fetch')
    }
 finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    const loadingToast = toast.loading(language === 'pt-BR' ? 'Atualizando cargo...' : 'Rolle wird aktualisiert...');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch('/api/admin-mgmt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'updateUserRole', userId, role: newRole })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update user role');

      toast.success(language === 'pt-BR' ? 'Cargo atualizado com sucesso!' : 'Rolle erfolgreich aktualisiert!', { id: loadingToast });
      fetchUsers();
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(
        language === 'pt-BR' ? `Erro ao atualizar cargo: ${errorMessage}` : `Fehler beim Aktualisieren: ${errorMessage}`, 
        { id: loadingToast }
      );
    }
  };

  const fetchBlockedDates = fetchSettingsData
  const fetchBlockedSlots = fetchSettingsData
  const saveInstagramLinks = saveInstagramPosts

  const fetchClientsList = async () => {
    try {
      setClientsLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('*, appointments(id, payment_method)')
        .order('full_name', { ascending: true })

      if (error) throw error
      setClientsList(data || [])
    } catch (error) {
      await handleSupabaseError(error, 'clients')
      toast.error('Fehler beim Laden der Kunden')
    } finally {
      setClientsLoading(false)
    }
  }

  const handleRaffle = () => {
    if (clientsList.length === 0) {
      toast.error('Keine Kunden für die Verlosung verfügbar')
      return
    }

    setIsRaffling(true)
    setRaffleWinner(null)

    let counter = 0
    const maxSpins = 30
    const intervalTime = 100

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * clientsList.length)
      setRaffleWinner(clientsList[randomIndex])
      counter++

      if (counter >= maxSpins) {
        clearInterval(interval)
        setIsRaffling(false)
        // Set final winner
        const finalWinner = clientsList[Math.floor(Math.random() * clientsList.length)]
        setRaffleWinner(finalWinner)
      }
    }, intervalTime)
  }

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Tem certeza que deseja remover este cliente? Esta ação não pode ser desfeita e pode afetar os agendamentos vinculados.')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Sessão expirada')
        return
      }

      const res = await fetch('/api/admin-mgmt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'deleteClient', clientId })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao remover cliente')
      }

      toast.success('Cliente removido com sucesso')
      fetchClientsList()
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao remover cliente')
    }
  }

  const openEditClient = (client: any) => {
    setEditingClient(client)
    setClientForm({
      full_name: client.full_name || '',
      email: client.email || '',
      phone: client.phone || '',
      birth_date: client.birth_date || ''
    })
    setClientFormOpen(true)
  }

  const saveClient = async () => {
    if (!editingClient) return
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          full_name: clientForm.full_name,
          email: clientForm.email,
          phone: clientForm.phone,
          birth_date: clientForm.birth_date || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingClient.id)

      if (error) throw error
      toast.success(t('success'))
      setClientFormOpen(false)
      fetchClientsList()
    } catch (error) {
      console.error('Error saving client:', error)
      toast.error(t('error'))
    }
  }

  const sendCampaign = async () => {
    if (selectedClientIds.length === 0) {
        toast.error('Selecione ao menos um cliente')
        return
    }
    if (!campaignForm.title || !campaignForm.message) {
        toast.error('Preencha o título e a mensagem')
        return
    }

    setSendingCampaign(true)
    try {
        // 1. Create Campaign Record
        const { data: campaign, error: campaignError } = await supabase
            .from('campaigns')
            .insert([{
                title: campaignForm.title,
                message_template: campaignForm.message,
                recipient_count: selectedClientIds.length,
                voucher_config: campaignForm.includeVoucher ? {
                    type: campaignForm.voucherType,
                    value: campaignForm.voucherValue,
                    validity: campaignForm.voucherValidity,
                    service_id: campaignForm.serviceId
                } : null
            }])
            .select()
            .single()

        if (campaignError) throw campaignError

        // 2. Fetch selected clients details
        const { data: clients, error: fetchClientsError } = await supabase
            .from('clients')
            .select('id, full_name, phone')
            .in('id', selectedClientIds)

        if (fetchClientsError) throw fetchClientsError

        const queueEntries = []
        const voucherEntries = []

        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + Number(campaignForm.voucherValidity || 30))

        for (const client of clients || []) {
            let personalizedMessage = campaignForm.message.replace(/{name}/g, client.full_name || '')
            let voucherCode = ''

            if (campaignForm.includeVoucher) {
                const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
                voucherCode = `PROM-${randomPart}-${client.id.substring(0, 4).toUpperCase()}`
                
                voucherEntries.push({
                    client_id: client.id,
                    code: voucherCode,
                    type: campaignForm.voucherType,
                    value: campaignForm.voucherType === 'free_service' ? null : Number(campaignForm.voucherValue),
                    service_id: campaignForm.voucherType === 'free_service' ? campaignForm.serviceId : null,
                    expires_at: expiresAt.toISOString(),
                    validity_days: Number(campaignForm.voucherValidity || 30)
                })

                personalizedMessage = personalizedMessage.replace(/{voucher_code}/g, voucherCode)
                personalizedMessage = personalizedMessage.replace(/{expiry_date}/g, expiresAt.toLocaleDateString('pt-BR'))
            }

            if (client.phone) {
                let phoneClean = client.phone.replace(/\D/g, '')
                if (phoneClean.length === 11) phoneClean = '55' + phoneClean
                
                queueEntries.push({
                    number: phoneClean,
                    message: personalizedMessage,
                    status: 'pending'
                })
            }
        }

        // 3. Insert Vouchers
        if (voucherEntries.length > 0) {
            const { error: vError } = await supabase.from('vouchers').insert(voucherEntries)
            if (vError) throw vError
        }

        // 4. Insert into WhatsApp Queue
        if (queueEntries.length > 0) {
            const { error: qError } = await supabase.from('whatsapp_queue').insert(queueEntries)
            if (qError) throw qError
        }

        toast.success(t('campaignSuccess' as any))
        setCampaignModalOpen(false)
        setSelectedClientIds([])
        setCampaignForm({
            title: '',
            message: '',
            includeVoucher: false,
            voucherType: 'discount_percentage',
            voucherValue: '',
            voucherValidity: '30',
            serviceId: ''
        })

    } catch (error) {
        console.error('Error sending campaign:', error)
        toast.error(t('error'))
    } finally {
        setSendingCampaign(false)
    }
  }

  const insertTag = (tag: string) => {
    const textarea = campaignMessageRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = campaignForm.message
    const before = text.substring(0, start)
    const after = text.substring(end, text.length)

    const newMessage = before + tag + after
    setCampaignForm({ ...campaignForm, message: newMessage })

    // Restore focus and cursor position after state update
    setTimeout(() => {
      textarea.focus()
      const newPos = start + tag.length
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: newRole
      })

      if (error) throw error

      toast.success(`Benutzerrolle auf "${newRole}" aktualisiert`)
      fetchUsers()
    } catch (error) {
      await handleSupabaseError(error, 'role update')
      toast.error('Fehler beim Aktualisieren der Rolle')
    }
  }

  const fetchAppointments = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('appointments')
        .select(`
          *, 
          client:clients!client_id(*),
          professionals(id, name, photo_url),
          services:appointment_services(
            service_id,
            order_index,
            price_at_time,
            duration_at_time,
            service:services!service_id(name)
          )
        `)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      // Helper to format as YYYY-MM-DD using local time components
      const formatDateLocal = (d: Date) => {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }

      // Apply date filter based on view mode
      if (viewMode === 'day') {
        const dateStr = formatDateLocal(selectedDate)
        query = query.eq('appointment_date', dateStr)
      } else if (viewMode === 'week') {
        const startOfWeek = new Date(selectedDate)
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay())
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)

        query = query
          .gte('appointment_date', formatDateLocal(startOfWeek))
          .lte('appointment_date', formatDateLocal(endOfWeek))
      } else if (viewMode === 'month') {
        const year = selectedDate.getFullYear()
        const month = selectedDate.getMonth()
        const startOfMonth = new Date(year, month, 1)
        const endOfMonth = new Date(year, month + 1, 0)

        query = query
          .gte('appointment_date', formatDateLocal(startOfMonth))
          .lte('appointment_date', formatDateLocal(endOfMonth))
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const res = await query

      if (res.error) throw res.error

      interface RawServiceItem {
        service_id: string
        order_index: number | null
        price_at_time: number
        duration_at_time: number
        service: { name: string }
      }



      interface RawAppointment {
        id: string
        appointment_date: string
        appointment_time: string
        total_price: number
        total_duration_minutes: number
        status: 'confirmed' | 'cancelled' | 'completed' | 'no_show'
        notes: string | null
        is_paid?: boolean
        payment_method?: string
        source?: string
        created_at: string
        client: { id: string; full_name: string; email?: string | null; phone: string }
        professionals?: { id: string; name: string; photo_url: string | null }
        professional_id?: string | null
        services: RawServiceItem[]
      }

      const rows = res.data ?? []
      const formattedAppointments: Appointment[] = rows.map((apt: RawAppointment) => ({
        id: apt.id,
        appointment_date: apt.appointment_date,
        appointment_time: apt.appointment_time,
        total_price: apt.total_price,
        total_duration_minutes: apt.total_duration_minutes,
        status: apt.status,
        notes: apt.notes,
        is_paid: apt.is_paid,
        payment_method: apt.payment_method || 'salon',
        source: apt.source || 'online',
        created_at: apt.created_at,
        client: apt.client ? {
          id: apt.client.id,
          full_name: apt.client.full_name,
          email: apt.client.email ?? '',
          phone: apt.client.phone
        } : {
          id: '',
          full_name: 'Cliente não informado',
          email: '',
          phone: ''
        },
        professional_id: apt.professional_id,
        professional: apt.professionals ? {
          id: apt.professionals.id,
          name: apt.professionals.name,
          photo_url: apt.professionals.photo_url
        } : undefined,
        services: apt.services
          .sort((a: RawServiceItem, b: RawServiceItem) => (a.order_index ?? 0) - (b.order_index ?? 0))
          .map((service: RawServiceItem) => ({
            id: service.service_id,
            name: service.service.name,
            price: service.price_at_time,
            duration_minutes: service.duration_at_time
          }))
      }))

      // Apply search filter
      const filteredAppointments = formattedAppointments.filter(apt =>
        apt.client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.client.phone.includes(searchTerm) ||
        apt.services.some(service =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )

      setAppointments(filteredAppointments)
    } catch (error) {
      await handleSupabaseError(error, 'appointments')
      toast.error('Fehler beim Laden der Termine')
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', appointmentId)

      if (error) throw error

      toast.success('Terminstatus erfolgreich aktualisiert!')
      fetchAppointments()
    } catch (error) {
      console.error('Error updating appointment status:', error)
      toast.error('Fehler beim Aktualisieren des Terminstatus')
    }
  }

  const deleteAppointment = async (appointmentId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Termin löschen möchten?')) return

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)

      if (error) throw error

      toast.success('Termin erfolgreich gelöscht!')
      fetchAppointments()
    } catch (error) {
      console.error('Error deleting appointment:', error)
      toast.error('Fehler beim Löschen des Termins')
    }
  }

  const rescheduleAppointment = async (
    appointmentId: string,
    newDate: string,
    newTime: string,
    newProfessionalId: string | null,
    newNotes: string,
    newStatus: any
  ) => {
    try {
      const currentAppt = appointments.find(a => a.id === appointmentId)
      if (!currentAppt) throw new Error('Agendamento não encontrado')

      // 1. Obter informações de alteração
      const isDateChanged = currentAppt.appointment_date !== newDate
      const isTimeChanged = currentAppt.appointment_time.slice(0, 5) !== newTime.slice(0, 5)
      const isProfessionalChanged = currentAppt.professional_id !== newProfessionalId

      // Se mudou a data, hora ou profissional, validamos a disponibilidade (Opção A - Rigoroso)
      if (isDateChanged || isTimeChanged || isProfessionalChanged) {
        if (newProfessionalId) {
          const totalDuration = currentAppt.total_duration_minutes
          const servicesList = currentAppt.services.map(s => ({ id: s.id, duration_minutes: s.duration_minutes }))

          const availabilityMap = await getAvailabilityPerProfessional(
            newDate,
            servicesList,
            totalDuration,
            newProfessionalId
          )

          const proAvail = availabilityMap.get(newProfessionalId)
          const isSlotAvailable = proAvail?.availableSlots.includes(newTime.slice(0, 5))

          if (!isSlotAvailable) {
            toast.error(
              language === 'pt-BR'
                ? 'O profissional selecionado não está disponível nesta data e horário!'
                : 'Der ausgewählte Mitarbeiter ist an diesem Datum und zu dieser Uhrzeit nicht verfügbar!'
            )
            return false
          }
        }
      }

      // 2. Atualizar compromisso no banco de dados
      const { error } = await supabase
        .from('appointments')
        .update({
          appointment_date: newDate,
          appointment_time: newTime,
          professional_id: newProfessionalId,
          notes: newNotes,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)

      if (error) throw error

      toast.success(
        language === 'pt-BR'
          ? 'Agendamento atualizado com sucesso!'
          : 'Termin erfolgreich aktualisiert!'
      )

      // 3. Disparar notificações de alteração de horário (apenas se data, hora ou profissional mudaram)
      if (isDateChanged || isTimeChanged || isProfessionalChanged) {
        const client = currentAppt.client
        const professionalObj = professionals.find(p => p.id === newProfessionalId)

        if (client.email || client.phone) {
          const bookingData = {
            clientName: client.full_name,
            clientEmail: client.email || '',
            services: currentAppt.services.map(s => ({ name: s.name, price: s.price })),
            totalPrice: currentAppt.total_price,
            appointmentDate: newDate,
            appointmentTime: newTime,
            appointmentId: appointmentId,
            paymentMethod: getPaymentMethodLabel(currentAppt.payment_method || ''),
            phone: client.phone || '',
            language: (language as 'de-CH' | 'pt-BR') || 'de-CH',
            professionalName: professionalObj?.name || ''
          }

          if (client.email) {
            sendRescheduleNotification(bookingData)
          }
          if (client.phone) {
            sendRescheduleWhatsApp(bookingData)
          }
        }
      }

      // Atualizar compromisso local selecionado se o modal de detalhes estiver aberto
      if (selectedAppointmentForDetails && selectedAppointmentForDetails.id === appointmentId) {
        const updatedProf = professionals.find(p => p.id === newProfessionalId)
        setSelectedAppointmentForDetails({
          ...selectedAppointmentForDetails,
          appointment_date: newDate,
          appointment_time: newTime,
          professional_id: newProfessionalId,
          notes: newNotes,
          status: newStatus,
          professional: updatedProf ? {
            id: updatedProf.id,
            name: updatedProf.name,
            photo_url: updatedProf.photo_url
          } : undefined
        })
      }

      // Atualizar lista
      fetchAppointments()
      return true
    } catch (err) {
      console.error('Error rescheduling appointment:', err)
      toast.error(
        language === 'pt-BR'
          ? 'Erro ao atualizar o agendamento no banco de dados'
          : 'Fehler beim Aktualisieren des Termins in der Datenbank'
      )
      return false
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'no_show':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return t('confirmed')
      case 'cancelled':
        return t('cancelled')
      case 'completed':
        return t('completed')
      case 'no_show':
        return t('noShow' as any)
      default:
        return status
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'salon':
      case 'pickup':
        return t('paymentSalon' as any) || 'No Salão'
      case 'credit_card':
        return t('payOnline' as any) || 'Online'
      case 'twint':
        return 'TWINT'
      case 'cash':
        return t('paymentCash' as any) || 'Dinheiro'
      default:
        return method || (t('paymentSalon' as any) || 'No Salão')
    }
  }

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'salon':
      case 'pickup':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'credit_card':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'twint':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'cash':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'manual':
        return t('manual' as any) || 'Manual'
      case 'website':
        return 'Website'
      default:
        return source
    }
  }

  const getGridStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-50 border-l-green-500 hover:bg-green-100'
      case 'completed':
        return 'bg-blue-50 border-l-blue-500 hover:bg-blue-100'
      case 'no_show':
        return 'bg-orange-50 border-l-orange-400 hover:bg-orange-100'
      case 'cancelled':
        return 'bg-red-50 border-l-red-400 hover:bg-red-100 opacity-60'
      default:
        return 'bg-gray-50 border-l-gray-400'
    }
  }

  const changeDate = (direction: number) => {
    const newDate = new Date(selectedDate)
    if (viewMode === 'week') newDate.setDate(selectedDate.getDate() + direction * 7)
    else if (viewMode === 'month') newDate.setMonth(selectedDate.getMonth() + direction)
    else newDate.setDate(selectedDate.getDate() + direction)
    setSelectedDate(newDate)
  }

  const getDateDisplay = () => {
    if (viewMode === 'day') {
      return formatDate(selectedDate)
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(selectedDate)
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`
    } else {
      return selectedDate.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })
    }
  }

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('display_order', { ascending: true })
    
    if (error) {
      await handleSupabaseError(error, 'services')
    } else {
      setServices(data || [])
    }
  }

  const loadPromotions = async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key,value')
      .or('key.eq.store_discount_pct,key.like.service_discount_pct_%')
    
    if (error) {
      await handleSupabaseError(error, 'promotions')
      return
    }
    
    type SettingRow = { key: string; value: string | null }
    const rows = (data || []) as SettingRow[]
    const store = rows.find((r) => r.key === 'store_discount_pct')
    setPromoStorePct(store && store.value != null ? Number(store.value) : 0)
    const svcRows = rows.filter((r) => r.key.startsWith('service_discount_pct_'))
    const map: Record<string, number> = {}
    for (const r of svcRows) {
      const sid = r.key.replace('service_discount_pct_', '')
      map[sid] = r.value != null ? Number(r.value) : 0
    }
    setPromoPerService(map)
  }

  const fetchProfessionals = async () => {
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) {
      await handleSupabaseError(error, 'professionals')
    } else {
      setProfessionals(data || [])
      // Also fetch all professional services for filtering
      const { data: svcData } = await supabase.from('professional_services').select('*')
      setAllProfessionalServices(svcData || [])
    }
  }

  const openCreateProfessional = () => {
    setEditingProfessional(null)
    setProfessionalForm({ name: '', bio: '', photo_url: '', active: true })
    setProfServices([])
    // Default schedule (Mon-Fri 09:00-18:00, Sat 09:00-15:00, Sun Closed)
    setProfSchedule([
      { day_of_week: 0, open_time: null, close_time: null, is_closed: true },
      { day_of_week: 1, open_time: '09:00', close_time: '18:00', is_closed: false },
      { day_of_week: 2, open_time: '09:00', close_time: '18:00', is_closed: false },
      { day_of_week: 3, open_time: '09:00', close_time: '18:00', is_closed: false },
      { day_of_week: 4, open_time: '09:00', close_time: '18:00', is_closed: false },
      { day_of_week: 5, open_time: '09:00', close_time: '18:00', is_closed: false },
      { day_of_week: 6, open_time: '09:00', close_time: '15:00', is_closed: false },
    ])
    setProfessionalFormOpen(true)
  }

  const openEditProfessional = async (prof: any) => {
    setEditingProfessional(prof)
    setProfessionalForm({
      name: prof.name || '',
      bio: prof.bio || '',
      photo_url: prof.photo_url || '',
      active: Boolean(prof.active ?? true)
    })

    // Fetch assigned services
    const { data: servicesData } = await supabase
      .from('professional_services')
      .select('service_id')
      .eq('professional_id', prof.id)

    setProfServices(servicesData?.map(s => s.service_id) || [])

    // Fetch schedule
    const { data: scheduleData } = await supabase
      .from('professional_schedule')
      .select('*')
      .eq('professional_id', prof.id)
      .order('day_of_week')

    if (scheduleData && scheduleData.length > 0) {
      // Merge with default structure to ensure all days exist
      const fullSchedule = [0, 1, 2, 3, 4, 5, 6].map(day => {
        const existing = scheduleData.find(s => s.day_of_week === day)
        if (existing) {
          return {
            ...existing,
            open_time: existing.start_time, // Map DB 'start_time' to UI 'open_time'
            close_time: existing.end_time,   // Map DB 'end_time' to UI 'close_time'
            is_closed: !existing.is_active // Map DB 'is_active' to UI 'is_closed'
          }
        }
        return { day_of_week: day, open_time: null, close_time: null, is_closed: true }
      })
      setProfSchedule(fullSchedule)
    } else {
      // Default fallback
      setProfSchedule([
        { day_of_week: 0, open_time: null, close_time: null, is_closed: true },
        { day_of_week: 1, open_time: '09:00', close_time: '18:00', is_closed: false },
        { day_of_week: 2, open_time: '09:00', close_time: '18:00', is_closed: false },
        { day_of_week: 3, open_time: '09:00', close_time: '18:00', is_closed: false },
        { day_of_week: 4, open_time: '09:00', close_time: '18:00', is_closed: false },
        { day_of_week: 5, open_time: '09:00', close_time: '18:00', is_closed: false },
        { day_of_week: 6, open_time: '09:00', close_time: '15:00', is_closed: false },
      ])
    }

    setProfessionalFormOpen(true)
  }

  const saveProfessional = async () => {
    const payload = {
      name: professionalForm.name.trim(),
      bio: professionalForm.bio.trim(),
      photo_url: professionalForm.photo_url.trim() || null,
      active: professionalForm.active
    }

    if (!payload.name) {
      toast.error(t('fillProfessionalNameError' as any))
      return
    }

    try {
      let profId = editingProfessional?.id

      if (editingProfessional) {
        const { error } = await supabase
          .from('professionals')
          .update(payload)
          .eq('id', editingProfessional.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('professionals')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        profId = data.id
      }

      // Save Services
      if (profId) {
        // Delete existing services
        // Delete existing services
        const { error: delSvcError } = await supabase.from('professional_services').delete().eq('professional_id', profId)
        if (delSvcError) throw delSvcError

        // Insert new services
        if (profServices.length > 0) {
          const servicesPayload = profServices.map(svcId => ({
            professional_id: profId,
            service_id: svcId
          }))
          const { error: svcError } = await supabase.from('professional_services').insert(servicesPayload)
          if (svcError) throw svcError
        }

        // Save Schedule
        // Delete existing schedule
        // Save Schedule
        // Delete existing schedule
        const { error: delSchedError } = await supabase.from('professional_schedule').delete().eq('professional_id', profId)
        if (delSchedError) throw delSchedError

        // Insert new schedule (only valid ones?)
        // Or upsert? Logic above deletes so we insert.
        const schedulePayload = profSchedule.map(s => ({
          professional_id: profId,
          day_of_week: s.day_of_week,
          start_time: s.open_time || '09:00',
          end_time: s.close_time || '18:00',
          is_active: !s.is_closed // Map UI 'is_closed' to DB 'is_active' (inverse)
        }))

        const { error: schedError } = await supabase.from('professional_schedule').insert(schedulePayload)
        if (schedError) throw schedError
      }

      toast.success(t('success'))
      setProfessionalFormOpen(false)
      fetchProfessionals()
    } catch (error) {
      console.error('Error saving professional:', error)
      toast.error(t('error'))
    }
  }

  const deleteProfessional = async (id: string) => {
    if (!confirm(t('confirm'))) return
    
    try {
      // 1. Check if professional has any appointments
      const { data: appointments, error: countError } = await supabase
        .from('appointments')
        .select('id')
        .eq('professional_id', id)
        .limit(1)

      if (countError) throw countError

      if (appointments && appointments.length > 0) {
        // 2a. If has appointments, just deactivate
        const { error: updateError } = await supabase
          .from('professionals')
          .update({ active: false })
          .eq('id', id)
        
        if (updateError) throw updateError
        toast.success(t('deactivatedProfessional' as any) || 'Profissional desativado para preservar histórico')
      } else {
        // 2b. If no appointments, can delete (clean up relations first)
        await supabase.from('professional_services').delete().eq('professional_id', id)
        await supabase.from('professional_schedule').delete().eq('professional_id', id)
        
        const { error: deleteError } = await supabase
          .from('professionals')
          .delete()
          .eq('id', id)
          
        if (deleteError) throw deleteError
        toast.success(t('success'))
      }
      
      fetchProfessionals()
    } catch (error) {
      console.error('Error deleting professional:', error)
      toast.error(t('error'))
    }
  }

  const openCreateService = (category?: string) => {
    setEditingService(null)
    setIsCustomSubcategory(false)
    setServiceForm({ name: '', description: '', name_pt: '', description_pt: '', name_de: '', description_de: '', duration_minutes: 30, price: 0, category: category || '', active: true, display_order: (services?.length || 0) + 1, image_url: '', stock: 0, weight: 0, subcategory: '' })
    setServiceFormOpen(true)
    setIsNewMenuOpen(false)
  }

  const openEditService = (svc: any) => {
    setEditingService(svc)
    setIsCustomSubcategory(svc.subcategory && !KNOWN_SUBCATEGORIES.includes(svc.subcategory) ? true : false)
    setServiceForm({
      name: svc.name || '',
      description: svc.description || '',
      duration_minutes: svc.duration_minutes || 30,
      price: svc.price || 0,
      category: svc.category || '',
      active: Boolean(svc.active ?? true),
      name_pt: svc.name_pt || '',
      description_pt: svc.description_pt || '',
      name_de: svc.name_de || '',
      description_de: svc.description_de || '',
      display_order: svc.display_order ?? 0,
      image_url: svc.image_url || '',
      stock: svc.stock || 0,
      weight: svc.weight || 0,
      subcategory: svc.subcategory || ''
    })
    setServiceFormOpen(true)
  }

  const saveService = async () => {
    const payload = {
      name: serviceForm.name.trim(),
      description: serviceForm.description.trim(),
      duration_minutes: Number(serviceForm.duration_minutes),
      price: Number(serviceForm.price),
      category: serviceForm.category.trim() || null,
      active: Boolean(serviceForm.active),
      display_order: Number(serviceForm.display_order),
      name_pt: serviceForm.name_pt || null,
      description_pt: serviceForm.description_pt || null,
      name_de: serviceForm.name_de || null,
      description_de: serviceForm.description_de || null,
      updated_at: new Date().toISOString(),
      image_url: serviceForm.image_url || null,
      stock: serviceForm.category === 'product' ? Number(serviceForm.stock) : 0,
      weight: serviceForm.category === 'product' ? Number(serviceForm.weight) : 0,
      subcategory: serviceForm.subcategory || null
    }

    const isProduct = serviceForm.category === 'product'
    if (!payload.name || (!isProduct && !payload.duration_minutes) || !payload.price) {
      toast.error(isProduct ? 'Bitte Name und Preis ausfüllen' : 'Bitte Name, Dauer und Preis ausfüllen')
      return
    }
    if (editingService) {
      const { error } = await supabase
        .from('services')
        .update(payload)
        .eq('id', editingService.id)
      if (error) { toast.error(t('error')); return }
      toast.success(t('success'))
    } else {
      const { error } = await supabase
        .from('services')
        .insert([{ ...payload, created_at: new Date().toISOString() }])
      if (error) {
        console.error('Error creating service:', error)
        toast.error(`${t('error')}: ${error.message}`)
        return
      }
      toast.success(t('success'))
    }
    setServiceFormOpen(false)
    fetchServices()
  }

  const deleteService = async (serviceId: string) => {
    if (!confirm(t('confirm'))) return

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId)

    if (error) {
      console.error('Error deleting service:', error)
      if (error.code === '23503') {
        toast.error(t('serviceInUseError'))
      } else {
        toast.error(`${t('error')}: ${error.message || 'Unbekannter Fehler'}`)
      }
      return
    }

    toast.success(t('success'))
    fetchServices()
  }

  const handleManualCreate = async () => {
    const { date, time, notes, selectedServiceIds } = manualForm
    const isProduct = manualCategory === 'product'

    // Validation
    if ((!selectedClient && !clientSearch) || !date || (!time && !isProduct) || selectedServiceIds.length === 0) {
      toast.error(t('manualBookingFillError' as any))
      return
    }

    let client = selectedClient

    // Client handling
    if (client) {
      if ((manualForm.email && manualForm.email !== client.email) || (manualForm.phone && manualForm.phone !== client.phone)) {
        const { error: updateError } = await supabase
          .from('clients')
          .update({ email: manualForm.email, phone: manualForm.phone, updated_at: new Date().toISOString() })
          .eq('id', client.id)

        if (!updateError) {
          client = { ...client, email: manualForm.email, phone: manualForm.phone }
        }
      }
    }

    if (!client && clientSearch) {
      // Simple insert - just full_name and phone
      const insertData = {
        full_name: clientSearch,
        phone: manualForm.phone || `walkin_${Date.now()}`
      }

      console.log('ADMIN CLIENT INSERT:', insertData)
      
      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert([insertData])
        .select()
        .single()

      console.log('ADMIN CLIENT RESULT:', newClient, createError)
      
      if (createError || !newClient) {
        toast.error(t('error') + ': ' + createError?.message)
        return
      }
      client = newClient
    }

    const svcList = services.filter(s => selectedServiceIds.includes(s.id))
    const totalPrice = svcList.reduce((sum, s) => sum + Number(applyPriceWithPromotions(s.price, s.id)), 0)
    const totalDuration = isProduct ? 0 : svcList.reduce((sum, s) => sum + Number(s.duration_minutes), 0)

    const finalTime = isProduct ? "00:00:00" : (time.length === 5 ? `${time}:00` : time)

    // Check for conflicts before creating appointment (considering duration overlap)
    if (!isProduct && manualProfessionalId && totalDuration > 0) {
      const { data: existingAppts } = await supabase
        .from('appointments')
        .select('id, appointment_time, total_duration_minutes')
        .eq('professional_id', manualProfessionalId)
        .eq('appointment_date', date)
        .in('status', ['confirmed', 'completed'])

      if (existingAppts && existingAppts.length > 0) {
        const [newHour, newMin] = finalTime.split(':').map(Number)
        const newStartMins = newHour * 60 + newMin
        const newEndMins = newStartMins + totalDuration

        const hasConflict = existingAppts.some(apt => {
          const [existHour, existMin] = apt.appointment_time.split(':').map(Number)
          const existStartMins = existHour * 60 + existMin
          const existEndMins = existStartMins + (apt.total_duration_minutes || 0)

          return (newStartMins >= existStartMins && newStartMins < existEndMins) ||
                 (newEndMins > existStartMins && newEndMins <= existEndMins) ||
                 (newStartMins <= existStartMins && newEndMins >= existEndMins)
        })

        if (hasConflict) {
          toast.error(t('appointmentConflict') || 'Este horário conflita com outro agendamento!')
          return
        }
      }
    }

    // Create appointment using direct INSERT (more reliable)
    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        client_id: client.id,
        user_id: user?.id ?? null,
        professional_id: isProduct ? null : manualProfessionalId,
        appointment_date: date,
        appointment_time: finalTime,
        total_price: Number(totalPrice),
        total_duration_minutes: Number(totalDuration),
        status: 'confirmed',
        notes: notes || (isProduct ? 'Venda de produtos (manual)' : ''),
        payment_method: manualForm.payment_method || (isProduct ? 'salon' : 'salon'),
        payment_status: isProduct ? 'paid' : 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert Error:', insertError)
      toast.error(insertError.message || t('scheduleError'))
      return
    }

    const appointmentId = appointment.id

    // Insert services
    for (let i = 0; i < svcList.length; i++) {
      const s = svcList[i]
      await supabase.from('appointment_services').insert({
        appointment_id: appointmentId,
        service_id: s.id,
        order_index: i,
        price_at_time: applyPriceWithPromotions(s.price, s.id),
        duration_at_time: s.duration_minutes
      })
    }

    // Update stock for products if successful
    if (isProduct) {
      for (const product of svcList) {
        if (product.category === 'product') {
          const currentStock = product.stock || 0
          await supabase
            .from('services')
            .update({ stock: Math.max(0, currentStock - 1) })
            .eq('id', product.id)
        }
      }
      fetchServices()
    }

    // Trigger confirmations for manual creation
    if (manualForm.email || manualForm.phone) {
      const bookingData = {
        clientName: client?.full_name || manualForm.clientIdentifier,
        clientEmail: manualForm.email || '',
        services: svcList.map(s => ({ name: s.name, price: s.price })),
        totalPrice: Number(totalPrice),
        appointmentDate: manualForm.date,
        appointmentTime: manualForm.time,
        appointmentId: appointment.id,
        paymentMethod: getPaymentMethodLabel(manualForm.payment_method || ''),
        phone: manualForm.phone || '',
        language: (language as 'de-CH' | 'pt-BR') || 'de-CH'
      }

      if (manualForm.email) {
        sendBookingConfirmation(bookingData)
      }
      if (manualForm.phone) {
        sendBookingConfirmationWhatsApp(bookingData)
      }
    }

    toast.success(t('appointmentCreated'))
    setManualModalOpen(false)
    setManualProfessionalId(null)
    setManualForm({
      clientIdentifier: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      notes: '',
      selectedServiceIds: [],
      email: '',
      phone: '',
      birthDate: '',
      address: '',
      payment_method: 'salon'
    })
    fetchAppointments()
  }

  const applyPriceWithPromotions = (basePrice: number, serviceId: string) => {
    const perSvc = promoPerService[serviceId] || 0
    const storePct = promoStorePct || 0
    const pct = Math.max(perSvc, storePct)
    return Math.max(0, Math.round(basePrice * (1 - pct / 100) * 100) / 100)
  }

  const savePromotions = async () => {
    const now = new Date().toISOString()
    type SettingInsert = { key: string; value: string | null; description?: string | null; updated_at?: string | null }
    const rows: SettingInsert[] = [
      { key: 'store_discount_pct', value: String(promoStorePct), description: 'Global store discount percentage', updated_at: now },
      ...Object.entries(promoPerService).map(([serviceId, pct]) => ({ key: `service_discount_pct_${serviceId}`, value: String(pct), description: `Discount percentage for service ${serviceId}`, updated_at: now }))
    ]
    const { error } = await supabase
      .from('system_settings')
      .upsert(rows, { onConflict: 'key' })
    if (error) {
      toast.error(['admin', 'owner'].includes(user?.role || '') ? 'Fehler beim Speichern der Promotionen' : 'Nur Administratoren können Promotionen speichern')
      return
    }
    toast.success('Promotionen gespeichert')
  }

  const createUser = async () => {
    if (!newUserForm.email || !newUserForm.password || !newUserForm.fullName) {
      toast.error('Bitte alle Felder ausfüllen')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Sitzung abgelaufen')
        return
      }

      const res = await fetch('/api/admin-mgmt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'createUser', ...newUserForm })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Erstellen des Benutzers')
      }

      toast.success('Benutzer erfolgreich erstellt')
      setNewUserForm({ email: '', password: '', fullName: '', role: 'client' })
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error(error instanceof Error ? error.message : 'Fehler beim Erstellen des Benutzers')
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Benutzer löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Sitzung abgelaufen')
        return
      }

      const res = await fetch('/api/admin-mgmt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'deleteUser', userId })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Löschen des Benutzers')
      }

      toast.success('Benutzer erfolgreich gelöscht')
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error(error instanceof Error ? error.message : 'Fehler beim Löschen des Benutzers')
    }
  }

  // Partner Requests Logic
  const fetchPartnerRequests = async () => {
    setLoadingRequests(true)
    try {
      const { data, error } = await supabase
        .from('partner_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPartnerRequests(data || [])
    } catch (err: any) {
      console.error('Error fetching partner requests:', err)
      toast.error('Erro ao carregar solicitações de parceria')
    } finally {
      setLoadingRequests(false)
    }
  }

  const handleApproveRequest = async (request: any) => {
    try {
      const { error: reqError } = await supabase
        .from('partner_requests')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', request.id)

      if (reqError) throw reqError

      let targetUserId = request.user_id

      if (!targetUserId) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('user_id')
          .eq('email', request.email)
          .maybeSingle()

        if (clientData?.user_id) {
          targetUserId = clientData.user_id
        }
      }

      if (targetUserId) {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        const res = await fetch('/api/admin-mgmt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'updateUserRole',
            userId: targetUserId,
            role: 'partner'
          })
        })

        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || 'Erro ao promover usuário no Supabase Auth')
        }
        toast.success(isPt ? 'Parceria aprovada e usuário promovido!' : 'Partnerschaft genehmigt und Benutzer befördert!')
      } else {
        toast.success(isPt ? 'Solicitação aprovada! (Usuário pendente de cadastro no site)' : 'Bewerbung genehmigt! (Benutzer muss noch ein Konto erstellen)')
      }

      fetchPartnerRequests()
    } catch (err: any) {
      console.error(err)
      toast.error(`Erro ao aprovar: ${err.message}`)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('partner_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', requestId)

      if (error) throw error
      toast.success(isPt ? 'Solicitação de parceria rejeitada.' : 'Bewerbung abgelehnt.')
      fetchPartnerRequests()
    } catch (err: any) {
      console.error(err)
      toast.error(`Erro ao rejeitar: ${err.message}`)
    }
  }

  // Settings Logic

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .in('key', [
          'review_email_delay',
          'birthday_voucher_enabled',
          'birthday_voucher_type',
          'birthday_voucher_value',
          'birthday_voucher_service_id',
          'birthday_voucher_validity',
          'birthday_message_template_de',
          'birthday_message_template_pt',
          'upselling_enabled',
          'upselling_discount_pct',
          'whatsapp_number',
          'twint_phone',
          'twint_qr_url',
          'partner_discount_pct',
          'partner_min_order_amount',
          'partner_contract_text_de',
          'partner_contract_text_pt'
        ])

      if (error) throw error

      if (data) {
        const reviewDelay = data.find(s => s.key === 'review_email_delay')
        if (reviewDelay) setSettings({ review_email_delay: Number(reviewDelay.value) })

        const enabledV = data.find(s => s.key === 'birthday_voucher_enabled')
        if (enabledV) setBirthdayVoucherEnabled(enabledV.value === 'true')

        const typeV = data.find(s => s.key === 'birthday_voucher_type')
        if (typeV) setBirthdayVoucherType(typeV.value)

        const valueV = data.find(s => s.key === 'birthday_voucher_value')
        if (valueV) setBirthdayVoucherValue(valueV.value)

        const serviceIdV = data.find(s => s.key === 'birthday_voucher_service_id')
        if (serviceIdV) setBirthdayVoucherServiceId(serviceIdV.value)

        const validityV = data.find(s => s.key === 'birthday_voucher_validity')
        if (validityV) setBirthdayVoucherValidity(validityV.value)

        const templateDeV = data.find(s => s.key === 'birthday_message_template_de')
        if (templateDeV) setBirthdayMessageTemplateDe(templateDeV.value)

        const templatePtV = data.find(s => s.key === 'birthday_message_template_pt')
        if (templatePtV) setBirthdayMessageTemplatePt(templatePtV.value)

        const upsellingEnabled = data.find(s => s.key === 'upselling_enabled')
        if (upsellingEnabled) setUpsellingEnabled(upsellingEnabled.value === 'true')

        const upsellingDiscount = data.find(s => s.key === 'upselling_discount_pct')
        if (upsellingDiscount) setUpsellingDiscountPct(upsellingDiscount.value)

        const waNum = data.find(s => s.key === 'whatsapp_number')
        if (waNum) setWhatsappNumber(waNum.value || '')

        const waQueueActive = data.find(s => s.key === 'whatsapp_queue_active')
        if (waQueueActive) setWhatsappQueueActive(waQueueActive.value === 'true')

        const twPhone = data.find(s => s.key === 'twint_phone')
        if (twPhone) setTwintPhone(twPhone.value || '')

        const twQr = data.find(s => s.key === 'twint_qr_url')
        if (twQr) setTwintQrUrl(twQr.value || '')

        const pDiscount = data.find(s => s.key === 'partner_discount_pct')
        if (pDiscount) setPartnerDiscountPct(pDiscount.value)

        const pMinOrder = data.find(s => s.key === 'partner_min_order_amount')
        if (pMinOrder) setPartnerMinOrderAmount(pMinOrder.value)

        const pContractDe = data.find(s => s.key === 'partner_contract_text_de')
        if (pContractDe) setPartnerContractTextDe(pContractDe.value)

        const pContractPt = data.find(s => s.key === 'partner_contract_text_pt')
        if (pContractPt) setPartnerContractTextPt(pContractPt.value)
      } else {
        // Initialize if not exists
        setSettings({ review_email_delay: 2 })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const saveSettings = async () => {
    if (!settings) return
    setSavingSettings(true)
    try {
      const now = new Date().toISOString()
      const settingsPayload = [
        { key: 'review_email_delay', value: settings ? String(settings.review_email_delay) : '2', updated_at: now },
        { key: 'birthday_voucher_enabled', value: String(birthdayVoucherEnabled), updated_at: now },
        { key: 'birthday_voucher_type', value: birthdayVoucherType, updated_at: now },
        { key: 'birthday_voucher_value', value: birthdayVoucherValue, updated_at: now },
        { key: 'birthday_voucher_service_id', value: birthdayVoucherServiceId || '', updated_at: now },
        { key: 'birthday_voucher_validity', value: birthdayVoucherValidity, updated_at: now },
        { key: 'birthday_message_template_de', value: birthdayMessageTemplateDe, updated_at: now },
        { key: 'birthday_message_template_pt', value: birthdayMessageTemplatePt, updated_at: now },
        { key: 'upselling_enabled', value: String(upsellingEnabled), updated_at: now },
        { key: 'upselling_discount_pct', value: upsellingDiscountPct, updated_at: now },
        { key: 'whatsapp_number', value: whatsappNumber, updated_at: now },
        { key: 'whatsapp_queue_active', value: String(whatsappQueueActive), updated_at: now },
        { key: 'twint_phone', value: twintPhone, updated_at: now },
        { key: 'twint_qr_url', value: twintQrUrl, updated_at: now },
        { key: 'partner_discount_pct', value: String(partnerDiscountPct), updated_at: now },
        { key: 'partner_min_order_amount', value: String(partnerMinOrderAmount), updated_at: now },
        { key: 'partner_contract_text_de', value: partnerContractTextDe, updated_at: now },
        { key: 'partner_contract_text_pt', value: partnerContractTextPt, updated_at: now }
      ]

      const { error } = await supabase
        .from('system_settings')
        .upsert(settingsPayload, { onConflict: 'key' })

      if (error) throw error

      toast.success('Einstellungen gespeichert')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Fehler beim Speichern der Einstellungen')
    } finally {
      setSavingSettings(false)
    }
  }

  // Specialized save for upselling only (optional, but requested dedicated button idea)
  // Actually, saveSettings handles everything, so we can just reuse it.

  useEffect(() => {
    if (!whatsappQueueActive) {
      console.log('WhatsApp queue worker is on STANDBY.')
      return
    }
    // WhatsApp Queue Worker
    // This worker listens for new messages in 'whatsapp_queue' and sends them via the local API.
    // This bridges the gap between Vercel (Cloud) and Localhost (Docker).
    
    const sendPendingMessage = async (msgData: any) => {
      const { id, number, message, attempts = 0 } = msgData
      
      try {
        console.log('Worker processing message:', id, number)
        
        // Format number if necessary (e.g. Swiss numbers 079... -> 4179...)
        let targetNumber = String(number).replace(/\D/g, '')
        if (targetNumber.startsWith('0') && targetNumber.length === 10) {
          targetNumber = '41' + targetNumber.substring(1)
        } else if (targetNumber.length === 11 && targetNumber.startsWith('9')) {
          // Guessing Brazilian number missing 55
          targetNumber = '55' + targetNumber
        }

        const res = await fetch('http://localhost:8085/message/sendText/salon', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'salon_key_123'
          },
          body: JSON.stringify({
            number: targetNumber,
            textMessage: {
              text: message
            },
            linkPreview: false
          })
        })

        if (res.ok) {
          console.log('Worker sent message successfully:', id)
          await supabase
            .from('whatsapp_queue')
            .update({ status: 'sent', updated_at: new Date().toISOString() })
            .eq('id', id)
        } else {
          const errText = await res.text()
          let errorMsg = errText
          try {
            const errJson = JSON.parse(errText)
            if (errJson.response?.message?.[0]?.exists === false) {
              errorMsg = `O número ${number} não existe no WhatsApp. Verifique se incluiu o código do país (ex: 41 para Suíça ou 55 para Brasil).`
            }
          } catch (e) {}
          throw new Error(errorMsg)
        }
      } catch (error: any) {
        console.error('Worker failed to send message:', id, error)
        await supabase
            .from('whatsapp_queue')
            .update({ 
              status: 'error', 
              error_message: error.message,
              attempts: attempts + 1,
              updated_at: new Date().toISOString() 
            })
            .eq('id', id)
      }
    }

    const channel = supabase
      .channel('whatsapp-queue-worker')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_queue',
          filter: 'status=eq.pending'
        },
        (payload) => {
          sendPendingMessage(payload.new)
        }
      )
      .subscribe()

    // Polling fallback every 30 seconds just in case Realtime disconnects
    const checkInitialQueue = async () => {
      const { data } = await supabase
        .from('whatsapp_queue')
        .select('*')
        .or('status.eq.pending,and(status.eq.error,attempts.lt.3)')
        .limit(10)

      if (data && data.length > 0) {
        for (const msg of data) {
          await sendPendingMessage(msg)
        }
      }
    }

    checkInitialQueue()
    const interval = setInterval(checkInitialQueue, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [whatsappQueueActive])

  useEffect(() => {
    if (activeTab === 'settings' || activeTab === 'partner_requests') {
      fetchSettings()
    }
  }, [activeTab])

  // Manual Review Email
  const sendReviewEmail = async (appointmentId: string) => {
    if (!confirm('Möchten Sie jetzt eine Bewertungs-E-Mail an diesen Kunden senden?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Sitzung abgelaufen')
        return
      }

      const res = await fetch('/api/manual-review-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ appointmentId })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Senden der E-Mail')
      }

      toast.success('Bewertungs-E-Mail gesendet')
      // Update local state to reflect sent status ? (review_email_sent is not in the type definition yet maybe)
      // fetchAppointments() // Refresh list
    } catch (error) {
      console.error('Error sending review email:', error)
      toast.error(error instanceof Error ? error.message : 'Fehler beim Senden der E-Mail')
    }
  }

  // Derived state for filtered appointments
  const filteredAppointments = appointments.filter(apt => {
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter
    const matchesSearch = !searchTerm || 
      apt.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.services?.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Get appointment date as string in YYYY-MM-DD format
    const aptDateStr = apt.appointment_date
    
    if (viewMode === 'day') {
      // Format selectedDate to YYYY-MM-DD
      const y = selectedDate.getFullYear()
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const d = String(selectedDate.getDate()).padStart(2, '0')
      const dateStr = `${y}-${m}-${d}`
      return aptDateStr === dateStr && matchesStatus && matchesSearch
    }
    
    if (viewMode === 'week') {
      // Get start of week (Monday)
      const start = new Date(selectedDate)
      const day = start.getDay()
      start.setDate(start.getDate() - (day + 6) % 7)
      
      const end = new Date(start)
      end.setDate(end.getDate() + 7)
      
      // Compare as strings
      const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
      const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
      
      return aptDateStr >= startStr && aptDateStr < endStr && matchesStatus && matchesSearch
    }
    
    if (viewMode === 'month') {
      // Compare year and month directly from string
      const aptYear = parseInt(aptDateStr.substring(0, 4))
      const aptMonth = parseInt(aptDateStr.substring(5, 7))
      
      return aptMonth === selectedDate.getMonth() + 1 && 
             aptYear === selectedDate.getFullYear() && 
             matchesStatus && matchesSearch
    }
    
    return matchesStatus && matchesSearch
  })


  return (
    <ProtectedRoute requiredRoles={['admin', 'owner']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {user?.role === 'owner' ? t('ownerDashboard') : t('adminDashboard')}
                </h1>
                <p className="text-gray-600">
                  {activeTab === 'appointments' && t('manageAppointments' as any)}
                  {activeTab === 'settings' && t('systemSettings' as any)}
                  {activeTab === 'people' && t('userManagement' as any)}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {t('welcome')}, {user?.user_metadata?.full_name || user?.email}
                </span>
                <button
                  onClick={() => navigate('/')}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                  title="Zur Startseite"
                >
                  <Home className="w-5 h-5" />
                </button>
                {activeTab === 'appointments' && (
                  <button
                    onClick={fetchAppointments}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                    title="Aktualisieren"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-1 mt-4">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'overview'
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                  }`}
              >
                <TrendingUp className="w-4 h-4" />
                {t('overview' as any)}
              </button>

              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'appointments'
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                  }`}
              >
                <Calendar className="w-4 h-4" />
                {t('agenda' as any)}
              </button>

              {(user?.role === 'owner' || user?.role === 'admin') && (
                <button
                  onClick={() => setActiveTab('people')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'people'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                    }`}
                >
                  <Users className="w-4 h-4" />
                  {t('peopleManagement' as any)}
                </button>
              )}

              {(user?.role === 'owner' || user?.role === 'admin') && (
                <button
                  onClick={() => setActiveTab('marketing')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'marketing'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                    }`}
                >
                  <Award className="w-4 h-4" />
                  {t('marketing' as any)}
                </button>
              )}

              {(user?.role === 'owner' || user?.role === 'admin') && (
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'settings'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                    }`}
                >
                  <Settings className="w-4 h-4" />
                  {t('businessSettings' as any)}
                </button>
              )}

              {(user?.role === 'owner' || user?.role === 'admin') && (
                <button
                  onClick={() => setActiveTab('whatsapp')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'whatsapp'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                    }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  {t('whatsapp' as any)}
                </button>
              )}

              {(user?.role === 'owner' || user?.role === 'admin') && (
                <button
                  onClick={() => setActiveTab('system')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'system'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                    }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('system' as any)}
                </button>
              )}

              {(user?.role === 'owner' || user?.role === 'admin') && (
                <button
                  onClick={() => setActiveTab('partner_requests')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'partner_requests'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                    }`}
                >
                  <Users className="w-4 h-4" />
                  {t('partnerRole' as any) || (isPt ? 'Salão Parceiro' : 'Partner-Salon')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="container mx-auto px-4 py-6">
          {activeTab === 'overview' && <DashboardStats />}

          {activeTab === 'appointments' && (
            <>
              {/* Controls */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  {/* View Controls */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => changeDate(-1)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-lg font-medium text-gray-800 min-w-[200px] text-center">
                        {getDateDisplay()}
                      </span>
                      <button
                        onClick={() => changeDate(1)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      {(['day', 'week', 'month'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setViewMode(mode)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${viewMode === mode
                            ? 'bg-pink-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                          {mode === 'day' ? t('day') : mode === 'week' ? t('week') : t('month')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder={t('searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="all">{t('allStatus')}</option>
                      <option value="confirmed">{t('confirmed')}</option>
                      <option value="completed">{t('completed')}</option>
                      <option value="cancelled">{t('cancelled')}</option>
                    </select>
                  </div>
                </div>
              </div>

              {viewMode === 'day' ? (
                /* ========== LIST VIEW ========== */
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                    </div>
                  ) : filteredAppointments.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">{t('noAppointments')}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                       {filteredAppointments.map((appointment) => {
                          const isProductSale = appointment.total_duration_minutes === 0 || appointment.appointment_time?.startsWith('00:00')
                          return (
                        <div 
                          key={appointment.id} 
                          className="p-4 hover:bg-gray-50 transition-colors group cursor-pointer"
                          onClick={() => {
                            setSelectedAppointmentForDetails(appointment)
                            setIsDetailsModalOpen(true)
                          }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center space-x-4">
                              <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl ${isProductSale ? 'bg-emerald-50' : 'bg-pink-50'}`}>
                                {isProductSale ? (
                                  <>
                                    <Package className="w-6 h-6 text-emerald-600" />
                                    <span className="text-emerald-500 text-[10px] uppercase font-bold tracking-widest">Venda</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-pink-600 font-bold text-lg">{appointment.appointment_time.substring(0, 5)}</span>
                                    <span className="text-pink-400 text-[10px] uppercase font-bold tracking-widest">{appointment.total_duration_minutes}m</span>
                                  </>
                                )}
                              </div>
                                <div>
                                <h3 className="font-bold text-gray-900">{appointment.client?.full_name}</h3>
                                <p className="text-sm text-gray-500 font-medium">
                                  {appointment.services?.map(s => s.name).join(', ')}
                                </p>
                                <div className="flex items-center mt-1 space-x-3">
                                  {appointment.professional && (
                                    <span className="flex items-center px-2 py-0.5 rounded text-[10px] font-bold text-pink-700 bg-pink-100 uppercase tracking-widest">
                                      <Users className="w-3 h-3 mr-1" /> {appointment.professional.name}
                                    </span>
                                  )}
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${getStatusColor(appointment.status)}`}>
                                    {getStatusLabel(appointment.status)}
                                  </span>
                                  {appointment.is_paid && (
                                    <span className="flex items-center text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                      <CheckCircle className="w-3 h-3 mr-1" /> {t('paid')}
                                    </span>
                                  )}
                                  {appointment.payment_method && (
                                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest flex items-center ${getPaymentMethodColor(appointment.payment_method)}`}>
                                      {appointment.payment_method === 'cash' ? (
                                        <Wallet className="w-3 h-3 mr-1" />
                                      ) : (appointment.payment_method === 'twint' || appointment.payment_method === 'credit_card') ? (
                                        <CreditCard className="w-3 h-3 mr-1" />
                                      ) : (
                                        <Wallet className="w-3 h-3 mr-1" />
                                      )}
                                      {getPaymentMethodLabel(appointment.payment_method)}
                                    </span>
                                  )}
                                  {appointment.source === 'manual' && (
                                    <span className="px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                      {getSourceLabel(appointment.source)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {appointment.status === 'confirmed' && (
                                <>
                                  <button onClick={(e) => { e.stopPropagation(); updateAppointmentStatus(appointment.id, 'completed') }} className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg" title={t('markCompleted')}><CheckCircle className="w-4 h-4" /></button>
                                  <button onClick={(e) => { e.stopPropagation(); updateAppointmentStatus(appointment.id, 'no_show') }} className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg" title={t('noShow' as any)}><ZapOff className="w-4 h-4" /></button>
                                  <button onClick={(e) => { e.stopPropagation(); updateAppointmentStatus(appointment.id, 'cancelled') }} className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg" title={t('cancelAppointment')}><XCircle className="w-4 h-4" /></button>
                                </>
                              )}
                              <button onClick={(e) => { 
                      e.stopPropagation();
                      setManualProfessionalId(null); 
                      setManualCategory('service');
                      setManualForm({
                        clientIdentifier: '',
                        date: new Date().toISOString().split('T')[0],
                        time: '',
                        selectedServiceIds: [] as string[],
                        notes: '',
                        email: '',
                        phone: '',
                        birthDate: '',
                        address: '',
                        payment_method: 'salon'
                      });
                      setManualModalOpen(true); 
                    }} className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg" title={t('manualPlan')}><Calendar className="w-4 h-4" /></button>
                              <button onClick={(e) => { e.stopPropagation(); deleteAppointment(appointment.id) }} className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg" title={t('delete')}><Trash2 className="w-4 h-4" /></button>
                              <button onClick={(e) => { e.stopPropagation(); sendReviewEmail(appointment.id) }} className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg" title={t('sendReviewEmail')}><Star className="w-4 h-4" /></button>
                            </div>
                          </div>
                        </div>
                          )
                        })}
                    </div>
                  )}
                  <div className="p-3 border-t flex items-center gap-2">
                    <button onClick={() => { 
          setManualProfessionalId(null); 
          setManualCategory('service');
          setManualForm({
            clientIdentifier: '',
            date: new Date().toISOString().split('T')[0],
            time: '',
            selectedServiceIds: [] as string[],
            notes: '',
            email: '',
            phone: '',
            birthDate: '',
            address: '',
            payment_method: 'salon'
          });
          setManualModalOpen(true); 
        }} className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 text-sm flex items-center"><Plus className="w-4 h-4 mr-1" />{t('createAppointment')}</button>
                    <button onClick={() => { 
          setManualProfessionalId(null); 
          setManualCategory('product');
          setManualForm({
            clientIdentifier: '',
            date: new Date().toISOString().split('T')[0],
            time: '00:00',
            selectedServiceIds: [] as string[],
            notes: 'Venda de produtos (manual)',
            email: '',
            phone: '',
            birthDate: '',
            address: '',
            payment_method: 'salon'
          });
          setManualModalOpen(true); 
        }} className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm flex items-center"><Package className="w-4 h-4 mr-1" />{t('newSale' as any)}</button>
                  </div>
                </div>
              ) : viewMode === 'week' ? (
                /* ========== WEEKLY CALENDAR GRID ========== */
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                    </div>
                  ) : (() => {
                    // Calculate the week days (Mon-Sun)
                    const startOfWeek = new Date(selectedDate)
                    const dow = startOfWeek.getDay()
                    startOfWeek.setDate(startOfWeek.getDate() - ((dow + 6) % 7)) // Monday
                    const weekDays: { date: Date; dateStr: string; label: string; dayOfWeek: number }[] = []
                    const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
                    for (let i = 0; i < 7; i++) {
                      const d = new Date(startOfWeek)
                      d.setDate(startOfWeek.getDate() + i)
                      const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const dd = String(d.getDate()).padStart(2, '0')
                      weekDays.push({ date: d, dateStr: `${y}-${m}-${dd}`, label: dayLabels[i], dayOfWeek: d.getDay() })
                    }

                    // Determine earliest open and latest close from business hours
                    let earliestOpen = '09:00'; let latestClose = '18:00'
                    if (businessHours && businessHours.length > 0) {
                      const opens = businessHours.map(h => h.open_time).filter(Boolean).sort()
                      const closes = businessHours.map(h => h.close_time).filter(Boolean).sort()
                      if (opens.length > 0) earliestOpen = opens[0].slice(0, 5)
                      if (closes.length > 0) latestClose = closes[closes.length - 1].slice(0, 5)
                    }
                    // Generate time slots (30-min intervals)
                    const timeSlots: string[] = []
                    const slotStart = new Date(`2000-01-01T${earliestOpen}`)
                    const slotEnd = new Date(`2000-01-01T${latestClose}`)
                    while (slotStart < slotEnd) {
                      timeSlots.push(slotStart.toTimeString().slice(0, 5))
                      slotStart.setMinutes(slotStart.getMinutes() + 30)
                    }

                    // Map appointments to day+time
                    const getAptsAt = (dateStr: string, time: string) => {
                      return appointments.filter(a => {
                        if (a.appointment_date !== dateStr) return false
                        const aptTime = a.appointment_time.slice(0, 5)
                        return aptTime === time
                      })
                    }

                    // Check if a cell is occupied by an appointment that started earlier
                    const isOccupied = (dateStr: string, time: string) => {
                      const timeMin = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1])
                      return appointments.some(a => {
                        if (a.appointment_date !== dateStr) return false
                        const aptTime = a.appointment_time.slice(0, 5)
                        const aptMin = parseInt(aptTime.split(':')[0]) * 60 + parseInt(aptTime.split(':')[1])
                        const aptEndMin = aptMin + (a.total_duration_minutes || 30)
                        return aptMin < timeMin && timeMin < aptEndMin
                      })
                    }

                    const getRowSpan = (apt: Appointment) => Math.max(1, Math.ceil((apt.total_duration_minutes || 30) / 30))

                    // Check if day is closed
                    const isDayClosed = (dayOfWeek: number) => {
                      if (!businessHours || businessHours.length === 0) return false
                      const bh = businessHours.find((h: any) => h.day_of_week === dayOfWeek)
                      return bh?.is_closed === true
                    }

                    const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()

                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[800px]">
                          <thead>
                            <tr>
                              <th className="w-16 p-2 border-b border-r bg-gray-50 text-xs text-gray-500 font-medium sticky left-0 z-10"></th>
                              {weekDays.map(day => (
                                <th
                                  key={day.dateStr}
                                  className={`p-2 border-b text-center text-sm font-medium cursor-pointer hover:bg-pink-50 transition-colors ${day.dateStr === todayStr ? 'bg-pink-50 text-pink-700' : isDayClosed(day.dayOfWeek) ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-700'
                                    }`}
                                  onClick={() => { setViewMode('day'); setSelectedDate(day.date) }}
                                >
                                  <div className="font-bold">{day.label}</div>
                                  <div className={`text-xs ${day.dateStr === todayStr ? 'bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto' : ''}`}>
                                    {day.date.getDate()}
                                  </div>
                                  {isDayClosed(day.dayOfWeek) && <div className="text-[10px] text-gray-400">{t('closed')}</div>}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {timeSlots.map(time => (
                              <tr key={time} className="group">
                                <td className="p-1 border-r border-b bg-white text-[11px] text-gray-400 text-right pr-2 font-mono sticky left-0 z-10 align-top">
                                  {time}
                                </td>
                                {weekDays.map(day => {
                                  if (isDayClosed(day.dayOfWeek)) {
                                    return <td key={day.dateStr} className="border-b border-r bg-gray-50 h-10"></td>
                                  }
                                  const apts = getAptsAt(day.dateStr, time)
                                  const occupied = isOccupied(day.dateStr, time)
                                  if (occupied && apts.length === 0) return null // Merged cell
                                  return (
                                    <td
                                      key={day.dateStr}
                                      className={`border-b border-r h-10 align-top relative ${day.dateStr === todayStr ? 'bg-pink-50/30' : 'bg-white'} group-hover:bg-gray-50/50`}
                                      rowSpan={apts.length > 0 ? getRowSpan(apts[0]) : 1}
                                    >
                                      {apts.length > 0 && (
                                        <div
                                          className={`absolute inset-0.5 rounded-md p-1 overflow-hidden cursor-pointer transition-all hover:shadow-md hover:z-10 border-l-3 ${getGridStatusColor(apts[0].status)}`}
                                          onClick={() => { 
                                            setSelectedAppointmentForDetails(apts[0])
                                            setIsDetailsModalOpen(true)
                                          }}
                                          title={`${apts[0].client.full_name}\n${apts[0].services.map(s => s.name).join(', ')}\n${apts[0].appointment_time.slice(0, 5)} - ${formatCurrency(apts[0].total_price)}`}
                                        >
                                          <div className="text-[11px] font-semibold text-gray-800 truncate leading-tight">
                                            {apts[0].client.full_name}
                                          </div>
                                          <div className="text-[10px] text-gray-500 truncate leading-tight">
                                            {apts[0].services.map(s => s.name).join(', ')}
                                          </div>
                                          {apts[0].professional && (
                                            <div className="text-[10px] font-medium text-pink-600 truncate mt-0.5 flex items-center justify-between">
                                              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {apts[0].professional.name}</span>
                                              <div className="flex items-center gap-1">
                                                {apts[0].payment_method === 'cash' ? (
                                                  <Wallet className="w-3 h-3 text-amber-600" />
                                                ) : (apts[0].payment_method === 'twint' || apts[0].payment_method === 'credit_card') && (
                                                  <CreditCard className="w-3 h-3 text-blue-600" />
                                                )}
                                                {apts[0].is_paid && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                                              </div>
                                            </div>
                                          )}
                                          {getRowSpan(apts[0]) > 1 && (
                                            <div className="text-[10px] text-gray-400 mt-0.5 flex items-center justify-between">
                                              <span>{apts[0].appointment_time.slice(0, 5)} • {apts[0].total_duration_minutes}min</span>
                                            </div>
                                          )}
                                          {apts.length > 1 && (
                                            <div className="text-[10px] text-pink-600 font-medium mt-0.5">+{apts.length - 1} {t('more')}</div>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                  )
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  })()}
                   <div className="p-3 border-t flex items-center justify-between">
                     <div className="flex items-center gap-3 text-[11px] text-gray-500">
                       <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border-l-2 border-green-500"></span> {t('confirmed')}</span>
                       <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border-l-2 border-blue-500"></span> {t('completed')}</span>
                       <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-100 border-l-2 border-orange-400"></span> {t('noShow' as any)}</span>
                       <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border-l-2 border-red-400 opacity-60"></span> {t('cancelled')}</span>
                     </div>
                     <div className="flex items-center gap-2">
                     <button onClick={() => { 
           setManualProfessionalId(null); 
           setManualCategory('service');
           setManualForm({
             clientIdentifier: '',
             date: new Date().toISOString().split('T')[0],
             time: '',
             selectedServiceIds: [] as string[],
             notes: '',
             email: '',
             phone: '',
             birthDate: '',
             address: ''
           });
           setManualModalOpen(true); 
         }} className="px-3 py-1.5 bg-pink-500 text-white rounded-lg hover:bg-pink-600 text-sm flex items-center"><Plus className="w-3 h-3 mr-1" />{t('createAppointment')}</button>
                     <button onClick={() => { 
           setManualProfessionalId(null); 
           setManualCategory('product');
           setManualForm({
             clientIdentifier: '',
             date: new Date().toISOString().split('T')[0],
             time: '00:00',
             selectedServiceIds: [] as string[],
             notes: 'Venda de produtos (manual)',
             email: '',
             phone: '',
             birthDate: '',
             address: ''
           });
          setManualModalOpen(true); 
         }} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm flex items-center"><Package className="w-3 h-3 mr-1" />{t('newSale' as any)}</button>
                     </div>
                   </div>
                 </div>
               ) : (
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => { const d = new Date(selectedDate); d.setMonth(d.getMonth() - 1); setSelectedDate(d) }} className="p-2 rounded hover:bg-gray-100"><ChevronLeft className="w-4 h-4" /></button>
                    <div className="font-semibold">{selectedDate.toLocaleString('de-DE', { month: 'long', year: 'numeric' })}</div>
                    <button onClick={() => { const d = new Date(selectedDate); d.setMonth(d.getMonth() + 1); setSelectedDate(d) }} className="p-2 rounded hover:bg-gray-100"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (<div key={d} className="text-xs text-gray-500 text-center py-1">{d}</div>))}
                    {(() => {
                      const year = selectedDate.getFullYear()
                      const month = selectedDate.getMonth()
                      const first = new Date(year, month, 1)
                      const startIdx = (first.getDay() + 6) % 7
                      const daysInMonth = new Date(year, month + 1, 0).getDate()
                      const cells = [] as JSX.Element[]
                      for (let i = 0; i < startIdx; i++) cells.push(<div key={`empty-${i}`} className="h-24 border rounded"></div>)
                      for (let day = 1; day <= daysInMonth; day++) {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        const dayAppointments = appointments.filter(a => a.appointment_date === dateStr)
                        cells.push(
                          <div key={dateStr} className="h-24 border rounded p-1 hover:bg-gray-50 cursor-pointer" onClick={() => { setViewMode('day'); setSelectedDate(new Date(year, month, day)) }}>
                            <div className="text-xs text-gray-500">{day}</div>
                            <div className="mt-1 space-y-1 overflow-hidden">
                              {dayAppointments.slice(0, 3).map(a => (
                                <div key={a.id} className={`text-[11px] px-1 py-0.5 rounded ${getStatusColor(a.status)} truncate`} title={`${a.client?.full_name || 'Cliente'} - ${a.services[0]?.name || ''}`}>
                                  <span className="font-semibold">{a.client?.full_name || 'Cliente'}</span>
                                  {a.services[0]?.name ? ` (${a.services[0].name})` : ''}
                                </div>
                              ))}
                              {dayAppointments.length > 3 && (<div className="text-[11px] text-gray-500">+{dayAppointments.length - 3} mehr</div>)}
                            </div>
                          </div>
                        )
                      }
                      return cells
                    })()}
                  </div>
                </div>
              )}
            </>
          )}


          {activeTab === 'people' && (user?.role === 'owner' || user?.role === 'admin') && (
            <div className="space-y-6">
              {/* Professionals Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                       <Users className="w-5 h-5 text-pink-500" />
                       {t('professionals' as any)}
                    </h2>
                    <p className="text-sm text-gray-500">{t('manageProfessionals' as any)}</p>
                  </div>
                  <button onClick={openCreateProfessional} className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all shadow-sm flex items-center gap-2 font-bold">
                    <Plus className="w-4 h-4" />
                    {t('new' as any)}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {professionals.map(p => (
                    <div key={p.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors bg-white shadow-sm">
                      <div className="flex items-center gap-3">
                        {p.photo_url ? (
                          <img src={p.photo_url} alt={p.name} className="w-12 h-12 rounded-full object-cover border-2 border-pink-100" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center text-pink-300">
                            <Users size={24} />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-gray-800">
                            {p.name}
                            {!p.active && (
                              <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-500 rounded uppercase font-bold tracking-wider">
                                {t('inactive' as any) || 'Inativo'}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-1">{p.bio}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditProfessional(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                        <button onClick={() => deleteProfessional(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                  {professionals.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">{t('noProfessionals' as any)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* User Management Section (Auth Mgmt) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <UserCircle className="w-5 h-5 text-emerald-500" />
                      {t('userMgmtTitle') || 'Gestão de Usuários'}
                    </h2>
                    <p className="text-sm text-gray-500">{t('userMgmtDesc') || 'Controle o acesso administrativo'}</p>
                  </div>
                  <button onClick={fetchUsers} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">{t('nameEmail')}</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">{t('role')}</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold uppercase shadow-sm">
                                {(u.raw_user_meta_data?.full_name || u.email || '?').substring(0, 2)}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-bold text-gray-900">{u.raw_user_meta_data?.full_name || 'Usuário'}</div>
                                <div className="text-xs text-gray-500">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={u.role || 'client'}
                              onChange={async (e) => {
                                await handleUpdateRole(u.id, e.target.value);
                              }}
                              className="bg-white border border-gray-200 rounded-lg text-xs font-semibold p-1.5 focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer text-gray-800"
                              disabled={u.id === user?.id}
                            >
                              <option value="client">{language === 'pt-BR' ? 'Cliente' : 'Kunde'}</option>
                              <option value="partner">{language === 'pt-BR' ? 'Salão Parceiro' : 'Partner-Salon'}</option>
                              <option value="admin">{language === 'pt-BR' ? 'Administrador' : 'Administrator'}</option>
                              <option value="owner">{language === 'pt-BR' ? 'Proprietário' : 'Besitzer'}</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => deleteUser(u.id)}
                              className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                              disabled={u.id === user?.id}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 mt-6">
                  <h3 className="font-medium text-gray-800 mb-2">{t('createUserTitle')}</h3>
                  <p className="text-sm text-gray-600 mb-4">{t('createUserDesc')}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-700">Name</label>
                      <input
                        value={newUserForm.fullName}
                        onChange={e => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                        className="mt-1 w-full border rounded px-3 py-2"
                        placeholder="Voller Name"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-700">E-Mail</label>
                      <input
                        type="email"
                        value={newUserForm.email}
                        onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                        className="mt-1 w-full border rounded px-3 py-2"
                        placeholder="email@beispiel.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-700">Passwort</label>
                      <input
                        type="password"
                        value={newUserForm.password}
                        onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                        className="mt-1 w-full border rounded px-3 py-2"
                        placeholder="******"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-700">Rolle</label>
                      <select
                        value={newUserForm.role}
                        onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
                        className="mt-1 w-full border rounded px-3 py-2 bg-white text-gray-800 text-sm"
                      >
                        <option value="client">{language === 'pt-BR' ? 'Cliente' : 'Kunde'}</option>
                        <option value="partner">{language === 'pt-BR' ? 'Salão Parceiro' : 'Partner-Salon'}</option>
                        <option value="admin">Administrator</option>
                        <option value="owner">Besitzer</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button onClick={createUser} className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 font-bold transition-all shadow-sm">
                      <Plus className="w-4 h-4 inline mr-2" />
                      {t('createUserBtn')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Clients List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className="text-2xl font-serif text-gray-800 flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-500" />
                    {t('clients' as any) || 'Lista de Clientes'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder={t('searchClients' as any)}
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm w-full sm:w-64 text-gray-800"
                      />
                    </div>
                    <select
                      value={clientFilter}
                      onChange={(e) => setClientFilter(e.target.value as any)}
                      className="flex-1 sm:flex-none border-gray-200 rounded-lg shadow-sm focus:border-pink-500 focus:ring-pink-500 text-sm py-2 text-gray-800"
                    >
                      <option value="all">{t('all' as any)}</option>
                      <option value="website">{t('website' as any)}</option>
                      <option value="manual">{t('manual' as any)}</option>
                    </select>
                    <button
                      onClick={fetchClientsList}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg border border-gray-100"
                      title={t('refresh' as any)}
                    >
                      <RefreshCw className={`w-5 h-5 ${clientsLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleRaffle}
                        disabled={isRaffling || clientsList.length === 0}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-bold transition-all disabled:opacity-50 text-sm shadow-md shadow-blue-100"
                      >
                        <Award className="w-4 h-4" />
                        {t('raffle' as any)}
                      </button>
                      <button
                        onClick={() => {
                          if (selectedClientIds.length === 0) {
                            toast.error(t('selectClientsFirst' as any))
                          } else {
                            setCampaignModalOpen(true)
                          }
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-xl font-bold transition-all text-sm shadow-md shadow-pink-100"
                      >
                        <Send className="w-4 h-4" />
                        {t('campaign' as any)}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Raffle Display Area */}
                {(isRaffling || raffleWinner) && (
                  <div className="mb-8 p-8 bg-gradient-to-r from-pink-50 to-pink-100/50 rounded-2xl border border-pink-100 text-center animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-sm font-medium text-pink-600 uppercase tracking-wider mb-2">
                      {isRaffling ? t('raffling' as any) : t('raffleWinnerTitle' as any)}
                    </h3>
                    <div className={`text-4xl font-bold ${isRaffling ? 'text-gray-400 blur-[1px]' : 'text-pink-600'} transition-all min-h-[50px] flex items-center justify-center`}>
                      {raffleWinner?.full_name || '...'}
                    </div>
                    {!isRaffling && raffleWinner && (
                      <div className="mt-4 flex items-center justify-center gap-4 text-pink-600">
                        <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {raffleWinner.phone || '-'}</span>
                        {raffleWinner.email && <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {raffleWinner.email}</span>}
                      </div>
                    )}
                  </div>
                )}

                {/* Clients Content */}
                {clientsLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                  </div>
                ) : clientsList.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100 text-gray-500 italic">
                    {t('noClients' as any) || 'Nenhum cliente cadastrado'}
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-6 sm:mx-0">
                    {/* Desktop Table (Visible on sm+) */}
                    <table className="hidden sm:table min-w-full divide-y divide-gray-100">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left w-10">
                            <input
                              type="checkbox"
                              className="rounded h-5 w-5 text-pink-500 focus:ring-pink-500 cursor-pointer"
                              checked={selectedClientIds.length > 0 && selectedClientIds.length === clientsList.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedClientIds(clientsList.map(c => c.id))
                                } else {
                                  setSelectedClientIds([])
                                }
                              }}
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('name' as any)}</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('phoneLabel' as any)}</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('email' as any)}</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">{t('actions' as any)}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {clientsList
                          .filter(client => {
                            let isManual = false;
                            if (client.email?.endsWith('@temp.com') || client.phone?.startsWith('walkin_')) {
                              isManual = true;
                            } else if (client.user_id === null) {
                              const hasWebsiteAppts = client.appointments?.some((a: any) =>
                                a.user_id === null || (a.user_id === client.user_id && client.user_id !== null)
                              );
                              if (client.appointments?.length > 0 && !hasWebsiteAppts) {
                                isManual = true;
                              }
                            }

                            if (clientFilter === 'website') return !isManual;
                            if (clientFilter === 'manual') return isManual;
                            return true;
                          })
                          .map((client) => {
                            let isManual = false;
                            if (client.email?.endsWith('@temp.com') || client.phone?.startsWith('walkin_')) {
                              isManual = true;
                            } else if (client.user_id === null) {
                              const hasWebsiteAppts = client.appointments?.some((a: any) =>
                                a.user_id === null || (a.user_id === client.user_id && client.user_id !== null)
                              );
                              if (client.appointments?.length > 0 && !hasWebsiteAppts) {
                                isManual = true;
                              }
                            }

                            return (
                              <tr key={client.id} className={`hover:bg-gray-50 transition-colors ${selectedClientIds.includes(client.id) ? 'bg-pink-50/20' : ''}`}>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    className="rounded text-pink-500 focus:ring-pink-500"
                                    checked={selectedClientIds.includes(client.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedClientIds([...selectedClientIds, client.id])
                                      } else {
                                        setSelectedClientIds(selectedClientIds.filter(id => id !== client.id))
                                      }
                                    }}
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-none">
                                  <div className="flex items-center gap-2">
                                    {client.full_name}
                                    {isManual && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">Manual</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.phone?.startsWith('walkin_') ? '-' : (client.phone || '-')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {client.email?.endsWith('@temp.com') ? '-' : (client.email || '-')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                  <div className="flex justify-end gap-1">
                                    <button onClick={() => openEditClient(client)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={14} /></button>
                                    <button onClick={() => handleDeleteClient(client.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>

                    {/* Mobile Cards (Visible on <sm) */}
                    <div className="sm:hidden space-y-4 px-6 py-2">
                      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border mb-4">
                        <span className="text-sm font-medium text-gray-700">Selecionar Todos</span>
                        <input
                          type="checkbox"
                          className="rounded h-6 w-6 text-pink-500 focus:ring-pink-500 cursor-pointer"
                          checked={selectedClientIds.length > 0 && selectedClientIds.length === clientsList.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedClientIds(clientsList.map(c => c.id))
                            } else {
                              setSelectedClientIds([])
                            }
                          }}
                        />
                      </div>
                      {clientsList
                        .filter(client => {
                          let isManual = false;
                          if (client.email?.endsWith('@temp.com') || client.phone?.startsWith('walkin_')) {
                            isManual = true;
                          } else if (client.user_id === null) {
                            const hasWebsiteAppts = client.appointments?.some((a: any) =>
                              a.user_id === null || (a.user_id === client.user_id && client.user_id !== null)
                            );
                            if (client.appointments?.length > 0 && !hasWebsiteAppts) {
                              isManual = true;
                            }
                          }

                          if (clientFilter === 'website') return !isManual;
                          if (clientFilter === 'manual') return isManual;
                          return true;
                        })
                        .map((client) => {
                          let isManual = false;
                          if (client.email?.endsWith('@temp.com') || client.phone?.startsWith('walkin_')) {
                            isManual = true;
                          } else if (client.user_id === null) {
                            const hasWebsiteAppts = client.appointments?.some((a: any) =>
                              a.user_id === null || (a.user_id === client.user_id && client.user_id !== null)
                            );
                            if (client.appointments?.length > 0 && !hasWebsiteAppts) {
                              isManual = true;
                            }
                          }

                          return (
                            <div
                              key={client.id}
                              className={`p-4 rounded-xl border-2 transition-all ${selectedClientIds.includes(client.id) ? 'border-pink-300 bg-pink-50/50' : 'border-gray-100 bg-white'}`}
                              onClick={() => {
                                if (selectedClientIds.includes(client.id)) {
                                  setSelectedClientIds(selectedClientIds.filter(id => id !== client.id))
                                } else {
                                  setSelectedClientIds([...selectedClientIds, client.id])
                                }
                              }}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                    {client.full_name}
                                    {isManual && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">Manual</span>
                                    )}
                                  </h4>
                                  <div className="text-sm text-gray-500 mt-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-3.5 h-3.5" />
                                      {client.phone?.startsWith('walkin_') ? '-' : (client.phone || '-')}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-3.5 h-3.5" />
                                      {client.email?.endsWith('@temp.com') ? '-' : (client.email || '-')}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-center gap-4">
                                  <input
                                    type="checkbox"
                                    className="rounded h-6 w-6 text-pink-500 focus:ring-pink-500 cursor-pointer"
                                    checked={selectedClientIds.includes(client.id)}
                                    readOnly
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); openEditClient(client); }}
                                      className="p-2 bg-pink-50 text-pink-600 rounded-lg"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }}
                                      className="p-2 bg-red-50 text-red-600 rounded-lg"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========== TAB: MARKETING ========== */}
          {activeTab === 'marketing' && (user?.role === 'owner' || user?.role === 'admin') && (
            <div className="space-y-6">
              {/* Promotions & Discounts */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <Tag className="w-5 h-5 text-pink-500" />
                      {t('promotionsAndDiscounts' as any)}
                    </h2>
                    <p className="text-sm text-gray-500">{t('storeDiscountDesc' as any) || 'Configure descontos gerais para toda a loja'}</p>
                  </div>
                  <button onClick={savePromotions} className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all shadow-md font-bold flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {t('save' as any)}
                  </button>
                </div>
                <div className="max-w-xs mb-8">
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('globalDiscount' as any)} (%)</label>
                  <input
                    type="number"
                    value={promoStorePct}
                    onChange={(e) => setPromoStorePct(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">{t('specificPromotions' as any) || 'Promoções Específicas'}</h3>
                  <p className="text-sm text-gray-500 mb-4">{t('promoConfigDesc' as any) || 'Configure promoções para serviços específicos'}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map(svc => (
                      <div key={svc.id} className="p-4 border border-gray-50 rounded-xl bg-gray-50/30">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 truncate">{svc.name}</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={promoPerService[svc.id] || 0}
                            onChange={(e) => setPromoPerService(prev => ({ ...prev, [svc.id]: Number(e.target.value) }))}
                            className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm"
                            min="0"
                            max="100"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Birthday Voucher Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                       <Gift className="w-5 h-5 text-pink-500" />
                       {t('birthdayVoucherTitle' as any)}
                    </h2>
                    <p className="text-sm text-gray-500">{t('birthdayVoucherDesc' as any)}</p>
                  </div>
                  <button onClick={saveSettings} className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all shadow-md font-bold flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {t('save')}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                         <span className="font-bold text-gray-700">{t('birthdayVoucherEnabled' as any)}</span>
                         <button onClick={() => setBirthdayVoucherEnabled(!birthdayVoucherEnabled)} className={`w-12 h-6 rounded-full transition-colors relative ${birthdayVoucherEnabled ? 'bg-pink-500' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${birthdayVoucherEnabled ? 'left-7' : 'left-1'}`} />
                         </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('voucherType')}</label>
                            <select value={birthdayVoucherType} onChange={e => setBirthdayVoucherType(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                               <option value="discount_percentage">{t('discountPercentage')}</option>
                               <option value="discount_amount">{t('discountAmount')}</option>
                               <option value="free_service">{t('freeService')}</option>
                            </select>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                               {birthdayVoucherType === 'free_service' ? t('specificService' as any) : t('voucherValue')}
                            </label>
                            {birthdayVoucherType === 'free_service' ? (
                               <select value={birthdayVoucherServiceId} onChange={e => setBirthdayVoucherServiceId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                                  <option value="">{t('selectServiceVoucher' as any)}</option>
                                  {services.filter(s => s.category === 'service').map(s => (
                                     <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                               </select>
                            ) : (
                               <input type="number" value={birthdayVoucherValue} onChange={e => setBirthdayVoucherValue(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                            )}
                         </div>
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('validityDays')}</label>
                         <input type="number" value={birthdayVoucherValidity} onChange={e => setBirthdayVoucherValidity(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('messageTemplateDe')}</label>
                         <textarea value={birthdayMessageTemplateDe} onChange={e => setBirthdayMessageTemplateDe(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm h-24" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('messageTemplatePt')}</label>
                         <textarea value={birthdayMessageTemplatePt} onChange={e => setBirthdayMessageTemplatePt(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm h-24" />
                      </div>
                   </div>
                </div>
              </div>

              {/* Lucky Roulette Config */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                       <Trophy className="w-5 h-5 text-amber-500" />
                       {t('luckyRoulette' as any)}
                    </h2>
                    <p className="text-sm text-gray-500">{t('rouletteConfigDesc' as any) || 'Configure os prêmios da roleta da sorte'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setRoulettePreviewOpen(true)} className="px-4 py-2 border border-pink-200 text-pink-600 rounded-lg hover:bg-pink-50 transition-all font-bold flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      {t('test' as any)}
                    </button>
                    <button onClick={saveRouletteSettings} className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all shadow-md font-bold flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      {t('save')}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                       <span className="font-bold text-gray-700">{t('enabled' as any)}</span>
                       <button onClick={() => setRouletteEnabled(!rouletteEnabled)} className={`w-12 h-6 rounded-full transition-colors relative ${rouletteEnabled ? 'bg-pink-500' : 'bg-gray-300'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${rouletteEnabled ? 'left-7' : 'left-1'}`} />
                       </button>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                       <label className="block text-sm font-bold text-gray-700">{t('cooldownDays' as any)}</label>
                       <input type="number" value={rouletteSettings.cooldown_days} onChange={(e) => setRouletteSettings(prev => ({ ...prev, cooldown_days: Number(e.target.value) }))} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-gray-800">{t('prizes' as any)}</h3>
                        <div className="text-xs text-pink-500 font-bold uppercase tracking-widest">{t('editOptions' as any)}</div>
                     </div>
                     <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
                        {rouletteSettings.options.map((prize, idx) => (
                           <div key={idx} className="flex gap-2 items-center p-3 border border-gray-100 rounded-lg bg-white group">
                              <input type="text" value={prize.label} onChange={(e) => {
                                 const newOptions = [...rouletteSettings.options];
                                 newOptions[idx] = { ...newOptions[idx], label: e.target.value };
                                 setRouletteSettings(prev => ({ ...prev, options: newOptions }));
                              }} className="flex-1 text-sm border-none focus:ring-0 p-0 font-medium" />
                              <input type="number" value={prize.probability} onChange={(e) => {
                                 const newOptions = [...rouletteSettings.options];
                                 newOptions[idx] = { ...newOptions[idx], probability: Number(e.target.value) };
                                 setRouletteSettings(prev => ({ ...prev, options: newOptions }));
                              }} className="w-12 text-sm border-none focus:ring-0 p-0 text-right text-gray-400" />
                              <input type="color" value={prize.color} onChange={(e) => {
                                 const newOptions = [...rouletteSettings.options];
                                 newOptions[idx] = { ...newOptions[idx], color: e.target.value };
                                 setRouletteSettings(prev => ({ ...prev, options: newOptions }));
                              }} className="w-6 h-6 rounded border-none cursor-pointer p-0 bg-transparent" title={t('color')} />
                              <span className="text-[10px] text-gray-300">%</span>
                              <button onClick={() => {
                                 const newOptions = rouletteSettings.options.filter((_, i) => i !== idx);
                                 setRouletteSettings(prev => ({ ...prev, options: newOptions }));
                              }} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                 <Trash2 className="w-3 h-3" />
                              </button>
                           </div>
                        ))
                     }
                     </div>
                     <button 
                        onClick={() => {
                           const newPrize = { 
                             id: Math.random().toString(36).substring(7), 
                             label: 'Novo Prêmio', 
                             probability: 0, 
                             color: '#FF69B4' 
                           };
                           setRouletteSettings(prev => ({
                             ...prev,
                             options: [...prev.options, newPrize]
                           }));
                        }}
                        className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs font-bold hover:border-pink-300 hover:text-pink-500 transition-all flex items-center justify-center gap-2"
                     >
                        <Plus className="w-4 h-4" />
                        {t('add' as any)}
                     </button>
                  </div>
                </div>
              </div>

              {/* Home Carousel & Instagram Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Carousel Management */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-blue-400" />
                        {t('homeCarousel' as any)}
                      </h2>
                      <p className="text-sm text-gray-500">{t('manageHeroCarousel' as any) || 'Imagens principais da página inicial'}</p>
                    </div>
                    <label className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all shadow-sm flex items-center gap-2 font-bold cursor-pointer">
                      <Upload className="w-4 h-4" />
                      {t('upload' as any)}
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Add New Carousel Item (Mini Form) */}
                    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg bg-white relative">
                          {uploadingImage ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                          ) : newCarouselItem.image_url ? (
                            <>
                              <img src={newCarouselItem.image_url} alt="Preview" className="h-24 object-contain rounded" />
                              <button onClick={() => setNewCarouselItem({...newCarouselItem, image_url: ''})} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3"/></button>
                            </>
                          ) : (
                            <label className="flex flex-col items-center cursor-pointer">
                              <Upload className="w-6 h-6 text-gray-400 mb-2"/>
                              <span className="text-[10px] text-gray-500">{t('clickToUpload')}</span>
                              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                          )}
                        </div>
                        <input placeholder={t('title' as any)} value={newCarouselItem.title} onChange={e => setNewCarouselItem({...newCarouselItem, title: e.target.value})} className="border rounded-lg px-3 py-1.5 text-sm" />
                        <button onClick={addCarouselItem} className="w-full py-2 bg-pink-500 text-white rounded-lg font-bold text-sm hover:bg-pink-600">
                          {t('add' as any)}
                        </button>
                      </div>
                    </div>

                    {/* Carousel Items List */}
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                       {carouselItems.map(item => (
                         <div key={item.id} className="flex items-center gap-3 p-2 border border-gray-100 rounded-lg group hover:border-pink-200 transition-colors bg-white">
                           <img src={item.image_url} alt="" className="w-12 h-12 rounded object-cover" />
                           <div className="flex-1 min-w-0">
                             <div className="text-xs font-bold truncate">{item.title}</div>
                           </div>
                           <button onClick={() => deleteCarouselItem(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                         </div>
                       ))}
                       {carouselItems.length === 0 && <p className="text-xs text-center text-gray-400 py-4 italic">{t('noCarouselItems' as any) || 'Nenhum item no carrossel'}</p>}
                    </div>
                  </div>
                </div>

                {/* Instagram Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Instagram className="w-5 h-5 text-pink-600" />
                        Instagram Feed
                      </h2>
                      <p className="text-sm text-gray-500">{t('instagramFeedDesc' as any) || 'Configure seu feed do Instagram na página inicial'}</p>
                    </div>
                    <button onClick={saveInstagramPosts} className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all shadow-md font-bold flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      {t('save' as any)}
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* General Instagram Post Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">{t('title' as any)} (Username)</label>
                          <input type="text" value={instagramUsername} onChange={(e) => setInstagramUsername(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" placeholder="@username" />
                       </div>
                       <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Embed Code / ID</label>
                          <input type="text" value={instagramEmbedId} onChange={(e) => setInstagramEmbedId(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" placeholder="https://instagram.com/p/..." />
                       </div>
                    </div>

                    {/* Detailed Posts List */}
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-bold text-gray-700 mb-4">{t('individualPosts' as any) || 'Postagens Individuais'}</h3>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {instagramPosts.map((post, idx) => (
                          <div key={idx} className="relative group/post border rounded-xl overflow-hidden aspect-square bg-gray-50 hover:shadow-lg transition-all">
                            <div className="p-3 space-y-2">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Post #{idx + 1}</label>
                              <input 
                                type="text" 
                                placeholder="Image URL" 
                                value={post.image_url} 
                                onChange={e => {
                                  const newPosts = [...instagramPosts];
                                  newPosts[idx].image_url = e.target.value;
                                  setInstagramPosts(newPosts);
                                }} 
                                className="w-full text-[10px] border-none bg-transparent focus:ring-0 p-0"
                              />
                              <input 
                                type="text" 
                                placeholder="Link Instagram" 
                                value={post.link} 
                                onChange={e => {
                                  const newPosts = [...instagramPosts];
                                  newPosts[idx].link = e.target.value;
                                  setInstagramPosts(newPosts);
                                }} 
                                className="w-full text-[10px] text-pink-600 font-medium border-none bg-transparent focus:ring-0 p-0"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
          )}

          {/* ========== TAB: SETTINGS ========== */}
          {activeTab === 'settings' && (user?.role === 'owner' || user?.role === 'admin') && (
            <div className="space-y-6">
              {/* Business Hours & Availability */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                       <Clock className="w-5 h-5 text-pink-500" />
                       {t('businessHours' as any)}
                    </h2>
                    <p className="text-sm text-gray-500">{t('manageAvailability' as any) || 'Configure horários e datas bloqueadas'}</p>
                  </div>
                  <button onClick={saveBusinessHours} className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all shadow-sm flex items-center gap-2 font-bold text-sm">
                    <Save className="w-4 h-4" />
                    {t('save' as any)}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Weekly Schedule */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">{t('weeklySchedule' as any) || 'Horários Semanais'}</h3>
                    {businessHours.map((day, index) => (
                      <div key={day.id || index} className="flex items-center justify-between p-3 border border-gray-50 rounded-xl hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={!day.is_closed}
                            onChange={e => {
                              const newHours = [...businessHours]
                              newHours[index].is_closed = !e.target.checked
                              setBusinessHours(newHours)
                            }}
                            className="rounded h-5 w-5 text-pink-500 focus:ring-pink-500 cursor-pointer"
                          />
                          <span className="font-bold text-gray-700 w-24">
                            {t(('weekday' + day.day_of_week) as any)}
                          </span>
                        </div>
                        {!day.is_closed ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={day.open_time || ''}
                              onChange={e => {
                                const newHours = [...businessHours]
                                newHours[index].open_time = e.target.value
                                setBusinessHours(newHours)
                              }}
                              className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                              type="time"
                              value={day.close_time || ''}
                              onChange={e => {
                                const newHours = [...businessHours]
                                newHours[index].close_time = e.target.value
                                setBusinessHours(newHours)
                              }}
                              className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white"
                            />
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-red-400 bg-red-50 px-3 py-1 rounded-full uppercase italic">{t('closed')}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Blocked Dates & Slots */}
                  <div className="space-y-6">
                    {/* Blocked Dates */}
                    <div>
                       <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                         <Ban className="w-4 h-4 text-red-500" />
                         {t('blockedDates')}
                       </h3>
                       <div className="flex gap-2 mb-4">
                          <input
                            type="date"
                            value={newBlockedDate}
                            onChange={e => setNewBlockedDate(e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 bg-white"
                          />
                          <button onClick={addBlockedDate} className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all font-bold text-sm">
                            {t('block')}
                          </button>
                       </div>
                       <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                          {blockedDates.map(date => (
                            <div key={date.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100 group">
                              <span className="text-sm text-gray-700 font-medium">{formatDate(date.date)}</span>
                              <button onClick={() => removeBlockedDate(date.id)} className="text-red-400 hover:text-red-600 p-1">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {blockedDates.length === 0 && <p className="text-xs text-center text-gray-400 py-4 italic">{t('noBlockedDates')}</p>}
                       </div>
                    </div>

                    {/* Blocked Slots */}
                    <div className="pt-6 border-t border-gray-100">
                       <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                         <Clock className="w-4 h-4 text-gray-500" />
                         {t('blockedSlots' as any) || 'Horários de Pausa (Intervalos)'}
                       </h3>
                       <div className="grid grid-cols-1 gap-3 mb-4">
                         <div className="flex gap-2">
                           <input type="date" value={newBlockedSlot.date} onChange={e => setNewBlockedSlot({ ...newBlockedSlot, date: e.target.value })} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs" />
                           <input type="time" value={newBlockedSlot.start_time} onChange={e => setNewBlockedSlot({ ...newBlockedSlot, start_time: e.target.value })} className="w-24 border border-gray-200 rounded-lg px-2 py-2 text-xs" />
                           <input type="time" value={newBlockedSlot.end_time} onChange={e => setNewBlockedSlot({ ...newBlockedSlot, end_time: e.target.value })} className="w-24 border border-gray-200 rounded-lg px-2 py-2 text-xs" />
                         </div>
                         <div className="flex gap-2">
                           <input placeholder={t('reasonPlaceholder' as any) || "Motivo (Ex: Almoço)"} value={newBlockedSlot.reason} onChange={e => setNewBlockedSlot({ ...newBlockedSlot, reason: e.target.value })} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs" />
                           <button onClick={addBlockedSlot} className="px-4 py-2 bg-pink-500 text-white rounded-lg font-bold text-xs hover:bg-pink-600">
                             {t('add' as any)}
                           </button>
                         </div>
                       </div>
                       <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                          {blockedSlots.map(slot => (
                            <div key={slot.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100 text-[10px] group">
                               <div className="font-bold text-gray-700">{formatDate(new Date(slot.start_time))}</div>
                               <div className="text-gray-500 font-medium">
                                 {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </div>
                               <div className="italic text-gray-400 max-w-[80px] truncate">{slot.reason}</div>
                               <button onClick={() => deleteBlockedSlot(slot.id)} className="text-red-400 hover:text-red-600">
                                 <Trash2 className="w-3 h-3" />
                               </button>
                            </div>
                          ))}
                          {blockedSlots.length === 0 && <p className="text-xs text-center text-gray-400 py-4 italic">Keine Pausen vorhanden</p>}
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Services & Products List (Unified) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <Scissors className="w-5 h-5 text-gray-700" />
                      {t('productsAndServices' as any)}
                    </h2>
                    <p className="text-sm text-gray-500">{t('manageInventoryDesc' as any) || 'Gerencie seu catálogo de serviços e produtos'}</p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
                      className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all shadow-sm flex items-center gap-2 font-bold text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      {t('new' as any)}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {isNewMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                        <button onClick={() => { openCreateService('service'); setIsNewMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-pink-50 text-sm text-gray-700 flex items-center gap-2 transition-colors">
                          <Scissors className="w-4 h-4 text-pink-500" />
                          {t('newService' as any)}
                        </button>
                        <button onClick={() => { openCreateService('product'); setIsNewMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-pink-50 text-sm text-gray-700 flex items-center gap-2 transition-colors">
                          <Package className="w-4 h-4 text-pink-500" />
                          {t('newProduct' as any)}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-x-hidden">
                  {/* Services Group */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-pink-500 rounded-full"></div>
                      {t('services' as any)}
                    </h3>
                    <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
                      {services.filter(s => s.category === 'service').map(s => (
                        <div key={s.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-white hover:border-pink-200 transition-all shadow-sm group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center overflow-hidden">
                              {s.image_url ? <img src={s.image_url} className="w-full h-full object-cover" /> : <Scissors className="w-5 h-5 text-pink-200" />}
                            </div>
                            <div>
                              <div className="font-bold text-gray-800 text-sm">{s.name}</div>
                              <div className="text-xs text-gray-500 font-medium">{formatCurrency(s.price)} • {s.duration_minutes} min</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEditService(s)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                            <button onClick={() => deleteService(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Products Group */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-2 text-blue-600">
                      <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                      {t('products' as any)}
                    </h3>
                    <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
                      {services.filter(s => s.category === 'product').map(s => (
                        <div key={s.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-white hover:border-blue-200 transition-all shadow-sm group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center overflow-hidden">
                              {s.image_url ? <img src={s.image_url} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-blue-200" />}
                            </div>
                            <div>
                              <div className="font-bold text-gray-800 text-sm">{s.name}</div>
                              <div className="text-xs text-gray-500 font-medium">{formatCurrency(s.price)} {s.stock !== undefined && `• ${t('stock' as any) || 'Estoque'}: ${s.stock}`}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEditService(s)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                            <button onClick={() => deleteService(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                      </div>
                    </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== TAB: PARTNER REQUESTS ========== */}
          {activeTab === 'partner_requests' && (user?.role === 'owner' || user?.role === 'admin') && (
            <div className="space-y-6">
              {/* Partner Settings Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                       <Award className="w-5 h-5 text-pink-500" />
                       {t('partnerSettings' as any) || 'Configurações de Parceiros'}
                    </h2>
                    <p className="text-sm text-gray-500">{language === 'pt-BR' ? 'Gerencie descontos, pedido mínimo, taxas de câmbio e contratos de parceria.' : 'Verwalten Sie Rabatte, Mindestbestellwert, Wechselkurse und Partnerschaftsverträge.'}</p>
                  </div>
                  <button onClick={saveSettings} className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all shadow-md font-bold flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {t('save')}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                      {t('partnerDiscountLabel' as any) || 'Partner-Rabatt (%)'}
                    </label>
                    <input
                      type="number"
                      value={partnerDiscountPct}
                      onChange={e => setPartnerDiscountPct(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-800"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                      {t('partnerMinOrderLabel' as any) || 'Mindestbestellwert'}
                    </label>
                    <input
                      type="number"
                      value={partnerMinOrderAmount}
                      onChange={e => setPartnerMinOrderAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                      {t('partnerContractLabelDe' as any) || 'Partnerschaftsvertrag (DE)'}
                    </label>
                    <textarea
                      value={partnerContractTextDe}
                      onChange={e => setPartnerContractTextDe(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm h-64 font-mono leading-relaxed text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                      {t('partnerContractLabelPt' as any) || 'Partnerschaftsvertrag (PT)'}
                    </label>
                    <textarea
                      value={partnerContractTextPt}
                      onChange={e => setPartnerContractTextPt(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm h-64 font-mono leading-relaxed text-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* Partner Requests Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <Building className="w-5 h-5 text-pink-500" />
                      {t('partnerTabRequests' as any) || 'Solicitações de Parceria'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {isPt 
                        ? 'Analise e aprove as solicitações de salões parceiros regionais' 
                        : 'Prüfen und genehmigen Sie Partnerschafts-Bewerbungen'}
                    </p>
                  </div>
                  <button
                    onClick={fetchPartnerRequests}
                    className="p-2 text-gray-400 hover:text-pink-500 hover:bg-pink-50 rounded-lg transition-all"
                  >
                    <RefreshCw className={`w-5 h-5 ${loadingRequests ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {loadingRequests ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">{t('loading')}</p>
                  </div>
                ) : partnerRequests.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
                    <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">
                      {isPt ? 'Nenhuma solicitação encontrada.' : 'Keine Bewerbungen gefunden.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-100 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                          <th className="pb-3">{isPt ? 'Salão' : 'Salon'}</th>
                          <th className="pb-3">{isPt ? 'Proprietário' : 'Inhaber'}</th>
                          <th className="pb-3">E-mail</th>
                          <th className="pb-3">{isPt ? 'Telefone / WhatsApp' : 'Telefon'}</th>
                          <th className="pb-3">{isPt ? 'Status' : 'Status'}</th>
                          <th className="pb-3">{isPt ? 'Data de Envio' : 'Datum'}</th>
                          <th className="pb-3 text-right">{isPt ? 'Ações' : 'Aktionen'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                        {partnerRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-gray-50/50">
                            <td className="py-4 font-semibold text-gray-900">{req.salon_name}</td>
                            <td className="py-4">{req.owner_name}</td>
                            <td className="py-4">{req.email}</td>
                            <td className="py-4 font-mono text-xs">{req.phone}</td>
                            <td className="py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                req.status === 'approved' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                  : req.status === 'rejected'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {req.status === 'approved' 
                                  ? (t('requestStatusApproved' as any) || 'Aprovado') 
                                  : req.status === 'rejected'
                                  ? (t('requestStatusRejected' as any) || 'Rejeitado')
                                  : (t('requestStatusPending' as any) || 'Pendente')}
                              </span>
                            </td>
                            <td className="py-4 text-xs text-gray-500">
                              {new Date(req.created_at).toLocaleDateString(isPt ? 'pt-BR' : 'de-CH')}
                            </td>
                            <td className="py-4 text-right space-x-2">
                              {req.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApproveRequest(req)}
                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                  >
                                    {t('approve' as any) || 'Aprovar'}
                                  </button>
                                  <button
                                    onClick={() => handleRejectRequest(req.id)}
                                    className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                  >
                                    {t('reject' as any) || 'Rejeitar'}
                                  </button>
                                </>
                              )}
                              {req.notes && (
                                <p className="text-left text-xs text-gray-400 mt-1 italic max-w-xs truncate" title={req.notes}>
                                  {isPt ? 'Obs: ' : 'Notiz: '}{req.notes}
                                </p>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========== TAB: SYSTEM ========== */}
          {activeTab === 'system' && (user?.role === 'owner' || user?.role === 'admin') && ( <>
            <div className="space-y-6">
              {/* WhatsApp Config Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-500" />
                  {t('whatsappConfig' as any)}
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                       <div className="flex items-center gap-3">
                         <div className={`w-3 h-3 rounded-full ${whatsappStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                         <span className="font-bold text-gray-700">{whatsappStatus === 'connected' ? t('connected' as any) : t('disconnected' as any)}</span>
                       </div>
                       {whatsappStatus === 'connected' && (
                         <button onClick={disconnectWhatsapp} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100 hover:bg-red-100">
                           {t('disconnect' as any)}
                         </button>
                       )}
                    </div>

                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">{t('whatsappNumber')}</label>
                       <div className="flex gap-2">
                          <input
                            type="text"
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                            placeholder="5511999999999"
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                          />
                          <button onClick={saveWhatsappNumber} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-bold transition-all text-sm">
                            <Save className="w-4 h-4" />
                          </button>
                       </div>
                    </div>

                    {whatsappStatus === 'disconnected' && (
                       <div className="grid grid-cols-2 gap-3">
                          <button onClick={generateWhatsappQRCode} disabled={isGeneratingCode} className="py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 text-sm shadow-sm">
                            {isGeneratingCode ? t('generating' as any) : t('generateQRCode' as any)}
                          </button>
                          <button onClick={generateWhatsappPairingCode} disabled={isGeneratingCode || !whatsappNumber} className="py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 disabled:opacity-50 text-sm shadow-sm">
                            {t('pairWithCode' as any)}
                          </button>
                       </div>
                    )}

                    {/* Queue Worker Standby Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mt-4">
                      <div>
                        <div className="font-bold text-gray-700 text-sm">{t('whatsappServiceStatus' as any)}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {whatsappQueueActive 
                            ? t('whatsappServiceActiveDesc' as any) 
                            : t('whatsappServiceStandbyDesc' as any)}
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          const newValue = !whatsappQueueActive
                          setWhatsappQueueActive(newValue)
                          // Also immediately save to DB
                          const now = new Date().toISOString()
                          await supabase.from('system_settings').upsert({
                            key: 'whatsapp_queue_active',
                            value: String(newValue),
                            updated_at: now
                          })
                          toast.success(newValue ? 'Serviço de envio ativado!' : 'Serviço de envio em standby!')
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                          whatsappQueueActive 
                            ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        {whatsappQueueActive ? t('putOnStandby' as any) : t('activateService' as any)}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                     {whatsappQrCode ? (
                       <div className="text-center">
                         <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 mb-4 inline-block">
                           <img src={whatsappQrCode} alt="WhatsApp QR" className="w-48 h-48" />
                         </div>
                         <p className="text-xs text-gray-500 font-medium">{t('scanQRCodeDesc' as any) || 'Aproxime seu telefone para conectar'}</p>
                         <button onClick={fetchWhatsAppData} className="text-xs text-green-600 mt-2 font-bold hover:underline">{t('refresh' as any)}</button>
                       </div>
                     ) : whatsappPairingCode ? (
                       <div className="text-center space-y-4">
                         <div className="text-sm font-bold text-green-800 bg-green-50 px-4 py-2 rounded-lg">{t('pairingCodeLabel')}</div>
                         <div className="text-4xl font-black text-green-700 tracking-widest font-mono bg-white p-6 rounded-2xl shadow-sm border border-green-100">
                           {whatsappPairingCode.slice(0, 4)}-{whatsappPairingCode.slice(4)}
                         </div>
                       </div>
                     ) : (
                       <div className="text-center text-gray-400 space-y-2">
                         <Phone className="w-12 h-12 mx-auto mb-2 opacity-20" />
                         <p className="text-xs uppercase font-bold tracking-widest">{t('waitingConnection' as any)}</p>
                       </div>
                     )}
                  </div>
                </div>
              </div>

              {/* User Management Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                       <UserCircle className="w-5 h-5 text-emerald-500" />
                       {t('userManagement' as any)}
                    </h2>
                    <p className="text-sm text-gray-500">{t('manageAdminAccess' as any) || 'Controle o acesso administrativo do sistema'}</p>
                  </div>
                  <button onClick={fetchUsers} className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all">
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                   <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-50">
                           <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('user' as any)}</th>
                           <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('role' as any)}</th>
                           <th className="text-right py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('actions' as any)}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {users.map(u => (
                          <tr key={u.id} className="group hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                                     {(u.raw_user_meta_data?.full_name || u.email || '?').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                     <div className="text-sm font-bold text-gray-800">{u.raw_user_meta_data?.full_name || 'Sem Nome'}</div>
                                     <div className="text-[10px] text-gray-400">{u.email}</div>
                                  </div>
                               </div>
                            </td>
                             <td className="py-4 px-4 text-xs font-bold uppercase tracking-widest">
                               <select
                                 value={u.role || 'client'}
                                 onChange={async (e) => {
                                   await handleUpdateRole(u.id, e.target.value);
                                 }}
                                 className="bg-white border border-gray-200 rounded-lg text-xs font-semibold p-1.5 focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer text-gray-800"
                                 disabled={u.id === user?.id}
                               >
                                 <option value="client">{language === 'pt-BR' ? 'Cliente' : 'Kunde'}</option>
                                 <option value="partner">{language === 'pt-BR' ? 'Salão Parceiro' : 'Partner-Salon'}</option>
                                 <option value="admin">{language === 'pt-BR' ? 'Administrador' : 'Administrator'}</option>
                                 <option value="owner">{language === 'pt-BR' ? 'Proprietário' : 'Besitzer'}</option>
                               </select>
                             </td>
                             <td className="py-4 px-4 text-right">
                               <button
                                 onClick={() => deleteUser(u.id)}
                                 className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                 disabled={u.id === user?.id}
                               >
                                  <Trash2 size={14} />
                               </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              </div>

              {/* Emergency / Safety Section */}
              <div className="bg-orange-50 rounded-xl border border-orange-200 p-6 flex items-center justify-between">
                <div>
                   <h3 className="text-lg font-bold text-orange-900 flex items-center gap-2">
                      <Ban className="w-5 h-5" />
                      {t('pauseBookings' as any)}
                   </h3>
                   <p className="text-sm text-orange-700">{t('pauseBookingsDesc' as any) || 'Interromper agendamentos no site imediatamente'}</p>
                </div>
                <button
                  onClick={toggleBookingPaused}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all shadow-inner ${bookingPaused ? 'bg-orange-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm ${bookingPaused ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
 </>           )}


      {
        serviceFormOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-4">{editingService ? t('editService' as any) : t('newService' as any)}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {serviceForm.category === 'product' ? 'Nome do Produto (Padrão/DE)' : `${t('serviceName' as any)} (Padrão/DE)`}
                  </label>
                  <input value={serviceForm.name} onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} placeholder={serviceForm.category === 'product' ? "Ex: Creme Facial" : "Ex: Tiefenreinigung"} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {serviceForm.category === 'product' ? 'Nome do Produto (PT)' : `${t('serviceName' as any)} (PT)`}
                  </label>
                  <input value={serviceForm.name_pt} onChange={e => setServiceForm({ ...serviceForm, name_pt: e.target.value })} placeholder={serviceForm.category === 'product' ? "Ex: Creme Facial" : "Ex: Limpeza de Pele"} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {serviceForm.category === 'product' ? 'Descrição (Padrão/DE)' : `${t('description' as any)} (Padrão/DE)`}
                  </label>
                  <textarea value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} placeholder="Beschreibung auf Deutsch..." className="w-full border rounded px-3 py-2" rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {serviceForm.category === 'product' ? 'Descrição (PT)' : `${t('description' as any)} (PT)`}
                  </label>
                  <textarea value={serviceForm.description_pt} onChange={e => setServiceForm({ ...serviceForm, description_pt: e.target.value })} placeholder="Descrição em Português..." className="w-full border rounded px-3 py-2" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    {serviceForm.category === 'product' ? (
                      <>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade em Estoque</label>
                        <input type="number" value={serviceForm.stock} onChange={e => setServiceForm({ ...serviceForm, stock: Number(e.target.value) })} placeholder="0" className="w-full border rounded px-3 py-2" />
                        <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">Gewicht (kg)</label>
                        <input type="number" step="0.1" value={serviceForm.weight} onChange={e => setServiceForm({ ...serviceForm, weight: Number(e.target.value) })} placeholder="0.5" className="w-full border rounded px-3 py-2" />
                      </>
                    ) : (
                      <>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('duration' as any)} (min)</label>
                        <input type="number" value={serviceForm.duration_minutes} onChange={e => setServiceForm({ ...serviceForm, duration_minutes: Number(e.target.value) })} placeholder="30" className="w-full border rounded px-3 py-2" />
                      </>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('price' as any)} (CHF)</label>
                    <input type="number" value={serviceForm.price} onChange={e => setServiceForm({ ...serviceForm, price: Number(e.target.value) })} placeholder="0.00" className="w-full border rounded px-3 py-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('imageDesc' as any) || 'Bild (Optional)'}</label>
                  <div className="flex items-center gap-4">
                    {serviceForm.image_url && (
                      <div className="relative">
                        <img src={serviceForm.image_url} alt="Preview" className="w-16 h-16 object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => setServiceForm({ ...serviceForm, image_url: '' })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-colors"
                          title="Bild löschen"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <label className="cursor-pointer bg-white px-3 py-2 border rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                      {uploadingImage ? t('loading' as any) : t('uploadImage' as any)}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return

                          setUploadingImage(true)
                          try {
                            const fileExt = file.name.split('.').pop()
                            const fileName = `${Math.random()}.${fileExt}`
                            const { error: uploadError } = await supabase.storage
                              .from('carousel-images') // Reusing existing bucket
                              .upload(`services/${fileName}`, file)

                            if (uploadError) throw uploadError

                            const { data: { publicUrl } } = supabase.storage
                              .from('carousel-images')
                              .getPublicUrl(`services/${fileName}`)

                            setServiceForm({ ...serviceForm, image_url: publicUrl })
                            toast.success('Bild erfolgreich hochgeladen')
                          } catch (error) {
                            console.error('Error uploading image:', error)
                            toast.error('Fehler beim Hochladen des Bildes')
                          } finally {
                            setUploadingImage(false)
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('category' as any)}</label>
                  <select
                    value={serviceForm.category}
                    onChange={e => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">{t('selectCategory' as any) || 'Kategorie wählen'}</option>
                    <option value="service">Dienstleistung</option>
                    <option value="product">Produkt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('subcategory' as any) || 'Kategorie (Anzeige)'}</label>
                  {isCustomSubcategory ? (
                    <div className="flex gap-2">
                      <input
                        value={serviceForm.subcategory}
                        onChange={e => setServiceForm({ ...serviceForm, subcategory: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        placeholder={t('subcategory' as any) || "Kategorie Name"}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomSubcategory(false)
                          setServiceForm({ ...serviceForm, subcategory: '' })
                        }}
                        className="px-3 py-2 border rounded hover:bg-gray-50 text-gray-600"
                        title={t('back' as any) || "Zurück"}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={serviceForm.subcategory}
                      onChange={e => {
                        if (e.target.value === '__NEW__') {
                          setIsCustomSubcategory(true)
                          setServiceForm({ ...serviceForm, subcategory: '' })
                        } else {
                          setServiceForm({ ...serviceForm, subcategory: e.target.value })
                        }
                      }}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">{t('select' as any) || 'Wählen...'}</option>
                      <option value="__NEW__" className="font-bold text-pink-600">
                        + {t('createNew' as any) || 'Neu erstellen...'}
                      </option>
                      {allSubcategories.map(key => {
                        const transKey = `sub_${key}`
                        const translated = t(transKey as any)
                        const label = translated && translated !== transKey ? translated : key
                        return (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        )
                      })}
                    </select>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="active-check" checked={serviceForm.active} onChange={e => setServiceForm({ ...serviceForm, active: e.target.checked })} className="rounded text-pink-500 focus:ring-pink-500" />
                  <label htmlFor="active-check" className="text-sm font-medium text-gray-700">{t('active' as any)}</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('displayOrder' as any)}</label>
                  <input type="number" value={serviceForm.display_order} onChange={e => setServiceForm({ ...serviceForm, display_order: Number(e.target.value) })} placeholder="0" className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setServiceFormOpen(false)} className="px-3 py-2 border rounded"><X className="w-4 h-4 inline mr-1" />{t('close' as any)}</button>
                <button onClick={saveService} className="px-3 py-2 bg-pink-500 text-white rounded"><Save className="w-4 h-4 inline mr-1" />{t('save' as any)}</button>
              </div>
            </div>
          </div>
        )
      }
      {
        manualModalOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {manualCategory === 'product' ? (t('manualSale' as any) || 'Venda Manual de Produtos') : (t('manualBooking') || 'Agendamento Manual')}
                </h3>
                <button onClick={() => { setManualModalOpen(false); setManualProfessionalId(null); }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Category Toggle */}
              <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                <button
                  onClick={() => {
                    setManualCategory('service')
                    setManualForm(prev => ({ ...prev, selectedServiceIds: [], time: '' }))
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    manualCategory === 'service'
                      ? 'bg-white text-pink-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  {t('appointment' as any) || 'Agendamento'}
                </button>
                <button
                  onClick={() => {
                    setManualCategory('product')
                    setManualForm(prev => ({ ...prev, selectedServiceIds: [], time: '00:00' }))
                    setManualProfessionalId(null)
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    manualCategory === 'product'
                      ? 'bg-white text-pink-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  {t('products' as any) || 'Produtos'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label>
                  <input
                    type="date"
                    value={manualForm.date}
                    onChange={(e) => setManualForm({ ...manualForm, date: e.target.value, time: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                {manualCategory === 'service' ? (
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('selectProfessional') || 'Profissional'}
                    </label>
                    <select
                      value={manualProfessionalId || ''}
                      onChange={(e) => setManualProfessionalId(e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                      disabled={!manualForm.date}
                    >
                      <option value="">{t('anyProfessional') || 'Qualquer Profissional'}</option>
                      {professionals.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    {!manualForm.date && <p className="text-xs text-amber-600 mt-1">{t('selectDateFirst') || 'Favor selecionar data primeiro'}</p>}
                  </div>
                ) : (
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('notes')}</label>
                    <input
                      type="text"
                      value={manualForm.notes}
                      onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                      placeholder={t('internalNotes' as any) || 'Observações'}
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('client')}</label>
                  <div className="relative">
                    <ClientSearch
                      onSelect={(client: any) => {
                        setSelectedClient(client)
                        setClientSearch('')
                        setManualForm(prev => ({ 
                          ...prev, 
                          email: client.email || '', 
                          phone: client.phone || '',
                          birthDate: client.birth_date || '',
                          address: client.address || ''
                        }))
                      }}
                      onQueryChange={(query) => {
                        setClientSearch(query)
                        if (selectedClient) setSelectedClient(null)
                      }}
                      placeholder={t('searchClientPlaceholder')}
                    />
                    {selectedClient && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
                        <div>
                          <div className="font-medium text-green-800">{t('selected')}: {selectedClient.full_name}</div>
                          <div className="text-xs text-green-600">{selectedClient.email} • {selectedClient.phone}</div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedClient(null)
                            setClientSearch('')
                          }}
                          className="text-green-600 hover:text-green-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Optional Contact Fields for Walk-ins */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                  <input
                    value={manualForm.email}
                    onChange={e => setManualForm({ ...manualForm, email: e.target.value })}
                    placeholder={t('emailOptional')}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('birthDate') || 'Data de Nascimento'}</label>
                  <input
                    type="date"
                    value={manualForm.birthDate}
                    onChange={e => setManualForm({ ...manualForm, birthDate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('address') || 'Endereço'}</label>
                  <input
                    value={manualForm.address}
                    onChange={e => setManualForm({ ...manualForm, address: e.target.value })}
                    placeholder={t('addressPlaceholder' as any) || 'Endereço'}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('paymentMethod') || 'Método de Pagamento'}</label>
                  <select
                    value={manualForm.payment_method}
                    onChange={e => setManualForm({ ...manualForm, payment_method: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                  >
                    <option value="salon">{t('paymentSalon') || 'No Salão'}</option>
                    <option value="twint">TWINT</option>
                    <option value="cash">{t('paymentCash') || 'Dinheiro'}</option>
                  </select>
                </div>

                {manualCategory === 'service' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('notes')}</label>
                    <input 
                      value={manualForm.notes} 
                      onChange={e => setManualForm({ ...manualForm, notes: e.target.value })} 
                      placeholder={t('notes')} 
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                    />
                  </div>
                )}

                {/* Services/Products Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {manualCategory === 'product' ? (t('selectProducts' as any) || 'Selecionar Produtos') : (t('selectServices') || 'Selecionar Serviços')}
                  </label>
                  <div className="max-h-48 overflow-auto border rounded-xl p-3 bg-gray-50/50">
                    {services
                      .filter(s => (manualCategory === 'product' ? s.category === 'product' : s.category !== 'product'))
                      .map(s => (
                        <label key={s.id} className="flex items-center justify-between py-2 group cursor-pointer border-b border-gray-100 last:border-0">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-800 group-hover:text-pink-600 transition-colors">{s.name}</span>
                            <span className="text-xs text-gray-500">
                              {s.category !== 'product' && `${s.duration_minutes} min • `}
                              {formatCurrency(applyPriceWithPromotions(s.price, s.id))}
                              {s.category === 'product' && s.stock !== undefined && ` • Estoque: ${s.stock}`}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            className="rounded text-pink-500 focus:ring-pink-500 w-5 h-5 border-gray-300"
                            checked={manualForm.selectedServiceIds.includes(s.id)}
                            onChange={e => {
                              const sel = manualForm.selectedServiceIds
                              const next = e.target.checked ? [...sel, s.id] : sel.filter(id => id !== s.id)
                              setManualForm({ ...manualForm, selectedServiceIds: next, time: manualCategory === 'product' ? '00:00' : '' })
                            }}
                          />
                        </label>
                      ))}
                    {services.filter(s => (manualCategory === 'product' ? s.category === 'product' : s.category !== 'product')).length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4 italic">
                        {manualCategory === 'product' ? 'Nenhum produto cadastrado' : 'Nenhum serviço cadastrado'}
                      </p>
                    )}
                  </div>
                </div>


                {/* Available Time Slots */}
                {manualCategory === 'service' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('availableTime') || 'Verfügbare Zeiten'}</label>
                    <div className="border rounded-xl p-3 max-h-40 overflow-y-auto bg-gray-50/50">
                      {!manualForm.date ? (
                        <p className="text-sm text-gray-400 text-center py-2">{t('selectDateFirst') || 'Bitte Datum wählen'}</p>
                      ) : manualForm.selectedServiceIds.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-2">{'Bitte Dienst wählen'}</p>
                      ) : manualTimesLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
                        </div>
                      ) : manualAvailableTimes.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-2">{t('noTimesAvailable') || 'Keine verfügbaren Zeiten'}</p>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {manualAvailableTimes.map(time => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setManualForm({ ...manualForm, time })}
                              className={`px-2 py-2 text-sm font-medium rounded-lg border transition-all flex items-center justify-center ${manualForm.time === time
                                ? 'bg-pink-500 text-white border-pink-500 ring-2 ring-pink-200'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-pink-300 hover:bg-pink-50'
                                }`}
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              {time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => { setManualModalOpen(false); setManualProfessionalId(null); }} className="px-3 py-2 border rounded"><X className="w-4 h-4 inline mr-1" />{t('close')}</button>
                <button onClick={handleManualCreate} className="px-3 py-2 bg-pink-500 text-white rounded"><Save className="w-4 h-4 inline mr-1" />{t('create')}</button>
              </div>
            </div>
          </div>
        )
      }
      {/* Professional Form Modal */}
      {professionalFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">
                {editingProfessional ? (t('editService') || 'Bearbeiten') : (t('newProfessional') || 'Neu')}
              </h3>
              <button onClick={() => setProfessionalFormOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('professionalName')}</label>
                <input value={professionalForm.name} onChange={e => setProfessionalForm({ ...professionalForm, name: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('professionalBio')}</label>
                <textarea value={professionalForm.bio} onChange={e => setProfessionalForm({ ...professionalForm, bio: e.target.value })} className="w-full border rounded px-3 py-2 h-20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('professionalPhoto')}</label>
                <div className="flex items-center gap-4">
                  {professionalForm.photo_url && (
                    <img src={professionalForm.photo_url} alt="Preview" className="w-16 h-16 object-cover rounded-full" />
                  )}
                  <label className="cursor-pointer bg-white px-3 py-2 border rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                    {uploadingImage ? t('loading') : t('uploadImage')}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return

                        setUploadingImage(true)
                        try {
                          const fileExt = file.name.split('.').pop()
                          const fileName = `prof_${Math.random()}.${fileExt}`
                          const { error: uploadError } = await supabase.storage
                            .from('carousel-images')
                            .upload(`professionals/${fileName}`, file)

                          if (uploadError) throw uploadError

                          const { data: { publicUrl } } = supabase.storage
                            .from('carousel-images')
                            .getPublicUrl(`professionals/${fileName}`)

                          setProfessionalForm({ ...professionalForm, photo_url: publicUrl })
                          toast.success('Bild erfolgreich hochgeladen')
                        } catch (error) {
                          console.error('Error uploading image:', error)
                          toast.error('Fehler beim Hochladen des Bildes')
                        } finally {
                          setUploadingImage(false)
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="prof-active" checked={professionalForm.active} onChange={e => setProfessionalForm({ ...professionalForm, active: e.target.checked })} className="rounded text-pink-500 focus:ring-pink-500" />
                <label htmlFor="prof-active" className="text-sm font-medium text-gray-700">{t('active')}</label>
              </div>

              {/* Services Selection */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-800 mb-3 block">{t('services')}</h4>
                <div className="max-h-40 overflow-y-auto border rounded p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {services.filter(s => s.category !== 'product').map(s => (
                    <label key={s.id} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={profServices.includes(s.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setProfServices([...profServices, s.id])
                          } else {
                            setProfServices(profServices.filter(id => id !== s.id))
                          }
                        }}
                        className="rounded text-pink-500 focus:ring-pink-500"
                      />
                      <span>{s.name}</span>
                    </label>
                  ))}
                  {services.filter(s => s.category !== 'product').length === 0 && (
                    <p className="text-gray-500 text-xs col-span-2">{t('noServicesFound')}</p>
                  )}
                </div>
              </div>

              {/* Weekly Schedule */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-800 mb-3 block">{t('weeklyHours')}</h4>
                <div className="space-y-3">
                  {profSchedule.map((day, index) => (
                    <div key={day.day_of_week} className="flex items-center space-x-2 text-sm">
                      <span className="w-24 font-medium">
                        {t(('weekday' + day.day_of_week) as any)}
                      </span>
                      <input
                        type="checkbox"
                        checked={!day.is_closed}
                        onChange={e => {
                          const newSchedule = [...profSchedule]
                          newSchedule[index].is_closed = !e.target.checked
                          setProfSchedule(newSchedule)
                        }}
                        className="rounded text-pink-500"
                      />
                      {!day.is_closed ? (
                        <>
                          <input
                            type="time"
                            value={day.open_time || ''}
                            onChange={e => {
                              const newSchedule = [...profSchedule]
                              newSchedule[index].open_time = e.target.value
                              setProfSchedule(newSchedule)
                            }}
                            className="border rounded px-2 py-1 w-24"
                          />
                          <span>-</span>
                          <input
                            type="time"
                            value={day.close_time || ''}
                            onChange={e => {
                              const newSchedule = [...profSchedule]
                              newSchedule[index].close_time = e.target.value
                              setProfSchedule(newSchedule)
                            }}
                            className="border rounded px-2 py-1 w-24"
                          />
                        </>
                      ) : (
                        <span className="text-gray-500 italic">{t('closed')}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setProfessionalFormOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">
                {t('cancel')}
              </button>
              <button onClick={saveProfessional} className="px-4 py-2 bg-pink-500 text-white rounded-lg font-bold hover:bg-pink-600">
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
      {clientFormOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6 text-gray-800">
              <h3 className="text-xl font-bold">{t('editClient')}</h3>
              <button
                onClick={() => setClientFormOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">{t('fullName')}</label>
                <input
                  type="text"
                  value={clientForm.full_name}
                  onChange={e => setClientForm({ ...clientForm, full_name: e.target.value })}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-pink-500 focus:ring-pink-500 py-2 px-3 border"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                  <input
                    type="email"
                    value={clientForm.email}
                    onChange={e => setClientForm({ ...clientForm, email: e.target.value })}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-pink-500 focus:ring-pink-500 py-2 px-3 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('phoneLabel')}</label>
                  <input
                    type="text"
                    value={clientForm.phone}
                    onChange={e => setClientForm({ ...clientForm, phone: e.target.value })}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-pink-500 focus:ring-pink-500 py-2 px-3 border text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">{t('birthDate')}</label>
                <input
                  type="date"
                  value={clientForm.birth_date}
                  onChange={e => setClientForm({ ...clientForm, birth_date: e.target.value })}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-pink-500 focus:ring-pink-500 py-2 px-3 border text-gray-800"
                />
              </div>

              <div className="flex justify-end gap-3 mt-8 font-sans">
                <button
                  onClick={() => setClientFormOpen(false)}
                  className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={saveClient}
                  className="px-6 py-2 bg-pink-500 text-white font-bold rounded-lg hover:bg-pink-600 transition-colors shadow-md shadow-pink-200"
                >
                  {t('save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {campaignModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 font-sans">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 border-x border-t sm:border">
            <div className="p-4 sm:p-6 border-b flex justify-between items-center bg-pink-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-pink-100 p-2 rounded-lg">
                  <Send className="w-5 h-5 text-pink-600" />
                </div>
                <h3 className="text-xl font-serif text-gray-800">{t('sendCampaign' as any)}</h3>
              </div>
              <button
                onClick={() => setCampaignModalOpen(false)}
                className="p-2 hover:bg-white rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="bg-pink-50 p-3 rounded-xl border border-pink-100 text-pink-700">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {t('recipientsSelected' as any).replace('{count}', String(selectedClientIds.length))}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('campaignTitle' as any)}</label>
                <input
                  type="text"
                  placeholder={t('promotionSummerExample' as any)}
                  value={campaignForm.title}
                  onChange={e => setCampaignForm({ ...campaignForm, title: e.target.value })}
                  className="w-full border-gray-200 rounded-xl px-4 py-3 shadow-sm focus:border-pink-500 focus:ring-pink-500 transition-all border font-sans"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 font-sans">{t('messageTemplate' as any)}</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    onClick={() => insertTag('{name}')}
                    className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    + {t('tagName' as any)}
                  </button>
                  <button
                    onClick={() => insertTag('{voucher_code}')}
                    className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    + {t('tagVoucher' as any)}
                  </button>
                  <button
                    onClick={() => insertTag('{expiry_date}')}
                    className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    + {t('tagExpiry' as any)}
                  </button>
                </div>
                <textarea
                  ref={campaignMessageRef}
                  rows={4}
                  placeholder={t('messagePlaceholder' as any)}
                  value={campaignForm.message}
                  onChange={e => setCampaignForm({ ...campaignForm, message: e.target.value })}
                  className="w-full border-gray-200 rounded-xl px-4 py-3 shadow-sm focus:border-pink-500 focus:ring-pink-500 min-h-[140px] text-base border"
                />
              </div>

              <div className="border-t pt-4 mt-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-pink-500" />
                    <span className="text-sm font-medium text-gray-700">{t('includeVoucher' as any)}</span>
                  </div>
                  <button
                    onClick={() => setCampaignForm({ ...campaignForm, includeVoucher: !campaignForm.includeVoucher })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${campaignForm.includeVoucher ? 'bg-pink-500' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${campaignForm.includeVoucher ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {campaignForm.includeVoucher && (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-[10px] uppercase tracking-wider">{t('voucherType' as any)}</label>
                                <select
                                    value={campaignForm.voucherType}
                                    onChange={(e) => setCampaignForm({ ...campaignForm, voucherType: e.target.value })}
                                    className="w-full border-gray-200 rounded-lg px-2 py-2 text-sm bg-white"
                                >
                                    <option value="discount_percentage">{t('discountPercentage' as any)}</option>
                                    <option value="discount_amount">{t('discountAmount' as any)}</option>
                                    <option value="free_service">{t('freeService' as any)}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-[10px] uppercase tracking-wider">
                                    {campaignForm.voucherType === 'free_service' ? t('service' as any) : t('voucherValue' as any)}
                                </label>
                                {campaignForm.voucherType === 'free_service' ? (
                                    <select
                                        value={campaignForm.serviceId}
                                        onChange={(e) => setCampaignForm({ ...campaignForm, serviceId: e.target.value })}
                                        className="w-full border-gray-200 rounded-lg px-2 py-2 text-sm bg-white"
                                    >
                                        <option value="">{t('select' as any)}</option>
                                        {services.filter(s => s.category === 'service').map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="number"
                                        value={campaignForm.voucherValue}
                                        onChange={(e) => setCampaignForm({ ...campaignForm, voucherValue: e.target.value })}
                                        className="w-full border-gray-200 rounded-lg px-2 py-2 text-sm bg-white"
                                    />
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-[10px] uppercase tracking-wider">{t('validityDays' as any)}</label>
                            <input
                                type="number"
                                value={campaignForm.voucherValidity}
                                onChange={(e) => setCampaignForm({ ...campaignForm, voucherValidity: e.target.value })}
                                className="w-full border-gray-200 rounded-lg px-2 py-2 text-sm bg-white"
                            />
                        </div>
                    </div>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-gray-50 border-t flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setCampaignModalOpen(false)}
                className="flex-1 sm:flex-none px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors order-2 sm:order-1"
              >
                {t('cancel')}
              </button>
              <button
                onClick={sendCampaign}
                disabled={sendingCampaign || !campaignForm.title || !campaignForm.message}
                className="flex-[2] sm:flex-1 bg-pink-500 hover:bg-pink-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-pink-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 order-1 sm:order-2"
              >
                {sendingCampaign ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {t('sendNow' as any)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {isDetailsModalOpen && selectedAppointmentForDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className={`p-6 border-b flex items-center justify-between ${getStatusColor(selectedAppointmentForDetails.status)} bg-opacity-10`}>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${getStatusColor(selectedAppointmentForDetails.status)} bg-opacity-20`}>
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{t('appointmentDetails' as any) || 'Detalhes do Agendamento'}</h3>
                  <p className="text-sm text-gray-500 font-medium">#{selectedAppointmentForDetails.id.slice(0, 8)}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
              {isEditingAppointment ? (
                /* ========== EDIT MODE UI ========== */
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Client (Read only) */}
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <UserCircle className="w-4 h-4" /> {t('client')}
                      </label>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-150">
                        <p className="font-bold text-gray-900">{selectedAppointmentForDetails.client?.full_name}</p>
                        <p className="text-sm text-gray-500 mt-1">{selectedAppointmentForDetails.client?.phone}</p>
                      </div>
                    </div>

                    {/* Status Selection */}
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Status
                      </label>
                      <select
                        value={editAppointmentForm.status}
                        onChange={(e) => setEditAppointmentForm({ ...editAppointmentForm, status: e.target.value as any })}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent font-medium"
                      >
                        <option value="confirmed">{t('confirmed')}</option>
                        <option value="completed">{t('completed')}</option>
                        <option value="cancelled">{t('cancelled')}</option>
                        <option value="no_show">{t('noShow')}</option>
                      </select>
                    </div>

                    {/* Date Picker */}
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> {t('date')}
                      </label>
                      <input
                        type="date"
                        value={editAppointmentForm.date}
                        onChange={(e) => {
                          const dateVal = e.target.value
                          setEditAppointmentForm({ ...editAppointmentForm, date: dateVal })
                          loadRescheduleSlots(dateVal, editAppointmentForm.professional_id)
                        }}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent font-medium"
                      />
                    </div>

                    {/* Professional Selection */}
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" /> {t('professional' as any)}
                      </label>
                      <select
                        value={editAppointmentForm.professional_id || ''}
                        onChange={(e) => {
                          const profId = e.target.value || null
                          setEditAppointmentForm({ ...editAppointmentForm, professional_id: profId })
                          loadRescheduleSlots(editAppointmentForm.date, profId)
                        }}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent font-medium"
                      >
                        <option value="">{t('selectProfessional' as any) || 'Sem Profissional'}</option>
                        {professionals
                          .filter(p => p.active)
                          .map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))
                        }
                      </select>
                    </div>

                    {/* Time Slot Selection */}
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> {t('time')}
                      </label>
                      {loadingRescheduleSlots ? (
                        <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 flex items-center gap-2 font-medium">
                          <RefreshCw className="w-4 h-4 animate-spin text-pink-500" />
                          {language === 'pt-BR' ? 'Carregando horários...' : 'Lade Zeiten...'}
                        </div>
                      ) : (
                        <select
                          value={editAppointmentForm.time}
                          onChange={(e) => setEditAppointmentForm({ ...editAppointmentForm, time: e.target.value })}
                          disabled={!editAppointmentForm.date || !editAppointmentForm.professional_id}
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent font-medium disabled:bg-gray-50 disabled:text-gray-400"
                        >
                          <option value="">
                            {!editAppointmentForm.date || !editAppointmentForm.professional_id 
                              ? (language === 'pt-BR' ? 'Selecione data e profissional' : 'Datum & Mitarbeiter wählen') 
                              : (language === 'pt-BR' ? 'Selecione o horário' : 'Uhrzeit wählen')
                            }
                          </option>
                          {(() => {
                            const slotsToRender = [...availableRescheduleSlots]
                            const isCurrentTimeAvailable = availableRescheduleSlots.includes(editAppointmentForm.time)
                            
                            if (editAppointmentForm.time && !isCurrentTimeAvailable) {
                              slotsToRender.push(editAppointmentForm.time)
                              slotsToRender.sort()
                            }
                            
                            return slotsToRender.map(slot => {
                              const isAvailable = availableRescheduleSlots.includes(slot)
                              let label = slot
                              if (!isAvailable) {
                                label = language === 'pt-BR' 
                                  ? `${slot} (Indisponível)` 
                                  : `${slot} (Nicht verfügbar)`
                              }
                              return (
                                <option key={slot} value={slot}>
                                  {label}
                                </option>
                              )
                            })
                          })()}
                        </select>
                      )}
                      {!loadingRescheduleSlots && editAppointmentForm.time && !availableRescheduleSlots.includes(editAppointmentForm.time) && (
                        <p className="text-xs text-amber-500 font-bold mt-1.5 flex items-center gap-1">
                          ⚠️ {language === 'pt-BR' 
                            ? 'Este horário está indisponível para a nova seleção!' 
                            : 'Diese Uhrzeit ist für die neue Auswahl nicht verfügbar!'}
                        </p>
                      )}
                      {!loadingRescheduleSlots && editAppointmentForm.date && editAppointmentForm.professional_id && availableRescheduleSlots.length === 0 && (
                        <p className="text-xs text-red-500 font-bold mt-1.5">
                          ⚠️ {language === 'pt-BR' ? 'Sem horários disponíveis para este dia.' : 'Keine freien Termine für diesen Tag.'}
                        </p>
                      )}
                    </div>

                    {/* Note Box */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Clipboard className="w-4 h-4" /> {t('notes' as any)}
                      </label>
                      <textarea
                        value={editAppointmentForm.notes}
                        onChange={(e) => setEditAppointmentForm({ ...editAppointmentForm, notes: e.target.value })}
                        rows={3}
                        placeholder={t('notes' as any)}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent font-medium resize-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* ========== VIEW MODE UI ========== */
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Client & Appointment info */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <UserCircle className="w-4 h-4" /> {t('client')}
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <p className="font-bold text-gray-900 text-lg">{selectedAppointmentForDetails.client?.full_name}</p>
                          <div className="mt-3 space-y-2">
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" /> {selectedAppointmentForDetails.client?.email}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" /> {selectedAppointmentForDetails.client?.phone}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4" /> {t('schedule' as any) || 'Horário'}
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{t('date')}</span>
                            <span className="text-sm font-bold text-gray-900">{formatDate(selectedAppointmentForDetails.appointment_date)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{t('time')}</span>
                            <span className="text-sm font-bold text-gray-900">{selectedAppointmentForDetails.appointment_time.slice(0, 5)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{t('duration')}</span>
                            <span className="text-sm font-bold text-gray-900">{selectedAppointmentForDetails.total_duration_minutes} min</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Professional & Service info */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Scissors className="w-4 h-4" /> {t('services')}
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                          {selectedAppointmentForDetails.services?.map((s, idx) => (
                            <div key={idx} className="flex items-center justify-between py-1 border-b border-gray-200 last:border-0">
                              <span className="text-sm font-medium text-gray-800">{s.name}</span>
                              <span className="text-sm font-bold text-gray-900">{formatCurrency(s.price)}</span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between pt-2 mt-2">
                            <span className="text-sm font-bold text-gray-900">{t('total')}</span>
                            <span className="text-lg font-black text-pink-600">{formatCurrency(selectedAppointmentForDetails.total_price)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> {t('status' as any)}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(selectedAppointmentForDetails.status)}`}>
                            {getStatusLabel(selectedAppointmentForDetails.status)}
                          </span>
                          {selectedAppointmentForDetails.is_paid ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> {t('paid')}
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                              {t('pending' as any)}
                            </span>
                          )}
                          {selectedAppointmentForDetails.payment_method && (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1 ${getPaymentMethodColor(selectedAppointmentForDetails.payment_method)}`}>
                              {selectedAppointmentForDetails.payment_method === 'cash' ? <Wallet className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                              {getPaymentMethodLabel(selectedAppointmentForDetails.payment_method)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t space-y-6">
                    {selectedAppointmentForDetails.professional && (
                      <div className="flex items-center gap-4 bg-pink-50 p-4 rounded-2xl border border-pink-100">
                        <div className="w-12 h-12 rounded-full bg-pink-200 flex items-center justify-center text-pink-600">
                          <Users className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-pink-400 uppercase tracking-widest">{t('professional' as any)}</p>
                          <p className="font-bold text-pink-900">{selectedAppointmentForDetails.professional.name}</p>
                        </div>
                      </div>
                    )}

                    {selectedAppointmentForDetails.notes && (
                      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                        <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                          <Clipboard className="w-4 h-4" /> {t('notes' as any)}
                        </p>
                        <p className="text-sm text-amber-900 leading-relaxed italic">"{selectedAppointmentForDetails.notes}"</p>
                      </div>
                    )}

                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-200 rounded-lg text-gray-500">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('createdAt' as any) || 'Agendado em'}</p>
                          <p className="text-sm font-medium text-gray-700">{formatDateTime(selectedAppointmentForDetails.created_at)}</p>
                        </div>
                      </div>
                      {selectedAppointmentForDetails.source && (
                        <div className="text-right">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('source' as any) || 'Origem'}</p>
                          <p className="text-sm font-bold text-emerald-600">{getSourceLabel(selectedAppointmentForDetails.source)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t flex items-center justify-end gap-3">
              {isEditingAppointment ? (
                <>
                  <button
                    onClick={() => setIsEditingAppointment(false)}
                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all active:scale-95 shadow-sm"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={async () => {
                      if (!editAppointmentForm.date || !editAppointmentForm.time || !editAppointmentForm.professional_id) {
                        toast.error(
                          language === 'pt-BR' 
                            ? 'Por favor, preencha todos os campos obrigatórios!' 
                            : 'Bitte füllen Sie alle Pflichtfelder aus!'
                        )
                        return
                      }
                      const success = await rescheduleAppointment(
                        selectedAppointmentForDetails.id,
                        editAppointmentForm.date,
                        editAppointmentForm.time + ':00',
                        editAppointmentForm.professional_id,
                        editAppointmentForm.notes,
                        editAppointmentForm.status
                      )
                      if (success) {
                        setIsEditingAppointment(false)
                      }
                    }}
                    className="px-6 py-2.5 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600 transition-all active:scale-95 shadow-md shadow-pink-100"
                  >
                    {language === 'pt-BR' ? 'Salvar Alterações' : 'Änderungen speichern'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditAppointmentForm({
                        date: selectedAppointmentForDetails.appointment_date,
                        time: selectedAppointmentForDetails.appointment_time.slice(0, 5),
                        professional_id: selectedAppointmentForDetails.professional_id || null,
                        notes: selectedAppointmentForDetails.notes || '',
                        status: selectedAppointmentForDetails.status
                      })
                      setIsEditingAppointment(true)
                      loadRescheduleSlots(
                        selectedAppointmentForDetails.appointment_date,
                        selectedAppointmentForDetails.professional_id || null
                      )
                    }}
                    className="px-6 py-2.5 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600 transition-all active:scale-95 shadow-md shadow-pink-100 flex items-center gap-1.5"
                  >
                    <Clipboard className="w-4 h-4" />
                    {language === 'pt-BR' ? 'Editar Agendamento' : 'Termin bearbeiten'}
                  </button>
                  <button 
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all active:scale-95 shadow-sm"
                  >
                    {t('close' as any) || 'Fechar'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
