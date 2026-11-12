import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const nextLanguage = i18n.resolvedLanguage === 'vi' ? 'en' : 'vi'

  async function changeLanguage() {
    await i18n.changeLanguage(nextLanguage)
    document.documentElement.lang = nextLanguage
  }

  return (
    <Button
      variant="outline"
      className="min-h-11"
      aria-label={`${t('language.label')}: ${t(`language.${nextLanguage}`)}`}
      onClick={changeLanguage}
    >
      {t(`language.${nextLanguage}`)}
    </Button>
  )
}
