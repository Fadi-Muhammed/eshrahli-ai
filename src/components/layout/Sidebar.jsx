import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Bookmark, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../LanguageContext'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, labelKey: 'dashboard', end: true },
  { to: '/saved', icon: Bookmark, labelKey: 'saved' },
]

export default function Sidebar({ open, onClose }) {
  const { t } = useLanguage()

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar — always visible on lg, drawer on mobile */}
      <aside
        className={cn(
          'fixed top-14 bottom-0 z-40 w-56 bg-sidebar flex flex-col transition-transform duration-250 ease-out',
          'lg:translate-x-0 lg:static lg:top-0 lg:shrink-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-end px-3 py-2 lg:hidden">
          <button onClick={onClose} className="text-sidebar-foreground/50 hover:text-sidebar-foreground p-1 rounded-md hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 px-2 pt-3">
          {navItems.map(({ to, icon: Icon, labelKey, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-sidebar-foreground/60 hover:bg-white/8 hover:text-sidebar-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} strokeWidth={isActive ? 2.5 : 1.8} />
                  {t(labelKey)}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
