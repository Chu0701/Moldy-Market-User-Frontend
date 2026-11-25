import { useTranslation } from 'react-i18next'

import { AppraiserUnavailableState } from '@/features/appraiser/components/AppraiserUnavailableState'
import { AppraiserPageShell } from '@/features/appraiser/components/AppraiserPageShell'

export function AppraiserApplicationsPage() {
  const { t } = useTranslation()

  return (
    <AppraiserPageShell
      title={t('appraiser.applications.title')}
      description={t('appraiser.applications.description')}
    >
      {/* TODO(doc14:appraisal-applications): connect after contract and role audit. */}
      <AppraiserUnavailableState
        title={t('appraiser.applications.previewTitle')}
        description={t('appraiser.applications.previewDescription')}
      />
    </AppraiserPageShell>
  )
}
