import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAllExplanations } from '../hooks/useExplanations'
import { useLanguage } from '../components/LanguageContext'
import { Bookmark, Search, ChevronRight, X } from 'lucide-react'

function SkeletonRow() {
  return (
    <div className="animate-pulse flex gap-3 p-4">
      <div className="w-8 h-8 bg-muted rounded-full shrink-0" />
      <div className="flex-1">
        <div className="h-3 bg-muted rounded w-20 mb-2" />
        <div className="h-3 bg-muted rounded w-full" />
      </div>
    </div>
  )
}

export default function Saved() {
  const { t, language } = useLanguage()
  const { data: explanations, isLoading, error } = useAllExplanations()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filtered = (explanations ?? []).filter((exp) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      exp.arabic_explanation?.toLowerCase().includes(q) ||
      exp.courses?.name?.toLowerCase().includes(q) ||
      exp.courses?.name_ar?.toLowerCase().includes(q)
    )
  })

  // Group by course
  const grouped = filtered.reduce((acc, exp) => {
    const cid = exp.course_id
    if (!acc[cid]) acc[cid] = { course: exp.courses, items: [] }
    acc[cid].items.push(exp)
    return acc
  }, {})

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('saved')}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isLoading ? '…' : `${explanations?.length ?? 0} saved explanations`}
          </p>
        </div>
      </div>

      {/* Search */}
      {!isLoading && (explanations?.length ?? 0) > 0 && (
        <div className="relative mb-5">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search explanations…"
            className="w-full border border-input rounded-lg pl-9 pr-9 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring bg-white"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-destructive rounded-lg p-4 text-sm">{error.message}</div>
      )}

      {isLoading && (
        <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden">
          {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
        </div>
      )}

      <AnimatePresence>
        {!isLoading && !error && (explanations?.length ?? 0) === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-5">
              <Bookmark size={30} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2">{t('noSavedExplanations')}</h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              Open any slide and generate an explanation — it will appear here automatically.
            </p>
          </motion.div>
        )}

        {!isLoading && filtered.length === 0 && search && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-muted-foreground text-sm"
          >
            No results for "<span className="font-medium text-foreground">{search}</span>"
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoading && Object.values(grouped).map(({ course, items }, groupIdx) => {
        const courseName = course
          ? (language === 'ar' ? course.name_ar : course.name)
          : 'Unknown Course'
        return (
          <motion.div
            key={items[0].course_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIdx * 0.06 }}
            className="mb-4"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              {courseName} · {items.length}
            </p>
            <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden">
              {items.map((exp, i) => (
                <motion.button
                  key={exp.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigate(`/course/${exp.course_id}/slide/${exp.slide_id}`)}
                  className="w-full text-start flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors group"
                >
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {exp.slides?.slide_number ?? '?'}
                  </span>
                  <p className="text-sm text-foreground line-clamp-1 flex-1 text-start" dir="rtl">
                    {exp.arabic_explanation?.slice(0, 120)}
                  </p>
                  <ChevronRight size={14} className="text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
