import { useState, useRef, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../lib/AuthContext'
import { useLanguage } from '../LanguageContext'
import { LayoutDashboard, Bookmark, Settings, LogOut, Languages, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, labelKey: 'dashboard', end: true },
  { to: '/saved', icon: Bookmark, labelKey: 'saved' },
  { to: '/settings', icon: Settings, labelKey: 'settings' },
]

export default function Navbar() {
  const { user, signOut } = useAuth()
  const { language, toggleLanguage, t } = useLanguage()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const initials = user?.email?.[0]?.toUpperCase() ?? 'U'
  const tabRefs = useRef({})
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 })

  // Track active pill position
  useEffect(() => {
    const active = NAV_ITEMS.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
    )
    if (!active) return
    const el = tabRefs.current[active.to]
    if (!el) return
    setPillStyle({ left: el.offsetLeft, width: el.offsetWidth })
  }, [location.pathname])

  const handleSignOut = async () => {
    try { await signOut() }
    catch { toast.error('Failed to sign out') }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/90 backdrop-blur-md border-b border-border/60">
      <div className="h-full max-w-screen-xl mx-auto px-4 flex items-center gap-2">

        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 font-bold text-primary text-base select-none shrink-0 me-2">
          <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-black">
            ع
          </div>
          <span className="hidden sm:block">{t('appName')}</span>
        </NavLink>

        {/* Nav tabs with sliding pill underline */}
        <nav className="relative flex items-end h-full">
          {/* Sliding pill */}
          <motion.div
            className="absolute bottom-0 h-[2.5px] bg-primary rounded-full"
            animate={pillStyle}
            transition={{ type: 'spring', stiffness: 450, damping: 38 }}
          />

          {NAV_ITEMS.map(({ to, icon: Icon, labelKey, end }) => {
            const isActive = end
              ? location.pathname === to
              : location.pathname.startsWith(to)

            return (
              <div
                key={to}
                ref={(el) => { tabRefs.current[to] = el }}
              >
                <NavLink
                  to={to}
                  end={end}
                  className="flex items-center gap-1.5 px-3.5 h-14 text-sm font-medium transition-colors duration-150 select-none"
                  style={{ color: isActive ? 'var(--primary)' : 'var(--muted-foreground)' }}
                >
                  <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span>{t(labelKey)}</span>
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
                  className="absolute end-0 z-20 mt-2 w-52 bg-white border border-border rounded-2xl shadow-xl py-1.5 overflow-hidden"
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
