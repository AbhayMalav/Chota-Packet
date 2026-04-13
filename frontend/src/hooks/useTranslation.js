import { useTheme } from '../context/ThemeContext'
import { translations } from '../config/translations'

export default function useTranslation() {
  const { language } = useTheme()
  const t = translations[language] || translations.en

  return { t, language }
}