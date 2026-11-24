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
      type="button"
      variant="ghost"
      size="sm"
      className="min-h-10 px-2.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:text-foreground"
      aria-label={`${t('language.label')}: ${t(`language.${nextLanguage}`)}`}
      onClick={changeLanguage}
    >
      {nextLanguage.toUpperCase()}
    </Button>
  )
}
