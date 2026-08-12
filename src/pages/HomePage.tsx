import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import { updateMetaTags } from '@/lib/seo'
import { lazy, Suspense } from 'react'
import ProductCarousel from '@/components/ProductCarousel'
import {
  Calendar,
  Clock,
  Star,
  Phone,
  MapPin,
  Scissors,
  Heart,
  Sparkles,
  Users,
  Award,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Instagram,
  X
} from 'lucide-react'
import { formatCurrency, optimizeImage } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Service } from '@/lib/supabase'
import { useLanguageStore } from '@/stores/languageStore'
import { RevealOnScroll } from '@/components/RevealOnScroll'
import { LazyBackgroundVideo } from '@/components/LazyBackgroundVideo'

export default function HomePage() {
  const navigate = useNavigate()
  const { t, language } = useLanguageStore()

  useEffect(() => {
    const title = language === 'pt-BR' 
      ? 'Schönheits Lokal | Salão de Beleza & Estética em Zurique 8003' 
      : 'Schönheits Lokal | Kosmetikstudio & Nagelstudio in Zurich 8003';
    const description = language === 'pt-BR'
      ? 'Transforme sua beleza. Waxing brasileiro, manicure, tratamentos de queratina e mais em Zurique Kreis 4. Agende online!'
      : 'Verwandeln Sie Ihre Schönheit. Brazilian Waxing, Maniküre, Keratin Behandlung und mehr in Kreis 4, Zurich. Jetzt Termin buchen!';
    
    updateMetaTags(title, description, '/', language);
  }, [language]);

  const [selectedService] = useState<string | null>(null)
  const [servicesDb, setServicesDb] = useState<Service[]>([])
  const [promoStorePct, setPromoStorePct] = useState(0)
  const [promoPerService, setPromoPerService] = useState<Record<string, number>>({})
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [instagramPosts, setInstagramPosts] = useState<{ image_url: string, link: string }[]>([])

  const faqs = [
    {
      question: 'Wie buche ich einen Termin?',
      answer: 'Sie können ganz einfach online über den "Termin Buchen" Button reservieren. Wählen Sie Ihren gewünschten Service, Fachkraft und die passende Uhrzeit aus.'
    },
    {
      question: 'Welche Produkte verwenden Sie?',
      answer: 'Wir verwenden ausschliesslich hochwertige Premium-Produkte für die besten Ergebnisse und um die Gesundheit Ihrer Haut und Haare zu gewährleisten.'
    },
    {
      question: 'Kann ich meinen Termin stornieren?',
      answer: 'Ja, Sie können Ihren Termin bis zu 24 Stunden vorher kostenlos über Ihr Kundenkonto oder den Link in Ihrer Bestätigungs-E-Mail stornieren.'
    },
    {
      question: 'Bieten Sie auch Geschenkgutscheine an?',
      answer: 'Ja! Fragen Sie bei Ihrem nächsten Besuch einfach unser Team an der Rezeption nach unseren exklusiven Geschenkgutscheinen.'
    }
  ]

  const services = [
    {
      id: 1,
      name: 'Maniküre & Pediküre',
      description: 'Komplette Behandlung für Hände und Füße mit den besten Techniken',
      duration_minutes: 90,
      price: 150,
      icon: <Heart className="w-8 h-8" />,
      color: 'from-pink-400 to-rose-500'
    },
    {
      id: 2,
      name: 'Haarschnitt & Styling',
      description: 'Personalisierte Haarschnitte und moderne Styling-Techniken',
      duration_minutes: 60,
      price: 120,
      icon: <Scissors className="w-8 h-8" />,
      color: 'from-purple-400 to-pink-500'
    },
    {
      id: 3,
      name: 'Gesichtsästhetik',
      description: 'Hautreinigung und personalisierte Gesichtsbehandlungen',
      duration_minutes: 75,
      price: 180,
      icon: <Sparkles className="w-8 h-8" />,
      color: 'from-blue-400 to-purple-500'
    },
    {
      id: 4,
      name: 'Brazilian Waxing',
      description: 'Brasilianischi Intimhaarentfernig: edel, glatt, professionell, höchsch Komfort, exklusiv schön',
      duration_minutes: 45,
      price: 100,
      icon: <Users className="w-8 h-8" />,
      color: 'from-orange-400 to-pink-500'
    },
    {
      id: 5,
      name: 'Augenbrauen-Design',
      description: 'Personalisierte Augenbrauen-Modellierung und -Design für Ihr Gesicht',
      duration_minutes: 30,
      price: 40,
      icon: <Award className="w-8 h-8" />,
      color: 'from-green-400 to-blue-500'
    },
    {
      id: 6,
      name: 'Haarbehandlungen',
      description: 'Haar-Botox, intensive Hydratation und Rekonstruktion',
      duration_minutes: 120,
      price: 280,
      icon: <Heart className="w-8 h-8" />,
      color: 'from-yellow-400 to-orange-500'
    }
  ]

  const testimonials = [
    {
      name: 'Maria Silva',
      text: 'Ausgezeichneter Service! Die Fachkräfte sind sehr qualifiziert und die Atmosphäre ist super angenehm.',
      rating: 5,
      service: 'Maniküre & Pediküre'
    },
    {
      name: 'Ana Santos',
      text: 'Bestes Salon in der Region! Ich bin immer super zufrieden mit meinem Haarschnitt und Styling.',
      rating: 5,
      service: 'Haarschnitt & Styling'
    },
    {
      name: 'Julia Oliveira',
      text: 'Wunderbare Gesichtsbehandlungen! Meine Haut war noch nie so schön.',
      rating: 5,
      service: 'Gesichtsästhetik'
    }
  ]

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Qualifizierte Fachkräfte',
      description: 'Erfahrenes Team, das mit den neuesten Trends auf dem Laufenden ist'
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: 'Qualitätsprodukte',
      description: 'Wir verwenden nur Premium-Produkte, die auf dem Markt anerkannt sind'
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: 'Gemütliche Atmosphäre',
      description: 'Moderner und komfortabler Raum für Ihr bestes Erlebnis'
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: 'Online-Buchung',
      description: 'Reservieren Sie Ihren Termin schnell und bequem 24 Stunden am Tag'
    }
  ]

  useEffect(() => {
    // Track page view
    supabase.rpc('increment_page_view', { p_page_path: window.location.pathname }).then(({ error }) => { if (error) console.error('Error tracking view:', error) })

      ; (async () => {
        const { data } = await supabase
          .from('services')
          .select('*')
          .eq('active', true)
          .order('display_order', { ascending: true })
        setServicesDb(data || [])
      })()
      ; (async () => {
        const { data } = await supabase
          .from('system_settings')
          .select('key,value')
          .or('key.eq.store_discount_pct,key.like.service_discount_pct_%')
        const rows = (data || []) as { key: string; value: string | null }[]
        const store = rows.find(r => r.key === 'store_discount_pct')
        setPromoStorePct(store && store.value != null ? Number(store.value) : 0)
        const map: Record<string, number> = {}
        for (const r of rows.filter(r => r.key.startsWith('service_discount_pct_'))) {
          const sid = r.key.replace('service_discount_pct_', '')
          map[sid] = r.value != null ? Number(r.value) : 0
        }
        setPromoPerService(map)
      })()
      ; (async () => {
        const { data } = await supabase.from('system_settings').select('*').eq('key', 'instagram_posts').maybeSingle()
        if (data && data.value) {
          try {
            const parsed = JSON.parse(data.value)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setInstagramPosts(parsed)
            }
          } catch (e) {
            console.error('Error parsing instagram posts', e)
          }
        }
      })()
  }, [])



  const applyPrice = (service: Service) => {
    const perSvc = promoPerService[service.id] || 0
    const pct = Math.max(perSvc, promoStorePct)
    return Math.max(0, Math.round(service.price * (1 - pct / 100) * 100) / 100)
  }

  const [showAllProducts, setShowAllProducts] = useState(false)
  const [showAllServices, setShowAllServices] = useState(false)
  const [activeProductCategory, setActiveProductCategory] = useState<string | null>(null)
  const [activeServiceCategory, setActiveServiceCategory] = useState<string | null>(null)
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<Service | null>(null)

  // Track service view when details are opened
  useEffect(() => {
    if (selectedItemForDetails) {
      supabase.rpc('increment_service_view', { p_service_id: selectedItemForDetails.id }).then(({ error }) => {
        if (error) console.error('Error tracking service view:', error)
      })
    }
  }, [selectedItemForDetails])

  const products = servicesDb.filter(s => s.category === 'product')
  const servicesList = servicesDb.filter(s => s.category !== 'product')

  const groupedProducts = products.reduce((acc, product) => {
    const subKey = product.subcategory ? `sub_${product.subcategory}` : ''
    const trans = product.subcategory ? t(subKey as any) : null
    const translatedSub = (trans && trans !== subKey) ? trans : product.subcategory
    const sub = translatedSub || (t('otherProducts') || 'Andere Produkte')
    if (!acc[sub]) acc[sub] = []
    acc[sub].push(product)
    return acc
  }, {} as Record<string, Service[]>)

  const groupedServices = servicesList.reduce((acc, service) => {
    const subKey = service.subcategory ? `sub_${service.subcategory}` : ''
    const trans = service.subcategory ? t(subKey as any) : null
    const translatedSub = (trans && trans !== subKey) ? trans : service.subcategory
    const sub = translatedSub || (t('otherServices') || 'Andere Services')
    if (!acc[sub]) acc[sub] = []
    acc[sub].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      <Header />

      {/* Product Carousel Section */}
      <section className="relative px-4 pt-24 pb-8">
        <div className="container mx-auto max-w-6xl">
          <ProductCarousel autoPlayInterval={5000} showIndicators={true} />
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 bg-white/10 backdrop-blur-md">
        {/* Background Video (Hero / Salon Experience) */}
        <LazyBackgroundVideo 
          src="https://cdn.pixabay.com/video/2019/02/02/21147-315137137_medium.mp4" 
          opacity={0.7} 
          overlayClass="bg-black/30 backdrop-blur-[1px]" 
        />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl font-bold !text-white mb-6 leading-tight">
                Verwandeln Sie Ihre
                <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                  {' '}Schönheit
                </span>
                <br />
                mit unseren
                <br />
                <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                  Exklusiven Dienstleistungen
                </span>
              </h1>
              <p className="text-lg !text-white/90 mb-8 max-w-lg">
                Willkommen in unserem Schönheitssalon, wo wir Ihre Schönheit mit professionellen
                und personalisierten Dienstleistungen verwandeln. Buchen Sie Ihren Termin und entdecken Sie das Beste in sich.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/agendar"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-semibold hover:from-pink-600 hover:to-rose-600 transition-all transform hover:scale-105 shadow-lg"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Termin Buchen
                </Link>
                <a
                  href="#servicos"
                  className="inline-flex items-center px-8 py-4 bg-white text-pink-600 rounded-full font-semibold hover:bg-gray-50 transition-all border-2 border-pink-600"
                >
                  Dienstleistungen Ansehen
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-pink-200 to-rose-200 rounded-3xl p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  {(servicesList.length > 0 ? servicesList.slice(0, 4) : (services as any[]).slice(0, 4)).map((service, index) => (
                    <div
                      key={service.id}
                      className={`relative overflow-hidden rounded-2xl p-4 text-white shadow-lg transform ${index % 2 === 0 ? 'rotate-3' : '-rotate-3'} hover:rotate-0 transition-transform bg-gradient-to-br ${service.color || 'from-pink-400 to-rose-500'}`}
                    >
                      {service.image_url ? (
                        <>
                          <div className="absolute inset-0">
                            <img
                              srcSet={`${optimizeImage(service.image_url, 200)} 200w, ${optimizeImage(service.image_url, 400)} 400w, ${optimizeImage(service.image_url, 600)} 600w`}
                              sizes="(max-width: 768px) 200px, (max-width: 1024px) 300px, 400px"
                              src={optimizeImage(service.image_url, 600)}
                              alt={service.name}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover opacity-60"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          </div>
                          <div className="relative z-10 h-full flex flex-col justify-end">
                            <h2 className="font-semibold text-lg leading-tight mb-1">{service.name}</h2>
                            <p className="text-sm opacity-90">{service.duration_minutes} min</p>
                          </div>
                        </>
                      ) : (
                        <div className="relative z-10 h-full flex flex-col justify-between">
                          <div className="mb-2">{service.icon || <Sparkles className="w-8 h-8 text-pink-100" />}</div>
                          <div>
                            <h2 className="font-semibold text-lg leading-tight mb-1">{service.name}</h2>
                            <p className="text-sm opacity-90">{service.duration_minutes} min</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative overflow-hidden py-16 px-4 bg-white/10 backdrop-blur-md">
        {/* Background Video (Details/Atmosphere) */}
        <LazyBackgroundVideo 
          src="https://cdn.pixabay.com/video/2022/10/30/137122-765701203_medium.mp4" 
          opacity={0.7} 
          overlayClass="bg-black/20 backdrop-blur-[1px]" 
        />
        <RevealOnScroll>
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold !text-white mb-4">
                Warum uns wählen?
              </h2>
              <p className="!text-white/90 max-w-2xl mx-auto">
                Wir verpflichten uns zur Exzellenz in jedem Detail und bieten ein einzigartiges
                und personalisiertes Erlebnis für jeden Kunden.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <div className="text-white">{feature.icon}</div>
                  </div>
                  <h3 className="font-semibold !text-white mb-2">{feature.title}</h3>
                  <p className="!text-white/80 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* B2B Partnership Banner */}
      <section className="relative overflow-hidden py-20 px-4 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white border-y border-white/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl -z-10"></div>
        
        <RevealOnScroll>
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Text column */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-pink-500/10 rounded-full border border-pink-500/20 text-pink-400 text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>B2B Partnership</span>
                </div>
                
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-pink-100 to-rose-300 bg-clip-text text-transparent leading-tight">
                  {language === 'pt-BR' 
                    ? 'Aumente o Faturamento do seu Salão' 
                    : 'Maximieren Sie Ihren Salon-Umsatz'}
                </h2>
                
                <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                  {language === 'pt-BR'
                    ? 'Seja um salão parceiro Schönheits Lokal. Adquira nossa linha premium com 30% de desconto exclusivo e parcelamento flexível em 50/50.'
                    : 'Werden Sie Partner von Schönheits Lokal. Beziehen Sie unsere Premium-Produktlinie mit 30% Rabatt und flexibler 50/50-Zahlung.'}
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    to="/parceria"
                    className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {language === 'pt-BR' ? 'Quero ser Parceiro' : 'Partner werden'}
                    <Award className="w-5 h-5 ml-2" />
                  </Link>
                </div>
              </div>

              {/* Image column */}
              <div className="lg:col-span-5 relative">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-35 transition-opacity duration-500 -z-10"></div>
                  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl">
                    <img
                      src="/partner_salon_interior.png"
                      alt="Salão Parceiro Schönheits Lokal"
                      className="w-full h-auto object-cover rounded-xl transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* Products Section */}
      {products.length > 0 && (
        <section className="relative overflow-hidden py-16 px-4 bg-rose-50/10 backdrop-blur-md">
          {/* Background Video (Products Aesthetic) */}
          <LazyBackgroundVideo 
            src="https://cdn.pixabay.com/video/2026/03/10/339378_medium.mp4" 
            opacity={0.7} 
            overlayClass="bg-black/20 backdrop-blur-[1px]" 
          />
          <RevealOnScroll>
            <div className="container mx-auto max-w-6xl relative z-10">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold !text-white mb-4">
                  Unsere Produkte
                </h2>
                <p className="!text-white/90 max-w-2xl mx-auto">
                  Entdecken Sie unsere Auswahl an hochwertigen Produkten für Ihre Schönheitspflege zu Hause.
                </p>
              </div>

              <div className="space-y-8">
                {!activeProductCategory ? (
                  <div className="flex flex-wrap justify-center gap-4">
                    {Object.keys(groupedProducts).map((subcategory) => (
                      <button
                        key={subcategory}
                        onClick={() => setActiveProductCategory(subcategory)}
                        className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-md hover:shadow-lg transition-all text-center border-2 border-white/20 hover:border-pink-300 flex flex-col items-center gap-3 group min-w-[200px]"
                      >
                        <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <span className="font-semibold !text-white group-hover:text-pink-300 transition-colors">{subcategory}</span>
                        <span className="text-xs !text-white/70">{groupedProducts[subcategory].length} Produkte</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="animation-fade-in">
                    <button
                      onClick={() => setActiveProductCategory(null)}
                      className="mb-6 flex items-center text-pink-400 hover:text-pink-300 font-medium transition-colors"
                    >
                      <ChevronDown className="w-5 h-5 mr-1 rotate-90" />
                      {t('back') || 'Zurück'}
                    </button>

                    <h3 className="text-2xl font-semibold text-white mb-6 pl-4 border-l-4 border-pink-500">
                      {activeProductCategory}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {(showAllProducts ? groupedProducts[activeProductCategory] : groupedProducts[activeProductCategory].slice(0, 6)).map((product) => (
                        <div
                          key={product.id}
                          className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer border-2 border-white/20 hover:border-pink-300 group"
                          onClick={() => setSelectedItemForDetails(product)}
                        >
                          <div className="h-48 bg-white/5 rounded-xl mb-4 flex items-center justify-center overflow-hidden border border-white/10">
                            {product.image_url ? (
                              <img src={optimizeImage(product.image_url, 800)} alt={`${product.name} in Zurich - Schönheits Lokal`} loading="lazy" decoding="async" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <Sparkles className="w-12 h-12 text-pink-300" />
                            )}
                          </div>
                          <h3 className="text-xl font-bold !text-white mb-2">{product.name}</h3>
                          <p className="!text-white/70 mb-4 line-clamp-2 text-sm">{product.description}</p>
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold text-pink-400">
                                  {formatCurrency(applyPrice(product))}
                                </p>
                                {(Math.max(promoPerService[product.id] || 0, promoStorePct) > 0) && (
                                  <span className="text-sm text-white/40 line-through">
                                    {formatCurrency(product.price)}
                                  </span>
                                )}
                              </div>
                              {(Math.max(promoPerService[product.id] || 0, promoStorePct) > 0) && (
                                <span className="mt-1 inline-block text-xs font-semibold text-white bg-pink-500/40 px-2 py-0.5 rounded backdrop-blur-sm">
                                  -{Math.max(promoPerService[product.id] || 0, promoStorePct)}%
                                </span>
                              )}
                            </div>
                            <div className="text-white bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/20 group-hover:bg-pink-500 transition-colors">
                              <Heart className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {groupedProducts[activeProductCategory].length > 6 && (
                      <div className="text-center mt-8">
                        <button
                          onClick={() => setShowAllProducts(!showAllProducts)}
                          className="inline-flex items-center px-6 py-3 border-2 border-pink-500 text-pink-600 rounded-full font-semibold hover:bg-pink-50 transition-colors"
                        >
                          <ChevronDown
                            className={`w-5 h-5 mr-2 transition-transform ${showAllProducts ? 'rotate-180' : ''}`}
                          />
                          <span translate="no">
                            {showAllProducts ? t('showLess') : `${t('showAllProducts')} (${groupedProducts[activeProductCategory].length})`}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </RevealOnScroll>
        </section>
      )}

      {/* Services Section */}
      <section id="servicos" className="relative overflow-hidden py-16 px-4 bg-white/10 backdrop-blur-lg border-y border-pink-100/20">
        {/* Background Video (Manicure/Details) */}
        <LazyBackgroundVideo 
          src="https://cdn.pixabay.com/video/2022/04/13/113819-699653847_medium.mp4" 
          opacity={0.8} 
          overlayClass="bg-black/20 backdrop-blur-[1px]" 
        />

        <div className="container mx-auto max-w-6xl relative z-10">
          <RevealOnScroll>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold !text-white mb-4">
                Unsere Dienstleistungen
              </h2>
              <p className="!text-white/90 max-w-2xl mx-auto">
                Wir bieten eine breite Palette von Schönheitsdienstleistungen, von Maniküre bis zu
                fortschrittlichen ästhetischen Behandlungen, alles auf Ihre Bedürfnisse zugeschnitten.
              </p>
            </div>

            <div className="space-y-8">
              {!activeServiceCategory ? (
                <div className="flex flex-wrap justify-center gap-4">
                  {Object.keys(groupedServices).map((subcategory) => (
                    <button
                      key={subcategory}
                      onClick={() => setActiveServiceCategory(subcategory)}
                      className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-md hover:shadow-lg transition-all text-center border-2 border-white/20 hover:border-pink-300 flex flex-col items-center gap-3 group min-w-[200px]"
                    >
                      <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                        <Scissors className="w-6 h-6" />
                      </div>
                      <span className="font-semibold !text-white group-hover:text-pink-300 transition-colors">{subcategory}</span>
                      <span className="text-xs !text-white/70">{groupedServices[subcategory].length} Services</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="animation-fade-in">
                  <button
                    onClick={() => setActiveServiceCategory(null)}
                    className="mb-6 flex items-center text-pink-400 hover:text-pink-300 font-medium transition-colors"
                  >
                    <ChevronDown className="w-5 h-5 mr-1 rotate-90" />
                    {t('back') || 'Zurück'}
                  </button>

                  <h3 className="text-2xl font-semibold text-white mb-6 pl-4 border-l-4 border-pink-500">
                    {activeServiceCategory}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {(showAllServices ? groupedServices[activeServiceCategory] : groupedServices[activeServiceCategory].slice(0, 6)).map((service) => (
                      <div
                        key={service.id}
                        className={`bg-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer border-2 flex flex-col group ${selectedService === service.id.toString()
                          ? 'border-pink-500 ring-2 ring-pink-500/30'
                          : 'border-white/20 hover:border-pink-300'
                          }`}
                        onClick={() => setSelectedItemForDetails(service)}
                      >
                        {service.image_url && (
                          <div className="h-48 bg-white/5 rounded-xl mb-4 flex items-center justify-center overflow-hidden border border-white/10">
                            <img src={optimizeImage(service.image_url, 800)} alt={`${service.name} in Zurich - Schönheits Lokal`} loading="lazy" decoding="async" className="w-full h-full object-cover rounded-xl" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-xl font-bold !text-white mb-2">{service.name}</h3>
                          <p className="!text-white/70 mb-4 text-sm">{service.description}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm !text-white/50">{service.duration_minutes} min</p>
                            <div className="flex items-baseline gap-2">
                              <p className="text-2xl font-bold text-pink-400">
                                {formatCurrency(applyPrice(service))}
                              </p>
                              {(Math.max(promoPerService[service.id] || 0, promoStorePct) > 0) && (
                                <span className="text-sm text-white/40 line-through">
                                  {formatCurrency(service.price)}
                                </span>
                              )}
                            </div>
                            {(Math.max(promoPerService[service.id] || 0, promoStorePct) > 0) && (
                              <span className="mt-1 inline-block text-xs font-semibold text-white bg-pink-500/40 px-2 py-0.5 rounded backdrop-blur-sm">
                                -{Math.max(promoPerService[service.id] || 0, promoStorePct)}%
                              </span>
                            )}
                          </div>
                          <div className="text-white bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/20 group-hover:bg-pink-500 transition-colors">
                            {selectedService === service.id.toString() ? (
                              <CheckCircle className="w-6 h-6" />
                            ) : (
                              <Calendar className="w-6 h-6" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {groupedServices[activeServiceCategory].length > 6 && (
                    <div className="text-center mt-8">
                      <button
                        onClick={() => setShowAllServices(!showAllServices)}
                        className="inline-flex items-center px-6 py-3 border-2 border-pink-500 text-pink-600 rounded-full font-semibold hover:bg-pink-50 transition-colors"
                      >
                        <ChevronDown
                          className={`w-5 h-5 mr-2 transition-transform ${showAllServices ? 'rotate-180' : ''}`}
                        />
                        <span translate="no">
                          {showAllServices ? t('showLess') : `${t('showAllServices')} (${groupedServices[activeServiceCategory].length})`}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Instagram Feed */}
      <section className="relative overflow-hidden py-16 px-4 bg-white/10 backdrop-blur-xl border-y border-pink-100/10">
        {/* Background Video (Skincare/Aesthetics) */}
        <LazyBackgroundVideo 
          src="https://cdn.pixabay.com/video/2024/03/14/204214-923594173_medium.mp4" 
          opacity={0.6} 
          overlayClass="bg-black/20 backdrop-blur-[1px]" 
        />
        <RevealOnScroll>
          <div className="container mx-auto max-w-6xl text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold !text-white mb-4">
              Vorher & Nachher auf Instagram
            </h2>
            <p className="!text-white/90 max-w-2xl mx-auto mb-10">
              Lassen Sie sich von den Verwandlungen unserer Kundinnen inspirieren.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {instagramPosts.length === 4 ? instagramPosts.map((post, i) => (
                <a
                  key={i}
                  href={post.link || "https://www.instagram.com/schoenheits_lokal/"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group aspect-square relative bg-white rounded-xl shadow-md overflow-hidden flex flex-col items-center justify-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
                >
                  {post.image_url ? (
                    <>
                      <img
                        src={optimizeImage(post.image_url, 400)}
                        alt={`Instagram Post ${i + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Instagram className="w-10 h-10 text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Instagram className="w-10 h-10 mb-2 opacity-30 text-pink-500" />
                      <span className="text-xs font-medium opacity-50 text-pink-500">Post {i + 1}</span>
                    </>
                  )}
                </a>
              )) : servicesDb.filter(s => s.image_url).slice(0, 4).map((service, i) => (
                <a
                  key={i}
                  href="https://www.instagram.com/schoenheits_lokal/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group aspect-square relative bg-white rounded-xl shadow-md overflow-hidden flex flex-col items-center justify-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
                >
                  {service.image_url ? (
                    <>
                      <img
                        src={optimizeImage(service.image_url, 400)}
                        alt="Instagram Post"
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Instagram className="w-10 h-10 text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Instagram className="w-10 h-10 mb-2 opacity-30 text-pink-500" />
                      <span className="text-xs font-medium opacity-50 text-pink-500">Post {i + 1}</span>
                    </>
                  )}
                </a>
              ))}
            </div>
            <div className="mt-8">
              <a href="https://www.instagram.com/schoenheits_lokal/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-white font-semibold hover:text-pink-200 transition-colors">
                Folgen Sie uns auf Instagram <ChevronDown className="w-5 h-5 ml-1 -rotate-90" />
              </a>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* Testimonials Section */}
      <section className="relative overflow-hidden py-16 px-4 bg-white/60 backdrop-blur-sm">
        <RevealOnScroll>
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Was unsere Kundinnen sagen
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Die Zufriedenheit unserer Kundinnen ist unsere höchste Priorität. Sehen Sie, was sie
                über unsere Dienstleistungen zu sagen haben.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 shadow-lg">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold text-gray-800">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.service}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-16 px-4 bg-pink-600/20 backdrop-blur-lg border-t border-pink-200/20">
        {/* Background Video (High Energy) */}
        <LazyBackgroundVideo 
          src="https://cdn.pixabay.com/video/2025/09/24/306150_medium.mp4" 
          opacity={0.8} 
          overlayClass="bg-pink-900/10 backdrop-blur-[1px]" 
        />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold !text-white mb-6">
            Bereit, Ihre Schönheit zu verwandeln?
          </h2>
          <p className="text-xl !text-pink-100 mb-10 max-w-2xl mx-auto">
            Buchen Sie noch heute Ihren Termin und entdecken Sie die Kraft, sich schön und selbstbewusst zu fühlen.
            Unser Team ist bereit, sich um Sie zu kümmern!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/agendar"
              className="inline-flex items-center px-8 py-4 bg-white text-pink-600 rounded-full font-semibold hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Jetzt Buchen
            </Link>
            <a
              href="tel:+41778162933"
              className="inline-flex items-center px-8 py-4 bg-pink-700 text-white rounded-full font-semibold hover:bg-pink-800 transition-all transform hover:scale-105"
            >
              <Phone className="w-5 h-5 mr-2" />
              Jetzt Anrufen
            </a>
          </div>
        </div>
      </section>

      {/* Service/Product Details Modal */}
      {selectedItemForDetails && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedItemForDetails(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
            {selectedItemForDetails.image_url && (
              <div className="h-64 w-full bg-gray-100">
                <img src={optimizeImage(selectedItemForDetails.image_url, 1200)} alt={selectedItemForDetails.name} className="w-full h-full object-cover" />
              </div>
            )}
            <button
              onClick={() => setSelectedItemForDetails(null)}
              className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-lg hover:bg-white text-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                {selectedItemForDetails.category === 'product' ? (
                  <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-semibold uppercase tracking-wide">Produkt</span>
                ) : (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold uppercase tracking-wide">Dienstleistung</span>
                )}
                <span className="text-gray-500 text-sm">{selectedItemForDetails.category !== 'product' ? `${selectedItemForDetails.duration_minutes} min` : ''}</span>
              </div>

              <h3 className="text-2xl font-bold text-gray-800 mb-3">{selectedItemForDetails.name}</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {selectedItemForDetails.description || 'Keine Beschreibung verfügbar.'}
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 mb-1">Preis</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-pink-600">{formatCurrency(applyPrice(selectedItemForDetails))}</span>
                    {(Math.max(promoPerService[selectedItemForDetails.id] || 0, promoStorePct) > 0) && (
                      <span className="text-sm text-gray-400 line-through">{formatCurrency(selectedItemForDetails.price)}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/agendar?serviceName=${encodeURIComponent(String(selectedItemForDetails.name))}`)}
                  className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  {selectedItemForDetails.category === 'product' ? 'Kaufen' : 'Buchen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Schönheitssalon</h3>
              <p className="text-gray-300 text-sm">
                Wir verwandeln Leben durch Schönheit und Wohlbefinden seit 2020.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Dienstleistungen</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Maniküre & Pediküre</li>
                <li>Haarschnitt & Styling</li>
                <li>Gesichtsbehandlungen</li>
                <li>Brazilian Waxing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Kontakt</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  077 816 29 33
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Kalkbreitstrasse 129, 8003 Zurich
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Mo-Fr: 10-18 Uhr, Sa: 09-17 Uhr
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Schnelle Links</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link to="/agendar" className="hover:text-pink-400">Buchen</Link></li>
                <li><a href="#servicos" className="hover:text-pink-400">Dienstleistungen</a></li>
                <li><Link to="/parceria" className="hover:text-pink-400">{t('partnerArea')}</Link></li>
                <li><Link to="/termos" className="hover:text-pink-400">AGB</Link></li>
                <li><Link to="/privacidade" className="hover:text-pink-400">Datenschutz</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 SchönheitsLokal. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}