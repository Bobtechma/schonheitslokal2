import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { CookieConsent } from '@/components/CookieConsent'
import { trackPageView } from '@/lib/analytics'

// Eagerly loaded components critical for the first paint
import HomePage from '@/pages/HomePage'
import ProtectedRoute from '@/components/ProtectedRoute'

// Lazily loaded components that are not needed on the home page
const BookingPage = lazy(() => import('@/pages/BookingPage'))
const ConfirmationPage = lazy(() => import('@/pages/ConfirmationPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'))
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'))
const ClientAppointmentsPage = lazy(() => import('@/pages/ClientAppointmentsPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const TermsPage = lazy(() => import('@/pages/TermsPage'))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'))
const BeautySimulator = lazy(() => import('@/pages/BeautySimulator'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const PartnerArea = lazy(() => import('@/pages/PartnerArea'))
const PaySecondHalf = lazy(() => import('@/pages/PaySecondHalf'))
const RoulettePopup = lazy(() => import('@/components/RoulettePopup').then(module => ({ default: module.RoulettePopup })))

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />
  },
  {
    path: '/agendar',
    element: <BookingPage />
  },
  {
    path: '/confirmacao',
    element: <ConfirmationPage />
  },
  {
    path: '/confirmacao/:id',
    element: <ConfirmationPage />
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/cliente/login',
    element: <LoginPage />
  },
  {
    path: '/admin/login',
    element: <LoginPage />
  },
  {
    path: '/cliente/cadastro',
    element: <RegisterPage />
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />
  },
  {
    path: '/admin/dashboard',
    element: (
      <ProtectedRoute requiredRoles={['admin', 'owner']}>
        <AdminDashboard />
      </ProtectedRoute>
    )
  },
  {
    path: '/meus-agendamentos',
    element: (
      <ProtectedRoute requiredRoles={['client', 'admin', 'owner']}>
        <ClientAppointmentsPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/perfil',
    element: (
      <ProtectedRoute requiredRoles={['client', 'admin', 'owner']}>
        <ProfilePage />
      </ProtectedRoute>
    )
  },
  {
    path: '/parceria',
    element: <PartnerArea />
  },
  {
    path: '/pagar-saldo',
    element: <PaySecondHalf />
  },
  {
    path: '/termos',
    element: <TermsPage />
  },
  {
    path: '/privacidade',
    element: <PrivacyPage />
  },
  {
    path: '/simulator',
    element: <BeautySimulator />
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
])

// Automatic Google Analytics SPA pageview tracking on route changes
router.subscribe((state) => {
  if (state.historyAction) {
    const url = state.location.pathname + state.location.search
    trackPageView(url)
  }
})

// Basic loading fallback for lazy-loaded routes with optimized performance
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50/50 backdrop-blur-sm">
    <div className="relative">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-100 border-t-pink-500 shadow-xl"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-2 w-2 bg-pink-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
)



export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RouterProvider router={router} />
      <RoulettePopup />
      <CookieConsent />
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'bg-white border border-gray-200 shadow-lg',
          style: {
            background: 'white',
            color: '#374151',
          },
        }}
      />
    </Suspense>
  )
}
