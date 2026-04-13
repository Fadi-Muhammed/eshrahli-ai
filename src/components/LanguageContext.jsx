import { createContext, useContext, useEffect, useState } from 'react'

const translations = {
  ar: {
    appName: 'Bridge AI',
    dashboard: 'لوحة التحكم',
    myCourses: 'مقرراتي',
    newCourse: 'مقرر جديد',
    upload: 'رفع ملف',
    slides: 'شرائح',
    slide: 'شريحة',
    explanation: 'الشرح',
    questions: 'أسئلة وأجوبة',
    quiz: 'اختبار',
    saved: 'المحفوظات',
    signOut: 'تسجيل الخروج',
    loading: 'جار التحميل...',
    noCoursesYet: 'لا توجد مقررات بعد',
    createFirstCourse: 'أنشئ مقررك الأول للبدء',
    courseName: 'اسم المقرر (EN)',
    courseNameAr: 'اسم المقرر (AR)',
    create: 'إنشاء',
    cancel: 'إلغاء',
    rename: 'إعادة التسمية',
    delete: 'حذف',
    deleteConfirm: 'هل أنت متأكد؟ سيتم حذف جميع الشرائح والشروحات والأسئلة.',
    noSlidesYet: 'لا توجد شرائح بعد',
    uploadSlides: 'ارفع ملفًا لإضافة شرائح',
    generateExplanation: 'توليد الشرح',
    generating: 'جار التوليد...',
    regenerate: 'إعادة التوليد',
    save: 'حفظ',
    askQuestion: 'اكتب سؤالك...',
    send: 'إرسال',
    generateQuiz: 'توليد اختبار',
    score: 'النتيجة',
    correct: 'صحيح',
    wrong: 'خطأ',
    noSavedExplanations: 'لا توجد شروحات محفوظة',
  },
  en: {
    appName: 'Bridge AI',
    dashboard: 'Dashboard',
    myCourses: 'My Courses',
    newCourse: 'New Course',
    upload: 'Upload',
    slides: 'Slides',
    slide: 'Slide',
    explanation: 'Explanation',
    questions: 'Q&A',
    quiz: 'Quiz',
    saved: 'Saved',
    signOut: 'Sign Out',
    loading: 'Loading...',
    noCoursesYet: 'No courses yet',
    createFirstCourse: 'Create your first course to get started',
    courseName: 'Course Name (EN)',
    courseNameAr: 'Course Name (AR)',
    create: 'Create',
    cancel: 'Cancel',
    rename: 'Rename',
    delete: 'Delete',
    deleteConfirm: 'Are you sure? This will delete all slides, explanations, and questions.',
    noSlidesYet: 'No slides yet',
    uploadSlides: 'Upload a file to add slides',
    generateExplanation: 'Generate Explanation',
    generating: 'Generating...',
    regenerate: 'Regenerate',
    save: 'Save',
    askQuestion: 'Ask a question...',
    send: 'Send',
    generateQuiz: 'Generate Quiz',
    score: 'Score',
    correct: 'Correct',
    wrong: 'Wrong',
    noSavedExplanations: 'No saved explanations',
  },
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('lang') ?? 'ar')

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
    localStorage.setItem('lang', language)
  }, [language])

  const toggleLanguage = () => setLanguage((l) => (l === 'ar' ? 'en' : 'ar'))
  const t = (key) => translations[language][key] ?? key

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t, isRTL: language === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}
