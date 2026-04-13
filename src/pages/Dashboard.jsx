import { useState } from 'react'
import { Plus, Upload, BookOpen } from 'lucide-react'
import { useCourses } from '../hooks/useCourses'
import { useSlides } from '../hooks/useSlides'
import { useLanguage } from '../components/LanguageContext'
import CourseCard from '../components/dashboard/CourseCard'
import CreateCourseDialog from '../components/dashboard/CreateCourseDialog'

// Helper to count slides per course using a pre-fetched map
function CourseCardWithCount({ course }) {
  const { data: slides } = useSlides(course.id)
  return <CourseCard course={course} slideCount={slides?.length ?? 0} />
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden animate-pulse">
      <div className="h-2 bg-muted" />
      <div className="p-4">
        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
        <div className="h-3 bg-muted rounded w-1/2 mb-4" />
        <div className="h-5 bg-muted rounded w-16" />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { t } = useLanguage()
  const { data: courses, isLoading, error } = useCourses()
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('myCourses')}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {courses?.length ?? 0} {t('courses') ?? 'courses'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
          >
            <Plus size={16} />
            {t('newCourse')}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-destructive rounded-md p-4 text-sm mb-4">
          Failed to load courses: {error.message}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && courses?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <BookOpen size={28} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">{t('noCoursesYet')}</h2>
          <p className="text-muted-foreground text-sm mb-6">{t('createFirstCourse')}</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-medium hover:opacity-90"
          >
            <Plus size={16} />
            {t('newCourse')}
          </button>
        </div>
      )}

      {/* Course grid */}
      {!isLoading && !error && courses?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <CourseCardWithCount key={course.id} course={course} />
          ))}
        </div>
      )}

      {createOpen && <CreateCourseDialog onClose={() => setCreateOpen(false)} />}
    </div>
  )
}
