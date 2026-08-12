import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { 
  Search, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  FileText, 
  Check, 
  Loader2, 
  AlertTriangle, 
  CreditCard,
  Building,
  ArrowRight,
  TrendingUp,
  Percent,
  Clock,
  Sparkles,
  UserCheck
} from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  name_pt?: string
  name_de?: string
  price: number
  image_url?: string
  description?: string
  description_pt?: string
  description_de?: string
  stock?: number
}

interface CartItem {
  product: Product
  quantity: number
}

export default function PartnerArea() {
  const { isAuthenticated, user } = useAuthStore()
  const { t, language } = useLanguageStore()
  const navigate = useNavigate()

  // Loading States
  const [loadingData, setLoadingData] = useState(true)
  const [submittingCheckout, setSubmittingCheckout] = useState(false)
  const [submittingRequest, setSubmittingRequest] = useState(false)

  // Data States
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])

  // Settings
  const [discountPct, setDiscountPct] = useState(30)
  const [minOrderAmount, setMinOrderAmount] = useState(100.00)
  const [contractDe, setContractDe] = useState('')
  const [contractPt, setContractPt] = useState('')

  // Form States
  const [contractLanguage, setContractLanguage] = useState<'de' | 'pt'>('de')
  const [contractAccepted, setContractAccepted] = useState(false)

  // Visitor Request Form States
  const [salonName, setSalonName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [requestEmail, setRequestEmail] = useState('')
  const [requestPhone, setRequestPhone] = useState('')
  const [requestNotes, setRequestNotes] = useState('')
  const [requestSuccess, setRequestSuccess] = useState(false)

  // Calculator State
  const [salesSlider, setSalesSlider] = useState(1500)

  // Acesso ao catálogo para parceiros aprovados
  const [showCatalog, setShowCatalog] = useState(false)

  const isPt = language === 'pt-BR'
  const isPartner = isAuthenticated && (user?.role === 'partner' || user?.role === 'admin' || user?.role === 'owner')

  // Set default contract language based on user interface language
  useEffect(() => {
    setContractLanguage(language === 'pt-BR' ? 'pt' : 'de')
  }, [language])

  // Fetch products (if partner) and system settings (always)
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true)
      try {
        // 1. Fetch system settings (accessible to all authenticated or public)
        const { data: settingsData, error: settingsError } = await supabase
          .from('system_settings')
          .select('key, value')
          .in('key', [
            'partner_discount_pct',
            'partner_min_order_amount',
            'partner_contract_text_de',
            'partner_contract_text_pt'
          ])

        if (!settingsError && settingsData) {
          const settingsMap = settingsData.reduce((acc: Record<string, string>, curr: { key: string; value: string }) => {
            acc[curr.key] = curr.value
            return acc
          }, {} as Record<string, string>)

          if (settingsMap.partner_discount_pct) setDiscountPct(Number(settingsMap.partner_discount_pct))
          if (settingsMap.partner_min_order_amount) setMinOrderAmount(Number(settingsMap.partner_min_order_amount))
          if (settingsMap.partner_contract_text_de) setContractDe(settingsMap.partner_contract_text_de)
          if (settingsMap.partner_contract_text_pt) setContractPt(settingsMap.partner_contract_text_pt)
        }

        // 2. Fetch products only if logged in as partner/admin
        if (isPartner) {
          const { data: prodData, error: prodError } = await supabase
            .from('services')
            .select('*')
            .eq('category', 'product')
            .eq('active', true)
            .order('name', { ascending: true })

          if (prodError) throw prodError
          setProducts(prodData || [])
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        toast.error(isPt ? 'Erro ao carregar dados da parceria.' : 'Fehler beim Laden der Partnerdaten.')
      } finally {
        setLoadingData(false)
      }
    }

    fetchData()
  }, [isPartner, language])

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id)
      if (existing) {
        return prevCart.map((item) => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prevCart, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta
          return newQty > 0 ? { ...item, quantity: newQty } : null
        }
        return item
      }).filter(Boolean) as CartItem[]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
  }

  // Calculations
  const originalSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
  const discountAmount = originalSubtotal * (discountPct / 100)
  const discountedTotal = originalSubtotal - discountAmount
  const amountUpfront = discountedTotal * 0.5
  const amountRemaining = discountedTotal * 0.5

  const isMinOrderMet = originalSubtotal >= minOrderAmount

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const name = isPt ? (p.name_pt || p.name) : (p.name_de || p.name)
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Submit Partner Application Form (Visitor)
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!salonName.trim() || !ownerName.trim() || !requestEmail.trim() || !requestPhone.trim()) {
      toast.error(isPt ? 'Preencha todos os campos obrigatórios.' : 'Bitte füllen Sie alle Pflichtfelder aus.')
      return
    }

    setSubmittingRequest(true)
    try {
      const { error } = await supabase
        .from('partner_requests')
        .insert({
          user_id: user?.id || null,
          salon_name: salonName,
          owner_name: ownerName,
          email: requestEmail,
          phone: requestPhone,
          notes: requestNotes,
          status: 'pending'
        })

      if (error) throw error
      setRequestSuccess(true)
      toast.success(isPt ? 'Cadastro enviado com sucesso!' : 'Bewerbung erfolgreich abgesendet!')
    } catch (err: any) {
      console.error('Error submitting request:', err)
      toast.error(isPt ? `Erro ao enviar solicitação: ${err.message}` : `Fehler beim Senden: ${err.message}`)
    } finally {
      setSubmittingRequest(false)
    }
  }

  // Handle Checkout Redirect
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error(isPt ? 'Seu carrinho está vazio!' : 'Ihr Warenkorb ist leer!')
      return
    }

    if (!isMinOrderMet) {
      toast.error(
        isPt 
          ? `O valor mínimo original do pedido (${formatCurrency(minOrderAmount)}) não foi atingido.` 
          : `Mindestbestellwert (${formatCurrency(minOrderAmount)}) nicht erreicht.`
      )
      return
    }

    if (!contractAccepted) {
      toast.error(
        isPt
          ? 'Você deve ler e aceitar o contrato de parceria para prosseguir.'
          : 'Sie müssen den Partnerschaftsvertrag lesen und akzeptieren, um fortzufahren.'
      )
      return
    }

    setSubmittingCheckout(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const res = await fetch('/api/create-partner-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          items: cart.map(item => ({ id: item.product.id, quantity: item.quantity })),
          payment_method: 'credit_card'
        })
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Checkout creation failed')

      if (result.sessionUrl) {
        window.location.href = result.sessionUrl
      } else {
        throw new Error('Missing session URL')
      }
    } catch (err) {
      console.error(err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      toast.error(
        isPt
          ? `Falha ao iniciar o checkout: ${errorMessage}`
          : `Checkout-Fehler: ${errorMessage}`
      )
    } finally {
      setSubmittingCheckout(false)
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex flex-col items-center justify-center pt-20">
        <Loader2 className="w-12 h-12 text-pink-500 animate-spin mb-4" />
        <p className="text-gray-700 font-medium">{t('loading') || 'Carregando portal...'}</p>
      </div>
    )
  }

  // --- RENDER B2B LANDING PAGE & SALES FUNNEL (For Visitors/Non-Partners) ---
  if (!isPartner || !showCatalog) {
    const estimatedSavings = salesSlider * (discountPct / 100)
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 text-gray-800 pt-24 pb-16 px-4 font-sans">
        <div className="container mx-auto max-w-6xl space-y-20">
          
          {/* HERO SECTION */}
          <div className="relative rounded-3xl overflow-hidden border border-pink-100/80 bg-white/80 shadow-xl shadow-pink-100/10 p-8 md:p-12 lg:p-16">
            {/* Ambient gradients */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-300/10 rounded-full blur-3xl -z-10"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-300/10 rounded-full blur-3xl -z-10"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column (Content) */}
              <div className="lg:col-span-7 text-center lg:text-left space-y-6">
                <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-pink-100 text-pink-700 rounded-full border border-pink-200/50 text-xs font-semibold uppercase tracking-wider mx-auto lg:mx-0">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isPt ? 'Oportunidade de Parceria B2B' : 'B2B Partnerschaftsmöglichkeit'}</span>
                </div>

                <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-pink-950 to-rose-950 bg-clip-text text-transparent leading-tight mx-auto lg:mx-0 max-w-xl">
                  {t('partnerHeroTitle' as any) || 'Aumente as Margens de Lucro do seu Salão'}
                </h1>
                
                <p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                  {t('partnerHeroSubtitle' as any) || 'Seja um salão parceiro Schönheits Lokal. Adquira nossa linha premium com 30% de desconto e pagamento facilitado em 50/50.'}
                </p>

                <div className="pt-4 flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-4">
                  {isPartner ? (
                    <button
                      onClick={() => setShowCatalog(true)}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isPt ? 'Acessar Catálogo de Compras' : 'Partner-Shop aufrufen'}
                      <ShoppingBag className="w-5 h-5 ml-2" />
                    </button>
                  ) : (
                    <a
                      href="#cadastro"
                      className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {t('partnerCtaApply' as any) || 'Solicitar Parceria'}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </a>
                  )}
                  {!isAuthenticated && (
                    <button
                      onClick={() => navigate('/login', { state: { from: { pathname: '/parceria' } } })}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-white border border-pink-200 text-pink-600 hover:bg-pink-50 rounded-xl font-bold transition-all shadow-sm"
                    >
                      {isPt ? 'Entrar na Área do Parceiro' : 'Partner-Login'}
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column (Visual) */}
              <div className="lg:col-span-5 relative">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-rose-400 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500 -z-10"></div>
                  <div className="relative overflow-hidden rounded-2xl border border-pink-100 bg-white p-2 shadow-xl">
                    <img
                      src="/partner_salon_interior.png"
                      alt={isPt ? 'Salão de Beleza Lucrativo' : 'Erfolgreicher Schönheitssalon'}
                      className="w-full h-auto object-cover rounded-xl transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BENEFITS SECTION */}
          <div className="space-y-12">
            <h2 className="text-3xl font-extrabold tracking-tight text-center bg-gradient-to-r from-gray-900 to-pink-900 bg-clip-text text-transparent">
              {t('partnerBenefitsTitle' as any) || 'Vantagens da Parceria B2B'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="p-6 rounded-2xl border border-pink-100/50 bg-white/70 hover:bg-white shadow-sm hover:shadow-md transition-all group">
                <div className="p-3.5 bg-pink-50 text-pink-600 rounded-xl w-fit mb-5 group-hover:scale-110 transition-transform">
                  <Percent className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('benefit1Title' as any) || '30% de Desconto Fixo'}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{t('benefit1Desc' as any) || 'Aumento imediato do faturamento na revenda de cosméticos de alta performance.'}</p>
              </div>

              <div className="p-6 rounded-2xl border border-pink-100/50 bg-white/70 hover:bg-white shadow-sm hover:shadow-md transition-all group">
                <div className="p-3.5 bg-pink-50 text-pink-600 rounded-xl w-fit mb-5 group-hover:scale-110 transition-transform">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('benefit2Title' as any) || 'Entrada Facilitada (50/50)'}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{t('benefit2Desc' as any) || 'Pague metade no ato da compra e os 50% restantes em 30 dias sem juros.'}</p>
              </div>

              <div className="p-6 rounded-2xl border border-pink-100/50 bg-white/70 hover:bg-white shadow-sm hover:shadow-md transition-all group">
                <div className="p-3.5 bg-pink-50 text-pink-600 rounded-xl w-fit mb-5 group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('benefit3Title' as any) || 'Entrega Expressa'}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{t('benefit3Desc' as any) || 'Logística rápida e priorizada com frete para toda a Suíça.'}</p>
              </div>

              <div className="p-6 rounded-2xl border border-pink-100/50 bg-white/70 hover:bg-white shadow-sm hover:shadow-md transition-all group">
                <div className="p-3.5 bg-pink-50 text-pink-600 rounded-xl w-fit mb-5 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('benefit4Title' as any) || 'Materiais de Apoio'}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{t('benefit4Desc' as any) || 'Displays de balcão, amostras grátis e material digital para alavancar suas redes.'}</p>
              </div>

            </div>
          </div>

          {/* PREMIUM COSMETICS HIGHLIGHT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center bg-white/80 border border-pink-100/80 rounded-3xl p-8 md:p-12 shadow-xl shadow-pink-100/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-80 h-80 bg-pink-300/10 rounded-full blur-3xl -z-10"></div>
            
            {/* Left: Image Column */}
            <div className="lg:col-span-5 relative order-last lg:order-first">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-rose-400 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500 -z-10"></div>
                <div className="relative overflow-hidden rounded-2xl border border-pink-100 bg-white p-2 shadow-xl">
                  <img
                    src="/premium_cosmetics_flatlay.png"
                    alt={isPt ? 'Cosméticos de Beleza Lucrativos' : 'Kosmetikprodukte für den Wiederverkauf'}
                    className="w-full h-auto object-cover rounded-xl transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </div>
            </div>

            {/* Right: Text Content */}
            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                {isPt 
                  ? 'Cosméticos Exclusivos para seu Salão Lucrar Mais' 
                  : 'Exklusive Kosmetika für höhere Salon-Umsätze'}
              </h2>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                {isPt
                  ? 'Ofereça às suas clientes produtos premium que trazem resultados de salão para o cuidado em casa. Nossa linha profissional possui alta aceitação e garante recorrência nas vendas.'
                  : 'Bieten Sie Ihren Kundinnen Premium-Produkte an, die Salon-Ergebnisse für die häusliche Pflege liefern. Unsere professionelle Linie geniesst hohe Akzeptanz und sorgt für wiederkehrende Umsätze.'}
              </p>
              
              <ul className="space-y-3.5">
                {[
                  {
                    title: isPt ? 'Fórmulas Premium & Resultados Visíveis' : 'Premium-Formeln & Sichtbare Ergebnisse',
                    desc: isPt ? 'Cosméticos desenvolvidos com ativos de alta performance para encantar as clientes.' : 'Kosmetika mit hochwirksamen Wirkstoffen, die Ihre Kundinnen begeistern werden.'
                  },
                  {
                    title: isPt ? 'Margem Segura de Revenda' : 'Sichere Wiederverkaufsspanne',
                    desc: isPt ? 'Desconto fixo de 30% em toda a linha de produtos profissionais e revenda.' : 'Sicherer Rabatt von 30% auf die gesamte professionelle Produktlinie.'
                  },
                  {
                    title: isPt ? 'Suporte Visual no Salão' : 'Verkaufshilfen im Salon',
                    desc: isPt ? 'Receba displays de balcão elegantes para expor os produtos com destaque.' : 'Erhalten Sie edle Thekendisplays, um die Produkte ansprechend zu präsentieren.'
                  }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mt-1">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">{item.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* DYNAMIC CALCULATOR */}
          <div className="relative rounded-3xl border border-pink-100/80 bg-white/80 shadow-xl shadow-pink-100/10 p-8 md:p-12 overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-rose-300/10 rounded-full blur-3xl -z-10"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center">
                  <TrendingUp className="w-6 h-6 mr-3 text-pink-500" />
                  {t('marginCalculatorTitle' as any) || 'Calculadora de Margem de Lucro'}
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('marginCalculatorDesc' as any) || 'Mova o controle deslizante para estimar o seu lucro mensal com a margem de 30%.'}
                </p>
                <div className="pt-4 space-y-4">
                  <div className="flex justify-between font-bold text-sm text-gray-700">
                    <span>{t('monthlySales' as any) || 'Volume de vendas de produtos mensal'}</span>
                    <span className="text-pink-600 text-lg">{formatCurrency(salesSlider)}</span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="10000"
                    step="100"
                    value={salesSlider}
                    onChange={(e) => setSalesSlider(Number(e.target.value))}
                    className="w-full h-2 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>CHF 200</span>
                    <span>CHF 5\'000</span>
                    <span>CHF 10\'000</span>
                  </div>
                </div>
              </div>

              <div className="bg-pink-50/50 border border-pink-100 rounded-2xl p-6 text-center space-y-2 lg:h-full lg:flex lg:flex-col lg:justify-center">
                <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                  {t('estimatedLucrative' as any) || 'Seu lucro líquido estimado'}
                </p>
                <p className="text-4xl md:text-5xl font-extrabold text-pink-600">
                  {formatCurrency(estimatedSavings)}
                </p>
                <p className="text-xs text-emerald-600 font-medium">
                  {isPt 
                    ? `*Simulação com base na taxa de desconto padrão de ${discountPct}%`
                    : `*Simulation basierend auf dem Standard-Rabatt von ${discountPct}%`}
                </p>
              </div>
            </div>
          </div>

          {/* TIMELINE SECTION */}
          <div className="space-y-12">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-center text-gray-900">
              {t('howItWorksTitle' as any) || 'Como Funciona a Parceria'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              
              <div className="space-y-3 relative p-6 bg-white/70 rounded-2xl border border-pink-100/50 shadow-sm">
                <span className="text-3xl font-extrabold text-pink-200 block">01</span>
                <h3 className="text-lg font-bold text-gray-900">{t('step1Title' as any) || '1. Solicitação Online'}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{t('step1Desc' as any) || 'Preencha o formulário abaixo com os dados básicos do seu salão.'}</p>
              </div>

              <div className="space-y-3 relative p-6 bg-white/70 rounded-2xl border border-pink-100/50 shadow-sm">
                <span className="text-3xl font-extrabold text-pink-200 block">02</span>
                <h3 className="text-lg font-bold text-gray-900">{t('step2Title' as any) || '2. Análise e Liberação'}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{t('step2Desc' as any) || 'Nossa equipe avalia o cadastro e ativa sua conta para o nível Parceiro.'}</p>
              </div>

              <div className="space-y-3 relative p-6 bg-white/70 rounded-2xl border border-pink-100/50 shadow-sm">
                <span className="text-3xl font-extrabold text-pink-200 block">03</span>
                <h3 className="text-lg font-bold text-gray-900">{t('step3Title' as any) || '3. Compre com Desconto'}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{t('step3Desc' as any) || 'Acesse o portal para fazer pedidos com descontos automáticos e pagamento flexível.'}</p>
              </div>

            </div>
          </div>

          {/* TESTIMONIALS */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold tracking-tight text-center text-gray-900">
              {isPt ? 'Depoimentos de Parceiros' : 'Was unsere Partner sagen'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="p-6 bg-white/70 rounded-2xl border border-pink-100/50 space-y-4 shadow-sm">
                <p className="text-gray-600 italic text-sm leading-relaxed">
                  {isPt 
                    ? '"Com o desconto de 30% da Schönheits Lokal e a possibilidade de parcelamento 50/50 em 30 dias, consegui renovar o estoque de revenda do meu salão sem comprometer meu fluxo de caixa. O retorno foi incrível!"' 
                    : '"Mit dem 30%-Rabatt von Schönheits Lokal und der Möglichkeit der 50/50-Zahlung konnte ich meinen Verkaufsbestand auffüllen, ohne meine Liquidität zu belasten. Die Kunden lieben die Produkte!"'}
                </p>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Elena Weber</h4>
                  <p className="text-gray-500 text-xs">{isPt ? 'Proprietária do Coiffeur Weber, Zurique' : 'Inhaberin Coiffeur Weber, Zürich'}</p>
                </div>
              </div>

              <div className="p-6 bg-white/70 rounded-2xl border border-pink-100/50 space-y-4 shadow-sm">
                <p className="text-gray-600 italic text-sm leading-relaxed">
                  {isPt 
                    ? '"O suporte de marketing físico e digital que a equipe nos disponibiliza facilita muito a indicação de produtos para nossas clientes de corte e coloração. Nossa receita de revenda subiu 45%."' 
                    : '"Die Marketingmaterialien und Werbedisplays helfen uns sehr beim Verkauf an unsere Kundinnen. Unser Umsatz mit Kosmetikprodukten ist um 45% gestiegen."'}
                </p>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Marcus Keller</h4>
                  <p className="text-gray-500 text-xs">{isPt ? 'Diretor do Keller Salon, Winterthur' : 'Inhaber Salon Keller, Winterthur'}</p>
                </div>
              </div>

            </div>
          </div>

          {/* APPLICATION FORM CARD */}
          <div id="cadastro" className="max-w-2xl mx-auto rounded-3xl border border-pink-200/80 bg-white/95 p-8 md:p-12 shadow-2xl relative">
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-300/10 rounded-full blur-2xl -z-10"></div>
            
            {requestSuccess ? (
              <div className="text-center space-y-6 py-8">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <UserCheck className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {isPt ? 'Recebemos seu Cadastro!' : 'Anfrage erhalten!'}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm max-w-md mx-auto">
                  {t('partnerRequestSuccess' as any) || 'Sua solicitação foi enviada com sucesso! Nossa equipe entrará em contato em breve.'}
                </p>
                <button
                  onClick={() => setRequestSuccess(false)}
                  className="px-6 py-2 border border-pink-200 text-xs text-pink-700 rounded-lg hover:bg-pink-50"
                >
                  {isPt ? 'Enviar nova solicitação' : 'Neues Formular senden'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-6">
                <div className="text-center space-y-2 mb-4">
                  <h3 className="text-2xl font-extrabold text-gray-900">
                    {t('partnerFormTitle' as any) || 'Cadastro de Salão Parceiro'}
                  </h3>
                  <p className="text-gray-500 text-xs">
                    {isPt 
                      ? 'Preencha o formulário e analisaremos seu cadastro em até 24 horas úteis.'
                      : 'Füllen Sie das Formular aus, wir prüfen Ihre Bewerbung innerhalb von 24 Stunden.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700">{t('salonNameLabel' as any) || 'Nome do Salão'} *</label>
                    <input
                      type="text"
                      required
                      value={salonName}
                      onChange={(e) => setSalonName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 transition-all placeholder:text-gray-400"
                      placeholder={isPt ? 'Ex: Coiffeur Paris' : 'z.B. Salon Elegance'}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700">{t('ownerNameLabel' as any) || 'Nome do Proprietário'} *</label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 transition-all placeholder:text-gray-400"
                      placeholder={isPt ? 'Ex: Silvia Frick' : 'z.B. Maria Müller'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700">{t('partnerEmailLabel' as any) || 'E-mail Comercial'} *</label>
                    <input
                      type="email"
                      required
                      value={requestEmail}
                      onChange={(e) => setRequestEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 transition-all placeholder:text-gray-400"
                      placeholder="contato@salao.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700">{t('partnerPhoneLabel' as any) || 'Telefone / WhatsApp'} *</label>
                    <input
                      type="text"
                      required
                      value={requestPhone}
                      onChange={(e) => setRequestPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 transition-all placeholder:text-gray-400"
                      placeholder="+41 79 123 45 67"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700">{isPt ? 'Notas / Observações Adicionais' : 'Zusätzliche Notizen / Fragen'} (Opcional)</label>
                  <textarea
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 transition-all placeholder:text-gray-400 resize-none"
                    placeholder={isPt ? 'Escreva aqui detalhes sobre seu salão...' : 'Hier können Sie uns Fragen stellen...'}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center transform active:scale-[0.98]"
                >
                  {submittingRequest ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {isPt ? 'Enviando...' : 'Wird gesendet...'}
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      {t('partnerSubmitBtn' as any) || 'Enviar Solicitação'}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }

  // --- RENDER PORTAL COMERCIAL EXCLUSIVO DE PARCEIROS (For Approved Partners) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Back to Landing Page */}
        <div className="mb-6">
          <button
            onClick={() => setShowCatalog(false)}
            className="inline-flex items-center text-pink-600 hover:text-pink-700 font-semibold text-sm transition-colors"
          >
            <ArrowRight className="w-4 h-4 mr-1.5 rotate-180" />
            {isPt ? 'Voltar para a Página Informativa' : 'Zurück zur Infoseite'}
          </button>
        </div>
        {/* Banner Title */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8 flex items-center space-x-6">
          <div className="p-4 bg-pink-50 rounded-lg">
            <Building className="w-10 h-10 text-pink-500" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {isPt ? 'Painel de Salão Parceiro' : 'Partner-Salon Dashboard'}
            </h1>
            <p className="text-gray-500 mt-1">
              {isPt 
                ? `Aproveite ${discountPct}% de desconto exclusivo. Pedido mínimo: ${formatCurrency(minOrderAmount)}.`
                : `Profitieren Sie von ${discountPct}% Partner-Rabatt. Mindestbestellwert: ${formatCurrency(minOrderAmount)}.`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Catalog */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <ShoppingBag className="w-5 h-5 mr-2 text-pink-500" />
                  {isPt ? 'Catálogo de Produtos' : 'Produktkatalog'}
                </h2>
                
                {/* Search input */}
                <div className="relative max-w-xs w-full">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={isPt ? 'Buscar produto...' : 'Produkt suchen...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg">
                  <p className="text-gray-400">{isPt ? 'Nenhum produto encontrado.' : 'Keine Produkte gefunden.'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredProducts.map((product) => {
                    const name = isPt ? (product.name_pt || product.name) : (product.name_de || product.name)
                    const desc = isPt ? product.description_pt : product.description_de
                    const inCart = cart.find(item => item.product.id === product.id)
                    
                    return (
                      <div 
                        key={product.id} 
                        className="flex flex-col justify-between p-4 bg-gray-50/50 hover:bg-white border border-gray-200 hover:border-pink-300 rounded-xl transition-all duration-200 hover:shadow-md relative overflow-hidden"
                      >
                        <div className="flex space-x-4">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={name} 
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                              <ShoppingBag className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{name}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">{desc || product.description}</p>
                            <p className="text-sm font-bold text-gray-900 mt-2">{formatCurrency(product.price)}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          {product.stock !== undefined && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              (product.stock || 0) > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {isPt ? `Estoque: ${product.stock}` : `Lager: ${product.stock}`}
                            </span>
                          )}
                          
                          {inCart ? (
                            <div className="flex items-center space-x-2 bg-pink-50 p-1 rounded-lg border border-pink-200">
                              <button 
                                onClick={() => updateQuantity(product.id, -1)}
                                className="p-1 hover:bg-pink-100 rounded text-pink-600 transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-bold text-pink-700 px-1.5">{inCart.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(product.id, 1)}
                                className="p-1 hover:bg-pink-100 rounded text-pink-600 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(product)}
                              className="ml-auto flex items-center px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              {isPt ? 'Adicionar' : 'Hinzufügen'}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Contract Agreement */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-pink-500" />
                  {isPt ? 'Contrato de Parceria' : 'Partnerschaftsvertrag'}
                </h2>
                
                {/* Language Switch */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg text-xs border border-gray-200">
                  <button 
                    onClick={() => setContractLanguage('de')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                      contractLanguage === 'de' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    DE
                  </button>
                  <button 
                    onClick={() => setContractLanguage('pt')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                      contractLanguage === 'pt' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    PT-BR
                  </button>
                </div>
              </div>

              {/* Scrollable contract text */}
              <div className="h-48 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50/50 text-xs text-gray-600 font-mono leading-relaxed whitespace-pre-wrap">
                {contractLanguage === 'de' 
                  ? (contractDe || 'Der deutsche Partnerschaftsvertrag wird geladen oder ist nicht konfiguriert.') 
                  : (contractPt || 'O contrato de parceria em português está sendo carregado ou não foi configurado.')}
              </div>

              {/* Checkbox */}
              <label className="flex items-start space-x-3 cursor-pointer group pt-2 select-none">
                <input 
                  type="checkbox"
                  checked={contractAccepted}
                  onChange={(e) => setContractAccepted(e.target.checked)}
                  className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500 mt-0.5 transition-all"
                />
                <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                  {t('acceptContract') || 'Li e aceito os termos do contrato de parceria.'}
                </span>
              </label>
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                <span>{isPt ? 'Resumo da Compra' : 'Bestellübersicht'}</span>
                <span className="bg-pink-50 text-pink-700 text-xs px-2.5 py-1 rounded-full font-bold">
                  {cart.reduce((acc, item) => acc + item.quantity, 0)} {isPt ? 'Itens' : 'Artikel'}
                </span>
              </h2>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">{isPt ? 'Seu carrinho está vazio.' : 'Warenkorb ist leer.'}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Selected items list */}
                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 pr-1">
                    {cart.map((item) => {
                      const name = isPt ? (item.product.name_pt || item.product.name) : (item.product.name_de || item.product.name)
                      return (
                        <div key={item.product.id} className="flex justify-between items-center py-3">
                          <div className="min-w-0 pr-2">
                            <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.quantity} × {formatCurrency(item.product.price)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-bold text-gray-900">
                              {formatCurrency(item.product.price * item.quantity)}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Minimum order restriction alert */}
                  {!isMinOrderMet && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold">{isPt ? 'Pedido Mínimo Não Atingido' : 'Mindestbestellwert nicht erreicht'}</p>
                        <p className="mt-0.5 leading-relaxed">
                          {isPt 
                            ? `O valor subtotal original deve ser de no mínimo ${formatCurrency(minOrderAmount)}. Faltam ${formatCurrency(minOrderAmount - originalSubtotal)}.`
                            : `Der originale Subtotal muss mindestens ${formatCurrency(minOrderAmount)} betragen. Es fehlen ${formatCurrency(minOrderAmount - originalSubtotal)}.`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Calculations breakdown */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal original</span>
                      <span>{formatCurrency(originalSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>{t('partnerDiscount') || 'Desconto Parceiro'} ({discountPct}%)</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                    <div className="flex justify-between text-gray-900 font-bold border-t border-gray-200 pt-2.5">
                      <span>Total com Desconto</span>
                      <span>{formatCurrency(discountedTotal)}</span>
                    </div>

                    {/* Split Payments */}
                    <div className="border-t border-dashed border-gray-200 pt-2.5 mt-2.5 space-y-2">
                      <div className="flex justify-between text-xs text-pink-700 font-bold">
                        <span>{isPt ? 'Ato do pedido (50%)' : 'Anzahlung (50% heute)'}</span>
                        <span>{formatCurrency(amountUpfront)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 font-medium">
                        <span>{isPt ? 'Para 30 dias (50%)' : 'In 30 Tagen (50%)'}</span>
                        <span>{formatCurrency(amountRemaining)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment method info */}
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2.5">
                      {t('paymentMethod') || 'Método de Pagamento'}
                    </span>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-pink-500 bg-pink-50/30 text-pink-700 text-xs font-bold">
                      <CreditCard className="w-4 h-4 flex-shrink-0" />
                      <span>{isPt ? 'Cartão de Crédito / Twint (CHF)' : 'Kreditkarte / Twint (CHF)'}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={handleCheckout}
                    disabled={submittingCheckout || !isMinOrderMet}
                    className="w-full py-3.5 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-200 disabled:cursor-not-allowed disabled:shadow-none text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center transform active:scale-[0.98]"
                  >
                    {submittingCheckout ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('redirecting') || 'Processando checkout...'}
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        {isPt ? `Pagar Entrada (${formatCurrency(amountUpfront)})` : `Anzahlung bezahlen (${formatCurrency(amountUpfront)})`}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
