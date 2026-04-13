import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../lib/AuthContext'
import { useLanguage } from '../LanguageContext'
import { LogOut, Languages, Menu } from 'lucide-react'
import { toast } from 'sonner'

export default function Navbar({ onMenuToggle }) {
  const { user, signOut } = useAuth()
  const { language, toggleLanguage, t } = useLanguage()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try { await signOut() }
    catch { toast.error('Failed to sign out') }
  }

  const initials = user?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-border flex items-center px-4 gap-3">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        aria-label="Toggle menu"
      >
        <Menu size={18} />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2 font-bold text-primary text-[17px] select-none">
        <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-black">B</div>
        {t('appName')}
      </div>

      <div className="flex-1" />

      {/* Language toggle */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={toggleLanguage}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors font-medium"
      >
        <Languages size={14} />
        {language === 'ar' ? 'EN' : 'AR'}
      </motion.button>

      {/* User menu */}
      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setUserMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg hover:bg-muted px-2 py-1.5 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
          <span className="hidden sm:block text-sm text-foreground max-w-[130px] truncate">
            {user?.email}
          </span>
        </motion.button>

        <AnimatePresence>
          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute end-0 z-20 mt-2 w-48 bg-white border border-border rounded-xl shadow-lg py-1.5 overflow-hidden"
              >
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setUserMenuOpen(false); handleSignOut() }}
                  className="w-full text-start px-3 py-2.5 text-sm hover:bg-muted flex items-center gap-2.5 text-destructive transition-colors"
                >
                  <LogOut size={14} />
                  {t('signOut')}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
