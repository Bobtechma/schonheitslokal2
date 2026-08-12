import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BookingForm from '@/components/BookingForm'
import { Toaster } from 'sonner'
import { Calendar, Clock, Star, Phone, MapPin, ArrowLeft, Globe, ShoppingBag } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import { updateMetaTags } from '@/lib/seo'
import { useBookingStore } from '@/stores/bookingStore'
import { supabase } from '@/lib/supabase'

export default function BookingPage() {
  const navigate = useNavigate()
  const [bookingCompleted, setBookingCompleted] = useState(false)
  const { t, language, setLanguage } = useLanguageStore()
  const { selectedServices } = useBookingStore()
  const [loadingWidget, setLoadingWidget] = useState(true)

  useEffect(() => {
    // Simulate external widget loading time (e.g., Visuel IA iframe)
    const timer = setTimeout(() => {
      setLoadingWidget(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    supabase.rpc('increment_page_view', { p_page_path: '/agendar' })
      .then(({ error }) => { if (error) console.error('Error tracking view:', error) })
  }, [])

  useEffect(() => {
    const title = language === 'pt-BR' 
      ? 'Agendar Horário | Schönheits Lokal Zurique' 
      : 'Termin buchen | Schönheits Lokal Zurich';
    const description = language === 'pt-BR'
      ? 'Agende seu horário de beleza online. Waxing brasileiro, manicure, tratamento de queratina em Zurique Kreis 4.'
      : 'Buchen Sie Ihren Schönheitstermin online. Brazilian Waxing, Maniküre, Keratin-Behandlung in Zürich Kreis 4.';
    
    updateMetaTags(title, description, '/agendar', language);
  }, [language]);

  const isProductOrder = selectedServices.length > 0 && selectedServices.every(s => s.category === 'product')

  const handleBookingComplete = (appointmentId: string) => {
    setBookingCompleted(true)
    setTimeout(() => {
      navigate('/confirmacao', { state: { appointmentId } })
    }, 3000)
  }

  if (bookingCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {t('successTitle')}
            </h1>
            <p className="text-gray-600">
              {t('successMessage')}
            </p>
          </div>
          <div className="animate-pulse text-pink-600">
            {t('redirecting')}
          </div>
        </div>
        <Toaster position="top-right" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-pink-600 hover:text-pink-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('back')}
          </button>


        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {isProductOrder ? (t('productPageTitle') || 'Bestellen Sie Ihre Produkte') : t('pageTitle')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {isProductOrder ? (t('productPageSubtitle') || 'Bestellen Sie Ihre Lieblingsprodukte online zur Abholung.') : t('pageSubtitle')}
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {isProductOrder ? <ShoppingBag className="w-6 h-6 text-pink-600" /> : <Calendar className="w-6 h-6 text-pink-600" />}
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{isProductOrder ? (t('productFeature1Title') || 'Online-Bestellung') : t('feature1Title')}</h3>
            <p className="text-gray-600 text-sm">
              {isProductOrder ? (t('productFeature1Desc') || 'Bestellen Sie Ihre Produkte 24/7 einfach und sicher') : t('feature1Desc')}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{isProductOrder ? (t('productFeature2Title') || 'Flexible Abholung') : t('feature2Title')}</h3>
            <p className="text-gray-600 text-sm">
              {isProductOrder ? (t('productFeature2Desc') || 'Wählen Sie die beste Zeit für die Abholung') : t('feature2Desc')}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{isProductOrder ? (t('productFeature3Title') || 'Qualitätsprodukte') : t('feature3Title')}</h3>
            <p className="text-gray-600 text-sm">
              {isProductOrder ? (t('productFeature3Desc') || 'Von Experten ausgewählte Produkte für Ihre Pflege') : t('feature3Desc')}
            </p>
          </div>
        </div>

        {/* Booking Form / Visuel IA Widget */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden relative min-h-[500px]">
          {loadingWidget && (
            <div className="absolute inset-0 p-8 space-y-6 bg-white animate-pulse z-10">
              <div className="h-8 bg-pink-100/50 rounded-md w-1/3 mb-8"></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-100 rounded w-1/2 mb-4"></div>
                  <div className="h-20 bg-rose-50/50 rounded-xl w-full"></div>
                  <div className="h-20 bg-rose-50/50 rounded-xl w-full"></div>
                </div>

                <div className="space-y-4">
                  <div className="h-6 bg-gray-100 rounded w-1/2 mb-4"></div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <div key={i} className="h-12 bg-pink-50/50 rounded-lg"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={`transition-opacity duration-1000 ${loadingWidget ? 'opacity-0' : 'opacity-100'}`}>
            <BookingForm onComplete={handleBookingComplete} />
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-12 bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('contactInfo')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-pink-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">{t('phone')}</p>
                <p className="font-medium">077 816 29 33</p>
              </div>
            </div>
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-pink-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">{t('address')}</p>
                <p translate="no" className="font-medium notranslate">Schönheits Lokal</p>
                <p className="font-medium">Kalkbreitstrasse 129</p>
                <p className="font-medium">8003 Zurich</p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-pink-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">{t('openingHours')}</p>
                <p className="font-medium">{t('weekdays')}: 10:00–18:00</p>
                <p className="font-medium">{t('saturday')}: 09:00–17:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  )
}