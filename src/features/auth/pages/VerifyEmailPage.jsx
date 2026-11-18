import { useTranslation } from 'react-i18next'

import { VerifyEmailForm } from '@/features/auth/components/VerifyEmailForm'

export function VerifyEmailPage() {
  const { t } = useTranslation()

  return (
    <section className="login-page" aria-labelledby="verify-email-title">
      <h1 id="verify-email-title">{t('auth.verify.title')}</h1>
      <VerifyEmailForm />
    </section>
  )
}
