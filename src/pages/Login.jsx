import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../lib/AuthContext'
import { toast } from 'sonner'
import { Mail, ArrowLeft } from 'lucide-react'

// Google G logo SVG
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground font-medium">or</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

export default function Login() {
  const { user, signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword, isLoading } = useAuth()
  // mode: 'signin' | 'signup' | 'forgot'
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  if (!isLoading && user) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (mode === 'forgot') {
        await resetPassword(email)
        setResetSent(true)
        return
      }
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

  const handleGoogle = async () => {
    try {
      await signInWithGoogle()
    } catch (err) {
      toast.error(err.message ?? 'Google sign-in failed')
    }
  }

  const switchMode = (next) => {
    setMode(next)
    setResetSent(false)
    setPassword('')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-sm dark:shadow-black/30 sm:p-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Welcome to Eshrahli
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/80 sm:text-lg">
            Your AI-powered learning assistant for understanding university material in Arabic.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-secondary/45 p-5 sm:p-7">
          <AnimatePresence mode="wait">

            {/* ── Forgot password ── */}
            {mode === 'forgot' && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {resetSent ? (
                  <div className="flex flex-col items-center text-center gap-4 py-4">
                    <div className="w-12 h-12 rounded-full bg-[#00C2CB]/10 flex items-center justify-center">
                      <Mail size={22} style={{ color: '#00C2CB' }} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Check your inbox</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        We sent a password reset link to <span className="font-medium text-foreground">{email}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => switchMode('signin')}
                      className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <ArrowLeft size={13} /> Back to sign in
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                      <button
                        type="button"
                        onClick={() => switchMode('signin')}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                      >
                        <ArrowLeft size={13} /> Back to sign in
                      </button>
                      <p className="font-semibold text-foreground text-lg">Reset your password</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Enter your email and we'll send you a reset link.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-foreground">Email</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-base font-bold text-primary-foreground transition hover:brightness-95 disabled:opacity-60"
                    >
                      {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                      Send reset link
                    </button>
                  </form>
                )}
              </motion.div>
            )}

            {/* ── Sign in / Sign up ── */}
            {mode !== 'forgot' && (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-4"
              >
                {/* Google button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleGoogle}
                  className="flex items-center justify-center gap-3 w-full rounded-xl border border-border bg-background py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
                >
                  <GoogleIcon />
                  Continue with Google
                </motion.button>

                <Divider />

                {/* Email / password form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-foreground">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-foreground">Password</label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => switchMode('forgot')}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-lg font-bold text-primary-foreground transition hover:brightness-95 disabled:opacity-60"
                  >
                    {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                    {mode === 'signin' ? 'Sign in' : 'Create account'}
                  </button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {mode !== 'forgot' && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-primary font-medium hover:underline"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
