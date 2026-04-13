import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Upload, BookOpen } from 'lucide-react'
import { useCourses } from '../hooks/useCourses'
import { useSlides } from '../hooks/useSlides'
import { useLanguage } from '../components/LanguageContext'
import CourseCard from '../components/dashboard/CourseCard'
import CreateCourseDialog from '../components/dashboard/CreateCourseDialog'
import UploadDialog from '../components/dashboard/UploadDialog'

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
    <div className="bg-white border border-border rounded-xl overflow-hidden animate-pulse">
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

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('myCourses')}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isLoading ? '…' : `${courses?.length ?? 0} courses`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 border border-border bg-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
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
        <div className="bg-red-50 border border-red-200 text-destructive rounded-lg p-4 text-sm mb-4">
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
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-5">
              <BookOpen size={32} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">{t('noCoursesYet')}</h2>
            <p className="text-muted-foreground text-sm mb-7 max-w-xs">{t('createFirstCourse')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setUploadOpen(true)}
                className="flex items-center gap-2 border border-border bg-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                <Upload size={15} />
                Upload PDF/PPTX
              </button>
              <button
                onClick={() => setCreateOpen(true)}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-all active:scale-95"
              >
                <Plus size={15} />
                {t('newCourse')}
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
      </AnimatePresence>
    </div>
  )
}
