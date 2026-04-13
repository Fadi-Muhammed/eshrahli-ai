import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useAllSlides } from '../hooks/useSlides'
import { useCourses } from '../hooks/useCourses'
import { useLanguage } from '../components/LanguageContext'
import { useFavorites } from '../hooks/useFavorites'
import SlideStatusPills from '../components/slide/SlideStatusPills'

function FavoriteSlideCard({ slide, courseName, onOpen }) {
  return (
    <motion.button
      whileHover={{ y: -2, boxShadow: '0 10px 24px rgba(20,40,80,0.1)' }}
      whileTap={{ scale: 0.99 }}
      onClick={onOpen}
      className="w-full rounded-xl border border-border bg-card px-4 py-3 text-start hover:border-primary/30 transition-all"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full ring-1 ring-amber-200 dark:bg-amber-400/15 dark:text-amber-300 dark:ring-amber-400/20">
          <Star size={11} fill="currentColor" />
          Favorite
        </span>
        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          Slide {slide.slide_number}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-2 truncate">{courseName}</p>
      <p className="text-sm text-muted-foreground line-clamp-3 mt-1.5">{slide.original_text || 'No text content'}</p>
      <SlideStatusPills slideId={slide.id} isFavorite />
    </motion.button>
  )
}

export default function Favorites() {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const { data: slides = [], isLoading, error } = useAllSlides()
  const { data: courses = [] } = useCourses()
  const { favoriteIds } = useFavorites()

  const coursesById = useMemo(() => Object.fromEntries(courses.map((course) => [course.id, course])), [courses])

  const favoriteSlides = useMemo(() => {
    const byId = new Map(slides.map((slide) => [slide.id, slide]))
    return favoriteIds.map((id) => byId.get(id)).filter(Boolean)
  }, [favoriteIds, slides])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Favorites</h1>
          <p className="text-primary/80 text-sm mt-0.5">
            {isLoading ? '…' : `${favoriteSlides.length} favorite slides`}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-4 text-sm mb-4">
          {error.message}
        </div>
      )}

      {!isLoading && !error && favoriteSlides.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-5">
            <Star size={30} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-primary mb-2">No favorite slides yet</h2>
          <p className="text-primary/80 text-sm max-w-xs">Star any slide from course or lecture view and it will appear here.</p>
        </motion.div>
      )}

      {!isLoading && !error && favoriteSlides.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {favoriteSlides.map((slide) => {
            const course = coursesById[slide.course_id]
            const courseName = course ? (language === 'ar' ? course.name_ar : course.name) : t('myCourses')

            return (
              <FavoriteSlideCard
                key={slide.id}
                slide={slide}
                courseName={courseName}
                onOpen={() => navigate(`/course/${slide.course_id}/slide/${slide.id}`)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
