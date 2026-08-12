import React from 'react'
import { 
  Calendar, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Package, 
  CheckCircle, 
  ZapOff, 
  XCircle, 
  Trash2, 
  Star,
  RefreshCw,
  Users,
  CreditCard,
  Wallet
} from 'lucide-react'
import { Appointment, BusinessHour } from '@/types/admin'
import { Service } from '@/lib/supabase'

interface AppointmentsTabProps {
  loading: boolean
  filteredAppointments: Appointment[]
  appointments: Appointment[]
  viewMode: 'day' | 'week' | 'month'
  setViewMode: (mode: 'day' | 'week' | 'month') => void
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  statusFilter: string
  setStatusFilter: (filter: string) => void
  fetchAppointments: () => void
  updateAppointmentStatus: (id: string, status: any) => void
  deleteAppointment: (id: string) => void
  sendReviewEmail: (id: string) => void
  t: (key: string) => string
  getStatusColor: (status: string) => string
  getStatusLabel: (status: string) => string
  getDateDisplay: () => string
  changeDate: (delta: number) => void
  businessHours: BusinessHour[]
  services: Service[]
  setManualProfessionalId: (id: string | null) => void
  setManualCategory: (cat: 'service' | 'product') => void
  setManualForm: (form: any) => void
  setManualModalOpen: (open: boolean) => void
}

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({
  loading,
  filteredAppointments,
  appointments,
  viewMode,
  setViewMode,
  selectedDate,
  setSelectedDate,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  fetchAppointments,
  updateAppointmentStatus,
  deleteAppointment,
  sendReviewEmail,
  t,
  getStatusColor,
  getStatusLabel,
  getDateDisplay,
  changeDate,
  businessHours,
  services,
  setManualProfessionalId,
  setManualCategory,
  setManualForm,
  setManualModalOpen
}) => {
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

  return (
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
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-auto pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
            
            <button
               onClick={fetchAppointments}
               className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
               title="Aktualisieren"
            >
               <RefreshCw className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 ml-auto sm:ml-0">
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
                }} className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 text-sm flex items-center shadow-sm transition-opacity opacity-100"><Plus className="w-4 h-4 mr-1" />{t('createAppointment')}</button>
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
                }} className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm flex items-center shadow-sm transition-opacity opacity-100"><Package className="w-4 h-4 mr-1" />{t('newSale')}</button>
            </div>
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
                  <div key={appointment.id} className="p-4 hover:bg-gray-50 transition-colors group">
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
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center ${getPaymentMethodColor(appointment.payment_method)}`}>
                              {appointment.payment_method === 'cash' ? (
                                <Wallet className="w-3 h-3 mr-1" />
                              ) : (appointment.payment_method === 'twint' || appointment.payment_method === 'credit_card') ? (
                                <CreditCard className="w-3 h-3 mr-1" />
                              ) : (
                                <Wallet className="w-3 h-3 mr-1" />
                              )}
                              {getPaymentMethodLabel(appointment.payment_method)}
                            </span>
                            {appointment.is_paid && (
                              <span className="flex items-center text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                <CheckCircle className="w-3 h-3 mr-1" /> {t('paid')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {appointment.status === 'confirmed' && (
                          <>
                            <button onClick={() => updateAppointmentStatus(appointment.id, 'completed')} className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg" title={t('markCompleted')}><CheckCircle className="w-4 h-4" /></button>
                            <button onClick={() => updateAppointmentStatus(appointment.id, 'no_show')} className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg" title={t('noShow')}><ZapOff className="w-4 h-4" /></button>
                            <button onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')} className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg" title={t('cancelAppointment')}><XCircle className="w-4 h-4" /></button>
                          </>
                        )}

                        <button onClick={() => deleteAppointment(appointment.id)} className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg" title={t('delete')}><Trash2 className="w-4 h-4" /></button>
                        <button onClick={() => sendReviewEmail(appointment.id)} className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg" title={t('sendReviewEmail')}><Star className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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
              if (opens.length > 0) earliestOpen = (opens[0] || '09:00').slice(0, 5)
              if (closes.length > 0) latestClose = (closes[closes.length - 1] || '18:00').slice(0, 5)
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
                      <tr key={time} className="h-20">
                        <td className="p-2 border-r border-b bg-gray-50 text-[10px] text-gray-400 font-medium sticky left-0 z-10 align-top">
                          {time}
                        </td>
                        {weekDays.map(day => {
                          const items = getAptsAt(day.dateStr, time)
                          return (
                            <td 
                              key={`${day.dateStr}-${time}`} 
                              className={`p-1 border-b border-r relative group cursor-pointer transition-colors ${isDayClosed(day.dayOfWeek) ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                              onClick={() => {
                                if (isDayClosed(day.dayOfWeek)) return
                                setManualProfessionalId(null); 
                                setManualCategory('service');
                                setManualForm({
                                  clientIdentifier: '',
                                  date: day.dateStr,
                                  time: time,
                                  selectedServiceIds: [] as string[],
                                  notes: '',
                                  email: '',
                                  phone: '',
                                  birthDate: '',
                                  address: ''
                                });
                                setManualModalOpen(true);
                              }}
                            >
                              {items.map(apt => (
                                <div
                                  key={apt.id}
                                  onClick={(e) => { e.stopPropagation(); setViewMode('day'); setSelectedDate(new Date(apt.appointment_date)) }}
                                  className={`absolute inset-x-1 top-1 p-1.5 rounded shadow-sm z-10 overflow-hidden cursor-pointer hover:brightness-95 transition-all ${apt.status === 'cancelled' ? 'bg-red-100 text-red-700 border-l-4 border-red-500' : 'bg-pink-100 text-pink-700 border-l-4 border-pink-500'}`}
                                  style={{ minHeight: 'calc(100% - 0.5rem)' }}
                                >
                                  <div className="font-bold text-[10px] truncate">{apt.client?.full_name}</div>
                                  <div className="flex items-center justify-between">
                                    <div className="text-[9px] truncate opacity-100">{apt.services?.map(s => s.name).join(', ')}</div>
                                    <div className="flex items-center gap-1 ml-1 opacity-100">
                                      {apt.payment_method === 'cash' ? (
                                        <Wallet className="w-3 h-3 text-amber-600" />
                                      ) : (apt.payment_method === 'twint' || apt.payment_method === 'credit_card') && (
                                        <CreditCard className="w-3 h-3 text-blue-600" />
                                      )}
                                      {apt.is_paid && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {!isDayClosed(day.dayOfWeek) && items.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-100 transition-opacity">
                                  <Plus className="w-4 h-4 text-pink-300" />
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
        </div>
      ) : (
        /* ========== MONTH VIEW Placeholder ========== */
        <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
           {t('monthView' as any)} (Em Breve)
        </div>
      )}
    </>
  )
}
