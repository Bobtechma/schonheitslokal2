import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { User, LogOut, Settings, Calendar, UserCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

export default function UserProfile() {
  const { user, signOut } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logout erfolgreich!')
      setIsOpen(false)
    } catch (error) {
      toast.error('Fehler beim Logout')
      console.error('Logout error:', error)
    }
  }

  if (!user) return null

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator'
      case 'owner':
        return 'Besitzer'
      default:
        return 'Kunde'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'owner':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt={user.user_metadata?.full_name || user.email}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900">
            {user.user_metadata?.full_name || user.email.split('@')[0]}
          </p>
          <p className="text-xs text-gray-500">{getRoleLabel(user.role)}</p>
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata?.full_name || user.email}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getRoleColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>
              </div>
            </div>

            <div className="py-2">
              {(user.role === 'admin' || user.role === 'owner') && (
                <Link
                  to="/perfil"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Einstellungen
                </Link>
              )}

              {user.role === 'admin' || user.role === 'owner' ? (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  <Calendar className="w-4 h-4 mr-3" />
                  Admin Dashboard
                </Link>
              ) : (
                <Link
                  to="/meus-agendamentos"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  <Calendar className="w-4 h-4 mr-3" />
                  Meine Termine
                </Link>
              )}
            </div>

            <div className="border-t border-gray-200 py-2">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Ausloggen
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}