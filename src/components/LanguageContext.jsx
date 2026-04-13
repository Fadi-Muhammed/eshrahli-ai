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
    favorites: 'المفضلة',
    settings: 'الإعدادات',
    appearance: 'المظهر',
    nightMode: 'الوضع الليلي',
    nightModeDescription: 'أفضل للقراءة الليلية وتقليل إجهاد العين.',
    light: 'فاتح',
    dark: 'داكن',
    signOut: 'تسجيل الخروج',
    loading: 'جار التحميل…',
    noCoursesYet: 'لا توجد مقررات بعد',
    createFirstCourse: 'أنشئ مقررك الأول أو ارفع ملفًا للبدء',
    simpleDashboardEmptyDescription: 'ابدأ بطريقة بسيطة: اختر مقررات جاهزة أو ارفع ملفًا.',
    chooseStarterCourses: 'اختر مقررات جاهزة',
    starterCoursesTitle: 'اختر مقرراتك المبدئية',
    starterCoursesDescription: 'حدد المقررات التي تريد إضافتها الآن، ويمكنك تعديلها لاحقًا.',
    createSelectedCourses: 'إنشاء المقررات المحددة',
    maybeLater: 'لاحقًا',
    defaultCoursesCreated: 'تم إنشاء المقررات بنجاح',
    defaultCoursesCreateError: 'تعذر إنشاء المقررات',
    courseName: 'اسم المقرر',
    create: 'إنشاء',
    cancel: 'إلغاء',
    rename: 'إعادة التسمية',
    delete: 'حذف',
    deleteConfirm: 'سيتم حذف جميع الشرائح والشروحات والأسئلة نهائيًا.',
    noSlidesYet: 'لا توجد شرائح بعد',
    uploadSlides: 'ارفع ملف PPTX (مفضل) أو PDF. سيتم تحويل PPTX تلقائيًا إلى PDF عند الإمكان.',
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
    favorites: 'Favorites',
    settings: 'Settings',
    appearance: 'Appearance',
    nightMode: 'Night mode',
    nightModeDescription: 'Designed for late sessions with high contrast and comfortable reading.',
    light: 'Light',
    dark: 'Dark',
    signOut: 'Sign Out',
    loading: 'Loading…',
    noCoursesYet: 'No courses yet',
    createFirstCourse: 'Create a course or upload a file to get started',
    simpleDashboardEmptyDescription: 'Keep it simple: pick starter courses or upload a file.',
    chooseStarterCourses: 'Choose Starter Courses',
    starterCoursesTitle: 'Pick Starter Courses',
    starterCoursesDescription: 'Select the courses you want now. You can rename or change them later.',
    createSelectedCourses: 'Create Selected Courses',
    maybeLater: 'Maybe Later',
    defaultCoursesCreated: 'Starter courses created',
    defaultCoursesCreateError: 'Failed to create starter courses',
    courseName: 'Course Name',
    create: 'Create',
    cancel: 'Cancel',
    rename: 'Rename',
    delete: 'Delete',
    deleteConfirm: 'This will permanently delete all slides, explanations, and questions.',
    noSlidesYet: 'No slides yet',
    uploadSlides: 'Upload a PPTX (preferred) or a PDF. PPTX will be converted to PDF when supported.',
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
