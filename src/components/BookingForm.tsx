import { useState, useEffect, useCallback } from 'react'
import { Calendar, Clock, User, CheckCircle, ArrowRight, ArrowLeft, Ban } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useBookingStore } from '@/stores/bookingStore'
import { useLanguageStore } from '@/stores/languageStore'
import { Service, Tables } from '@/lib/supabase'
import { formatCurrency, getDurationText } from '@/lib/utils'
import { sendBookingConfirmation } from '@/lib/email'
import ClientSearch from './ClientSearch'
import "react-datepicker/dist/react-datepicker.css"

export default function BookingForm({ onComplete }: { onComplete?: (appointmentId: string) => void }) {
  const {
    services,
    setServices,
    selectedServices,
    setSelectedServices,
    step,
    setStep,
    totalPrice,
    totalDuration,
    bookingPaused,
    setBookingPaused,
    promoStorePct,
    promoPerService
  } = useBookingStore()

  const [loading, setLoading] = useState(true)
  const { t } = useLanguageStore()

  const applyPrice = useCallback((service: Service) => {
    let discount = 0
    if (promoPerService && promoPerService[service.id]) {
      discount = promoPerService[service.id]
    } else if (promoStorePct) {
      discount = promoStorePct
    }

    if (discount > 0) {
      return service.price * (1 - discount / 100)
    }
    return service.price
  }, [promoStorePct, promoPerService])

  useEffect(() => {
    loadServices()
    loadPromotions()
    checkBookingStatus()
  }, [])

  const loadServices = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true })

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      toast.error(t('loadServicesError'))
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPromotions = async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key,value')
      .or('key.eq.store_discount_pct,key.like.service_discount_pct_%')
    if (error) return
    type SettingRow = Pick<Tables<'system_settings'>, 'key' | 'value'>
    const rows = (data || []) as SettingRow[]
    const store = rows.find((r) => r.key === 'store_discount_pct')
    const promoStorePct = store && store.value != null ? Number(store.value) : 0
    const svcRows = rows.filter((r) => r.key.startsWith('service_discount_pct_'))
    const promoPerService: Record<string, number> = {}
    for (const r of svcRows) {
      const sid = r.key.replace('service_discount_pct_', '')
      promoPerService[sid] = r.value != null ? Number(r.value) : 0
    }
    useBookingStore.getState().setPromotions({ promoStorePct, promoPerService })
  }

  const checkBookingStatus = async () => {
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'booking_paused')
      .single()

    if (data && data.value === 'true') {
      setBookingPaused(true)
    }
  }

  const handleServiceToggle = (service: Service) => {
    const isSelected = selectedServices.some(s => s.id === service.id)
    let newServices: Service[]

    if (isSelected) {
      newServices = selectedServices.filter(s => s.id !== service.id)
    } else {
      newServices = [...selectedServices, service]
    }

    setSelectedServices(newServices)
  }

  const handleNext = () => {
    if (step === 1 && selectedServices.length === 0) {
      toast.error(t('selectServiceError'))
      return
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  if (bookingPaused) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
          <Ban className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Buchungen pausiert</h2>
          <p className="text-gray-600">Momentan nehmen wir keine neuen Online-Buchungen entgegen. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns telefonisch.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= stepNumber
                ? 'bg-pink-500 text-white'
                : 'bg-gray-200 text-gray-600'
                }`}>
                {step > stepNumber ? <CheckCircle className="w-5 h-5" /> : stepNumber}
              </div>
              {stepNumber < 4 && (
                <div className={`w-24 h-1 mx-2 ${step > stepNumber ? 'bg-pink-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>{t('step1')}</span>
          <span>{t('step2')}</span>
          <span>{t('step3')}</span>
          <span>{t('step4')}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-pink-500" />
              {t('selectServices')}
            </h2>

            {services.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{t('noServices')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedServices.some(s => s.id === service.id)
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
                      }`}
                    onClick={() => handleServiceToggle(service)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-800">{service.name}</h3>
                      <span className="text-pink-600 font-bold">
                        {formatCurrency(applyPrice(service))}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{service.description}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {getDurationText(service.duration_minutes)}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <span className="bg-gray-100 px-2 py-1 rounded">{service.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedServices.length > 0 && (
              <div className="mt-6 p-4 bg-pink-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">{t('bookingSummary')}</h4>
                <div className="space-y-1">
                  {selectedServices.map((service) => (
                    <div key={service.id} className="flex justify-between text-sm">
                      <span>{service.name}</span>
                      <span>{formatCurrency(applyPrice(service))}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>{t('total')}</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{t('totalDuration')}</span>
                    <span>{getDurationText(totalDuration)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && <DateTimeSelection />}
        {step === 3 && <ClientInfoForm />}
        {step === 4 && <BookingConfirmation onComplete={onComplete} />}
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={handleBack}
          disabled={step === 1}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('back')}
        </button>

        {step < 4 && (
          <button
            onClick={handleNext}
            className="flex items-center px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            {t('next')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        )}
      </div>
    </div>
  )
}

function DateTimeSelection() {
  const { selectedDate, selectedTime, setSelectedDate, setSelectedTime, totalDuration } = useBookingStore()
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { t } = useLanguageStore()

  // Get today's date in YYYY-MM-DD format for min attribute
  const getTodayString = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const fetchAvailableTimes = useCallback(async () => {
    if (!selectedDate) return

    setLoading(true)
    try {
      const [year, month, day] = selectedDate.split('-').map(Number)
      const dateObj = new Date(year, month - 1, day)
      const dayOfWeek = dateObj.getDay()

      // Check if date is manually blocked
      const { data: blockedDate } = await supabase
        .from('blocked_dates')
        .select('id')
        .eq('date', selectedDate)
        .maybeSingle()

      if (blockedDate) {
        setAvailableTimes([])
        setLoading(false)
        return
      }

      const { data: businessHours } = await supabase
        .from('business_hours')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .single()

      if (businessHours?.is_closed) {
        setAvailableTimes([])
        setLoading(false)
        return
      }

      const openTime = businessHours?.open_time?.slice(0, 5) || '09:00'
      const closeTime = businessHours?.close_time?.slice(0, 5) || '18:00'

      const { data: appointments } = await supabase
        .from('appointments')
        .select('appointment_time, total_duration_minutes')
        .eq('appointment_date', selectedDate)
        .neq('status', 'cancelled')
        .neq('status', 'no_show')
        .order('appointment_time')

      const allTimes = generateTimeSlots(openTime, closeTime, 30)
      const availableTimes = allTimes.filter(time => {
        const slotStart = new Date(`2000-01-01T${time}`)
        const slotEnd = new Date(slotStart)
        slotEnd.setMinutes(slotEnd.getMinutes() + totalDuration)

        const closing = new Date(`2000-01-01T${closeTime}`)
        if (slotEnd > closing) return false

        const hasConflict = appointments?.some(apt => {
          const aptStart = new Date(`2000-01-01T${apt.appointment_time}`)
          const aptEnd = new Date(aptStart)
          aptEnd.setMinutes(aptEnd.getMinutes() + apt.total_duration_minutes)
          return (slotStart < aptEnd && slotEnd > aptStart)
        })

        return !hasConflict
      })

      setAvailableTimes(availableTimes)
    } catch (error) {
      console.error('Error fetching available times:', error)
      toast.error(t('loadTimesError'))
    } finally {
      setLoading(false)
    }
  }, [selectedDate, totalDuration, t])

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableTimes()
    }
  }, [selectedDate, fetchAvailableTimes])

  const generateTimeSlots = (startTime: string, endTime: string, interval: number = 30): string[] => {
    const slots: string[] = []
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)

    while (start < end) {
      const timeString = start.toTimeString().slice(0, 5)
      slots.push(timeString)
      start.setMinutes(start.getMinutes() + interval)
    }

    return slots
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('bookingDate')}
        </label>
        <div className="w-full p-4 bg-gray-50 rounded-lg border border-gray-200">
          <input
            type="date"
            value={selectedDate || ''}
            min={getTodayString()}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white shadow-sm"
            required
          />
          <p className="mt-2 text-sm text-gray-500">
            {t('selectDateFirst')}
          </p>
        </div>
      </div>

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('availableTime')}
        </label>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 min-h-[380px]">
          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
              <Calendar className="w-12 h-12 mb-3 opacity-50" />
              <p>{t('selectDateFirst') || 'Bitte Datum wählen'}</p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mb-3"></div>
              <p className="text-gray-500 text-sm">Laden...</p>
            </div>
          ) : availableTimes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
              <Clock className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-center px-4">{t('noTimesAvailable')}</p>
              <p className="text-xs text-center mt-2 text-gray-400">{t('selectAnotherDate')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {availableTimes.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`
                    px-3 py-3 text-sm font-medium rounded-lg border transition-all duration-200
                    flex items-center justify-center
                    ${selectedTime === time
                      ? 'bg-pink-500 text-white border-pink-500 ring-2 ring-pink-200'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-pink-300 hover:bg-pink-50'
                    }
                  `}
                >
                  <Clock className={`w-3.5 h-3.5 mr-2 ${selectedTime === time ? 'text-white' : 'text-gray-400'}`} />
                  {time}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ClientInfoForm() {
  const { clientInfo, setClientInfo, termsAccepted, setTermsAccepted } = useBookingStore()
  const { t } = useLanguageStore()

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <User className="w-6 h-6 mr-2 text-pink-500" />
        {t('clientData')}
      </h2>

      <div className="mb-6">
        <ClientSearch
          onSelect={(client) => {
            setClientInfo({
              fullName: client.full_name,
              email: client.email || '',
              phone: client.phone || '',
              birthDate: client.birth_date || '',
              gender: client.gender || '',
              allergies: client.allergies || '',
              preferences: client.preferences || ''
            })
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('fullName')}
          </label>
          <input
            type="text"
            value={clientInfo.fullName}
            onChange={(e) => setClientInfo({ fullName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('email')}
          </label>
          <input
            type="email"
            value={clientInfo.email}
            onChange={(e) => setClientInfo({ email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('phoneLabel')}
          </label>
          <input
            type="tel"
            value={clientInfo.phone}
            onChange={(e) => setClientInfo({ phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('birthDate')}
          </label>
          <input
            type="date"
            value={clientInfo.birthDate}
            onChange={(e) => setClientInfo({ birthDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('gender')}
          </label>
          <select
            value={clientInfo.gender}
            onChange={(e) => setClientInfo({ gender: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="">{t('select')}</option>
            <option value="feminino">{t('female')}</option>
            <option value="masculino">{t('male')}</option>
            <option value="outro">{t('other')}</option>
            <option value="prefiro_nao_dizer">{t('preferNotToSay')}</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('allergies')}
          </label>
          <textarea
            value={clientInfo.allergies}
            onChange={(e) => setClientInfo({ allergies: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            rows={3}
            placeholder={t('allergiesPlaceholder')}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('preferences')}
          </label>
          <textarea
            value={clientInfo.preferences}
            onChange={(e) => setClientInfo({ preferences: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            rows={3}
          />
        </div>

        <div className="md:col-span-2 flex items-center">
          <input
            type="checkbox"
            id="terms"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
            {t('termsAccept')}
          </label>
        </div>
      </div>
    </div>
  )
}

function BookingConfirmation({ onComplete }: { onComplete?: (appointmentId: string) => void }) {
  const {
    selectedServices,
    selectedDate,
    selectedTime,
    totalPrice,
    totalDuration,
    clientInfo,
    termsAccepted,
    resetBooking
  } = useBookingStore()
  const [loading, setLoading] = useState(false)
  const { t, language } = useLanguageStore()

  const handleConfirmBooking = async () => {
    if (!termsAccepted) {
      toast.error(t('termsAccept'))
      return
    }

    setLoading(true)
    console.log('Starting booking confirmation process...')
    try {
      const sanitize = (val: string | null | undefined) => {
        if (!val) return null
        const trimmed = val.trim()
        return trimmed === '' ? null : trimmed
      }

      console.log('Fetching current user...')
      const { data: currentUser } = await supabase.auth.getUser()

      console.log('Checking for existing clients with email:', clientInfo.email, 'or phone:', clientInfo.phone)

      const { data: existingClients, error: searchError } = await supabase
        .from('clients')
        .select('id')
        .or(`email.eq."${clientInfo.email}",phone.eq."${clientInfo.phone}"`)
        .limit(1)

      if (searchError) {
        console.error('Error searching for existing clients:', searchError)
        throw searchError
      }

      let clientId: string

      if (existingClients && existingClients.length > 0) {
        console.log('Existing client found, updating...')
        clientId = existingClients[0].id
        const { error: updateError } = await supabase
          .from('clients')
          .update({
            full_name: clientInfo.fullName,
            phone: clientInfo.phone,
            birth_date: sanitize(clientInfo.birthDate),
            gender: sanitize(clientInfo.gender),
            allergies: sanitize(clientInfo.allergies),
            preferences: sanitize(clientInfo.preferences),
            updated_at: new Date().toISOString()
          })
          .eq('id', clientId)

        if (updateError) {
          console.error('Error updating client:', updateError)
          throw updateError
        }
      } else {
        console.log('Creating new client...')
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert([{
            user_id: currentUser.user?.id || null,
            full_name: clientInfo.fullName,
            email: clientInfo.email,
            phone: clientInfo.phone,
            birth_date: sanitize(clientInfo.birthDate),
            gender: sanitize(clientInfo.gender),
            allergies: sanitize(clientInfo.allergies),
            preferences: sanitize(clientInfo.preferences),
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (clientError) {
          console.error('Error creating client:', clientError)
          throw clientError
        }
        clientId = newClient.id
      }

      const normalizeDate = (d: string) => d?.slice(0, 10)
      const normalizeTime = (t: string) => (t?.length === 5 ? `${t}:00` : t)

      console.log('Creating appointment...')
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert([{
          client_id: clientId,
          user_id: currentUser.user?.id || null,
          appointment_date: normalizeDate(selectedDate!),
          appointment_time: normalizeTime(selectedTime!),
          total_duration_minutes: totalDuration,
          total_price: totalPrice,
          status: 'confirmed'
        }])
        .select()
        .single()

      if (appointmentError) {
        console.error('Error creating appointment:', appointmentError)
        throw appointmentError
      }

      console.log('Adding services to appointment...')
      const appointmentServices = selectedServices.map((service, index) => ({
        appointment_id: appointment.id,
        service_id: service.id,
        price_at_time: service.price,
        duration_at_time: service.duration_minutes,
        order_index: index
      }))

      const { error: servicesError } = await supabase
        .from('appointment_services')
        .insert(appointmentServices)

      if (servicesError) {
        console.error('Error adding services:', servicesError)
        throw servicesError
      }

      console.log('Sending confirmation email...')
      const emailData = {
        clientName: clientInfo.fullName,
        clientEmail: clientInfo.email,
        appointmentDate: selectedDate!,
        appointmentTime: selectedTime!,
        appointmentId: appointment.id,
        services: selectedServices.map(s => ({ name: s.name, price: s.price })),
        totalPrice: totalPrice,
        language: language
      }

      const emailSuccess = await sendBookingConfirmation(emailData)

      if (!emailSuccess) {
        console.warn('Email sending failed')
        toast.warning(t('emailError') || 'Booking confirmed, but email sending failed.')
      } else {
        console.log('Email sent successfully')
      }

      toast.success(t('bookingSuccess'))
      resetBooking()
      onComplete?.(appointment.id)

    } catch (error) {
      console.error('Error confirming booking:', error)
      if (typeof error === 'object' && error !== null && 'message' in error) {
        toast.error(`Error: ${(error as any).message}`)
      } else {
        toast.error(t('bookingError'))
      }
      setLoading(false)
    }
  }

  return (
    <div className="text-center py-12">
      {loading ? (
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-gray-600">{t('processingBooking')}</p>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md mx-auto">
          <h3 className="text-xl font-bold mb-4">{t('confirmBookingTitle')}</h3>
          <div className="space-y-4 text-left mb-6">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">{t('services')}:</span>
              <span className="font-medium">{selectedServices.map(s => s.name).join(', ')}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">{t('date')}:</span>
              <span className="font-medium">{selectedDate}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">{t('time')}:</span>
              <span className="font-medium">{selectedTime}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2">
              <span>{t('total')}:</span>
              <span className="text-pink-600">{formatCurrency(totalPrice)}</span>
            </div>
          </div>
          <button
            onClick={handleConfirmBooking}
            className="w-full bg-pink-500 text-white py-3 rounded-lg font-semibold hover:bg-pink-600 transition-colors"
          >
            {t('confirmBooking')}
          </button>
        </div>
      )}
    </div>
  )
}