import { createContext, useContext, useEffect, useState } from 'react'

const translations = {
  ar: {
    appName: 'Eshrahli',
    dashboard: 'الرئيسية',
    myCourses: 'مقرراتي',
    newCourse: 'مقرر جديد',
    upload: 'رفع ملف',
    slides: 'شرائح',
    slide: 'شريحة',
    courses: 'مقررات',
    explanation: 'الشرح',
    questions: 'أسئلة',
    quiz: 'اختبار',
    saved: 'المحفوظات',
    settings: 'الإعدادات',
    signOut: 'تسجيل الخروج',
    loading: 'جار التحميل…',
    noCoursesYet: 'لا توجد مقررات بعد',
    createFirstCourse: 'أنشئ مقررك الأول أو ارفع ملفًا للبدء',
    courseName: 'اسم المقرر',
    create: 'إنشاء',
    cancel: 'إلغاء',
    rename: 'إعادة التسمية',
    delete: 'حذف',
    deleteConfirm: 'سيتم حذف جميع الشرائح والشروحات والأسئلة نهائيًا.',
    noSlidesYet: 'لا توجد شرائح بعد',
    uploadSlides: 'ارفع ملف PDF أو PPTX لإضافة شرائح',
    generateExplanation: 'توليد الشرح',
    generating: 'جار التوليد…',
    regenerate: 'إعادة التوليد',
    save: 'حفظ',
    askQuestion: 'اكتب سؤالك…',
    send: 'إرسال',
    generateQuiz: 'توليد اختبار',
    score: 'النتيجة',
    correct: 'صحيح',
    wrong: 'خطأ',
    noSavedExplanations: 'لا توجد شروحات محفوظة',
    searchPlaceholder: 'ابحث في الشروحات…',
    previous: 'السابق',
    next: 'التالي',
  },
  en: {
    appName: 'Eshrahli',
    dashboard: 'Dashboard',
    myCourses: 'My Courses',
    newCourse: 'New Course',
    upload: 'Upload',
    slides: 'slides',
    slide: 'Slide',
    courses: 'courses',
    explanation: 'Explain',
    questions: 'Q&A',
    quiz: 'Quiz',
    saved: 'Saved',
    settings: 'Settings',
    signOut: 'Sign Out',
    loading: 'Loading…',
    noCoursesYet: 'No courses yet',
    createFirstCourse: 'Create a course or upload a file to get started',
    courseName: 'Course Name',
    create: 'Create',
    cancel: 'Cancel',
    rename: 'Rename',
    delete: 'Delete',
    deleteConfirm: 'This will permanently delete all slides, explanations, and questions.',
    noSlidesYet: 'No slides yet',
    uploadSlides: 'Upload a PDF or PPTX file to add slides',
    generateExplanation: 'Generate Explanation',
    generating: 'Generating…',
    regenerate: 'Regenerate',
    save: 'Save',
    askQuestion: 'Ask a question…',
    send: 'Send',
    generateQuiz: 'Generate Quiz',
    score: 'Score',
    correct: 'Correct',
    wrong: 'Wrong',
    noSavedExplanations: 'No saved explanations',
    searchPlaceholder: 'Search explanations…',
    previous: 'Previous',
    next: 'Next',
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
