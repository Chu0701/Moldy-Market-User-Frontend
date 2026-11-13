import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'
import { ProfileEditForm } from '@/features/profile/components/ProfileEditForm'

export function ProfileEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profileQuery } = useSession()
  const profile = profileQuery.data
  const canEdit = profile?.permissions?.includes('PROFILE_MANAGE')

  function handleSaved() {
    void navigate('/profile', {
      replace: true,
      state: { profileSaved: true },
    })
  }

  return (
    <section className="profile-page" aria-labelledby="profile-edit-title">
      <h1 id="profile-edit-title">{t('profile.edit.title')}</h1>

      {canEdit ? (
        <ProfileEditForm key={profile.id} profile={profile} onSaved={handleSaved} />
      ) : (
        <>
          <ForbiddenState />
          <Button asChild variant="outline">
            <Link to="/profile">{t('profile.edit.back')}</Link>
          </Button>
        </>
      )}
    </section>
  )
}
