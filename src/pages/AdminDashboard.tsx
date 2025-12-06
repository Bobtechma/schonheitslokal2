import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import ProtectedRoute from '@/components/ProtectedRoute'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils'
import {
  Calendar,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Settings,
  Users,
  Shield,
  Plus,
  Save,
  X,
  Clock,
  Ban,
  Image as ImageIcon,
  Upload,
  ToggleLeft,
  Home,
  Star
} from 'lucide-react'
import { toast } from 'sonner'
import ClientSearch from '@/components/ClientSearch'

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  total_price: number
  total_duration_minutes: number
  status: 'confirmed' | 'cancelled' | 'completed'
  notes: string
  created_at: string
  client: {
    id: string
    full_name: string
    email: string
    phone: string
  }
  services: Array<{
    id: string
    name: string
    price: number
    duration_minutes: number
  }>
}

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'appointments' | 'settings' | 'users'>('appointments')
  const [services, setServices] = useState<any[]>([])
  const [serviceFormOpen, setServiceFormOpen] = useState(false)
  const [editingService, setEditingService] = useState<any | null>(null)
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', duration_minutes: 30, price: 0, category: '', active: true, display_order: 0 })
  const [manualModalOpen, setManualModalOpen] = useState(false)
  const [manualForm, setManualForm] = useState({ clientIdentifier: '', date: '', time: '', notes: '', selectedServiceIds: [] as string[], email: '', phone: '' })
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [promoStorePct, setPromoStorePct] = useState<number>(0)
  const [promoPerService, setPromoPerService] = useState<Record<string, number>>({})
  const [newUserForm, setNewUserForm] = useState({ email: '', password: '', fullName: '', role: 'client' })
  const [users, setUsers] = useState<any[]>([])

  // New Settings State
  const [businessHours, setBusinessHours] = useState<any[]>([])
  const [blockedDates, setBlockedDates] = useState<any[]>([])
  const [bookingPaused, setBookingPaused] = useState(false)
  const [carouselItems, setCarouselItems] = useState<any[]>([])
  const [newBlockedDate, setNewBlockedDate] = useState('')
  const [newCarouselItem, setNewCarouselItem] = useState({ title: '', description: '', image_url: '', link_url: '', display_order: 0 })
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (activeTab === 'appointments') {
      fetchAppointments()
    }
    if (activeTab === 'settings') {
      fetchServices()
      loadPromotions()
      fetchSettingsData()
    }
    if (activeTab === 'users') {
      fetchUsers()
    }
  }, [selectedDate, viewMode, statusFilter, activeTab])

  const fetchSettingsData = async () => {
    try {
      // Fetch Business Hours
      const { data: hours, error: hoursError } = await supabase.from('business_hours').select('*').order('day_of_week')
      if (hoursError) console.error('Error fetching hours:', hoursError)

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
      const { data: settings, error: settingsError } = await supabase.from('system_settings').select('*').eq('key', 'booking_paused').single()
      if (settingsError && settingsError.code !== 'PGRST116') console.error('Error fetching settings:', settingsError)
      if (settings) setBookingPaused(settings.value === 'true')

      // Fetch Carousel Items
      const { data: carousel, error: carouselError } = await supabase.from('carousel_items').select('*').order('display_order')
      if (carouselError) console.error('Error fetching carousel:', carouselError)
      if (carousel) setCarouselItems(carousel)
    } catch (error) {
      console.error('Error in fetchSettingsData:', error)
      toast.error('Fehler beim Laden der Einstellungen')
    }
  }

  const saveBusinessHours = async () => {
    try {
      const { error } = await supabase.from('business_hours').upsert(businessHours)
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

  const removeBlockedDate = async (id: number) => {
    try {
      const { error } = await supabase.from('blocked_dates').delete().eq('id', id)
      if (error) throw error
      toast.success('Blockierung aufgehoben')
      fetchSettingsData()
    } catch (error) {
      toast.error('Fehler beim Löschen')
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
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
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
      console.error('Error updating role:', error)
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

      // Apply date filter based on view mode
      if (viewMode === 'day') {
        const dateStr = selectedDate.toISOString().split('T')[0]
        query = query.eq('appointment_date', dateStr)
      } else if (viewMode === 'week') {
        const startOfWeek = new Date(selectedDate)
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay())
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)

        query = query
          .gte('appointment_date', startOfWeek.toISOString().split('T')[0])
          .lte('appointment_date', endOfWeek.toISOString().split('T')[0])
      } else if (viewMode === 'month') {
        const year = selectedDate.getFullYear()
        const month = selectedDate.getMonth()
        const startOfMonth = new Date(year, month, 1)
        const endOfMonth = new Date(year, month + 1, 0)

        // Helper to format as YYYY-MM-DD using local time components
        const formatDateLocal = (d: Date) => {
          const y = d.getFullYear()
          const m = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${y}-${m}-${day}`
        }

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
        status: 'confirmed' | 'cancelled' | 'completed'
        notes: string | null
        created_at: string
        client: { id: string; full_name: string; email?: string | null; phone: string }
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
        created_at: apt.created_at,
        client: {
          id: apt.client.id,
          full_name: apt.client.full_name,
          email: apt.client.email ?? '',
          phone: apt.client.phone
        },
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
      console.error('Error fetching appointments:', error)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Bestätigt'
      case 'cancelled':
        return 'Storniert'
      case 'completed':
        return 'Abgeschlossen'
      default:
        return status
    }
  }

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() + days)
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
    if (!error) setServices(data || [])
  }

  const loadPromotions = async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key,value')
      .or('key.eq.store_discount_pct,key.like.service_discount_pct_%')
    if (error) return
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

  const openCreateService = () => {
    setEditingService(null)
    setServiceForm({ name: '', description: '', duration_minutes: 30, price: 0, category: '', active: true, display_order: (services?.length || 0) + 1 })
    setServiceFormOpen(true)
  }

  const openEditService = (svc: any) => {
    setEditingService(svc)
    setServiceForm({
      name: svc.name || '',
      description: svc.description || '',
      duration_minutes: svc.duration_minutes || 30,
      price: svc.price || 0,
      category: svc.category || '',
      active: Boolean(svc.active ?? true),
      display_order: svc.display_order ?? 0
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
      updated_at: new Date().toISOString(),
    } as any
    if (!payload.name || !payload.duration_minutes || !payload.price) {
      toast.error('Bitte Name, Dauer und Preis ausfüllen')
      return
    }
    if (editingService) {
      const { error } = await supabase
        .from('services')
        .update(payload)
        .eq('id', editingService.id)
      if (error) { toast.error('Fehler beim Bearbeiten der Dienstleistung'); return }
      toast.success('Dienstleistung aktualisiert')
    } else {
      const { error } = await supabase
        .from('services')
        .insert([{ ...payload, created_at: new Date().toISOString() }])
      if (error) {
        console.error('Error creating service:', error)
        toast.error(`Fehler beim Erstellen der Dienstleistung: ${error.message}`)
        return
      }
      toast.success('Dienstleistung erstellt')
    }
    setServiceFormOpen(false)
    fetchServices()
  }

  const deleteService = async (serviceId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Dienstleistung löschen möchten?')) return

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId)

    if (error) {
      console.error('Error deleting service:', error)
      toast.error('Fehler beim Löschen der Dienstleistung')
      return
    }

    toast.success('Dienstleistung gelöscht')
    fetchServices()
  }

  const handleManualCreate = async () => {
    const { date, time, notes, selectedServiceIds } = manualForm
    // Allow if we have a selected client OR a name typed in the search box
    if ((!selectedClient && !clientSearch) || !date || !time || selectedServiceIds.length === 0) {
      toast.error('Bitte Kunde, Datum, Uhrzeit und Dienstleistungen angeben')
      return
    }

    let client = selectedClient

    // If no existing client selected, create a "Walk-in" client
    if (!client && clientSearch) {
      const dummyId = Date.now().toString()
      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert([{
          full_name: clientSearch,
          phone: manualForm.phone || `walkin_${dummyId}`, // Use provided phone or dummy
          email: manualForm.email || `walkin_${dummyId}@temp.com`, // Use provided email or dummy
          user_id: null, // No linked user account
          terms_accepted: true, // Implied consent
          terms_accepted_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (createError || !newClient) {
        console.error('Error creating walk-in client:', createError)
        toast.error('Fehler beim Erstellen des Kunden')
        return
      }
      client = newClient
    }

    const svcList = services.filter(s => selectedServiceIds.includes(s.id))
    const totalPrice = svcList.reduce((sum, s) => sum + Number(s.price), 0)
    const totalDuration = svcList.reduce((sum, s) => sum + Number(s.duration_minutes), 0)

    const rpcRes = await supabase.rpc('create_appointment_with_services', {
      p_client_id: client.id,
      p_user_id: user?.id ?? null,
      p_appointment_date: date,
      p_appointment_time: time.length === 5 ? `${time}:00` : time,
      p_status: 'confirmed',
      p_notes: notes || '',
      p_total_price: Number(totalPrice),
      p_total_duration: Number(totalDuration),
      p_services: svcList.map((s, i) => ({ id: s.id, price: s.price, duration_minutes: s.duration_minutes, order_index: i }))
    })

    if (rpcRes.error) {
      const msg = (rpcRes.error.message || '').toLowerCase()
      const notFound = msg.includes('not found') || msg.includes('function') || (rpcRes.error as any).code === 'PGRST202'
      if (!notFound) { toast.error('Fehler beim Planen'); return }
      if (!(user?.role === 'admin' || user?.role === 'owner')) { toast.error('Serverfunktion fehlt. Bitte verwenden Sie ein Administratorkonto.'); return }

      const ins = await supabase
        .from('appointments')
        .insert([{ client_id: client.id, user_id: user?.id ?? null, appointment_date: date, appointment_time: time.length === 5 ? `${time}:00` : time, total_price: Number(totalPrice), total_duration_minutes: Number(totalDuration), status: 'confirmed', notes, created_at: new Date().toISOString() }])
        .select()
        .single()
      if ((ins as any).error || !ins.data) { toast.error('Fehler beim Erstellen des Termins'); return }
      for (let i = 0; i < svcList.length; i++) {
        const s = svcList[i]
        const r = await supabase
          .from('appointment_services')
          .insert([{ appointment_id: ins.data.id, service_id: s.id, order_index: i, price_at_time: s.price, duration_at_time: s.duration_minutes }])
        if ((r as any).error) { toast.error('Fehler beim Verknüpfen der Dienstleistung'); return }
      }
    }
    toast.success('Termin erstellt')
    setManualModalOpen(false)
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

      const res = await fetch('/api/admin-create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(newUserForm)
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

      const res = await fetch('/api/admin-delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId })
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

  // Settings Logic
  const [settings, setSettings] = useState<{ review_email_delay: number } | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('system_settings').select('review_email_delay').single()
      if (error && error.code !== 'PGRST116') throw error // Ignore 'no rows' error for now

      if (data) {
        setSettings(data)
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
      // Check if exists first to decide insert vs update, or use upsert if unique constraint exists
      // system_settings likely has a single row pattern, usually id=1 or similar. 
      // Let's assume we can upsert with a fixed ID or match existing row.
      // Ideally system_settings should have a single row constraint. 
      // For now, let's try to upsert with an arbitrary ID 1 or fetch existing ID.

      const { data: existing } = await supabase.from('system_settings').select('id').limit(1).single()

      if (existing) {
        const { error } = await supabase
          .from('system_settings')
          .update({ review_email_delay: settings.review_email_delay })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('system_settings')
          .insert({ review_email_delay: settings.review_email_delay })
        if (error) throw error
      }

      toast.success('Einstellungen gespeichert')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Fehler beim Speichern der Einstellungen')
    } finally {
      setSavingSettings(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'settings') {
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

  return (
    <ProtectedRoute requiredRoles={['admin', 'owner']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {user?.role === 'owner' ? 'Besitzer Dashboard' : 'Admin Dashboard'}
                </h1>
                <p className="text-gray-600">
                  {activeTab === 'appointments' && 'Verwalten Sie Ihre Termine'}
                  {activeTab === 'settings' && 'Systemeinstellungen'}
                  {activeTab === 'users' && 'Benutzerverwaltung'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Willkommen, {user?.user_metadata?.full_name || user?.email}
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
            <div className="flex space-x-1 mt-4">
              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'appointments'
                  ? 'bg-pink-500 text-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Termine
              </button>

              {/* Settings visible for admin and owner; Users only for owner */}
              {(user?.role === 'owner' || user?.role === 'admin') && (
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'settings'
                    ? 'bg-pink-500 text-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Configurações de Conta
                </button>
              )}
              {(user?.role === 'owner' || user?.role === 'admin') && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'users'
                    ? 'bg-pink-500 text-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Benutzer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="container mx-auto px-4 py-6">
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
                          {mode === 'day' ? 'Tag' : mode === 'week' ? 'Woche' : 'Monat'}
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
                        placeholder="Kunde oder Dienstleistung suchen..."
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
                      <option value="all">Alle Status</option>
                      <option value="confirmed">Bestätigt</option>
                      <option value="completed">Abgeschlossen</option>
                      <option value="cancelled">Storniert</option>
                    </select>
                  </div>
                </div>
              </div>

              {viewMode !== 'month' ? (
                <div className="bg-white rounded-lg shadow-sm">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                    </div>
                  ) : appointments.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Keine Termine gefunden</p>
                      <p className="text-gray-500 text-sm mt-1">
                        {searchTerm ? 'Versuchen Sie, Ihre Suche anzupassen' : 'Keine Termine für diesen Zeitraum'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {appointments.map((appointment) => (
                        <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>{getStatusLabel(appointment.status)}</span>
                                <span className="text-sm text-gray-500">{formatDateTime(new Date(appointment.appointment_date + ' ' + appointment.appointment_time))}</span>
                              </div>
                              <h3 className="font-semibold text-gray-800 mb-1">{appointment.client.full_name}</h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                                <div className="flex items-center"><Mail className="w-4 h-4 mr-1" />{appointment.client.email || '-'}</div>
                                <div className="flex items-center"><Phone className="w-4 h-4 mr-1" />{appointment.client.phone}</div>
                              </div>
                              <div className="text-sm text-gray-600">
                                <p className="font-medium mb-1">Dienstleistungen:</p>
                                {appointment.services.map((service) => (
                                  <div key={service.id} className="flex justify-between items-center py-1">
                                    <span>{service.name}</span>
                                    <span className="font-medium">{formatCurrency(service.price)}</span>
                                  </div>
                                ))}
                              </div>
                              {appointment.notes && (
                                <div className="mt-2 text-sm text-gray-600"><p className="font-medium">Bemerkungen:</p><p>{appointment.notes}</p></div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-bold text-pink-600">{formatCurrency(appointment.total_price)}</span>
                              {appointment.status === 'confirmed' && (
                                <>
                                  <button onClick={() => updateAppointmentStatus(appointment.id, 'completed')} className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg" title="Als abgeschlossen markieren"><CheckCircle className="w-4 h-4" /></button>
                                  <button onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')} className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg" title="Stornieren"><XCircle className="w-4 h-4" /></button>
                                </>
                              )}
                              <button onClick={() => setManualModalOpen(true)} className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg" title="Manuell planen"><Calendar className="w-4 h-4" /></button>
                              <button onClick={() => deleteAppointment(appointment.id)} className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg" title="Löschen"><Trash2 className="w-4 h-4" /></button>
                              <button onClick={() => sendReviewEmail(appointment.id)} className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg" title="Bewertungs-E-Mail senden"><Star className="w-4 h-4" /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                          <div key={dateStr} className="h-24 border rounded p-1 hover:bg-gray-50 cursor-pointer" onClick={() => { setViewMode('day'); setSelectedDate(new Date(dateStr)) }}>
                            <div className="text-xs text-gray-500">{day}</div>
                            <div className="mt-1 space-y-1 overflow-hidden">
                              {dayAppointments.slice(0, 3).map(a => (
                                <div key={a.id} className={`text-[11px] px-1 py-0.5 rounded ${getStatusColor(a.status)}`}>{a.services[0]?.name || 'Termin'}</div>
                              ))}
                              {dayAppointments.length > 3 && (<div className="text-[11px] text-gray-500">+{dayAppointments.length - 3} mehr</div>)}
                            </div>
                          </div>
                        )
                      }
                      return cells
                    })()}
                  </div>
                  <div className="mt-4">
                    <button onClick={() => setManualModalOpen(true)} className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"><Plus className="w-4 h-4 inline mr-2" />Termin erstellen</button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Admin Einstellungen</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-800">Dienstleistungen</h3>
                    <button onClick={openCreateService} className="px-3 py-1 bg-pink-500 text-white rounded hover:bg-pink-600"><Plus className="w-4 h-4 inline mr-1" />Neu</button>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Verwalten Sie die angebotenen Dienstleistungen</p>
                  <div className="space-y-2 max-h-80 overflow-auto">
                    {services.map(s => (
                      <div key={s.id} className="flex items-center justify-between border rounded p-2">
                        <div>
                          <div className="font-medium">{s.name}</div>
                          <div className="text-sm text-gray-600">{formatCurrency(applyPriceWithPromotions(s.price, s.id))} • {s.duration_minutes} min</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditService(s)} className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => deleteService(s.id)} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">Promoções</h3>
                  <p className="text-sm text-gray-600 mb-4">Definieren Sie Rabatte pro Dienstleistung oder für den gesamten Salon</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-700">Salon-Rabatt (%)</label>
                      <input type="number" value={promoStorePct} onChange={e => setPromoStorePct(Number(e.target.value))} className="mt-1 w-full border rounded px-3 py-2" min={0} max={90} />
                    </div>
                    <div className="max-h-64 overflow-auto border rounded p-2">
                      {services.map(s => (
                        <div key={s.id} className="flex items-center justify-between py-1">
                          <span className="text-sm">{s.name}</span>
                          <input type="number" value={promoPerService[s.id] ?? 0} onChange={e => setPromoPerService({ ...promoPerService, [s.id]: Number(e.target.value) })} className="w-24 border rounded px-2 py-1" min={0} max={90} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button onClick={savePromotions} className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"><Save className="w-4 h-4 inline mr-2" />Speichern</button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">Manuelle Terminbuchung</h3>
                  <p className="text-sm text-gray-600 mb-4">Erstellen Sie einen Termin direkt im Dashboard</p>
                  <button onClick={() => setManualModalOpen(true)} className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"><Calendar className="w-4 h-4 inline mr-2" />Öffnen</button>
                </div>
              </div>

              {/* Business Hours & Availability Section */}
              <div className="mt-8 border-t pt-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Öffnungszeiten & Verfügbarkeit</h2>

                {/* Quick Pause */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-orange-900 flex items-center">
                      <Ban className="w-4 h-4 mr-2" />
                      Buchungen pausieren
                    </h3>
                    <p className="text-sm text-orange-700">
                      Deaktiviert vorübergehend alle neuen Online-Buchungen.
                    </p>
                  </div>
                  <button
                    onClick={toggleBookingPaused}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bookingPaused ? 'bg-orange-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bookingPaused ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Weekly Hours */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-4 flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Wöchentliche Öffnungszeiten
                    </h3>
                    <div className="space-y-3">
                      {businessHours.map((day, index) => (
                        <div key={day.id || index} className="flex items-center space-x-2 text-sm">
                          <span className="w-24 font-medium">
                            {['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][day.day_of_week]}
                          </span>
                          <input
                            type="checkbox"
                            checked={!day.is_closed}
                            onChange={e => {
                              const newHours = [...businessHours]
                              newHours[index].is_closed = !e.target.checked
                              setBusinessHours(newHours)
                            }}
                            className="rounded text-pink-500"
                          />
                          {!day.is_closed ? (
                            <>
                              <input
                                type="time"
                                value={day.open_time || ''}
                                onChange={e => {
                                  const newHours = [...businessHours]
                                  newHours[index].open_time = e.target.value
                                  setBusinessHours(newHours)
                                }}
                                className="border rounded px-2 py-1"
                              />
                              <span>-</span>
                              <input
                                type="time"
                                value={day.close_time || ''}
                                onChange={e => {
                                  const newHours = [...businessHours]
                                  newHours[index].close_time = e.target.value
                                  setBusinessHours(newHours)
                                }}
                                className="border rounded px-2 py-1"
                              />
                            </>
                          ) : (
                            <span className="text-gray-500 italic">Geschlossen</span>
                          )}
                        </div>
                      ))}
                      <button onClick={saveBusinessHours} className="mt-4 px-4 py-2 bg-pink-500 text-white rounded text-sm hover:bg-pink-600 w-full">
                        Zeiten speichern
                      </button>
                    </div>
                  </div>

                  {/* Blocked Dates */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-4 flex items-center">
                      <Ban className="w-4 h-4 mr-2" />
                      Blockierte Daten
                    </h3>
                    <div className="flex space-x-2 mb-4">
                      <input
                        type="date"
                        value={newBlockedDate}
                        onChange={e => setNewBlockedDate(e.target.value)}
                        className="border rounded px-3 py-2 flex-1"
                      />
                      <button onClick={addBlockedDate} className="px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-900">
                        Blockieren
                      </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-auto">
                      {blockedDates.map(date => (
                        <div key={date.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                          <span>{formatDate(date.date)}</span>
                          <button onClick={() => removeBlockedDate(date.id)} className="text-red-500 hover:text-red-700">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {blockedDates.length === 0 && <p className="text-gray-500 text-sm">Keine blockierten Daten.</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Carousel Management Section */}
              <div className="mt-8 border-t pt-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Startseite Karussell</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Add New Item */}
                  <div className="md:col-span-1 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-4 flex items-center">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Neues Bild
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-700 block mb-1">Bild hochladen</label>
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              {uploadingImage ? (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                              ) : newCarouselItem.image_url ? (
                                <img src={newCarouselItem.image_url} alt="Preview" className="h-28 object-contain" />
                              ) : (
                                <>
                                  <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                  <p className="text-xs text-gray-500">Klicken zum Hochladen</p>
                                </>
                              )}
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                          </label>
                        </div>
                      </div>
                      <input
                        placeholder="Titel"
                        value={newCarouselItem.title}
                        onChange={e => setNewCarouselItem({ ...newCarouselItem, title: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      />
                      <textarea
                        placeholder="Beschreibung"
                        value={newCarouselItem.description}
                        onChange={e => setNewCarouselItem({ ...newCarouselItem, description: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        rows={2}
                      />
                      <input
                        placeholder="Link URL (optional)"
                        value={newCarouselItem.link_url}
                        onChange={e => setNewCarouselItem({ ...newCarouselItem, link_url: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      />
                      <button onClick={addCarouselItem} className="w-full px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600">
                        Hinzufügen
                      </button>
                    </div>
                  </div>

                  {/* Existing Items */}
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {carouselItems.map(item => (
                      <div key={item.id} className="border rounded-lg overflow-hidden relative group">
                        <img src={item.image_url} alt={item.title} className="w-full h-32 object-cover" />
                        <div className="p-3">
                          <h4 className="font-medium truncate">{item.title}</h4>
                          <p className="text-xs text-gray-500 truncate">{item.description}</p>
                        </div>
                        <button
                          onClick={() => deleteCarouselItem(item.id)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {carouselItems.length === 0 && (
                      <div className="col-span-2 text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                        Keine Bilder im Karussell
                      </div>
                    )}
                  </div>
                </div>
              </div>


            </div>
          )}

          {activeTab === 'users' && (user?.role === 'owner' || user?.role === 'admin') && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Benutzerverwaltung</h2>
                  <p className="text-gray-600">
                    Verwalten Sie Benutzerrollen und Berechtigungen.
                  </p>
                </div>
                <button
                  onClick={fetchUsers}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                  title="Liste aktualisieren"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name/Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rolle</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rolle Ändern</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-pink-100 rounded-full flex items-center justify-center">
                                <span className="text-pink-600 font-medium text-sm">
                                  {(u.raw_user_meta_data?.full_name || u.email || '?').substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{u.raw_user_meta_data?.full_name || 'Unbekannt'}</div>
                                <div className="text-sm text-gray-500">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                              u.role === 'admin' ? 'bg-red-100 text-red-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                              {u.role === 'owner' ? 'Besitzer' : u.role === 'admin' ? 'Administrator' : 'Kunde'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {u.role !== 'owner' && (
                              <div className="flex space-x-2">
                                {u.role !== 'admin' && (
                                  <button
                                    onClick={() => updateUserRole(u.id, 'admin')}
                                    className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md hover:bg-indigo-100 transition-colors"
                                  >
                                    Zum Admin befördern
                                  </button>
                                )}
                                {u.role === 'admin' && (
                                  <button
                                    onClick={() => updateUserRole(u.id, 'client')}
                                    className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md hover:bg-red-100 transition-colors"
                                  >
                                    Admin widerrufen
                                  </button>
                                )}
                              </div>
                            )}

                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {u.id !== user?.id && (
                              <button
                                onClick={() => deleteUser(u.id)}
                                className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-lg hover:bg-red-100 transition-colors"
                                title="Benutzer löschen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Keine Benutzer gefunden.
                    </div>
                  )}
                </div>
              )}

              <div className="border border-gray-200 rounded-lg p-4 mt-6">
                <h3 className="font-medium text-gray-800 mb-2">Neuen Benutzer erstellen</h3>
                <p className="text-sm text-gray-600 mb-4">Erstellen Sie einen neuen Benutzerzugang</p>
                <div className="space-y-3">
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
                      className="mt-1 w-full border rounded px-3 py-2"
                    >
                      <option value="client">Kunde</option>
                      <option value="admin">Administrator</option>
                      <option value="owner">Besitzer</option>
                    </select>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button onClick={createUser} className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600">
                      <Plus className="w-4 h-4 inline mr-2" />
                      Benutzer erstellen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (user?.role === 'owner' || user?.role === 'admin') && (
            <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Einstellungen</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Automatische Bewertungs-E-Mails</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Konfigurieren Sie, wann Kunden nach ihrem Termin um eine Bewertung gebeten werden.
                  </p>

                  <div className="flex items-center space-x-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Verzögerung nach Terminende (Stunden)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={settings?.review_email_delay ?? 2}
                        onChange={(e) => setSettings(prev => prev ? ({ ...prev, review_email_delay: Number(e.target.value) }) : { review_email_delay: Number(e.target.value) })}
                        className="border rounded px-3 py-2 w-32"
                      />
                    </div>
                    <button
                      onClick={saveSettings}
                      disabled={savingSettings}
                      className="mt-6 px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 disabled:opacity-50"
                    >
                      {savingSettings ? 'Speichert...' : 'Speichern'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Standard ist 2 Stunden. Setzen Sie auf 0 für sofortigen Versand (nur empfohlen für Tests).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {
        serviceFormOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-4">{editingService ? 'Dienstleistung bearbeiten' : 'Neue Dienstleistung'}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Serviço</label>
                  <input value={serviceForm.name} onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} placeholder="Ex: Limpeza de Pele" className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} placeholder="Descreva os detalhes do procedimento..." className="w-full border rounded px-3 py-2" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duração (min)</label>
                    <input type="number" value={serviceForm.duration_minutes} onChange={e => setServiceForm({ ...serviceForm, duration_minutes: Number(e.target.value) })} placeholder="30" className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço (CHF)</label>
                    <input type="number" value={serviceForm.price} onChange={e => setServiceForm({ ...serviceForm, price: Number(e.target.value) })} placeholder="0.00" className="w-full border rounded px-3 py-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <input value={serviceForm.category} onChange={e => setServiceForm({ ...serviceForm, category: e.target.value })} placeholder="Ex: Facial, Corporal" className="w-full border rounded px-3 py-2" />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="active-check" checked={serviceForm.active} onChange={e => setServiceForm({ ...serviceForm, active: e.target.checked })} className="rounded text-pink-500 focus:ring-pink-500" />
                  <label htmlFor="active-check" className="text-sm font-medium text-gray-700">Serviço Ativo</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ordem de Exibição</label>
                  <input type="number" value={serviceForm.display_order} onChange={e => setServiceForm({ ...serviceForm, display_order: Number(e.target.value) })} placeholder="0" className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setServiceFormOpen(false)} className="px-3 py-2 border rounded"><X className="w-4 h-4 inline mr-1" />Schliessen</button>
                <button onClick={saveService} className="px-3 py-2 bg-pink-500 text-white rounded"><Save className="w-4 h-4 inline mr-1" />Speichern</button>
              </div>
            </div>
          </div>
        )
      }
      {
        manualModalOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-white rounded-lg w-full max-w-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Manuelle Terminbuchung</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <ClientSearch
                    onSelect={(client) => {
                      setSelectedClient(client)
                      setClientSearch('') // Clear search term when client selected
                    }}
                    onQueryChange={(query) => {
                      setClientSearch(query)
                      if (selectedClient) setSelectedClient(null) // Deselect if user types
                    }}
                    placeholder="Kunde suchen (Name, Email, Telefon)"
                  />
                  {selectedClient && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
                      <div>
                        <div className="font-medium text-green-800">Ausgewählt: {selectedClient.full_name}</div>
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

                {/* Optional Contact Fields for Walk-ins */}
                {!selectedClient && (
                  <>
                    <input
                      value={manualForm.email}
                      onChange={e => setManualForm({ ...manualForm, email: e.target.value })}
                      placeholder="E-Mail (Optional)"
                      className="border rounded px-3 py-2"
                    />
                    <input
                      value={manualForm.phone}
                      onChange={e => setManualForm({ ...manualForm, phone: e.target.value })}
                      placeholder="Telefon (Optional)"
                      className="border rounded px-3 py-2"
                    />
                  </>
                )}

                <input type="date" value={manualForm.date} onChange={e => setManualForm({ ...manualForm, date: e.target.value })} className="border rounded px-3 py-2" />
                <input type="time" value={manualForm.time} onChange={e => setManualForm({ ...manualForm, time: e.target.value })} className="border rounded px-3 py-2" />
                <input value={manualForm.notes} onChange={e => setManualForm({ ...manualForm, notes: e.target.value })} placeholder="Notizen" className="border rounded px-3 py-2" />
                <div className="mt-3 max-h-48 overflow-auto border rounded p-2">
                  {services.map(s => (
                    <label key={s.id} className="flex items-center justify-between py-1">
                      <span className="text-sm">{s.name} • {s.duration_minutes} min • {formatCurrency(applyPriceWithPromotions(s.price, s.id))}</span>
                      <input type="checkbox" checked={manualForm.selectedServiceIds.includes(s.id)} onChange={e => {
                        const sel = manualForm.selectedServiceIds
                        const next = e.target.checked ? [...sel, s.id] : sel.filter(id => id !== s.id)
                        setManualForm({ ...manualForm, selectedServiceIds: next })
                      }} />
                    </label>
                  ))}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setManualModalOpen(false)} className="px-3 py-2 border rounded"><X className="w-4 h-4 inline mr-1" />Schliessen</button>
                  <button onClick={handleManualCreate} className="px-3 py-2 bg-pink-500 text-white rounded"><Save className="w-4 h-4 inline mr-1" />Erstellen</button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </ProtectedRoute >
  )
}