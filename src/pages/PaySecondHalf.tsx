import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useLanguageStore } from '@/stores/languageStore'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { 
  Loader2, 
  CreditCard, 
  Building, 
  CheckCircle, 
  AlertCircle,
  Home,
  ArrowRight,
  ShoppingBag
} from 'lucide-react'
import { toast } from 'sonner'

interface OrderDetails {
  id: string
  original_total: number
  discount_pct: number
  discounted_total: number
  amount_upfront: number
  amount_due_30_days: number
  status: 'pending' | 'paid_first' | 'fully_paid' | 'cancelled'
  payment_method: 'credit_card'
  created_at: string
}

export default function PaySecondHalf() {
  const location = useLocation()
  const { t, language } = useLanguageStore()
  
  const [orderId] = useState(() => {
    return new URLSearchParams(location.search).get('orderId')
  })

  interface OrderItem {
    quantity: number
    price_at_time: number
    product: {
      name: string
      name_pt?: string
      name_de?: string
    } | null
  }

  const [loadingOrder, setLoadingOrder] = useState(true)
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) {
      setErrorMsg(language === 'pt-BR' ? 'ID do pedido ausente na URL.' : 'Bestell-ID fehlt in der URL.')
      setLoadingOrder(false)
      return
    }

    const fetchOrderDetails = async () => {
      setLoadingOrder(true)
      setErrorMsg(null)
      try {
        // Fetch order from Supabase
        const { data: orderData, error: orderErr } = await supabase
          .from('partner_orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle()

        if (orderErr) throw orderErr
        if (!orderData) {
          setErrorMsg(language === 'pt-BR' ? 'Pedido não encontrado.' : 'Bestellung nicht gefunden.')
          return
        }

        setOrder(orderData)

        // Fetch items
        const { data: itemsData, error: itemsErr } = await supabase
          .from('partner_order_items')
          .select(`
            quantity,
            price_at_time,
            product:services(name, name_pt, name_de)
          `)
          .eq('order_id', orderId)

        if (itemsErr) throw itemsErr

        const formattedItems = (itemsData || []).map((item: any) => {
          const prodObj = Array.isArray(item.product) ? item.product[0] : item.product
          return {
            quantity: item.quantity,
            price_at_time: item.price_at_time,
            product: prodObj ? {
              name: prodObj.name,
              name_pt: prodObj.name_pt,
              name_de: prodObj.name_de
            } : null
          }
        })
        setOrderItems(formattedItems)

      } catch (err) {
        console.error('Error fetching order:', err)
        setErrorMsg(language === 'pt-BR' ? 'Erro ao carregar detalhes do pedido.' : 'Fehler beim Laden der Bestelldetails.')
      } finally {
        setLoadingOrder(false)
      }
    }

    fetchOrderDetails()
  }, [orderId, language])

  const handlePaySecondHalf = async () => {
    if (!orderId) return
    setSubmittingPayment(true)
    try {
      const res = await fetch('/api/create-second-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId })
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to create checkout session')

      if (result.sessionUrl) {
        window.location.href = result.sessionUrl
      } else {
        throw new Error('No redirect URL returned')
      }
    } catch (err) {
      console.error(err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      toast.error(
        language === 'pt-BR' 
          ? `Falha ao iniciar pagamento: ${errorMessage}` 
          : `Zahlungsfehler: ${errorMessage}`
      )
    } finally {
      setSubmittingPayment(false)
    }
  }

  if (loadingOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex flex-col items-center justify-center pt-20">
        <Loader2 className="w-12 h-12 text-pink-500 animate-spin mb-4" />
        <p className="text-gray-700 font-medium">{t('loading') || 'Carregando pedido...'}</p>
      </div>
    )
  }

  const isPt = language === 'pt-BR'

  if (errorMsg || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-gray-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {isPt ? 'Erro' : 'Fehler'}
          </h1>
          <p className="text-gray-600 mb-6">{errorMsg || (isPt ? 'Pedido Inválido' : 'Ungültige Bestellung')}</p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 font-semibold shadow-md w-full"
          >
            <Home className="w-5 h-5 mr-2" />
            {t('backToHome')}
          </Link>
        </div>
      </div>
    )
  }

  // Double check status rules
  if (order.status === 'fully_paid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-gray-200">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {isPt ? 'Pedido Quitado!' : 'Bereits bezahlt!'}
          </h1>
          <p className="text-gray-600 mb-6">
            {isPt 
              ? 'Este pedido já foi totalmente quitado e pago.' 
              : 'Diese Bestellung ist bereits vollständig bezahlt.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 font-semibold shadow-md w-full"
          >
            <Home className="w-5 h-5 mr-2" />
            {t('backToHome')}
          </Link>
        </div>
      </div>
    )
  }

  if (order.status !== 'paid_first') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-gray-200">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {isPt ? 'Status Inválido' : 'Ungültiger Status'}
          </h1>
          <p className="text-gray-600 mb-6">
            {isPt 
              ? `O pagamento inicial de 50% deste pedido ainda não foi confirmado (Status atual: ${order.status}). Por favor, efetue ou aguarde a compensação do primeiro pagamento.` 
              : `Die erste Rate für diese Bestellung wurde noch nicht bestätigt (Aktueller Status: ${order.status}). Bitte warten Sie auf die Bestätigung der Anzahlung.`}
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 font-semibold shadow-md w-full"
          >
            <Home className="w-5 h-5 mr-2" />
            {t('backToHome')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-28 pb-16 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Banner header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 border border-white/30">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {isPt ? 'Pagar Segunda Parcela (50%)' : 'Restzahlung leisten (50%)'}
          </h1>
          <p className="text-white/80 mt-1 text-sm font-medium">
            {isPt ? `Pedido #${order.id.slice(0, 8)}` : `Bestellung #${order.id.slice(0, 8)}`}
          </p>
        </div>

        <div className="p-8 space-y-6">
          {/* Summary of Items */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center">
              <ShoppingBag className="w-4 h-4 mr-1.5" />
              {isPt ? 'Produtos do Pedido' : 'Bestellte Produkte'}
            </h3>
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50 text-sm">
              {orderItems.map((item, idx) => {
                const name = isPt 
                  ? (item.product?.name_pt || item.product?.name)
                  : (item.product?.name_de || item.product?.name)
                return (
                  <div key={idx} className="flex justify-between items-center p-3">
                    <span className="font-medium text-gray-700">{name} <span className="text-gray-400">×{item.quantity}</span></span>
                    <span className="font-semibold text-gray-800">{formatCurrency(item.price_at_time * item.quantity)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Payment History breakdown */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-3.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>{isPt ? 'Total com desconto' : 'Total mit Rabatt'}</span>
              <span className="font-semibold text-gray-800">{formatCurrency(order.discounted_total)}</span>
            </div>
            
            <div className="flex justify-between items-center text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
              <span>{isPt ? '1ª Parcela (50% Entrada)' : '1. Rate (50% Anzahlung)'}</span>
              <div className="flex items-center space-x-1.5">
                <span>{formatCurrency(order.amount_upfront)}</span>
                <span className="text-[10px] uppercase font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded">✓ {isPt ? 'PAGO' : 'BEZAHLT'}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-gray-900 font-bold border-t border-gray-200 pt-3 text-base">
              <span>{isPt ? 'Saldo a Pagar (50%)' : 'Restbetrag (50%)'}</span>
              <span className="text-pink-600 text-lg">{formatCurrency(order.amount_due_30_days)}</span>
            </div>
          </div>

          {/* Payment Method Selected */}
          <div className="border border-gray-200 rounded-xl p-4 flex items-center space-x-3.5 bg-gray-50/30">
            <CreditCard className="w-8 h-8 text-pink-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">
                {isPt ? 'Forma de Cobrança' : 'Zahlungsmethode'}
              </p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">
                {isPt ? 'Cartão de Crédito / Twint (CHF)' : 'Kreditkarte / Twint (CHF)'}
              </p>
            </div>
          </div>

          {/* Pay Balance Button */}
          <div className="pt-2">
            <button
              onClick={handlePaySecondHalf}
              disabled={submittingPayment}
              className="w-full py-4 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center transform active:scale-[0.98]"
            >
              {submittingPayment ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t('redirecting')}
                </>
              ) : (
                <>
                  <span>
                    {isPt 
                      ? `Pagar Saldo Agora (${formatCurrency(order.amount_due_30_days)})` 
                      : `Saldo jetzt bezahlen (${formatCurrency(order.amount_due_30_days)})`}
                  </span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
