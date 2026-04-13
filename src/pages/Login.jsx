import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { toast } from 'sonner'

export default function Login() {
  const { user, signInWithEmail, signUpWithEmail, isLoading } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isLoading && user) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password)
        toast.success('Account created! Check your email to confirm.')
      }
    } catch (err) {
      toast.error(err.message ?? 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-3xl rounded-xl border border-border bg-white p-6 shadow-sm sm:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Welcome to Eshrahli</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/90 sm:text-lg">
            Your centralized learning assistant for understanding university material in Arabic while keeping essential English technical terms clear and accurate.
          </p>
          <p className="mt-2 text-base text-foreground/90 sm:text-lg">
            {mode === 'signin'
              ? 'Sign in below to continue to your dashboard.'
              : 'Create an account below to get started.'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-secondary/45 p-5 sm:p-7">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-input bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-input bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-lg font-bold text-primary-foreground transition hover:brightness-95 disabled:opacity-60"
            >
              {submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {mode === 'signin' ? 'Login to Eshrahli' : 'Create Eshrahli Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-primary font-medium hover:underline"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
