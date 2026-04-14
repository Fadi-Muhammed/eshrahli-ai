import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Calculator, BookOpen, Zap, Atom, FlaskConical, Monitor, Leaf, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '../LanguageContext'
import { useCreateCoursesBatch } from '../../hooks/useCourses'

const DEFAULT_COURSES = [
  { id: 'math', name: 'Mathematics', nameAr: 'الرياضيات', icon: Calculator, color: 'blue' },
  { id: 'english', name: 'English', nameAr: 'اللغة الإنجليزية', icon: BookOpen, color: 'amber' },
  { id: 'electrical-engineering', name: 'Electrical Engineering', nameAr: 'الهندسة الكهربائية', icon: Zap, color: 'yellow' },
  { id: 'physics', name: 'Physics', nameAr: 'الفيزياء', icon: Atom, color: 'violet' },
  { id: 'chemistry', name: 'Chemistry', nameAr: 'الكيمياء', icon: FlaskConical, color: 'emerald' },
  { id: 'computer-science', name: 'Computer Science', nameAr: 'علوم الحاسوب', icon: Monitor, color: 'cyan' },
  { id: 'biology', name: 'Biology', nameAr: 'الأحياء', icon: Leaf, color: 'green' },
]

const COLOR_MAP = {
  blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/40',    text: 'text-blue-500',    ring: 'ring-blue-500/30' },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/40',   text: 'text-amber-500',   ring: 'ring-amber-500/30' },
  yellow:  { bg: 'bg-yellow-500/10',  border: 'border-yellow-500/40',  text: 'text-yellow-500',  ring: 'ring-yellow-500/30' },
  violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/40',  text: 'text-violet-500',  ring: 'ring-violet-500/30' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-500', ring: 'ring-emerald-500/30' },
  cyan:    { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/40',    text: 'text-cyan-500',    ring: 'ring-cyan-500/30' },
  green:   { bg: 'bg-green-500/10',   border: 'border-green-500/40',   text: 'text-green-500',   ring: 'ring-green-500/30' },
}

export default function DefaultCoursesDialog({ onClose }) {
  const { t, language } = useLanguage()
  const createCoursesBatch = useCreateCoursesBatch()
  const [selected, setSelected] = useState({})

  const selectedCourses = useMemo(
    () => DEFAULT_COURSES.filter((c) => selected[c.id]),
    [selected]
  )

  const toggle = (id) =>
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedCourses.length) return

    try {
      await createCoursesBatch.mutateAsync(
        selectedCourses.map((c) => ({ id: c.id, name: c.name, name_ar: c.nameAr }))
      )
      toast.success(t('defaultCoursesCreated'))
      onClose()
    } catch (err) {
      toast.error(err.message ?? t('defaultCoursesCreateError'))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-card rounded-2xl shadow-2xl dark:shadow-black/50 w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-base">{t('starterCoursesTitle')}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t('starterCoursesDescription')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Course grid */}
        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 grid grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto">
            {DEFAULT_COURSES.map((course, i) => {
              const Icon = course.icon
              const colors = COLOR_MAP[course.color]
              const isSelected = !!selected[course.id]

              return (
                <motion.button
                  key={course.id}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: i * 0.03 }}
                  onClick={() => toggle(course.id)}
                  className={`relative flex items-center gap-3 px-3.5 py-3 rounded-xl border text-start transition-all duration-150 select-none
                    ${isSelected
                      ? `${colors.border} ${colors.bg} ring-2 ${colors.ring}`
                      : 'border-border hover:border-border/80 hover:bg-muted/50'
                    }`}
                >
                  <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={17} className={colors.text} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {language === 'ar' ? course.nameAr : course.name}
                    </p>
                  </div>

                  {/* Check indicator */}
                  <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150
                    ${isSelected ? `bg-primary border-primary` : 'border-muted-foreground/30'}`}
                    style={{ width: 18, height: 18 }}
                  >
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.1 }}
                        >
                          <Check size={10} className="text-primary-foreground" strokeWidth={3} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-muted/30">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
            >
              {t('maybeLater')}
            </button>

            <AnimatePresence mode="wait">
              <motion.button
                key={selectedCourses.length > 0 ? 'active' : 'disabled'}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                type="submit"
                disabled={createCoursesBatch.isPending || !selectedCourses.length}
                className="flex items-center gap-2 px-5 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-40 transition-all"
              >
                {createCoursesBatch.isPending && (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {selectedCourses.length > 0
                  ? `${t('createSelectedCourses')} (${selectedCourses.length})`
                  : t('createSelectedCourses')
                }
              </motion.button>
            </AnimatePresence>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
