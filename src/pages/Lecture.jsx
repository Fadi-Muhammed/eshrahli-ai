import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { useCourses } from '../hooks/useCourses'
import { useSlides } from '../hooks/useSlides'
import { useLanguage } from '../components/LanguageContext'
import { FileStack, ChevronRight, Star } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import SlideStatusPills from '../components/slide/SlideStatusPills'

function lectureKey(slide) {
  return slide.file_url || slide.file_name || `slide-${slide.id}`
}

function SlideCard({ slide, courseId, index }) {
  const navigate = useNavigate()
  const { isFavorite, toggleFavorite } = useFavorites()
  const starred = isFavorite(slide.id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.025, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, boxShadow: '0 10px 24px rgba(20,40,80,0.1)' }}
      whileTap={{ scale: 0.985 }}
      onClick={() => navigate(`/course/${courseId}/slide/${slide.id}`)}
      className="w-full text-start rounded-xl border border-border bg-card p-4 hover:border-primary/35 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          Slide {slide.slide_number}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(slide.id)
          }}
          className={starred ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500'}
          aria-label={starred ? 'Remove favorite' : 'Add favorite'}
        >
          <Star size={16} fill={starred ? 'currentColor' : 'none'} />
        </button>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mt-2">
        {slide.original_text || 'No text content'}
      </p>
      <SlideStatusPills slideId={slide.id} isFavorite={starred} />
    </motion.div>
  )
}

export default function Lecture() {
  const { courseId, lectureId } = useParams()
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const { data: courses } = useCourses()
  const { data: slides = [], isLoading, error } = useSlides(courseId)

  const decodedLectureId = decodeURIComponent(lectureId || '')
  const lectureSlides = useMemo(
    () => slides.filter((slide) => lectureKey(slide) === decodedLectureId),
    [slides, decodedLectureId]
  )

  const course = courses?.find((c) => c.id === courseId)
  const displayCourseName = course ? (language === 'ar' ? course.name_ar : course.name) : '…'
  const lectureName = lectureSlides[0]?.file_name || 'Untitled Lecture'

  if (!isLoading && !lectureSlides.length) {
    return (
      <div className="text-center py-24 text-primary/80 text-sm">
        Lecture not found.{' '}
        <button onClick={() => navigate(`/course/${courseId}`)} className="text-primary hover:underline">
          Back to course
        </button>
      </div>
    )
  }

  return (
    <div>
      <nav className="flex items-center gap-1 text-sm text-primary/80 mb-4 flex-wrap">
        <Link to="/" className="text-primary hover:opacity-85 transition-opacity">{t('dashboard')}</Link>
        <ChevronRight size={13} className="opacity-40" />
        <Link to={`/course/${courseId}`} className="text-primary hover:opacity-85 transition-opacity">{displayCourseName}</Link>
        <ChevronRight size={13} className="opacity-40" />
        <span className="text-primary font-medium truncate max-w-full">{lectureName}</span>
      </nav>

      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileStack size={18} className="text-primary shrink-0" />
            <h1 className="text-2xl font-bold text-primary truncate">{lectureName}</h1>
          </div>
          <p className="text-primary/80 text-sm mt-1">
            {isLoading ? '…' : `${lectureSlides.length} ${lectureSlides.length === 1 ? 'slide' : 'slides'}`}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-4 text-sm mb-4">
          {error.message}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-muted rounded-full w-16 mb-3" />
              <div className="h-3 bg-muted rounded w-full mb-1.5" />
              <div className="h-3 bg-muted rounded w-4/5 mb-1.5" />
              <div className="h-3 bg-muted rounded w-3/5" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && lectureSlides.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {lectureSlides.map((slide, i) => (
            <SlideCard key={slide.id} slide={slide} courseId={courseId} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
