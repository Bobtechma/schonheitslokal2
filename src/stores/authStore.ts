import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

export interface User {
  id: string
  email: string
  role: 'client' | 'admin' | 'owner' | 'partner'
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  checkSession: () => Promise<void>
  refreshSession: () => Promise<void>
  clearError: () => void
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
}

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        signIn: async (email: string, password: string) => {
          set({ isLoading: true, error: null })

          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password
            })

            if (error) throw error

            if (data.user) {
              // Get role from app_metadata first, fallback to user_metadata, then default to 'client'
              const role = (data.user.app_metadata?.role as User['role']) ||
                (data.user.user_metadata?.role as User['role']) ||
                'client'

              const user: User = {
                id: data.user.id,
                email: data.user.email!,
                role,
                user_metadata: data.user.user_metadata
              }
              set({ user, isAuthenticated: true, isLoading: false })
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Erro ao fazer login',
              isLoading: false
            })
            throw error
          }
        },

        signUp: async (email: string, password: string, fullName: string) => {
          set({ isLoading: true, error: null })

          try {
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  full_name: fullName,
                  role: 'client'
                }
              }
            })

            if (error) throw error

            if (data.user) {
              // Get role from app_metadata first, fallback to user_metadata, then default to 'client'
              const role = (data.user.app_metadata?.role as User['role']) ||
                (data.user.user_metadata?.role as User['role']) ||
                'client'

              const user: User = {
                id: data.user.id,
                email: data.user.email!,
                role,
                user_metadata: { full_name: fullName }
              }
              set({ user, isAuthenticated: true, isLoading: false })
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Erro ao criar conta',
              isLoading: false
            })
            throw error
          }
        },

        signInWithGoogle: async () => {
          set({ isLoading: true, error: null })

          try {
            const { data, error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: `${window.location.origin}/auth/callback`
              }
            })

            console.log('Google Sign-In Redirect URL:', `${window.location.origin}/auth/callback`)

            if (error) throw error

            // O redirecionamento será tratado pelo Supabase
          } catch (error) {
            const rawMessage = error instanceof Error ? (error.message || '') : ''
            let friendly = rawMessage || 'Erro ao fazer login com Google'
            const lower = rawMessage.toLowerCase()
            if (
              lower.includes('unsupported provider') ||
              lower.includes('provider is not enabled') ||
              lower.includes('validation_failed')
            ) {
              friendly = 'Login com Google indisponível: provedor não habilitado no Supabase. Habilite o Google Provider e configure Client ID/Secret e URLs de redirecionamento.'
            }
            set({
              error: friendly,
              isLoading: false
            })
            throw error
          }
        },

        signOut: async () => {
          set({ isLoading: true })

          try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error

            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            })
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Erro ao fazer logout',
              isLoading: false
            })
            throw error
          }
        },

        checkSession: async () => {
          try {
            const { data: { session }, error } = await supabase.auth.getSession()

            if (error) throw error

            if (session?.user) {
              // Check if session is expired or close to expiring (less than 5 minutes)
              const now = Math.floor(Date.now() / 1000)
              const expiresAt = session.expires_at || 0
              if (expiresAt - now < 300) {
                console.log('Session close to expiry, refreshing...')
                const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
                if (refreshError) throw refreshError
                if (refreshData.session) {
                  const role = (refreshData.session.user.app_metadata?.role as User['role']) ||
                    (refreshData.session.user.user_metadata?.role as User['role']) ||
                    'client'

                  const user: User = {
                    id: refreshData.session.user.id,
                    email: refreshData.session.user.email!,
                    role,
                    user_metadata: refreshData.session.user.user_metadata
                  }
                  set({ user, isAuthenticated: true, isLoading: false })
                  return
                }
              }

              const role = (session.user.app_metadata?.role as User['role']) ||
                (session.user.user_metadata?.role as User['role']) ||
                'client'

              const user: User = {
                id: session.user.id,
                email: session.user.email!,
                role,
                user_metadata: session.user.user_metadata
              }
              set({ user, isAuthenticated: true, isLoading: false })
            } else {
              set({ user: null, isAuthenticated: false, isLoading: false })
            }
          } catch (error: any) {
            console.error('Check session error:', error)
            
            // Se for erro de token de atualização inválido, precisamos limpar o estado local
            // para evitar que o app fique travado em um loop de erro 400
            const isRefreshTokenError = 
              error?.message?.includes('refresh_token_not_found') || 
              error?.message?.includes('Invalid Refresh Token') ||
              error?.status === 400;

            if (isRefreshTokenError) {
              console.warn('Refresh token inválido, limpando sessão local...');
              // Usamos scope: local para limpar apenas o armazenamento local sem tentar 
              // contatar o servidor (que falharia com 400)
              await supabase.auth.signOut({ scope: 'local' });
            }

            set({
              user: null,
              isAuthenticated: false,
              // Não mostramos erro se for apenas token expirado/inválido para não assustar o usuário
              error: isRefreshTokenError ? null : (error instanceof Error ? error.message : 'Erro ao verificar sessão'),
              isLoading: false
            })
          }
        },
        refreshSession: async () => {
          set({ isLoading: true })
          try {
            const { data, error } = await supabase.auth.refreshSession()
            if (error) throw error
            const session = data.session
            if (session?.user) {
              const role = (session.user.app_metadata?.role as User['role']) ||
                (session.user.user_metadata?.role as User['role']) ||
                'client'
              const user: User = {
                id: session.user.id,
                email: session.user.email!,
                role,
                user_metadata: session.user.user_metadata
              }
              set({ user, isAuthenticated: true, isLoading: false })
            } else {
              set({ user: null, isAuthenticated: false, isLoading: false })
            }
          } catch (error: any) {
            console.error('Refresh session error:', error)
            
            const isRefreshTokenError = 
              error?.message?.includes('refresh_token_not_found') || 
              error?.message?.includes('Invalid Refresh Token') ||
              error?.status === 400;

            if (isRefreshTokenError) {
              await supabase.auth.signOut({ scope: 'local' });
            }

            set({
              user: null,
              isAuthenticated: false,
              error: isRefreshTokenError ? null : (error instanceof Error ? error.message : 'Erro ao atualizar sessão'),
              isLoading: false
            })
          }
        },

        clearError: () => set({ error: null })
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated
        })
      }
    )
  )
)

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  const { user, isAuthenticated } = useAuthStore.getState()

  if (event === 'SIGNED_IN' && session?.user && !isAuthenticated) {
    // Get role from app_metadata first, fallback to user_metadata, then default to 'client'
    const role = (session.user.app_metadata?.role as User['role']) ||
      (session.user.user_metadata?.role as User['role']) ||
      'client'

    const newUser: User = {
      id: session.user.id,
      email: session.user.email!,
      role,
      user_metadata: session.user.user_metadata
    }
    useAuthStore.setState({ user: newUser, isAuthenticated: true })
  } else if (event === 'SIGNED_OUT' && isAuthenticated) {
    useAuthStore.setState({ user: null, isAuthenticated: false })
  }
})