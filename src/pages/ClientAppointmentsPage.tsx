import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Calendar, Clock, CheckCircle, XCircle, Search, Sparkles } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface ServiceItem {
  id: string
  name: string
  price: number
  duration_minutes: number
}

interface AppointmentItem {
  id: string
  appointment_date: string
  appointment_time: string
  total_price: number
  total_duration_minutes: number
  status: 'confirmed' | 'cancelled' | 'completed'
  notes: string | null
  created_at: string
  services: ServiceItem[]
}

export default function ClientAppointmentsPage() {
  const { user } = useAuthStore()
  const [appointments, setAppointments] = useState<AppointmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true)
      try {
        let query = supabase
          .from('appointments')
          .select(`
            *,
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

        if (user?.id) {
          query = query.eq('user_id', user.id)
        }

        const res = await query
        if (res.error) throw res.error

        const rows = res.data ?? []
        const formatted: AppointmentItem[] = rows.map((apt: any) => ({
          id: apt.id,
          appointment_date: apt.appointment_date,
          appointment_time: apt.appointment_time,
          total_price: apt.total_price,
          total_duration_minutes: apt.total_duration_minutes,
          status: apt.status,
          notes: apt.notes,
          created_at: apt.created_at,
          services: (apt.services || [])
            .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((s: any) => ({
              id: s.service_id,
              name: s.service?.name,
              price: s.price_at_time,
              duration_minutes: s.duration_at_time
            }))
        }))

        const filtered = formatted.filter(a =>
          a.services.some(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          a.notes?.toLowerCase().includes(searchTerm.toLowerCase())
        )

        setAppointments(searchTerm ? filtered : formatted)
      } catch (err) {
        setAppointments([])
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [user?.id, searchTerm])

  const getStatusLabel = (status: AppointmentItem['status']) => {
    if (status === 'confirmed') return 'Bestätigt'
    if (status === 'completed') return 'Abgeschlossen'
    if (status === 'cancelled') return 'Storniert'
    return status
  }

  const getStatusColor = (status: AppointmentItem['status']) => {
    if (status === 'confirmed') return 'bg-green-100 text-green-700'
    if (status === 'completed') return 'bg-blue-100 text-blue-700'
    if (status === 'cancelled') return 'bg-red-100 text-red-700'
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-800">Meine Termine</h1>
            <p className="text-gray-600">Sehen Sie Ihre zukünftigen und vergangenen Buchungen</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Dienstleistung oder Notiz suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent w-full"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Keine Termine gefunden</p>
                <p className="text-gray-500 text-sm mt-1">Buchen Sie Ihren ersten Termin</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {appointments.map((a) => (
                  <div key={a.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(a.status)}`}>
                            {getStatusLabel(a.status)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDateTime(new Date(a.appointment_date + ' ' + a.appointment_time))}
                          </span>
                        </div>
                        <div className="text-gray-800 font-medium">
                          {a.services.map((s, idx) => (
                            <span key={s.id} className="inline-flex items-center mr-2">
                              <Sparkles className="w-4 h-4 text-pink-500 mr-1" />
                              {s.name}
                              {idx < a.services.length - 1 && <span className="text-gray-400 ml-2">•</span>}
                            </span>
                          ))}
                        </div>
                        {a.notes && (
                          <p className="text-sm text-gray-600 mt-2">{a.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          {a.total_duration_minutes} Min
                        </div>
                        <div className="flex items-center text-gray-600">
                          {a.status === 'cancelled' ? (
                            <XCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}