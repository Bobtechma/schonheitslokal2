import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Calendar, 
  Package, 
  Users, 
  CheckCircle, 
  ZapOff, 
  XCircle, 
  Trash2, 
  Star, 
  Plus,
  Wallet,
  CreditCard
} from 'lucide-react';
import { Appointment, BusinessHour } from '@/types/admin';
import { formatCurrency } from '@/lib/utils';

interface AppointmentsTabProps {
  t: (key: any) => string;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  viewMode: 'day' | 'week' | 'month';
  setViewMode: (mode: 'day' | 'week' | 'month') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  loading: boolean;
  appointments: Appointment[];
  filteredAppointments: Appointment[];
  businessHours: BusinessHour[];
  changeDate: (offset: number) => void;
  getDateDisplay: () => string;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  sendReviewEmail: (id: string) => Promise<void>;
  setManualModalOpen: (open: boolean) => void;
  setManualForm: (form: any) => void;
  setManualCategory: (category: 'service' | 'product') => void;
  setManualProfessionalId: (id: string | null) => void;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  getGridStatusColor: (status: string) => string;
}

const AppointmentsTab: React.FC<AppointmentsTabProps> = ({
  t,
  selectedDate,
  setSelectedDate,
  viewMode,
  setViewMode,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  loading,
  appointments,
  filteredAppointments,
  businessHours,
  changeDate,
  getDateDisplay,
  updateAppointmentStatus,
  deleteAppointment,
  sendReviewEmail,
  setManualModalOpen,
  setManualForm,
  setManualCategory,
  setManualProfessionalId,
  getStatusColor,
  getStatusLabel,
  getGridStatusColor,
}) => {
  const todayStr = (() => { 
    const d = new Date(); 
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` 
  })();

  const isDayClosed = (dayOfWeek: number) => {
    if (!businessHours || businessHours.length === 0) return false;
    const bh = businessHours.find((h: any) => h.day_of_week === dayOfWeek);
    return bh?.is_closed === true;
  };

  const getAptsAt = (dateStr: string, time: string) => {
    return appointments.filter(a => {
      if (a.appointment_date !== dateStr) return false;
      const aptTime = a.appointment_time.slice(0, 5);
      return aptTime === time;
    });
  };

  const isOccupied = (dateStr: string, time: string) => {
    const timeMin = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
    return appointments.some(a => {
      if (a.appointment_date !== dateStr) return false;
      const aptTime = a.appointment_time.slice(0, 5);
      const aptMin = parseInt(aptTime.split(':')[0]) * 60 + parseInt(aptTime.split(':')[1]);
      const aptEndMin = aptMin + (a.total_duration_minutes || 30);
      return aptMin < timeMin && timeMin < aptEndMin;
    });
  };

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

  const getRowSpan = (apt: Appointment) => Math.max(1, Math.ceil((apt.total_duration_minutes || 30) / 30));

  const handleCreateAppointment = () => {
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
  };

  const handleNewSale = () => {
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
  };

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
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {appointment.status === 'confirmed' && (
                          <>
                            <button onClick={() => updateAppointmentStatus(appointment.id, 'completed')} className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg" title={t('markCompleted')}><CheckCircle className="w-4 h-4" /></button>
                            <button onClick={() => updateAppointmentStatus(appointment.id, 'no_show')} className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg" title={t('noShow' as any)}><ZapOff className="w-4 h-4" /></button>
                            <button onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')} className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg" title={t('cancelAppointment')}><XCircle className="w-4 h-4" /></button>
                          </>
                        )}
                        <button onClick={handleCreateAppointment} className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg" title={t('manualPlan')}><Calendar className="w-4 h-4" /></button>
                        <button onClick={() => deleteAppointment(appointment.id)} className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg" title={t('delete')}><Trash2 className="w-4 h-4" /></button>
                        <button onClick={() => sendReviewEmail(appointment.id)} className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg" title={t('sendReviewEmail')}><Star className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div className="p-3 border-t flex items-center gap-2">
            <button onClick={handleCreateAppointment} className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 text-sm flex items-center"><Plus className="w-4 h-4 mr-1" />{t('createAppointment')}</button>
            <button onClick={handleNewSale} className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm flex items-center"><Package className="w-4 h-4 mr-1" />{t('newSale' as any)}</button>
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
                                  onClick={() => { setViewMode('day'); setSelectedDate(day.date) }}
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
                                        ) : (apts[0].payment_method === 'twint' || apts[0].payment_method === 'credit_card') ? (
                                          <CreditCard className="w-3 h-3 text-blue-600" />
                                        ) : (
                                          <Wallet className="w-3 h-3 text-gray-400" />
                                        )}
                                        {apts[0].is_paid && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                                      </div>
                                    </div>
                                  )}
                                  {getRowSpan(apts[0]) > 1 && (
                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                      {apts[0].appointment_time.slice(0, 5)} • {apts[0].total_duration_minutes}min • {formatCurrency(apts[0].total_price)}
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
              <button onClick={handleCreateAppointment} className="px-3 py-1.5 bg-pink-500 text-white rounded-lg hover:bg-pink-600 text-sm flex items-center"><Plus className="w-3 h-3 mr-1" />{t('createAppointment')}</button>
              <button onClick={handleNewSale} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm flex items-center"><Package className="w-3 h-3 mr-1" />{t('newSale' as any)}</button>
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
              const cells = []
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
  );
};

export default AppointmentsTab;
