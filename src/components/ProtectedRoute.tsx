import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'client' | 'admin' | 'owner'
  requiredRoles?: Array<'client' | 'admin' | 'owner'>
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredRoles,
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, checkSession } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated && !user) {
        await checkSession()
      }
      setChecking(false)
    }
    
    checkAuth()
  }, [isAuthenticated, user, checkSession])

  if (isLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Authentifizierung wird überprüft...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    // Redirect to login with the current location as state
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Check role-based access
  const hasRequiredRole = () => {
    if (!requiredRole && !requiredRoles) return true
    
    if (requiredRole) {
      return user.role === requiredRole
    }
    
    if (requiredRoles) {
      return requiredRoles.includes(user.role)
    }
    
    return true
  }

  if (!hasRequiredRole()) {
    // User doesn't have the required role
    const requiredRoleText = requiredRole === 'admin' ? 'Administratoren' : 
                           requiredRole === 'owner' ? 'Eigentümer' : 'Kunden'
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unbefugter Zugriff</h2>
          <p className="text-gray-600 mb-4">
            Sie haben keine Berechtigung für diesen Bereich. Diese Seite ist nur für {requiredRoleText}.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Zurück zur Startseite
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}