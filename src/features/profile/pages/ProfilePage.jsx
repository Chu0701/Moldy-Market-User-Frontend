import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/feedback/EmptyState'
import { useSession } from '@/features/auth/hooks/useSession'

export function ProfilePage() {
  const { t } = useTranslation()
  const { profileQuery } = useSession()
  const profile = profileQuery.data

  return (
    <section className="profile-page" aria-labelledby="profile-title">
      <h1 id="profile-title">{t('profile.title')}</h1>

      {profile ? (
        <dl className="profile-details">
          <div>
            <dt>{t('profile.fullName')}</dt>
            <dd>{profile.fullName}</dd>
          </div>
          <div>
            <dt>{t('profile.email')}</dt>
            <dd>{profile.email}</dd>
          </div>
        </dl>
      ) : (
        <EmptyState title={t('profile.emptyTitle')} description={t('profile.emptyDescription')} />
      )}
    </section>
  )
}
