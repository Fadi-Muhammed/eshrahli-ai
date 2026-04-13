import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useLanguage } from '../LanguageContext'
import RenameCourseDialog from './RenameCourseDialog'
import DeleteCourseDialog from './DeleteCourseDialog'

const COURSE_COLORS = [
  ['bg-blue-500', 'bg-blue-50'],
  ['bg-violet-500', 'bg-violet-50'],
  ['bg-emerald-500', 'bg-emerald-50'],
  ['bg-orange-500', 'bg-orange-50'],
  ['bg-pink-500', 'bg-pink-50'],
  ['bg-cyan-500', 'bg-cyan-50'],
  ['bg-rose-500', 'bg-rose-50'],
  ['bg-indigo-500', 'bg-indigo-50'],
]

function getCourseColor(id) {
  const num = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return COURSE_COLORS[num % COURSE_COLORS.length]
}

export default function CourseCard({ course, slideCount = 0 }) {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const displayName = language === 'ar' ? course.name_ar : course.name
  const [stripColor, bgColor] = getCourseColor(course.id)

  return (
    <>
      <motion.div
        whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
        onClick={() => navigate(`/course/${course.id}`)}
        className={`bg-white border border-border rounded-xl cursor-pointer group relative overflow-visible ${menuOpen ? 'z-50' : 'z-0'}`}
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      >
        <div className={`h-1.5 ${stripColor}`} />

        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
                <span className={`text-sm font-bold ${stripColor.replace('bg-', 'text-')}`}>
                  {displayName?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground truncate leading-tight">{displayName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {slideCount} {slideCount === 1 ? 'slide' : 'slides'}
                </p>
              </div>
            </div>

            {/* Three-dot menu */}
            <div className="relative shrink-0">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Course options"
              >
                <MoreVertical size={15} />
              </motion.button>

              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute end-0 z-20 mt-1 w-36 bg-white border border-border rounded-xl shadow-lg py-1 overflow-hidden"
                    >
                      <button
                        className="w-full text-start px-3 py-2.5 text-sm hover:bg-muted flex items-center gap-2.5 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setRenaming(true) }}
                      >
                        <Pencil size={13} className="text-muted-foreground" />
                        Rename
                      </button>
                      <button
                        className="w-full text-start px-3 py-2.5 text-sm hover:bg-red-50 text-destructive flex items-center gap-2.5 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setDeleting(true) }}
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {renaming && <RenameCourseDialog course={course} onClose={() => setRenaming(false)} />}
        {deleting && <DeleteCourseDialog course={course} onClose={() => setDeleting(false)} />}
      </AnimatePresence>
    </>
  )
}
