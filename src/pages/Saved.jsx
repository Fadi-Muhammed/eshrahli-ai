import { Link, useNavigate } from 'react-router-dom'
import { useAllExplanations } from '../hooks/useExplanations'
import { useLanguage } from '../components/LanguageContext'
import { Bookmark, ChevronRight } from 'lucide-react'

function SkeletonRow() {
  return (
    <div className="animate-pulse flex gap-3 p-3">
      <div className="w-8 h-8 bg-muted rounded-full shrink-0" />
      <div className="flex-1">
        <div className="h-3 bg-muted rounded w-24 mb-1.5" />
        <div className="h-3 bg-muted rounded w-full" />
      </div>
    </div>
  )
}

export default function Saved() {
  const { t, language } = useLanguage()
  const { data: explanations, isLoading, error } = useAllExplanations()
  const navigate = useNavigate()

  // Group by course
  const grouped = (explanations ?? []).reduce((acc, exp) => {
    const courseId = exp.course_id
    if (!acc[courseId]) acc[courseId] = { course: exp.courses, items: [] }
    acc[courseId].items.push(exp)
    return acc
  }, {})

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('saved')}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {explanations?.length ?? 0} saved explanations
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-destructive rounded-md p-4 text-sm">
          {error.message}
        </div>
      )}

      {isLoading && (
        <div className="bg-white border border-border rounded-lg divide-y divide-border">
          {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
        </div>
      )}

      {!isLoading && !error && explanations?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Bookmark size={28} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold mb-1">{t('noSavedExplanations')}</h2>
          <p className="text-muted-foreground text-sm">
            Generate explanations on slides to see them here.
          </p>
        </div>
      )}

      {!isLoading && Object.values(grouped).map(({ course, items }) => {
        const courseName = course ? (language === 'ar' ? course.name_ar : course.name) : 'Unknown Course'
        return (
          <div key={items[0].course_id} className="mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
              {courseName} ({items.length})
            </h2>
            <div className="bg-white border border-border rounded-lg divide-y divide-border">
              {items.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => navigate(`/course/${exp.course_id}/slide/${exp.slide_id}`)}
                  className="w-full text-start flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group"
                >
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                    {exp.slides?.slide_number ?? '?'}
                  </span>
                  <p className="text-sm text-foreground line-clamp-1 flex-1">
                    {exp.arabic_explanation?.slice(0, 100)}
                  </p>
                  <ChevronRight size={14} className="text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
