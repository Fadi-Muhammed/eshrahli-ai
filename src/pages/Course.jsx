import { useParams, useNavigate, Link } from 'react-router-dom'
import { useCourses } from '../hooks/useCourses'
import { useSlides } from '../hooks/useSlides'
import { useLanguage } from '../components/LanguageContext'
import { useExplanation } from '../hooks/useExplanations'
import { FileText, ChevronRight, Upload } from 'lucide-react'

function SlideStatusBadge({ slideId }) {
  const { data: explanation } = useExplanation(slideId)
  if (!explanation) return null
  return (
    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
      Explained
    </span>
  )
}

function SlideCard({ slide, courseId }) {
  const navigate = useNavigate()
  const { language } = useLanguage()

  const preview = slide.original_text
    ? slide.original_text.slice(0, 80) + (slide.original_text.length > 80 ? '...' : '')
    : 'No text content'

  return (
    <div
      onClick={() => navigate(`/course/${courseId}/slide/${slide.id}`)}
      className="bg-white border border-border rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          Slide {slide.slide_number}
        </span>
        <SlideStatusBadge slideId={slide.id} />
      </div>
      <p className="text-sm text-muted-foreground line-clamp-3">{preview}</p>
    </div>
  )
}

function SkeletonSlide() {
  return (
    <div className="bg-white border border-border rounded-lg p-4 animate-pulse">
      <div className="h-4 bg-muted rounded w-16 mb-2" />
      <div className="h-3 bg-muted rounded w-full mb-1" />
      <div className="h-3 bg-muted rounded w-4/5" />
    </div>
  )
}

export default function Course() {
  const { courseId } = useParams()
  const { t, language } = useLanguage()
  const { data: courses } = useCourses()
  const { data: slides, isLoading, error } = useSlides(courseId)

  const course = courses?.find((c) => c.id === courseId)
  const displayName = course ? (language === 'ar' ? course.name_ar : course.name) : '...'

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">{t('dashboard')}</Link>
        <ChevronRight size={14} />
        <span className="text-foreground font-medium">{displayName}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {slides?.length ?? 0} {t('slides')}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-destructive rounded-md p-4 text-sm">
          Failed to load slides: {error.message}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonSlide key={i} />)}
        </div>
      )}

      {!isLoading && !error && slides?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <FileText size={28} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold mb-1">{t('noSlidesYet')}</h2>
          <p className="text-muted-foreground text-sm">{t('uploadSlides')}</p>
        </div>
      )}

      {!isLoading && !error && slides?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {slides.map((slide) => (
            <SlideCard key={slide.id} slide={slide} courseId={courseId} />
          ))}
        </div>
      )}
    </div>
  )
}
