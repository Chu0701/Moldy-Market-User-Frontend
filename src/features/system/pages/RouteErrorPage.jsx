import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'

export function RouteErrorPage() {
  const { t } = useTranslation()

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-12 text-foreground">
      <section role="alert" className="max-w-lg text-center">
        <h1 className="text-3xl font-semibold">{t('feedback.errorTitle')}</h1>
        <p className="mt-4 leading-7 text-muted-foreground">{t('feedback.errorMessage')}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button className="min-h-11" onClick={() => window.location.reload()}>
            {t('actions.reload')}
          </Button>
          <Button asChild variant="outline" className="min-h-11">
            <Link to="/">{t('actions.backHome')}</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
