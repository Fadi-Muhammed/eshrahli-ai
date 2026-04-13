import { useDeleteCourse } from '../../hooks/useCourses'
import { useLanguage } from '../LanguageContext'
import { toast } from 'sonner'
import { AlertTriangle, X } from 'lucide-react'

export default function DeleteCourseDialog({ course, onClose }) {
  const { t } = useLanguage()
  const deleteCourse = useDeleteCourse()

  const handleDelete = async () => {
    try {
      await deleteCourse.mutateAsync(course.id)
      toast.success('Course deleted')
      onClose()
    } catch (err) {
      toast.error(err.message ?? 'Failed to delete course')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">{t('delete')} "{course.name}"</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="flex gap-3 items-start bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <AlertTriangle size={18} className="text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">{t('deleteConfirm')}</p>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted">
              {t('cancel')}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteCourse.isPending}
              className="px-4 py-2 text-sm rounded-md bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
            >
              {deleteCourse.isPending && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {t('delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
