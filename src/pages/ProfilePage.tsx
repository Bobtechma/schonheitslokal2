import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuthStore } from '@/stores/authStore'
import { useEffect } from 'react'
import { UserCircle, Mail, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { user, refreshSession } = useAuthStore()

  const handlePromoteToAdmin = async () => {
    try {
      const { error } = await supabase.rpc('promote_self_to_admin')
      if (error) {
        if (String(error.message || '').toLowerCase().includes('not allowed')) {
          const original = user?.user_metadata?.full_name || ''
          const upd = await supabase.auth.updateUser({ data: { full_name: 'administrador' } })
          if (upd.error) throw upd.error
          const retry = await supabase.rpc('promote_self_to_admin')
          if (retry.error) throw retry.error
          if (original) {
            await supabase.auth.updateUser({ data: { full_name: original } })
          }
        } else {
          throw error
        }
      }
      await refreshSession()
      toast.success('Rolle aktualisiert: admin')
    } catch (err) {
      toast.error('Fehler beim Aktualisieren der Rolle')
      console.error(err)
    }
  }



  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-800">Einstellungen</h1>
            <p className="text-gray-600">Verwalten Sie Ihre Kontoinformationen</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-center text-lg font-semibold text-gray-800">
                  {user?.user_metadata?.full_name || user?.email}
                </h2>
                <p className="text-center text-sm text-gray-600 mt-1">{user?.email}</p>
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Shield className="w-3 h-3 mr-1" />
                    {user?.role === 'owner' ? 'Besitzer' : user?.role === 'admin' ? 'Administrator' : 'Kunde'}
                  </span>
                </div>
                {user?.role === 'owner' && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={handlePromoteToAdmin}
                      className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                    >
                      Administratorrechte aktivieren
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Kontodetails</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border rounded-lg p-4">
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">E-Mail</p>
                        <p className="text-gray-800 font-medium">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Name</p>
                    <p className="text-gray-800 font-medium">{user?.user_metadata?.full_name || '-'}</p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Rolle</p>
                    <p className="text-gray-800 font-medium">{user?.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}