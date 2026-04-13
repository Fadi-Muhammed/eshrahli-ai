import { useLocation } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './Navbar'

export default function AppLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background transition-colors">
      <Navbar />
      <main className="app-shell-main pt-[72px] px-4 sm:px-6 pb-6 min-h-screen bg-gradient-to-b from-[#f2f5f9] via-[#e9edf2] to-[#dde3ea] dark:from-[#141926] dark:via-[#101623] dark:to-[#0d1320] transition-colors">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
