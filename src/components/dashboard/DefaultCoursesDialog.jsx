import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '../LanguageContext'
import { useCreateCoursesBatch } from '../../hooks/useCourses'

const DEFAULT_COURSES = [
  { id: 'math', name: 'Math' },
  { id: 'english', name: 'English' },
  { id: 'electrical-engineering', name: 'Electrical Engineering' },
  { id: 'physics', name: 'Physics' },
  { id: 'chemistry', name: 'Chemistry' },
  { id: 'computer-science', name: 'Computer Science' },
  { id: 'biology', name: 'Biology' },
]

export default function DefaultCoursesDialog({ onClose }) {
  const { t } = useLanguage()
  const createCoursesBatch = useCreateCoursesBatch()
  const [selected, setSelected] = useState(() =>
    DEFAULT_COURSES.reduce((acc, course) => {
      acc[course.id] = true
      return acc
    }, {})
  )

  const selectedCourses = useMemo(
    () => DEFAULT_COURSES.filter((course) => selected[course.id]),
    [selected]
  )

  const toggleCourse = (courseId) => {
    setSelected((prev) => ({ ...prev, [courseId]: !prev[courseId] }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedCourses.length) return

    try {
      await createCoursesBatch.mutateAsync(selectedCourses)
      toast.success(t('defaultCoursesCreated'))
      onClose()
    } catch (err) {
      toast.error(err.message ?? t('defaultCoursesCreateError'))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card rounded-lg shadow-lg dark:shadow-black/45 w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">{t('starterCoursesTitle')}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label={t('cancel')}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{t('starterCoursesDescription')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEFAULT_COURSES.map((course) => (
              <label key={course.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!selected[course.id]}
                  onChange={() => toggleCourse(course.id)}
                  className="accent-primary"
                />
                <span>{course.name}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted"
            >
              {t('maybeLater')}
            </button>
            <button
              type="submit"
              disabled={createCoursesBatch.isPending || !selectedCourses.length}
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
            >
              {createCoursesBatch.isPending && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {t('createSelectedCourses')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
