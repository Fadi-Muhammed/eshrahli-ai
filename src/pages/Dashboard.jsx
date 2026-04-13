import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Upload } from 'lucide-react'
import { useCourses } from '../hooks/useCourses'
import { useSlides } from '../hooks/useSlides'
import { useLanguage } from '../components/LanguageContext'
import CourseCard from '../components/dashboard/CourseCard'
import CreateCourseDialog from '../components/dashboard/CreateCourseDialog'
import UploadDialog from '../components/dashboard/UploadDialog'
import DefaultCoursesDialog from '../components/dashboard/DefaultCoursesDialog'

function CourseCardWithCount({ course, index }) {
  const { data: slides } = useSlides(course.id)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
    >
      <CourseCard course={course} slideCount={slides?.length ?? 0} />
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
      <div className="h-2 bg-muted" />
      <div className="p-4">
        <div className="h-4 bg-muted rounded-md w-3/4 mb-2" />
        <div className="h-3 bg-muted rounded-md w-1/2 mb-4" />
        <div className="h-5 bg-muted rounded-full w-16" />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { t } = useLanguage()
  const { data: courses, isLoading, error } = useCourses()
  const [createOpen, setCreateOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [starterOpen, setStarterOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !error && courses?.length === 0) {
      setStarterOpen(true)
    }
  }, [courses, isLoading, error])

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t('myCourses')}</h1>
          <p className="text-primary/80 text-sm mt-0.5">
            {isLoading ? '…' : `${courses?.length ?? 0} courses`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 border border-border bg-card px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            <Upload size={15} />
            {t('upload')}
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-all active:scale-95"
          >
            <Plus size={15} />
            {t('newCourse')}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-4 text-sm mb-4">
          Failed to load courses: {error.message}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      <AnimatePresence>
        {!isLoading && !error && courses?.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl border border-border bg-card rounded-xl p-8 text-center mx-auto"
          >
            <h2 className="text-xl font-semibold text-primary mb-2">{t('noCoursesYet')}</h2>
            <p className="text-primary/80 text-sm mb-6">{t('simpleDashboardEmptyDescription')}</p>
            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={() => setStarterOpen(true)}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-all active:scale-95"
              >
                {t('chooseStarterCourses')}
              </button>
              <button
                onClick={() => setUploadOpen(true)}
                className="flex items-center gap-2 border border-border bg-card px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                <Upload size={15} />
                Upload PDF/PPTX
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoading && !error && courses?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course, i) => (
            <CourseCardWithCount key={course.id} course={course} index={i} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {createOpen && <CreateCourseDialog onClose={() => setCreateOpen(false)} />}
        {uploadOpen && <UploadDialog onClose={() => setUploadOpen(false)} />}
        {starterOpen && courses?.length === 0 && <DefaultCoursesDialog onClose={() => setStarterOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}
