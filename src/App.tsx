import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import HomePage from '@/pages/HomePage'
import BookingPage from '@/pages/BookingPage'
import ConfirmationPage from '@/pages/ConfirmationPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import AuthCallbackPage from '@/pages/AuthCallbackPage'
import AdminDashboard from '@/pages/AdminDashboard'
import ClientAppointmentsPage from '@/pages/ClientAppointmentsPage'
import ProfilePage from '@/pages/ProfilePage'
import TermsPage from '@/pages/TermsPage'
import PrivacyPage from '@/pages/PrivacyPage'
import BeautySimulator from '@/pages/BeautySimulator'
import ProtectedRoute from '@/components/ProtectedRoute'

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
  }
])

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
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
    </>
  )
}
