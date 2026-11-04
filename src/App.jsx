import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

function App() {
  const { t, i18n } = useTranslation()
  const nextLanguage = i18n.language === 'vi' ? 'en' : 'vi'

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-4xl font-bold text-foreground">{t('app.name')}</h1>
      <p className="mt-2 text-muted-foreground">{t('app.tagline')}</p>
      <div className="mt-6 flex gap-3">
        <Button>{t('actions.buyNow')}</Button>
        <Button variant="outline" onClick={() => i18n.changeLanguage(nextLanguage)}>
          {t('language.label')}: {t(`language.${nextLanguage}`)}
        </Button>
      </div>
    </div>
  )
}

export default App
