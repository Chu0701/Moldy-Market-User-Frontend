import { useTranslation } from 'react-i18next'

import { AppraiserUnavailableState } from '@/features/appraiser/components/AppraiserUnavailableState'
import { AppraiserPageShell } from '@/features/appraiser/components/AppraiserPageShell'

export function AppraiserCommissionsPage() {
  const { t } = useTranslation()

  return (
    <AppraiserPageShell
      title={t('appraiser.commissions.title')}
      description={t('appraiser.commissions.description')}
    >
      {/* TODO(doc14:appraiser-commissions): connect after raw response and access audit. */}
      <AppraiserUnavailableState
        title={t('appraiser.commissions.previewTitle')}
        description={t('appraiser.commissions.previewDescription')}
      />
    </AppraiserPageShell>
  )
}
