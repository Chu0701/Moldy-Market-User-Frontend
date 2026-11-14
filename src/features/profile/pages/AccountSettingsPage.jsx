import { useTranslation } from 'react-i18next'

import { ChangePasswordForm } from '@/features/profile/components/ChangePasswordForm'

export function AccountSettingsPage() {
  const { t } = useTranslation()
  return (
    <section className="profile-page" aria-labelledby="account-settings-title">
      <h1 id="account-settings-title">{t('account.title')}</h1>
      <ChangePasswordForm />
    </section>
  )
}
