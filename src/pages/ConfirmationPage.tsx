import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { CheckCircle, Calendar, Clock, MapPin, Phone, Home } from 'lucide-react'
import { formatCurrency, formatDate, formatTime, getDurationText } from '@/lib/utils'
import { useBookingStore } from '@/stores/bookingStore'
import { useLanguageStore } from '@/stores/languageStore'
import { QRCodeCanvas } from 'qrcode.react'
import { supabase } from '@/lib/supabase'
import type { Service } from '@/lib/supabase'

interface AppointmentDetails {
  id: string
  appointment_date: string
  appointment_time: string
  total_duration_minutes: number
  total_price: number
  client: {
    full_name: string
    email: string
    phone: string
  }
  services: (Service & { price_at_time: number })[]
}

export default function ConfirmationPage() {
  const { selectedServices, selectedDate, selectedTime, totalPrice, totalDuration, clientInfo } = useBookingStore()
  const [countdown, setCountdown] = useState(10)
  const [fetchedAppointment, setFetchedAppointment] = useState<AppointmentDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const location = useLocation()
  const params = useParams()
  const { t } = useLanguageStore()

  // ID can come from state (after immediate booking) or URL params (QR code link)
  const appointmentId = location.state?.appointmentId || params.id

  useEffect(() => {
    // Only fetch if we have an ID but no store data (or if we're accessing via direct link)
    if (appointmentId && (!selectedDate || params.id)) {
      fetchAppointmentDetails()
    }
  }, [appointmentId, params.id])

  useEffect(() => {
    // Only run countdown if we just booked (have state)
    if (location.state?.appointmentId) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [location.state])

  const fetchAppointmentDetails = async () => {
    if (!appointmentId) return

    setLoading(true)
    try {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select(`
          *,
          client:clients(*),
          appointment_services(
            price_at_time,
            service:services(*)
          )
        `)
        .eq('id', appointmentId)
        .single()

      if (error) throw error

      // Transform data to match our interface
      const services = appointment.appointment_services.map((as: any) => ({
        ...as.service,
        price_at_time: as.price_at_time
      }))

      setFetchedAppointment({
        id: appointment.id,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        total_duration_minutes: appointment.total_duration_minutes,
        total_price: appointment.total_price,
        client: appointment.client,
        services: services
      })
    } catch (error) {
      console.error('Error fetching appointment:', error)
    } finally {
      setLoading(false)
    }
  }

  // Determine which data to show: Store data (immediate) or Fetched data (persistent)
  const displayData = fetchedAppointment ? {
    date: fetchedAppointment.appointment_date,
    time: fetchedAppointment.appointment_time.slice(0, 5),
    duration: fetchedAppointment.total_duration_minutes,
    price: fetchedAppointment.total_price,
    services: fetchedAppointment.services,
    client: fetchedAppointment.client
  } : (selectedDate && selectedTime) ? {
    date: selectedDate,
    time: selectedTime,
    duration: totalDuration,
    price: totalPrice,
    services: selectedServices,
    client: {
      full_name: clientInfo.fullName,
      email: clientInfo.email,
      phone: clientInfo.phone
    }
  } : null

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  // If no data found at all
  if (!displayData && !appointmentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {t('noBookingFound') || 'Nenhuma reserva encontrada'}
            </h1>
            <p className="text-gray-600 mb-6">
              {t('noBookingMessage') || 'Parece que você não tem uma reserva recente.'}
            </p>
            <Link
              to="/agendar"
              className="inline-flex items-center px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              <Calendar className="w-5 h-5 mr-2" />
              {t('createNewBooking') || 'Criar Nova Reserva'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const qrCodeUrl = `${window.location.origin}/confirmacao/${appointmentId}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Message - Only show if we just booked (have state) */}
          {location.state?.appointmentId && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {t('bookingConfirmed') || 'Reserva Confirmada!'}
                </h1>
                <p className="text-gray-600">
                  {t('bookingConfirmedMessage') || 'Sua reserva foi realizada com sucesso. Você receberá um e-mail de confirmação em breve.'}
                </p>
              </div>

              {/* QR Code */}
              {appointmentId && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <p className="text-sm text-gray-600 mb-4">
                    {t('showQrCode') || 'Apresente este código no dia do seu agendamento:'}
                  </p>
                  <div className="flex flex-col items-center justify-center mx-auto">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <QRCodeCanvas value={qrCodeUrl} size={150} />
                    </div>
                    <p className="mt-2 text-xs text-gray-500 font-mono">{appointmentId}</p>
                  </div>
                </div>
              )}

              {/* Countdown */}
              <div className="bg-pink-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">
                  {t('redirectingHome') || 'Redirecionando para a página inicial em'} {countdown}s...
                </p>
                <div className="w-full bg-pink-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-pink-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${((10 - countdown) / 10) * 100}%` }}
                  />
                </div>
              </div>

              <Link
                to="/"
                className="inline-flex items-center px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                {t('backToHome') || 'Voltar para o Início'}
              </Link>
            </div>
          )}

          {/* Booking Details - Show if we have data (either from store or fetch) */}
          {displayData && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {t('bookingDetails') || 'Detalhes da Reserva'}
              </h2>

              <div className="space-y-6">
                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <Calendar className="w-6 h-6 text-pink-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">{t('date') || 'Data'}</p>
                      <p className="font-semibold text-gray-800">
                        {formatDate(displayData.date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <Clock className="w-6 h-6 text-pink-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">{t('time') || 'Horário'}</p>
                      <p className="font-semibold text-gray-800">
                        {formatTime(displayData.time)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Duration and Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <Clock className="w-6 h-6 text-pink-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">{t('duration') || 'Duração'}</p>
                      <p className="font-semibold text-gray-800">
                        {getDurationText(displayData.duration)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 text-pink-500 mr-3 font-bold">R$</div>
                    <div>
                      <p className="text-sm text-gray-600">{t('total') || 'Total'}</p>
                      <p className="font-semibold text-gray-800">
                        {formatCurrency(displayData.price)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">{t('selectedServices') || 'Serviços Selecionados'}</h3>
                  <div className="space-y-2">
                    {displayData.services.map((service) => (
                      <div key={service.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{service.name}</p>
                          <p className="text-sm text-gray-600">{getDurationText(service.duration_minutes)}</p>
                        </div>
                        <p className="font-semibold text-pink-600">
                          {formatCurrency('price_at_time' in service ? (service as any).price_at_time : applyPrice(service))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Client Info */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">{t('clientData') || 'Dados do Cliente'}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('fullName')?.replace('*', '') || 'Nome'}:</span>
                      <span className="font-medium">{displayData.client.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('email')?.replace('*', '') || 'E-mail'}:</span>
                      <span className="font-medium">{displayData.client.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('phoneLabel')?.replace('*', '') || 'Telefone'}:</span>
                      <span className="font-medium">{displayData.client.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {t('contactInfo') || 'Informações de Contato'}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-pink-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">{t('phone') || 'Telefone'}</p>
                  <p className="font-medium">077 816 29 33</p>
                </div>
              </div>
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-pink-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">{t('address') || 'Endereço'}</p>
                  <p className="font-medium">Sternenstrasse 21, 8002 Zürich</p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mt-8">
            <h3 className="font-semibold text-amber-800 mb-2">{t('important') || 'Importante'}</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• {t('arriveEarly') || 'Chegue 10 minutos antes do horário agendado'}</li>
              <li>• {t('cancellationPolicy') || 'Cancelamentos devem ser feitos com 24h de antecedência'}</li>
              <li>• {t('bringId') || 'Traga um documento de identificação'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function applyPrice(service: Service) {
  const { promoStorePct, promoPerService } = useBookingStore.getState()
  const perSvc = promoPerService[service.id] || 0
  const pct = Math.max(perSvc, promoStorePct)
  return Math.max(0, Math.round(service.price * (1 - pct / 100) * 100) / 100)
}