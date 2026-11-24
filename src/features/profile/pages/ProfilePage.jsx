import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import { EmptyState } from '@/components/feedback/EmptyState'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'

export function ProfilePage() {
  const { t } = useTranslation()
  const { profileQuery } = useSession()
  const { state } = useLocation()
  const profile = profileQuery.data
  const canEdit = profile?.permissions?.includes('PROFILE_MANAGE')

  return (
    <section className="profile-page" aria-labelledby="profile-title">
      <h1 id="profile-title">{t('profile.title')}</h1>

      {state?.profileSaved === true && <p role="status">{t('profile.edit.saved')}</p>}

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
          {profile.phone && (
            <div>
              <dt>{t('profile.edit.phone')}</dt>
              <dd>{profile.phone}</dd>
            </div>
          )}
        </dl>
      ) : (
        <EmptyState title={t('profile.emptyTitle')} description={t('profile.emptyDescription')} />
      )}

      <div className="flex flex-wrap gap-3">
        {canEdit && (
          <Button asChild variant="outline">
            <Link to="/profile/edit">{t('profile.edit.title')}</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link to="/account/settings">{t('account.title')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/wallet">{t('wallet.title')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/wishlist">{t('wishlist.title')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/disputes">{t('disputes.title')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/transactions">{t('transactions.title')}</Link>
        </Button>
      </div>
    </section>
  )
}
