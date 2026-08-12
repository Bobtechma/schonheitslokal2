import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Calendar, Clock, User, CheckCircle, ArrowRight, ArrowLeft, Ban, CreditCard, QrCode, Landmark, Store, Truck, Plus, X, Trash2 } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useBookingStore } from '@/stores/bookingStore'
import { useLanguageStore } from '@/stores/languageStore'
import { Service, Tables } from '@/lib/supabase'
import { getAvailabilityPerProfessional } from '@/lib/availability'
import { formatCurrency, getDurationText } from '@/lib/utils'
import { sendBookingConfirmation } from '@/lib/email'
import { sendBookingConfirmationWhatsApp } from '@/lib/whatsapp'
import ClientSearch from './ClientSearch'
import { QRCodeSVG } from 'qrcode.react'
import "react-datepicker/dist/react-datepicker.css"

// Duplicate import removed

export default function BookingForm({ onComplete }: { onComplete?: (appointmentId: string) => void }) {
  const {
    services,
    setServices,
    selectedServices,
    setSelectedServices,
    setSelectedProfessionalId,
    setSelectedDate,
    setSelectedTime,
    step,
    setStep,
    totalPrice,
    totalDuration,
    bookingPaused,
    setBookingPaused,
    promoStorePct,
    promoPerService,
    selectedDate,
    selectedTime,
    clientInfo,
    termsAccepted,
    upsellingEnabled,
    upsellingDiscountPct,
    upsellingServiceIds,
    setUpsellingStatus,
    addUpsellingService,
    removeUpsellingService,
    roulettePrizeLabel,
    rouletteDiscountPct
  } = useBookingStore()

  const { t, language } = useLanguageStore()

  // Helper to get localized content
  const getLocalizedContent = useCallback((service: any, field: 'name' | 'description') => {
    if (language === 'pt-BR') {
      if (field === 'name' && service.name_pt) return service.name_pt
      if (field === 'description' && service.description_pt) return service.description_pt
    } else {
      // Default to German (de-CH)
      if (field === 'name' && service.name_de) return service.name_de
      if (field === 'description' && service.description_de) return service.description_de
    }
    // Fallback to default fields or t()
    const val = service[field]
    return t(val) || val
  }, [language, t])

  const [searchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  /* const { t } = useLanguageStore()  <- Removing duplicate destructuring */
  const [showServiceSelection, setShowServiceSelection] = useState(false)
  const [upsellingItem, setUpsellingItem] = useState<Service | null>(null)

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

  useEffect(() => {
    console.log('BookingForm: Service check effect triggered', { servicesLength: services.length, selectedServicesCount: selectedServices.length })
    const serviceName = searchParams.get('serviceName')
    if (serviceName && services.length > 0) {
      const service = services.find(s => s.name === serviceName)
      if (service) {
        const isSelected = selectedServices.some(s => s.id === service.id)
        if (!isSelected) {
          console.log('BookingForm: Auto-selecting service:', service.name)
          setSelectedServices([...selectedServices, service])
        }
      }
    }
  }, [services, searchParams, selectedServices, setSelectedServices])

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

    // Fetch upselling settings
    const { data: upsData } = await supabase
      .from('system_settings')
      .select('key,value')
      .in('key', ['upselling_enabled', 'upselling_discount_pct'])
    
    if (upsData) {
      const enabled = upsData.find(s => s.key === 'upselling_enabled')?.value === 'true'
      const discount = Number(upsData.find(s => s.key === 'upselling_discount_pct')?.value || 0)
      setUpsellingStatus({ enabled, discountPct: discount })
    }
  }

  const handleServiceToggle = (service: Service) => {
    const isSelected = selectedServices.some(s => s.id === service.id)
    let newServices: Service[]

    if (isSelected) {
      newServices = selectedServices.filter(s => s.id !== service.id)
      removeUpsellingService(service.id)
    } else {
      newServices = [...selectedServices, service]
      
      // Upselling Trigger
      if (upsellingEnabled && service.category === 'service' && !upsellingServiceIds.includes(service.id)) {
        // Find a complementary service in the same subcategory
        const suggestion = services.find(s => 
          s.id !== service.id && 
          s.category === 'service' &&
          s.subcategory === service.subcategory &&
          !selectedServices.some(sel => sel.id === s.id)
        )
        
        if (suggestion) {
          setUpsellingItem(suggestion)
        }
      }
    }

    setSelectedServices(newServices)
  }

  const handleNext = () => {
    if (step === 1 && selectedServices.length === 0) {
      toast.error(t('selectServiceError'))
      return
    }

    // Skip professional and date selection if only products are selected
    if (step === 1) {
      const onlyProducts = selectedServices.every(s => s.category === 'product')
      if (onlyProducts) {
        setSelectedProfessionalId(null)
        // Set default date/time for product orders (required by DB)
        const today = new Date().toISOString().split('T')[0]
        setSelectedDate(today)
        setSelectedTime('00:00')
        setStep(5)
        return
      }
    }

    // Validation for Step 2 (Date)
    if (step === 2) {
      if (!selectedDate) {
        toast.error(t('selectDateError'))
        return
      }
    }

    // Validation for Step 4 (Time)
    if (step === 4) {
      if (!selectedTime) {
        toast.error(t('selectTimeError' as any) || 'Bitte Zeit wählen')
        return
      }
    }

    // Validation for Step 5 (Client Info)
    if (step === 5) {
      if (!clientInfo.fullName || !clientInfo.email || !clientInfo.phone) {
        toast.error(t('fillDataError'))
        return
      }
      if (!termsAccepted) {
        toast.error(t('termsError') || t('fillDataError'))
        return
      }
    }

    setStep(step + 1)
  }

  const handleBack = () => {
    // Skip back to services if only products are selected
    if (step === 5) {
      const onlyProducts = selectedServices.every(s => s.category === 'product')
      if (onlyProducts) {
        setStep(1)
        return
      }
    }
    setStep(step - 1)
  }

  if (bookingPaused) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
          <Ban className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('bookingsPausedTitle')}</h2>
          <p className="text-gray-600">{t('bookingsPausedDesc')}</p>
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
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5, 6].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= stepNumber
                ? 'bg-pink-500 text-white'
                : 'bg-gray-200 text-gray-600'
                }`}>
                {step > stepNumber ? <CheckCircle className="w-5 h-5" /> : stepNumber}
              </div>
              {stepNumber < 6 && (
                <div className={`w-12 h-1 mx-2 ${step > stepNumber ? 'bg-pink-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>{selectedServices.length > 0 && selectedServices.every(s => s.category === 'product') ? (t('products') || t('step1')) : t('step1')}</span>
          <span>{selectedServices.length > 0 && selectedServices.every(s => s.category === 'product') ? (t('collectionDate') || t('step2')) : t('step2')}</span>
          <span>{t('step3')}</span>
          <span>{t('step4')}</span>
          <span>{t('step5')}</span>
          <span>{t('step6')}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        {step === 1 && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Calendar className="w-6 h-6 mr-2 text-pink-500" />
                {selectedServices.length > 0 && selectedServices.every(s => s.category === 'product') ? (t('selectedProducts') || 'Produkte') : t('selectServices')}
              </h2>
              {showServiceSelection && (
                <button
                  onClick={() => setShowServiceSelection(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center text-sm font-medium"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('confirm') || 'Concluir'}
                </button>
              )}
            </div>

            {!showServiceSelection ? (
              <div className="space-y-4">
                {/* Selected Services List */}
                {selectedServices.length > 0 ? (
                  <div className="space-y-3">
                    {selectedServices.map((service) => (
                      <div key={service.id} className="border border-pink-200 bg-pink-50 rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-gray-800">{getLocalizedContent(service, 'name')}</h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            {service.category !== 'product' && (
                              <>
                                <Clock className="w-3 h-3 mr-1" />
                                {getDurationText(service.duration_minutes)}
                                <span className="mx-2">•</span>
                              </>
                            )}
                            <span className="font-medium text-pink-600">{formatCurrency(applyPrice(service))}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleServiceToggle(service)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">{t('noServicesSelected') || 'Nenhum serviço selecionado'}</p>
                )}

                {/* Add Service Button */}
                <button
                  onClick={() => setShowServiceSelection(true)}
                  className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-pink-500 hover:text-pink-500 hover:bg-pink-50 transition-all flex items-center justify-center font-medium"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {t('addService') || 'Adicionar Serviço/Produto'}
                </button>
              </div>
            ) : (
              /* Full Service Selection List */
              <>
                {services.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">{t('noServices')}</p>
                  </div>
                ) : (
                  <div className="space-y-8 max-h-[60vh] overflow-y-auto p-1 custom-scrollbar">
                    {Object.entries(services.reduce((acc, service) => {
                      const sub = service.subcategory || (service.category === 'product' ? (t('products') || 'Produkte') : (t('general') || 'Allgemein'))
                      if (!acc[sub]) acc[sub] = []
                      acc[sub].push(service)
                      return acc
                    }, {} as Record<string, Service[]>)).map(([subcategory, items]) => (
                      <div key={subcategory}>
                        <h3 className="font-semibold text-lg text-gray-700 mb-3 border-b pb-1">{subcategory}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(items as Service[]).map((service) => (
                            <div
                              key={service.id}
                              className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedServices.some(s => s.id === service.id)
                                ? 'border-pink-500 bg-pink-50'
                                : 'border-gray-200 hover:border-pink-300'
                                }`}
                              onClick={() => handleServiceToggle(service)}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-gray-800">{getLocalizedContent(service, 'name')}</h3>
                                {selectedServices.some(s => s.id === service.id) ? (
                                  <CheckCircle className="w-5 h-5 text-pink-500" />
                                ) : (
                                  <span className="text-pink-600 font-bold">
                                    {formatCurrency(applyPrice(service))}
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm mb-2">{getLocalizedContent(service, 'description')}</p>
                              {service.category !== 'product' && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {getDurationText(service.duration_minutes)}
                                </div>
                              )}
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <span className="bg-gray-100 px-2 py-1 rounded">{service.category}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Upselling Popup */}
            {upsellingItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border-2 border-pink-100 animate-upselling-pulse">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Plus className="w-10 h-10 text-pink-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('upsellingTitle')}</h3>
                    <p className="text-gray-600 mb-6">
                      {t('upsellingDescPrefix')} <span className="font-semibold text-pink-600">{getLocalizedContent(selectedServices[selectedServices.length - 1], 'name')}</span> {t('upsellingDescMiddle')} <span className="font-semibold text-pink-600">{getLocalizedContent(upsellingItem, 'name')}</span>{t('upsellingDescSuffix')}
                    </p>
                    <div className="bg-pink-50 rounded-xl p-4 mb-8">
                      <p className="text-sm text-pink-600 font-medium">{t('upsellingYouSave')}</p>
                      <p className="text-4xl font-black text-pink-500">{upsellingDiscountPct}% OFF</p>
                      <p className="text-sm text-pink-400 mt-1 line-through">{formatCurrency(upsellingItem.price)}</p>
                      <p className="text-xl font-bold text-pink-600">{formatCurrency(upsellingItem.price * (1 - Number(upsellingDiscountPct) / 100))}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setUpsellingItem(null)}
                        className="px-6 py-3 border-2 border-gray-200 text-gray-500 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                      >
                        {t('upsellingDecline')}
                      </button>
                      <button
                        onClick={() => {
                          addUpsellingService(upsellingItem.id)
                          setSelectedServices([...selectedServices, upsellingItem])
                          setUpsellingItem(null)
                          toast.success(t('upsellingSuccessToast'))
                        }}
                        className="px-6 py-3 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 shadow-lg shadow-pink-200 transition-all transform hover:scale-105"
                      >
                        {t('upsellingAccept')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && <DateSelection />}
        {step === 3 && <ProfessionalSelection />}
        {step === 4 && <TimeSelection />}
        {step === 5 && <ClientInfoForm />}
        {step === 6 && <BookingConfirmation onComplete={onComplete} />}
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

        {step < 6 && (
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

function ProfessionalSelection() {
  const { selectedProfessionalId, setSelectedProfessionalId, selectedServices, selectedDate, totalDuration } = useBookingStore()
  const [professionals, setProfessionals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [availability, setAvailability] = useState<Record<string, number>>({})
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const { t } = useLanguageStore()

  useEffect(() => {
    const fetchProfessionals = async () => {
      if (!selectedDate) {
        setLoading(false)
        return
      }

      setLoading(true)
      setAvailabilityLoading(true)
      try {
        const [year, month, day] = selectedDate.split('-').map(Number)
        const dateObj = new Date(year, month - 1, day)
        const dayOfWeek = dateObj.getDay()

        const { data: allProfessionals, error: profError } = await supabase
          .from('professionals')
          .select('*')
          .eq('active', true)
          .order('name')

        if (profError || !allProfessionals) {
          setLoading(false)
          setAvailabilityLoading(false)
          return
        }

        const { data: profServices } = await supabase
          .from('professional_services')
          .select('professional_id, service_id')

        const servicesByProf: Record<string, Set<string>> = {}
        profServices?.forEach(item => {
          if (!servicesByProf[item.professional_id]) {
            servicesByProf[item.professional_id] = new Set()
          }
          servicesByProf[item.professional_id].add(item.service_id)
        })

        const { data: profSchedules } = await supabase
          .from('professional_schedule')
          .select('professional_id')
          .eq('day_of_week', dayOfWeek)
          .eq('is_active', true)

        const scheduledProfIds = new Set(profSchedules?.map(s => s.professional_id))

        const filtered = allProfessionals.filter(prof => {
          const profServiceIds = servicesByProf[prof.id]
          if (!profServiceIds || !selectedServices.every(s => profServiceIds.has(s.id))) return false
          if (!scheduledProfIds.has(prof.id)) return false
          return true
        })

        // Get availability per professional
        const availabilityMap = await getAvailabilityPerProfessional(selectedDate, selectedServices, totalDuration)
        const availRecord: Record<string, number> = {}
        availabilityMap.forEach((val, key) => {
          availRecord[key] = val.slotCount
        })
        setAvailability(availRecord)

        // Filter out fully booked professionals
        const availableProfessionals = filtered.filter(prof => (availRecord[prof.id] || 0) > 0)
        setProfessionals(availableProfessionals)
      } catch (error) {
        console.error('Error fetching professionals:', error)
      } finally {
        setLoading(false)
        setAvailabilityLoading(false)
      }
    }

    console.log('ProfessionalSelection: fetchProfessionals triggered', { 
      selectedDate, 
      selectedServicesCount: selectedServices.length, 
      totalDuration 
    })
    fetchProfessionals()
  }, [selectedServices, selectedDate, totalDuration])

  if (loading || availabilityLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  // Calculate total availability for "Any Professional"
  const totalSlots = Object.values(availability).reduce((sum, count) => sum + count, 0)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <User className="w-6 h-6 mr-2 text-pink-500" />
        {t('selectProfessional')}
      </h2>

      {professionals.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{t('noProfessionalsAvailable')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            onClick={() => {
              setSelectedProfessionalId(null)
              useBookingStore.getState().setSelectedTime(null)
            }}
            className={`border rounded-lg p-4 cursor-pointer transition-all flex items-center gap-3 ${selectedProfessionalId === null
              ? 'border-pink-500 bg-pink-50 shadow-md transform scale-105'
              : 'border-gray-200 hover:border-pink-300'
              }`}
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{t('anyProfessional')}</h3>
              <p className="text-sm text-gray-500">{t('fastestAvailability')}</p>
              {totalSlots > 0 && (
                <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  totalSlots >= 3 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {totalSlots} {t('slotsAvailable')}
                </span>
              )}
            </div>
            {selectedProfessionalId === null && <CheckCircle className="w-5 h-5 text-pink-500 ml-auto" />}
          </div>

          {professionals.map((prof) => {
            const slotCount = availability[prof.id] || 0
            return (
              <div
                key={prof.id}
                onClick={() => {
                  setSelectedProfessionalId(prof.id)
                  useBookingStore.getState().setSelectedTime(null)
                }}
                className={`border rounded-lg p-4 cursor-pointer transition-all flex items-center gap-3 ${selectedProfessionalId === prof.id
                  ? 'border-pink-500 bg-pink-50 shadow-md transform scale-105'
                  : 'border-gray-200 hover:border-pink-300'
                  }`}
              >
                {prof.photo_url ? (
                  <img src={prof.photo_url} alt={prof.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-500" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{prof.name}</h3>
                  {prof.bio && <p className="text-sm text-gray-500 line-clamp-1">{prof.bio}</p>}
                  {slotCount > 0 && (
                    <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      slotCount >= 3 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {slotCount} {t('slotsAvailable')}
                    </span>
                  )}
                </div>
                {selectedProfessionalId === prof.id && <CheckCircle className="w-5 h-5 text-pink-500 ml-auto" />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


function DateSelection() {
  const { setSelectedDate, selectedDate, setSelectedProfessionalId, setSelectedTime } = useBookingStore()
  const { t } = useLanguageStore()

  const getTodayString = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  return (
    <div className="max-w-md mx-auto">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('bookingDate')}
      </label>
      <div className="w-full p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
        <input
          type="date"
          value={selectedDate || ''}
          min={getTodayString()}
          onChange={(e) => {
            setSelectedDate(e.target.value)
            setSelectedProfessionalId(null)
            setSelectedTime(null)
          }}
          className="w-full px-4 py-4 text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white shadow-sm"
          required
        />
        <p className="mt-4 text-sm text-gray-500 text-center">
          {t('selectDateFirst')}
        </p>
      </div>
    </div>
  )
}

function TimeSelection() {
  const { 
    selectedDate, 
    totalDuration, 
    selectedProfessionalId, 
    selectedServices,
    selectedTime,
    setSelectedTime 
  } = useBookingStore()
  const { t } = useLanguageStore()
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAvailableTimes = useCallback(async () => {
    if (!selectedDate) return

    setLoading(true)
    try {
      const availabilityMap = await getAvailabilityPerProfessional(
        selectedDate,
        selectedServices,
        totalDuration,
        selectedProfessionalId
      )

      // Merge all available slots from all professionals (or just the selected one)
      const allSlots = new Set<string>()
      availabilityMap.forEach((val) => {
        val.availableSlots.forEach(slot => allSlots.add(slot))
      })

      setAvailableTimes(Array.from(allSlots).sort())
    } catch (error) {
      console.error('Error fetching available times:', error)
      toast.error(t('loadTimesError'))
    } finally {
      setLoading(false)
    }
  }, [selectedDate, totalDuration, t, selectedProfessionalId, selectedServices])

  useEffect(() => {
    fetchAvailableTimes()
  }, [fetchAvailableTimes])

  return (
    <div className="max-w-2xl mx-auto">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('availableTime')}
      </label>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[300px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mb-3"></div>
            <p className="text-gray-500 text-sm">{t('loading')}</p>
          </div>
        ) : availableTimes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
            <Clock className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-center px-4">{t('noTimesAvailable')}</p>
            <p className="text-xs text-center mt-2 text-gray-400">{t('selectAnotherDate')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {availableTimes.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`
                  px-4 py-4 text-base font-bold rounded-xl border transition-all duration-200
                  flex items-center justify-center
                  ${selectedTime === time
                    ? 'bg-pink-500 text-white border-pink-500 ring-4 ring-pink-100 scale-105 shadow-md'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-pink-300 hover:bg-white hover:shadow-sm'
                  }
                `}
              >
                <Clock className={`w-4 h-4 mr-2 ${selectedTime === time ? 'text-white' : 'text-pink-400'}`} />
                {time}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ClientInfoForm() {
  const { clientInfo, setClientInfo, termsAccepted, setTermsAccepted, selectedServices, selectedShippingOption } = useBookingStore()
  const { t, language } = useLanguageStore()

  const isProductOrder = selectedServices.every(s => s.category === 'product')



  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <User className="w-6 h-6 mr-2 text-pink-500" />
        {isProductOrder ? (t('yourContactData') || 'Ihre Kontaktdaten') : t('clientData')}
      </h2>

      <div className="mb-6">
        <ClientSearch
          onSelect={(client: any) => {
            setClientInfo({
              fullName: client.full_name,
              email: client.email || '',
              phone: client.phone || '',
              address: client.address || '',
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

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('addressLabel')}
          </label>
          <input
            type="text"
            value={clientInfo.address}
            onChange={(e) => setClientInfo({ address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder={language === 'pt-BR' ? 'Rua, Número, Cidade, CEP' : 'Strasse, Nummer, Ort, PLZ'}
          />
        </div>

        {selectedShippingOption && (
          <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Truck className="w-4 h-4 mr-2" />
                {t('shippingMethod') || 'Versandart'}
              </label>
              <div className="font-medium text-gray-900">{selectedShippingOption.name}</div>
            </div>
            <span className="font-semibold text-gray-700">{formatCurrency(selectedShippingOption.price)}</span>
          </div>
        )}

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

        {!isProductOrder && (
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
        )}

        {!isProductOrder && (
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
        )}

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

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

function StripePaymentForm({ onSuccess }: { onSuccess: (paymentIntentId: string) => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const { t } = useLanguageStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setProcessing(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message || 'An error occurred')
      setProcessing(false)
      return
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/confirmacao',
      },
      redirect: 'if_required'
    })

    if (confirmError) {
      setError(confirmError.message || 'Payment failed')
      setProcessing(false)
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id)
    } else {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full mt-4 bg-pink-500 text-white py-3 rounded-lg font-semibold hover:bg-pink-600 transition-colors disabled:opacity-50 flex items-center justify-center"
      >
        {processing ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          t('confirmAndPay') || 'Confirm & Pay'
        )}
      </button>
    </form>
  )
}

function BookingConfirmation({ onComplete }: { onComplete?: (appointmentId: string) => void }) {
  const {
    selectedServices,
    selectedDate,
    selectedTime,
    totalPrice,
    subtotal,
    totalDiscount,
    totalDuration,
    clientInfo,
    termsAccepted,
    paymentMethod,
    setPaymentMethod,
    selectedProfessionalId,
    selectedShippingOption,
    roulettePrizeLabel,
    rouletteDiscountPct
  } = useBookingStore()
  const [loading, setLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const { t, language } = useLanguageStore()
  const { promoStorePct, promoPerService } = useBookingStore()

  const applyPrice = (service: any) => {
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
  }

  const getLocalizedContent = (service: any, field: 'name' | 'description') => {
    if (language === 'pt-BR') {
      if (field === 'name' && service.name_pt) return service.name_pt
      if (field === 'description' && service.description_pt) return service.description_pt
    } else {
      if (field === 'name' && service.name_de) return service.name_de
      if (field === 'description' && service.description_de) return service.description_de
    }
    const val = service[field]
    return t(val) || val
  }

  useEffect(() => {
    if (paymentMethod === 'credit_card' && !clientSecret) {
      fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalPrice,
          currency: 'chf',
          metadata: {
            client_name: clientInfo.fullName,
            client_email: clientInfo.email,
            items: selectedServices.map(s => s.name).join(', '),
            is_product: selectedServices.every(s => s.category === 'product'),
            date: selectedDate,
            time: selectedTime
          }
        })
      })
        .then(res => res.json())
        .then(data => setClientSecret(data.clientSecret))
        .catch(err => console.error('Error creating payment intent:', err))
    }
  }, [paymentMethod, totalPrice, clientSecret, clientInfo, selectedServices, selectedDate, selectedTime])

  const handleFinalizeBooking = async (stripePaymentIntentId?: string) => {
    if (!termsAccepted) {
      toast.error(t('termsAccept'))
      return
    }

    setLoading(true)
    try {
      const { data: currentUser } = await supabase.auth.getUser()
      const userId = currentUser.user?.id && currentUser.user.id.trim() !== '' ? currentUser.user.id : null

      const sanitize = (val: string | null | undefined) => {
        if (!val) return null
        const trimmed = val.trim()
        if (trimmed === '' || trimmed.toLowerCase() === 'null') return null
        return trimmed
      }

      const sanitizeDate = (val: string | null | undefined) => {
        const sanitized = sanitize(val)
        if (!sanitized) return null
        if (/^\d{4}-\d{2}-\d{2}$/.test(sanitized)) return sanitized
        return null
      }

      // 1. Search or Create Client
      let clientId: string

      const clientName = sanitize(clientInfo.fullName) || 'Cliente'
      const clientEmail = sanitize(clientInfo.email)
      const clientPhone = sanitize(clientInfo.phone) || `temp_${Date.now()}`

      // Try to find existing client by email or phone
      let existingClients: { id: string }[] = []

      if (clientEmail) {
        const { data, error } = await supabase.from('clients').select('id').eq('email', clientEmail).limit(1)
        if (!error && data) existingClients = data
      }
      
      if (!existingClients.length && clientPhone) {
        const { data, error } = await supabase.from('clients').select('id').eq('phone', clientPhone).limit(1)
        if (!error && data) existingClients = data
      }

      if (existingClients.length > 0) {
        clientId = existingClients[0].id
        await supabase
          .from('clients')
          .update({
            full_name: sanitize(clientInfo.fullName),
            phone: sanitize(clientInfo.phone),
            email: sanitize(clientInfo.email),
            address: sanitize(clientInfo.address),
            birth_date: sanitizeDate(clientInfo.birthDate),
            gender: sanitize(clientInfo.gender),
            allergies: sanitize(clientInfo.allergies),
            preferences: sanitize(clientInfo.preferences),
            updated_at: new Date().toISOString()
          })
          .eq('id', clientId)
      } else {
        // Simple insert - just full_name and phone
        const insertData = {
          full_name: sanitize(clientInfo.fullName) || 'Cliente',
          phone: sanitize(clientInfo.phone) || `temp_${Date.now()}`
        }

        console.log('CLIENT INSERT:', insertData)
        
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert([insertData])
          .select()
          .single()

        console.log('CLIENT RESULT:', newClient, clientError)
        
        if (clientError) {
          alert('Error creating client: ' + clientError.message)
          throw clientError
        }
        
        clientId = newClient.id
      }

      // 2. Check for conflicts before creating appointment (considering duration overlap)
      const normalizeDate = (d: string) => d?.slice(0, 10)
      const normalizeTime = (t: string) => (t?.length === 5 ? `${t}:00` : t)
      const profId = selectedProfessionalId === 'all' ? null : selectedProfessionalId
      const selectedTimeNormalized = normalizeTime(selectedTime!)

      if (profId && totalDuration > 0) {
        // Query existing appointments for this professional on this date
        const { data: existingAppts } = await supabase
          .from('appointments')
          .select('id, appointment_time, total_duration_minutes')
          .eq('professional_id', profId)
          .eq('appointment_date', normalizeDate(selectedDate!))
          .in('status', ['confirmed', 'completed'])

        // Check for exact time match OR overlap
        if (existingAppts && existingAppts.length > 0) {
          const [newHour, newMin] = selectedTimeNormalized.split(':').map(Number)
          const newStartMins = newHour * 60 + newMin
          const newEndMins = newStartMins + totalDuration

          const hasConflict = existingAppts.some(apt => {
            const [existHour, existMin] = apt.appointment_time.split(':').map(Number)
            const existStartMins = existHour * 60 + existMin
            const existEndMins = existStartMins + (apt.total_duration_minutes || 0)

            // Check overlap: new start is during existing OR new end is during existing OR new completely contains existing
            return (newStartMins >= existStartMins && newStartMins < existEndMins) ||
                   (newEndMins > existStartMins && newEndMins <= existEndMins) ||
                   (newStartMins <= existStartMins && newEndMins >= existEndMins)
          })

          if (hasConflict) {
            toast.error(t('appointmentConflict') || 'Este horário conflita com outro agendamento!')
            setLoading(false)
            return
          }
        }
      }

      // 3. Create appointment using direct INSERT (more reliable)
      const pm = paymentMethod as unknown as string
      const paymentMethodValue = !pm || pm === 'pending' ? 'salon' : pm
      
      const { data: appointment, error: insertError } = await supabase
        .from('appointments')
        .insert({
          client_id: clientId,
          user_id: userId,
          professional_id: profId,
          appointment_date: normalizeDate(selectedDate!),
          appointment_time: normalizeTime(selectedTime!),
          total_price: Number(totalPrice),
          total_duration_minutes: Number(totalDuration),
          status: 'confirmed',
          notes: '',
          payment_method: paymentMethodValue,
          payment_status: stripePaymentIntentId ? 'paid' : 'pending',
          stripe_payment_intent_id: stripePaymentIntentId
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert Error:', insertError)
        toast.error(insertError.message || t('bookingError'))
        setLoading(false)
        return
      }

      const appointmentId = appointment.id

      // Insert services
      for (let i = 0; i < selectedServices.length; i++) {
        const service = selectedServices[i]
        await supabase.from('appointment_services').insert({
          appointment_id: appointmentId,
          service_id: service.id,
          order_index: i,
          price_at_time: applyPrice(service),
          duration_at_time: service.duration_minutes
        })
      }

      // 3. Success Flow
      const emailData = {
        clientName: clientInfo.fullName,
        clientEmail: clientInfo.email,
        appointmentDate: selectedDate!,
        appointmentTime: selectedTime!,
        appointmentId: appointmentId,
        services: selectedServices.map(s => ({ name: getLocalizedContent(s, 'name'), price: applyPrice(s) })),
        totalPrice: totalPrice,
        language: language,
        phone: clientInfo.phone,
        paymentMethod: paymentMethod === 'credit_card' ? (t('payOnline' as any) || 'Online') : (t('paymentSalon' as any) || 'No Salão')
      }

      await sendBookingConfirmation(emailData)
      await sendBookingConfirmationWhatsApp(emailData)

      if (onComplete) {
        onComplete(appointmentId)
      }
    } catch (error) {
      console.error('Error confirming booking:', error)
      toast.error(t('bookingError') || 'Error confirming booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <CheckCircle className="w-6 h-6 mr-2 text-pink-500" />
        {selectedServices.every(s => s.category === 'product') ? (t('confirmOrder') || 'Bestellung bestätigen') : (t('confirmBooking') || 'Confirm Booking')}
      </h2>

      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">{selectedServices.every(s => s.category === 'product') ? (t('orderSummary') || 'Bestellübersicht') : (t('summary') || 'Summary')}</h3>
        <div className="space-y-2 mb-4">
          {!selectedServices.every(s => s.category === 'product') && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('date')}:</span>
                <span className="font-medium">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('time')}:</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">{t('services')}:</span>
            <div className="text-right">
              {selectedServices.map(s => (
                <div key={s.id} className="text-sm">{s.name}</div>
              ))}
            </div>
          </div>

          <div className="border-t pt-3 mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Valor Total:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Desconto:</span>
                <span className="font-bold text-red-500">-{formatCurrency(totalDiscount)}</span>
              </div>
            )}

            {selectedShippingOption && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{selectedShippingOption.name}:</span>
                <span className="font-medium">{formatCurrency(selectedShippingOption.price)}</span>
              </div>
            )}

            <div className="pt-2 flex justify-between font-bold text-xl text-gray-900">
              <span>Total com Desconto:</span>
              <span className="text-pink-600">{formatCurrency(totalPrice)}</span>
            </div>
          </div>

          {roulettePrizeLabel && rouletteDiscountPct > 0 && (
            <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-3 py-2 text-sm">
              <span className="text-lg">🎰</span>
              <div>
                <span className="font-bold">Prêmio da Roleta aplicado!</span>
                <span className="ml-1 text-emerald-600">({rouletteDiscountPct}% off: {roulettePrizeLabel})</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">{t('paymentMethod') || 'Payment Method'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setPaymentMethod('credit_card')}
            className={`p-4 border rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'credit_card' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 hover:border-pink-200'}`}
          >
            <CreditCard className="w-6 h-6" />
            <span className="font-medium text-center">
              {selectedServices.every(s => s.category === 'product') ? 'Online (Twint / Card)' : 'Online (Card)'}
            </span>
          </button>



          <button
            onClick={() => !selectedServices.every(s => s.category === 'product') && setPaymentMethod('salon')}
            disabled={selectedServices.every(s => s.category === 'product')}
            className={`p-4 border rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'salon'
              ? 'border-pink-500 bg-pink-50 text-pink-700'
              : selectedServices.every(s => s.category === 'product')
                ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                : 'border-gray-200 hover:border-pink-200'
              }`}
          >
            <Store className="w-6 h-6" />
            <span className="font-medium">{t('paymentSalon') || 'Pay at Salon'}</span>
          </button>
        </div>
      </div>

      {paymentMethod === 'credit_card' && clientSecret && (
        <div className="mb-6">
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <StripePaymentForm onSuccess={handleFinalizeBooking} />
          </Elements>
        </div>
      )}

      {(paymentMethod === 'salon') && (
        <button
          onClick={() => handleFinalizeBooking()}
          disabled={loading}
          className="w-full bg-pink-500 text-white py-3 rounded-lg font-semibold hover:bg-pink-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : (selectedServices.every(s => s.category === 'product') ? (t('buyNow') || 'Jetzt kaufen') : (t('confirmBooking') || 'Confirm Booking'))}
        </button>
      )}

      {!paymentMethod && (
        <p className="text-center text-gray-500 italic">Please select a payment method to continue.</p>
      )}
    </div>
  )
}