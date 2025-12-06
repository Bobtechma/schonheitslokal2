import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
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
  CheckCircle
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Service } from '@/lib/supabase'

export default function HomePage() {
  const navigate = useNavigate()
  const [selectedService] = useState<string | null>(null)
  const [servicesDb, setServicesDb] = useState<Service[]>([])
  const [promoStorePct, setPromoStorePct] = useState(0)
  const [promoPerService, setPromoPerService] = useState<Record<string, number>>({})

  const services = [
    {
      id: 1,
      name: 'Maniküre & Pediküre',
      description: 'Komplette Behandlung für Hände und Füße mit den besten Techniken',
      duration: '90 min',
      price: 150,
      icon: <Heart className="w-8 h-8" />,
      color: 'from-pink-400 to-rose-500'
    },
    {
      id: 2,
      name: 'Haarschnitt & Styling',
      description: 'Personalisierte Haarschnitte und moderne Styling-Techniken',
      duration: '60 min',
      price: 120,
      icon: <Scissors className="w-8 h-8" />,
      color: 'from-purple-400 to-pink-500'
    },
    {
      id: 3,
      name: 'Gesichtsästhetik',
      description: 'Hautreinigung und personalisierte Gesichtsbehandlungen',
      duration: '75 min',
      price: 180,
      icon: <Sparkles className="w-8 h-8" />,
      color: 'from-blue-400 to-purple-500'
    },
    {
      id: 4,
      name: 'Brazilian Waxing',
      description: 'Brasilianischi Intimhaarentfernig: edel, glatt, professionell, höchsch Komfort, exklusiv schön',
      duration: '45 min',
      price: 100,
      icon: <Users className="w-8 h-8" />,
      color: 'from-orange-400 to-pink-500'
    },
    {
      id: 5,
      name: 'Augenbrauen-Design',
      description: 'Personalisierte Augenbrauen-Modellierung und -Design für Ihr Gesicht',
      duration: '30 min',
      price: 40,
      icon: <Award className="w-8 h-8" />,
      color: 'from-green-400 to-blue-500'
    },
    {
      id: 6,
      name: 'Haarbehandlungen',
      description: 'Haar-Botox, intensive Hydratation und Rekonstruktion',
      duration: '120 min',
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
  }, [])

  const applyPrice = (service: Service) => {
    const perSvc = promoPerService[service.id] || 0
    const pct = Math.max(perSvc, promoStorePct)
    return Math.max(0, Math.round(service.price * (1 - pct / 100) * 100) / 100)
  }

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
      <section className="relative bg-gradient-to-br from-pink-100 via-rose-50 to-white py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
                Verwandeln Sie Ihre
                <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                  {' '}Schönheit
                </span>
                <br />
                mit unseren
                <br />
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Exklusiven Dienstleistungen
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-lg">
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
                  className="inline-flex items-center px-8 py-4 bg-white text-pink-500 rounded-full font-semibold hover:bg-gray-50 transition-all border-2 border-pink-500"
                >
                  Dienstleistungen Ansehen
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-pink-200 to-rose-200 rounded-3xl p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  {services.slice(0, 4).map((service, index) => (
                    <div
                      key={service.id}
                      className={`bg-gradient-to-br ${service.color} rounded-2xl p-4 text-white shadow-lg transform rotate-${index % 2 === 0 ? '3' : '-3'} hover:rotate-0 transition-transform`}
                    >
                      <div className="mb-2">{service.icon}</div>
                      <h4 className="font-semibold text-sm">{service.name}</h4>
                      <p className="text-xs opacity-90">{service.duration}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Warum uns wählen?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Wir verpflichten uns zur Exzellenz in jedem Detail und bieten ein einzigartiges
              und personalisiertes Erlebnis für jeden Kunden.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <div className="text-white">{feature.icon}</div>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicos" className="py-16 px-4 bg-gradient-to-br from-gray-50 to-pink-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Unsere Dienstleistungen
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Wir bieten eine breite Palette von Schönheitsdienstleistungen, von Maniküre bis zu
              fortschrittlichen ästhetischen Behandlungen, alles auf Ihre Bedürfnisse zugeschnitten.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicesDb.map((service) => (
              <div
                key={service.id}
                className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 ${selectedService === service.id.toString()
                  ? 'border-pink-500 ring-2 ring-pink-200'
                  : 'border-transparent hover:border-pink-200'
                  }`}
                onClick={() => navigate(`/agendar?serviceName=${encodeURIComponent(String(service.name))}`)}
              >
                <h3 className="text-xl font-bold text-gray-800 mb-2">{service.name}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">{service.duration_minutes} min</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-pink-600">
                        {formatCurrency(applyPrice(service))}
                      </p>
                      {(Math.max(promoPerService[service.id] || 0, promoStorePct) > 0) && (
                        <span className="text-sm text-gray-400 line-through">
                          {formatCurrency(service.price)}
                        </span>
                      )}
                    </div>
                    {(Math.max(promoPerService[service.id] || 0, promoStorePct) > 0) && (
                      <span className="mt-1 inline-block text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                        -{Math.max(promoPerService[service.id] || 0, promoStorePct)}%
                      </span>
                    )}
                  </div>
                  <div className="text-pink-500">
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

          <div className="text-center mt-12">
            <Link
              to="/agendar"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-semibold hover:from-pink-600 hover:to-rose-600 transition-all transform hover:scale-105 shadow-lg"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Dienstleistung Buchen
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
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
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-pink-500 to-rose-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Bereit, Ihre Schönheit zu verwandeln?
          </h2>
          <p className="text-pink-100 mb-8 max-w-2xl mx-auto">
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
              href="tel:+41798967188"
              className="inline-flex items-center px-8 py-4 bg-pink-700 text-white rounded-full font-semibold hover:bg-pink-800 transition-all transform hover:scale-105"
            >
              <Phone className="w-5 h-5 mr-2" />
              Jetzt Anrufen
            </a>
          </div>
        </div>
      </section>

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
                  Kalkbreitestrasse 129, 8003 Zürich
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Mo-Fr: 09-18 Uhr, Sa: 09-15 Uhr
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Schnelle Links</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link to="/agendar" className="hover:text-pink-400">Buchen</Link></li>
                <li><a href="#servicos" className="hover:text-pink-400">Dienstleistungen</a></li>
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