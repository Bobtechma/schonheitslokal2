import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BookingForm from '@/components/BookingForm'
import { Toaster } from 'sonner'
import { Calendar, Clock, Star, Phone, MapPin, ArrowLeft, Globe } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'

export default function BookingPage() {
  const navigate = useNavigate()
  const [bookingCompleted, setBookingCompleted] = useState(false)
  const { t, language, setLanguage } = useLanguageStore()

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

          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-gray-500" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-pink-500 focus:border-pink-500 block p-2"
            >
              <option value="de-CH">Deutsch (CH)</option>
              <option value="pt-BR">Português (BR)</option>
            </select>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {t('pageTitle')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('pageSubtitle')}
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{t('feature1Title')}</h3>
            <p className="text-gray-600 text-sm">
              {t('feature1Desc')}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{t('feature2Title')}</h3>
            <p className="text-gray-600 text-sm">
              {t('feature2Desc')}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{t('feature3Title')}</h3>
            <p className="text-gray-600 text-sm">
              {t('feature3Desc')}
            </p>
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <BookingForm onComplete={handleBookingComplete} />
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
                <p className="font-medium">Kalkbreitestrasse 129</p>
                <p className="font-medium">8003 Zürich</p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-pink-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">{t('openingHours')}</p>
                <p className="font-medium">{t('weekdays')}: 09:00–18:00</p>
                <p className="font-medium">{t('saturday')}: 09:00–15:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  )
}