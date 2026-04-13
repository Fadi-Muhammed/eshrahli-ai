import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../lib/AuthContext'
import { useLanguage } from '../LanguageContext'
import { LayoutDashboard, Bookmark, Settings, LogOut, Languages, ChevronDown, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useFavorites } from '../../hooks/useFavorites'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, labelKey: 'dashboard', end: true },
  { to: '/favorites', icon: Star, labelKey: 'favorites' },
  { to: '/saved', icon: Bookmark, labelKey: 'saved' },
  { to: '/settings', icon: Settings, labelKey: 'settings' },
]

export default function Navbar() {
  const { user, signOut } = useAuth()
  const { language, toggleLanguage, t } = useLanguage()
  const { favoritesCount } = useFavorites()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const initials = user?.email?.[0]?.toUpperCase() ?? 'U'

  const handleSignOut = async () => {
    try { await signOut() }
    catch { toast.error('Failed to sign out') }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-card/85 backdrop-blur-md border-b border-border/70">
      <div className="h-full max-w-screen-xl mx-auto px-4 flex items-center gap-2">

        {/* Logo */}
        <NavLink to="/" className="flex items-center font-bold text-primary text-base select-none shrink-0 me-2">
          <span className="hidden sm:block">{t('appName')}</span>
        </NavLink>

        {/* Nav tabs */}
        <nav className="relative flex items-end h-full">
          {NAV_ITEMS.map(({ to, icon: Icon, labelKey, end }) => {
            const isActive = end
              ? location.pathname === to
              : location.pathname.startsWith(to)

            return (
              <div key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className="flex items-center gap-1.5 px-3.5 h-14 text-sm font-medium transition-colors duration-150 select-none"
                  style={{
                    color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span>{t(labelKey)}</span>
                  {to === '/favorites' && favoritesCount > 0 && (
                    <span className="inline-flex min-w-4 h-4 px-1 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300 text-[10px] font-bold">
                      {favoritesCount > 99 ? '99+' : favoritesCount}
                    </span>
                  )}
                </NavLink>
              </div>
            )
          })}
        </nav>

        <div className="flex-1" />

        {/* Language toggle */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          <Languages size={13} />
          {language === 'ar' ? 'EN' : 'AR'}
        </motion.button>

        {/* User avatar + dropdown */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-xl hover:bg-muted px-2 py-1.5 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
            <ChevronDown
              size={13}
              className={`text-muted-foreground transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
            />
          </motion.button>

          <AnimatePresence>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  className="absolute end-0 z-20 mt-2 w-52 bg-card border border-border rounded-2xl shadow-xl dark:shadow-black/30 py-1.5 overflow-hidden"
                >
                  <div className="px-3.5 py-2.5 border-b border-border/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {initials}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setUserMenuOpen(false); handleSignOut() }}
                    className="w-full text-start px-3.5 py-2.5 text-sm hover:bg-muted flex items-center gap-2.5 text-destructive transition-colors"
                  >
                    <LogOut size={14} />
                    {t('signOut')}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  )
}
