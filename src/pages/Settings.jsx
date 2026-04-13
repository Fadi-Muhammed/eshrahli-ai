import { useAuth } from '../lib/AuthContext'
import { useLanguage } from '../components/LanguageContext'
import { Languages, User, Info } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Settings() {
  const { user } = useAuth()
  const { language, toggleLanguage, t } = useLanguage()

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">{t('settings')}</h1>

      <div className="flex flex-col gap-4">
        {/* Account */}
        <div className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            <User size={14} />
            Account
          </div>
          <p className="text-sm text-foreground">{user?.email}</p>
        </div>

        {/* Language */}
        <div className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            <Languages size={14} />
            Language / اللغة
          </div>
          <div className="flex gap-2">
            {['ar', 'en'].map((lang) => (
              <motion.button
                key={lang}
                whileTap={{ scale: 0.96 }}
                onClick={() => language !== lang && toggleLanguage()}
                className={`px-5 py-2 rounded-lg text-sm font-medium border transition-all ${
                  language === lang
                    ? 'border-primary bg-primary text-white'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {lang === 'ar' ? 'العربية' : 'English'}
              </motion.button>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            <Info size={14} />
            About
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Eshrahli</span> helps Arabic-speaking university students understand English-taught courses by generating Arabic explanations with key English academic terms preserved and highlighted.
          </p>
        </div>
      </div>
    </div>
  )
}
