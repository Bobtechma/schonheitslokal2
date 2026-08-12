import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { CheckCircle, Calendar, Clock, MapPin, Phone, Home, CreditCard, Wallet } from 'lucide-react'
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
  payment_method: string
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

  // Partner Order success handling
  const [partnerSessionId] = useState(() => {
    return new URLSearchParams(location.search).get('partner_session_id')
  })
  const [partnerOrder, setPartnerOrder] = useState<any | null>(null)
  const [partnerConfirming, setPartnerConfirming] = useState(false)
  const [partnerError, setPartnerError] = useState<string | null>(null)

  // ID can come from state (after immediate booking) or URL params (QR code link)
  const appointmentId = location.state?.appointmentId || params.id

  useEffect(() => {
    if (partnerSessionId) {
      confirmPartnerOrder()
    }
  }, [partnerSessionId])

  const confirmPartnerOrder = async () => {
    setPartnerConfirming(true)
    setPartnerError(null)
    try {
      // 1. Confirm session with backend
      const res = await fetch('/api/confirm-partner-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: partnerSessionId })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Erro ao confirmar pagamento')
      }

      // 2. Fetch order details from Supabase
      const { data: order, error } = await supabase
        .from('partner_orders')
        .select(`
          *,
          items:partner_order_items(
            quantity,
            price_at_time,
            product:services(*)
          )
        `)
        .or(`stripe_session_id_first.eq.${partnerSessionId},stripe_session_id_second.eq.${partnerSessionId}`)
        .maybeSingle()

      if (error) throw error
      if (!order) throw new Error('Pedido não encontrado')

      setPartnerOrder(order)
    } catch (err: any) {
      console.error(err)
      setPartnerError(err.message || 'Erro de processamento')
    } finally {
      setPartnerConfirming(false)
    }
  }

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
        payment_method: appointment.payment_method,
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
    paymentMethod: fetchedAppointment.payment_method,
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
    },
    paymentMethod: useBookingStore.getState().paymentMethod
  } : null

  if (partnerSessionId) {
    if (partnerConfirming) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-gray-700 font-medium">{t('confirming') || 'Confirmando pagamento...'}</p>
        </div>
      )
    }

    if (partnerError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-gray-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-red-600 font-bold">!</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {t('error') || 'Erro na Confirmação'}
            </h1>
            <p className="text-gray-600 mb-6">{partnerError}</p>
            <button
              onClick={confirmPartnerOrder}
              className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors w-full font-medium shadow-md hover:shadow-lg transition-transform transform active:scale-95"
            >
              {t('confirm') || 'Tentar Novamente'}
            </button>
          </div>
        </div>
      )
    }

    if (partnerOrder) {
      const isSecondPayment = partnerOrder.stripe_session_id_second === partnerSessionId
      const lang = useLanguageStore.getState().language
      const isPt = lang === 'pt-BR'

      return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 py-12 px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-8 text-center text-white relative">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                {isPt ? 'Pedido Confirmado!' : 'Bestellbestätigung'}
              </h1>
              <p className="text-white/85 mt-1 font-medium">
                {isPt ? 'Área de Parceiros Schönheits Lokal' : 'Partnerbereich Schönheits Lokal'}
              </p>
            </div>

            <div className="p-8 space-y-6">
              {/* Order ID & Status */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{t('orderId') || 'Número do Pedido'}</p>
                  <p className="text-lg font-bold text-gray-800">#{partnerOrder.id.slice(0, 8)}</p>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  isSecondPayment 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {isSecondPayment 
                    ? (isPt ? 'Totalmente Pago' : 'Vollständig bezahlt')
                    : (isPt ? 'Primeira Parcela Paga' : 'Anzahlung bezahlt')}
                </span>
              </div>

              {/* Items list */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  {t('selectedProducts') || 'Produtos Selecionados'}
                </h3>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50">
                  {partnerOrder.items?.map((item: any, idx: number) => {
                    const name = isPt 
                      ? (item.product?.name_pt || item.product?.name)
                      : (item.product?.name_de || item.product?.name)
                    return (
                      <div key={idx} className="flex justify-between items-center p-4">
                        <div>
                          <p className="font-semibold text-gray-800">{name}</p>
                          <p className="text-xs text-gray-500">
                            {isPt ? 'Qtd' : 'Menge'}: {item.quantity} × {formatCurrency(item.price_at_time)}
                          </p>
                        </div>
                        <p className="font-bold text-gray-900">
                          {formatCurrency(Number(item.price_at_time) * item.quantity)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(partnerOrder.original_total)}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-600 font-medium">
                  <span>{t('partnerDiscount') || 'Desconto de Parceiro'} ({partnerOrder.discount_pct}%)</span>
                  <span>-{formatCurrency(Number(partnerOrder.original_total) - Number(partnerOrder.discounted_total))}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-800 pt-2 border-t border-gray-200">
                  <span>Total com Desconto</span>
                  <span>{formatCurrency(partnerOrder.discounted_total)}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-200">
                  <div className="bg-white p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                      {isPt ? '1ª Parcela (50% Entrada)' : '1. Rate (50% Anzahlung)'}
                    </p>
                    <p className="text-lg font-bold text-pink-600 mt-1">
                      {formatCurrency(partnerOrder.amount_upfront)}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">
                      {isPt ? '✓ Pago' : '✓ Bezahlt'}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                      {isPt ? '2ª Parcela (30 Dias)' : '2. Rate (In 30 Tagen)'}
                    </p>
                    <p className="text-lg font-bold text-gray-800 mt-1">
                      {formatCurrency(partnerOrder.amount_due_30_days)}
                    </p>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      isSecondPayment ? 'text-emerald-600' : 'text-amber-500'
                    }`}>
                      {isSecondPayment 
                        ? (isPt ? '✓ Pago' : '✓ Bezahlt')
                        : (isPt ? '• Aguardando' : '• Ausstehend')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informational Footer */}
              {!isSecondPayment && (
                <div className="bg-pink-50/50 border border-pink-100 rounded-xl p-4 text-xs text-pink-800 leading-relaxed">
                  <p className="font-bold mb-1">
                    {isPt ? 'Segunda Parcela (50%) em 30 Dias' : 'Zweite Rate (50%) in 30 Tagen'}
                  </p>
                  <p>
                    {isPt 
                      ? 'Enviamos uma confirmação para seu e-mail contendo um link permanente de pagamento do saldo. Você poderá liquidar os 50% restantes a qualquer momento nos próximos 30 dias.' 
                      : 'Wir haben Ihnen eine Bestätigungs-E-Mail mit einem Zahlungslink für den Restbetrag gesendet. Sie können die restlichen 50% jederzeit innerhalb der nächsten 30 Tage bezahlen.'}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4">
                <Link
                  to="/"
                  className="flex items-center justify-center px-6 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 font-semibold shadow-md hover:shadow-lg transition-transform transform active:scale-95 w-full text-center"
                >
                  <Home className="w-5 h-5 mr-2" />
                  {t('backToHome') || 'Voltar para o Início'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

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
                
                {/* Payment Method */}
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 text-pink-500 mr-3 flex items-center justify-center">
                    {displayData.paymentMethod === 'credit_card' ? <CreditCard className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('paymentMethod' as any) || 'Método de Pagamento'}</p>
                    <p className="font-semibold text-gray-800">
                      {displayData.paymentMethod === 'credit_card' ? 
                        (t('payOnline' as any) || 'Pagar Online') : 
                        (t('paymentSalon' as any) || 'Pagar no Salão')}
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
                  <p className="font-medium">Kalkbreitstrasse 129, 8003 Zurich</p>
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