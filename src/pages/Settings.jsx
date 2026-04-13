import { useAuth } from '../lib/AuthContext'
import { useLanguage } from '../components/LanguageContext'
import { useTheme } from '../components/ThemeContext'
import { Languages, User, Info, Moon, Sun } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Settings() {
  const { user } = useAuth()
  const { language, toggleLanguage, t } = useLanguage()
  const { theme, setTheme } = useTheme()

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-primary mb-6">{t('settings')}</h1>

      <div className="flex flex-col gap-4">
        {/* Account */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            <User size={14} />
            Account
          </div>
          <p className="text-sm text-foreground">{user?.email}</p>
        </div>

        {/* Appearance */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            <Moon size={14} />
            {t('appearance')}
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{t('nightMode')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('nightModeDescription')}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setTheme('light')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all inline-flex items-center gap-1.5 ${
                  theme === 'light'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <Sun size={13} />
                {t('light')}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setTheme('dark')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all inline-flex items-center gap-1.5 ${
                  theme === 'dark'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <Moon size={13} />
                {t('dark')}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="bg-card border border-border rounded-xl p-5">
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
        <div className="bg-card border border-border rounded-xl p-5">
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
