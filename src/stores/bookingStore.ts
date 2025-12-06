import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Service } from '@/lib/supabase'

export interface BookingState {
  step: number
  selectedServices: Service[]
  selectedDate: string | null
  selectedTime: string | null
  clientInfo: {
    fullName: string
    email: string
    phone: string
    birthDate: string
    gender: string
    allergies: string
    preferences: string
  }
  termsAccepted: boolean
  totalPrice: number
  totalDuration: number
  promoStorePct: number
  promoPerService: Record<string, number>
  services: Service[]
  bookingPaused: boolean
}

interface BookingActions {
  setStep: (step: number) => void
  setSelectedServices: (services: Service[]) => void
  setSelectedDate: (date: string) => void
  setSelectedTime: (time: string) => void
  setClientInfo: (info: Partial<BookingState['clientInfo']>) => void
  setTermsAccepted: (accepted: boolean) => void
  calculateTotals: () => void
  resetBooking: () => void
  setPromotions: (promo: { promoStorePct: number; promoPerService: Record<string, number> }) => void
  setServices: (services: Service[]) => void
  setBookingPaused: (paused: boolean) => void
}

const initialState: BookingState = {
  step: 1,
  selectedServices: [],
  selectedDate: null,
  selectedTime: null,
  clientInfo: {
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    allergies: '',
    preferences: ''
  },
  termsAccepted: false,
  totalPrice: 0,
  totalDuration: 0,
  promoStorePct: 0,
  promoPerService: {},
  services: [],
  bookingPaused: false
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

      setClientInfo: (info) => {
        set((state) => ({
          clientInfo: { ...state.clientInfo, ...info }
        }))
      },

      setTermsAccepted: (accepted) => set({ termsAccepted: accepted }),

      calculateTotals: () => {
        const { selectedServices, promoStorePct, promoPerService } = get()
        const totalPrice = selectedServices.reduce((sum, service) => {
          const perSvc = promoPerService[service.id] || 0
          const pct = Math.max(perSvc, promoStorePct)
          const discounted = Math.max(0, Math.round(service.price * (1 - pct / 100) * 100) / 100)
          return sum + discounted
        }, 0)
        const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration_minutes, 0)
        set({ totalPrice, totalDuration })
      },

      resetBooking: () => set(initialState),

      setPromotions: (promo) => {
        set({ promoStorePct: promo.promoStorePct, promoPerService: promo.promoPerService })
        get().calculateTotals()
      },

      setServices: (services) => set({ services }),

      setBookingPaused: (paused) => set({ bookingPaused: paused })
    })
  )
)