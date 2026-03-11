import { useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { usePersonalityStore } from '@/store/usePersonalityStore'

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const register = useAuthStore((s) => s.register)
  const config = usePersonalityStore((s) => s.config)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, displayName, password)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
      <div className="w-full max-w-sm mx-auto p-8">
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold tracking-widest mb-2"
            style={{ color: config.color }}
          >
            TRINITY
          </h1>
          <p className="text-white/30 text-sm">Three Personalities. One Assistant.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/20 transition-all"
          />

          {mode === 'register' && (
            <input
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/20 transition-all"
            />
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/20 transition-all"
          />

          {error && (
            <div className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all cursor-pointer disabled:opacity-50"
            style={{ background: config.color }}
          >
            {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
          className="w-full text-center text-xs text-white/30 hover:text-white/50 mt-4 cursor-pointer transition-colors"
        >
          {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign In'}
        </button>
      </div>
    </div>
  )
}
