import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useUpdateStoreStaffPermissions } from '@/features/stores/hooks/useUpdateStoreStaffPermissions'

const editablePermissions = [
  'PRODUCT_CREATE',
  'APPRAISAL_REQUEST_CREATE',
  'ORDER_PROCESS',
  'ORDER_CANCEL',
  'OFFER_HANDLE',
  'CHAT_SEND',
]

/** @param {{ userId: string, member: { id: string, permissions: string[] }}} props*/
export function StoreStaffPermissionsEditor({ userId, member }) {
  const { t } = useTranslation()
  const mutation = useUpdateStoreStaffPermissions(userId)
  const [draftPermissions, setDraftPermissions] = useState(null)
  const currentPermissions = editablePermissions.filter((code) => member.permissions.includes(code))

  function startEditing() {
    mutation.reset()
    setDraftPermissions(currentPermissions)
  }

  if (draftPermissions === null) {
    return (
      <div className="mt-3 grid justify-items-start gap-2">
        <Button type="button" variant="outline" onClick={startEditing}>
          {t('stores.staff.editPermissions.title')}
        </Button>
        {mutation.isSuccess && <p role="status">{t('stores.staff.editPermissions.saved')}</p>}
      </div>
    )
  }

  const { error, isPending } = mutation
  const isForbidden = error?.status === 403
  const hasChanges =
    draftPermissions.length !== currentPermissions.length ||
    draftPermissions.some((code) => !currentPermissions.includes(code))

  function togglePermission(code, checked) {
    setDraftPermissions((draft) =>
      checked ? [...draft, code] : draft.filter((permission) => permission !== code),
    )
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!hasChanges || isPending || isForbidden) return

    mutation.mutate(
      { staffId: member.id, permissions: draftPermissions },
      { onSuccess: () => setDraftPermissions(null) },
    )
  }

  let errorKey = 'stores.staff.editPermissions.submitError'

  if (error?.code === 'STORE_BLOCKED') {
    errorKey = 'stores.unavailableTitle'
  } else if (isForbidden) {
    errorKey = 'feedback.forbiddenMessage'
  } else if (error?.code === 'STAFF_NOT_FOUND') {
    errorKey = 'stores.staff.editPermissions.staffNotFound'
  }

  return (
    <form className="mt-4 grid gap-4" aria-busy={isPending} onSubmit={handleSubmit}>
      <fieldset className="grid gap-2" disabled={isPending || isForbidden}>
        <legend className="mb-2 font-medium">{t('stores.staff.editPermissions.title')}</legend>
        {editablePermissions.map((code) => (
          <label key={code} className="flex min-h-9 items-center gap-2">
            <input
              type="checkbox"
              checked={draftPermissions.includes(code)}
              onChange={(event) => togglePermission(code, event.currentTarget.checked)}
            />
            {t(`stores.staff.editPermissions.options.${code}`)}
          </label>
        ))}
      </fieldset>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {t(errorKey)}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={!hasChanges || isPending || isForbidden}>
          {t(isPending ? 'stores.staff.editPermissions.saving' : 'actions.save')}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => setDraftPermissions(null)}
        >
          {t('actions.cancel')}
        </Button>
      </div>
    </form>
  )
}
