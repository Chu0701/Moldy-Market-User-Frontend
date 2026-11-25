import { useTranslation } from 'react-i18next'

import { AppraiserUnavailableState } from '@/features/appraiser/components/AppraiserUnavailableState'
import { AppraiserPageShell } from '@/features/appraiser/components/AppraiserPageShell'

export function AppraiserInvitationsPage() {
  const { t } = useTranslation()

  return (
    <AppraiserPageShell
      title={t('appraiser.invitations.title')}
      description={t('appraiser.invitations.description')}
    >
      {/* TODO(doc14:appraisal-invitations): wire actions after accept/reject audit. */}
      <AppraiserUnavailableState
        title={t('appraiser.invitations.previewTitle')}
        description={t('appraiser.invitations.previewDescription')}
      />
    </AppraiserPageShell>
  )
}
