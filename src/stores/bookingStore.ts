import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Service } from '@/lib/supabase'

export interface BookingState {
  step: number
  selectedServices: Service[]
  selectedDate: string | null
  selectedTime: string | null
  selectedProfessionalId: string | null
  clientInfo: {
    fullName: string
    email: string
    phone: string
    address: string
    birthDate: string
    gender: string
    allergies: string
    preferences: string
  }
  termsAccepted: boolean
  totalPrice: number
  subtotal: number
  totalDiscount: number
  totalDuration: number
  promoStorePct: number
  promoPerService: Record<string, number>
  services: Service[]
  bookingPaused: boolean
  paymentMethod: 'credit_card' | 'twint' | 'salon' | null
  selectedShippingOption: { id: string; name: string; price: number } | null
  upsellingEnabled: boolean
  upsellingDiscountPct: number
  upsellingServiceIds: string[]
  roulettePrizeLabel: string | null
  rouletteDiscountPct: number
}

interface BookingActions {
  setStep: (step: number) => void
  setSelectedServices: (services: Service[]) => void
  setSelectedDate: (date: string) => void
  setSelectedTime: (time: string) => void
  setSelectedProfessionalId: (id: string | null) => void
  setClientInfo: (info: Partial<BookingState['clientInfo']>) => void
  setTermsAccepted: (accepted: boolean) => void
  calculateTotals: () => void
  resetBooking: () => void
  setPromotions: (promo: { promoStorePct: number; promoPerService: Record<string, number> }) => void
  setServices: (services: Service[]) => void
  setBookingPaused: (paused: boolean) => void
  setPaymentMethod: (method: 'credit_card' | 'twint' | 'salon' | null) => void
  setSelectedShippingOption: (option: { id: string; name: string; price: number } | null) => void
  setUpsellingStatus: (status: { enabled: boolean, discountPct: number }) => void
  addUpsellingService: (serviceId: string) => void
  removeUpsellingService: (serviceId: string) => void
  setRoulettePrize: (label: string | null, discountPct: number) => void
}

const initialState: BookingState = {
  step: 1,
  selectedServices: [],
  selectedDate: null,
  selectedTime: null,
  selectedProfessionalId: null,
  clientInfo: {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: '',
    allergies: '',
    preferences: ''
  },
  termsAccepted: false,
  totalPrice: 0,
  subtotal: 0,
  totalDiscount: 0,
  totalDuration: 0,
  promoStorePct: 0,
  promoPerService: {},
  services: [],
  bookingPaused: false,
  paymentMethod: null,
  selectedShippingOption: null,
  upsellingEnabled: false,
  upsellingDiscountPct: 10,
  upsellingServiceIds: [],
  roulettePrizeLabel: null,
  rouletteDiscountPct: 0
}

export const useBookingStore = create<BookingState & BookingActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ step }),

      setSelectedServices: (services) => {
        set({ selectedServices: services })
        get().calculateTotals()
      },

      setSelectedDate: (date) => set({ selectedDate: date }),

      setSelectedTime: (time) => set({ selectedTime: time }),

      setSelectedProfessionalId: (id) => set({ selectedProfessionalId: id }),

      setClientInfo: (info) => {
        set((state) => ({
          clientInfo: { ...state.clientInfo, ...info }
        }))
      },

      setTermsAccepted: (accepted) => set({ termsAccepted: accepted }),

      calculateTotals: () => {
        const { selectedServices, promoStorePct, promoPerService } = get()
        const totalWeight = selectedServices.reduce((sum, service) => sum + (service.weight || 0), 0)
        let shippingCost = 0
        let shippingOption = null

        if (totalWeight > 0) {
          if (totalWeight <= 10) {
            shippingCost = 12
            shippingOption = { id: 'auto-low', name: 'Versand (bis 10kg)', price: 12 }
          } else {
            shippingCost = 31
            shippingOption = { id: 'auto-high', name: 'Versand (> 10kg)', price: 31 }
          }
        } else {
          // Check if ANY products are selected. If so, force default shipping (12 CHF)
          // This handles cases where products have 0 weight in DB or weight is missing.
          const hasProducts = selectedServices.some(s => s.category === 'product')
          if (hasProducts) {
            shippingCost = 12
            shippingOption = { id: 'auto-default', name: 'Versand (Pauschale)', price: 12 }
          }
        }

        // Use the manually selected option only if no weight-based rule applies (fallback) 
        // OR override it completely. The requirement is strict automatic attribution.
        // So we override selectedShippingOption.

        let subtotal = 0
        const itemsTotal = selectedServices.reduce((sum, service) => {
          subtotal += service.price
          const perSvc = promoPerService[service.id] || 0
          let pct = Math.max(perSvc, promoStorePct)
          
          // Apply upselling discount if service was added via upselling prompt
          const isUpsellingItem = get().upsellingServiceIds.includes(service.id)
          if (isUpsellingItem) {
            // Priority to upselling discount if it's explicitly for this item
            // or use Math.max if we want to ensure the best deal
            pct = Math.max(pct, get().upsellingDiscountPct)
          }

          // Apply roulette discount (if applicable)
          const rouletteDiscount = get().rouletteDiscountPct
          if (rouletteDiscount > 0) {
            pct = Math.max(pct, rouletteDiscount)
          }

          const discounted = Math.max(0, Math.round(service.price * (1 - pct / 100) * 100) / 100)
          return sum + discounted
        }, 0)

        const totalDiscount = Math.round((subtotal - itemsTotal) * 100) / 100
        const totalPrice = itemsTotal + shippingCost

        const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration_minutes, 0)

        set({ totalPrice, subtotal, totalDiscount, totalDuration, selectedShippingOption: shippingOption })
      },

      resetBooking: () => set(initialState),

      setPromotions: (promo) => {
        set({ promoStorePct: promo.promoStorePct, promoPerService: promo.promoPerService })
        get().calculateTotals()
      },

      setServices: (services) => set({ services }),

      setBookingPaused: (paused) => set({ bookingPaused: paused }),

      setPaymentMethod: (method) => set({ paymentMethod: method }),

      setSelectedShippingOption: (option) => {
        set({ selectedShippingOption: option })
        get().calculateTotals()
      },

      setUpsellingStatus: (status) => set({ 
        upsellingEnabled: status.enabled, 
        upsellingDiscountPct: status.discountPct 
      }),

      addUpsellingService: (serviceId) => {
        const { upsellingServiceIds } = get()
        if (!upsellingServiceIds.includes(serviceId)) {
          set({ upsellingServiceIds: [...upsellingServiceIds, serviceId] })
          get().calculateTotals()
        }
      },

      removeUpsellingService: (serviceId) => {
        set((state) => ({
          upsellingServiceIds: state.upsellingServiceIds.filter(id => id !== serviceId)
        }))
        get().calculateTotals()
      },

      setRoulettePrize: (label, discountPct) => {
        set({ roulettePrizeLabel: label, rouletteDiscountPct: discountPct })
        get().calculateTotals()
      }
    })
  )
)