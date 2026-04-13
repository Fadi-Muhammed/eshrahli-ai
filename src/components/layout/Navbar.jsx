import { useAuth } from '../../lib/AuthContext'
import { useLanguage } from '../LanguageContext'
import { LogOut, Languages } from 'lucide-react'
import { toast } from 'sonner'

export default function Navbar({ onMenuToggle }) {
  const { user, signOut } = useAuth()
  const { language, toggleLanguage, t } = useLanguage()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      toast.error('Failed to sign out')
    }
  }

  const initials = user?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-border flex items-center px-4 gap-3">
      {/* Hamburger (mobile) */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-1.5 rounded hover:bg-muted"
        aria-label="Toggle menu"
      >
        <span className="block w-5 h-0.5 bg-foreground mb-1" />
        <span className="block w-5 h-0.5 bg-foreground mb-1" />
        <span className="block w-5 h-0.5 bg-foreground" />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2 font-bold text-primary text-lg select-none">
        <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">B</span>
        {t('appName')}
      </div>

      <div className="flex-1" />

      {/* Language toggle */}
      <button
        onClick={toggleLanguage}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted"
      >
        <Languages size={15} />
        {language === 'ar' ? 'EN' : 'AR'}
      </button>

      {/* User avatar + sign out */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
          {initials}
        </div>
        <span className="hidden sm:block text-sm text-muted-foreground max-w-[140px] truncate">
          {user?.email}
        </span>
        <button
          onClick={handleSignOut}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          aria-label={t('signOut')}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
