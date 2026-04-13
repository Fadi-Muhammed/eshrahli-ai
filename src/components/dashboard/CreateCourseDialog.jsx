import { useState } from 'react'
import { useCreateCourse } from '../../hooks/useCourses'
import { useLanguage } from '../LanguageContext'
import { toast } from 'sonner'
import { X } from 'lucide-react'

export default function CreateCourseDialog({ onClose }) {
  const { t } = useLanguage()
  const createCourse = useCreateCourse()
  const [name, setName] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      await createCourse.mutateAsync({ name: name.trim(), name_ar: name.trim() })
      toast.success('Course created!')
      onClose()
    } catch (err) {
      toast.error(err.message ?? 'Failed to create course')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card rounded-lg shadow-lg dark:shadow-black/45 w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">{t('newCourse')}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">{t('courseName')}</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Data Structures / هياكل البيانات"
              dir="auto"
               className="border border-input bg-background rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={createCourse.isPending}
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
            >
              {createCourse.isPending && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {t('create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
