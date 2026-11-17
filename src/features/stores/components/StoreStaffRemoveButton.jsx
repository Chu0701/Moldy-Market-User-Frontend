import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useRemoveStoreStaff } from '@/features/stores/hooks/useRemoveStoreStaff'

/** @param {{ userId: string, staffId: string, name: string}} props */
export function StoreStaffRemoveButton({ userId, staffId, name }) {
  const { t } = useTranslation()
  const { mutate, isPending, error } = useRemoveStoreStaff(userId)

  function confirmRemoval() {
    if (window.confirm(t('stores.staff.remove.confirm', { name }))) {
      mutate({ staffId })
    }
  }

  let errorKey = 'stores.staff.remove.submitError'

  if (error?.code === 'STORE_BLOCKED') {
    errorKey = 'stores.unavailableTitle'
  } else if (error?.status === 403) {
    errorKey = 'feedback.forbiddenMessage'
  } else if (error?.code === 'STAFF_NOT_FOUND') {
    errorKey = 'stores.staff.editPermissions.staffNotFound'
  }

  return (
    <div className="mt-3 grid justify-items-start gap-2">
      <Button type="button" variant="destructive" disabled={isPending} onClick={confirmRemoval}>
        {t(isPending ? 'stores.staff.remove.pending' : 'stores.staff.remove.action')}
      </Button>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {t(errorKey)}
        </p>
      )}
    </div>
  )
}
