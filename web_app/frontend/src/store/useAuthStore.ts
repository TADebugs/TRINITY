import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/api/client'

interface AuthState {
  token: string | null
  user: { id: string; name: string } | null
  setAuth: (token: string, user: { id: string; name: string }) => void
  clearAuth: () => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, displayName: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,

      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),

      login: async (email, password) => {
        const res = await authApi.login(email, password)
        // Login returns { access_token, token_type }
        // We need user info — derive from token or fetch /me
        set({ token: res.access_token, user: { id: '', name: email.split('@')[0] } })
        try {
          const me = await authApi.me()
          set({ user: { id: me.id, name: me.display_name } })
        } catch { /* user info will be fetched on next load */ }
      },

      register: async (email, displayName, password) => {
        const res = await authApi.register({ email, display_name: displayName, password })
        set({ token: res.token, user: res.user })
      },

      logout: () => set({ token: null, user: null }),
    }),
    { name: 'trinity-auth' },
  ),
)
