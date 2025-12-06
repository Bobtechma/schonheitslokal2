import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { checkSession } = useAuthStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Authentifizierung wird verarbeitet...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash parameters from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const error = hashParams.get('error')
        const errorDescription = hashParams.get('error_description')

        if (error) {
          setStatus('error')
          setMessage(`Authentifizierungsfehler: ${errorDescription || error}`)
          toast.error(`Fehler beim Login: ${errorDescription || error}`)
          setTimeout(() => navigate('/login'), 3000)
          return
        }

        if (accessToken && refreshToken) {
          // Set the session with the tokens
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (sessionError) {
            throw sessionError
          }

          // Update the auth state
          await checkSession()

          setStatus('success')
          setMessage('Login erfolgreich! Weiterleitung...')
          toast.success('Login erfolgreich!')

          // Redirect to home for all users
          setTimeout(() => {
            navigate('/')
          }, 1500)
        } else {
          // Check if there's already a session
          const { data: { session } } = await supabase.auth.getSession()

          if (session?.user) {
            setStatus('success')
            setMessage('Login erfolgreich! Weiterleitung...')
            toast.success('Login erfolgreich!')
            setTimeout(() => navigate('/'), 1500)
          } else {
            setStatus('error')
            setMessage('Login konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.')
            toast.error('Authentifizierung fehlgeschlagen')
            setTimeout(() => navigate('/login'), 3000)
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setMessage('Fehler bei der Verarbeitung des Logins. Bitte versuchen Sie es erneut.')
        toast.error('Fehler beim Abschließen der Authentifizierung')
        setTimeout(() => navigate('/login'), 3000)
      }
    }

    handleAuthCallback()
  }, [navigate, checkSession])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {status === 'loading' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-pink-600 animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Login wird verarbeitet</h2>
              <p className="text-gray-600">{message}</p>
              <div className="animate-pulse bg-gray-200 h-2 rounded-full mt-4">
                <div className="bg-pink-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Erfolg!</h2>
              <p className="text-gray-600">{message}</p>
              <div className="bg-green-100 h-2 rounded-full mt-4">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Login-Fehler</h2>
              <p className="text-gray-600">{message}</p>
              <div className="bg-red-100 h-2 rounded-full mt-4">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <p className="text-sm text-gray-500">Sie werden in Kürze weitergeleitet...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}