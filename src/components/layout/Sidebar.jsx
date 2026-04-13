import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Bookmark, X } from 'lucide-react'
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
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-14 bottom-0 z-40 w-56 bg-sidebar flex flex-col transition-transform duration-200',
          'lg:translate-x-0 lg:static lg:top-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-end px-3 py-2 lg:hidden">
          <button onClick={onClose} className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-2 pt-4">
          {navItems.map(({ to, icon: Icon, labelKey, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-white'
                    : 'text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground'
                )
              }
            >
              <Icon size={18} />
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
