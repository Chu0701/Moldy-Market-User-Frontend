import { useTranslation } from 'react-i18next'

import { ChangePasswordForm } from '@/features/profile/components/ChangePasswordForm'

export function AccountSettingsPage() {
  const { t } = useTranslation()
  return (
    <section className="profile-page" aria-labelledby="account-settings-title">
      <header className="space-y-1.5 border-b border-border pb-4">
        <h1
          id="account-settings-title"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {t('account.title')}
        </h1>
      </header>
      <ChangePasswordForm />
    </section>
  )
}
