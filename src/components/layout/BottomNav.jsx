import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Bookmark } from 'lucide-react'
import { useLanguage } from '../LanguageContext'
import { cn } from '../../lib/utils'
import { motion } from 'framer-motion'

const items = [
  { to: '/', icon: LayoutDashboard, labelKey: 'dashboard', end: true },
  { to: '/saved', icon: Bookmark, labelKey: 'saved' },
]

export default function BottomNav() {
  const { t } = useLanguage()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border flex items-stretch safe-bottom">
      {items.map(({ to, icon: Icon, labelKey, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )
          }
        >
          {({ isActive }) => (
            <>
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ duration: 0.15 }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              </motion.div>
              <span className={cn('font-medium', isActive && 'font-semibold')}>{t(labelKey)}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
