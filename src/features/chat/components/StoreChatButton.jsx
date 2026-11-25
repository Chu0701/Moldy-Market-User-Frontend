import { MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'
import { usePublicStore } from '@/features/stores/hooks/usePublicStore'
import { useStartStoreChat } from '@/features/chat/hooks/useStartStoreChat'
import { useMyStaffProfile } from '@/features/stores/hooks/useMyStaffProfile'
import { getChatBlockReasonKey } from '@/features/chat/chatIdentity'

/** @param {{storeId: string, storeQuery?: object, product?: { id: string, title: string, price: number, imageUrl?: string }}} props */
export function StoreChatButton({ storeId, storeQuery: providedQuery, product }) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { hasAccessToken, profileQuery } = useSession()
  const lookupQuery = usePublicStore(providedQuery ? undefined : storeId)
  const storeQuery = providedQuery ?? lookupQuery
  const userId = hasAccessToken ? profileQuery.data?.id : undefined
  const isStaff = Boolean(profileQuery.data?.roles?.includes('STAFF'))
  const staffQuery = useMyStaffProfile(isStaff ? userId : undefined)
  const ownStaffStore = Boolean(
    isStaff && staffQuery.data?.userId === userId && staffQuery.data.storeId === storeId,
  )
  const checkingStaff = isStaff && (staffQuery.isPending || staffQuery.isError)
  const action = useStartStoreChat(userId)
  const ownerId = storeQuery.data?.id === storeId ? storeQuery.data?.ownerId : undefined
  const hasOwner = typeof ownerId === 'string' && ownerId.length > 0
  const ownStore = Boolean(userId && userId === ownerId)
  const unavailable = storeQuery.isError || (!storeQuery.isPending && !hasOwner)
  let errorKey = action.error?.status === 403 ? 'chat.storeChatForbidden' : 'chat.storeChatError'
  if (['CHAT_STORE_MEMBER', 'CHAT_PARTICIPANT_UNAVAILABLE'].includes(action.error?.code))
    errorKey = getChatBlockReasonKey(action.error.code)
  if (action.error?.code === 'USER_NOT_FOUND') errorKey = 'chat.participantUnavailable'

  if (!hasAccessToken)
    return (
      <Button asChild variant="outline">
        <Link to="/login" state={{ from: location.pathname + location.search }}>
          <MessageCircle className="size-4" aria-hidden="true" />
          {t('chat.storeChat')}
        </Link>
      </Button>
    )

  async function open() {
    const room = await action.open(ownerId)
    if (room) {
      void navigate(
        `/chat/${encodeURIComponent(room.id)}`,
        product ? { state: { productContext: product } } : undefined,
      )
    }
  }
  return (
    <div className="grid justify-items-start gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={
          !userId ||
          profileQuery.isError ||
          !hasOwner ||
          storeQuery.isError ||
          ownStore ||
          ownStaffStore ||
          checkingStaff ||
          action.isPending
        }
        onClick={() => void open()}
      >
        <MessageCircle className="size-4" aria-hidden="true" />
        {t(action.isPending ? 'chat.openingStoreChat' : 'chat.storeChat')}
      </Button>
      {ownStore && <p className="text-sm text-muted-foreground">{t('chat.ownStore')}</p>}
      {ownStaffStore && !ownStore && (
        <p className="text-sm text-muted-foreground">{t('chat.storeMemberBlocked')}</p>
      )}
      {isStaff && staffQuery.isError && (
        <Button
          type="button"
          variant="outline"
          onClick={() => void Promise.all([profileQuery.refetch(), staffQuery.refetch()])}
        >
          {t('actions.retry')}
        </Button>
      )}
      {unavailable && (
        <p role="status" className="text-sm text-muted-foreground">
          {t('chat.storeRecipientMissing')}
        </p>
      )}
      {unavailable && (
        <Button
          type="button"
          variant="outline"
          disabled={storeQuery.isFetching}
          onClick={() => void storeQuery.refetch()}
        >
          {t('chat.reloadStore')}
        </Button>
      )}
      {profileQuery.isError && (
        <Button
          type="button"
          variant="outline"
          disabled={profileQuery.isFetching}
          onClick={() => void profileQuery.refetch()}
        >
          {t('actions.retry')}
        </Button>
      )}
      {action.error && (
        <p role="alert" className="text-sm text-destructive">
          {t(errorKey)}
        </p>
      )}
    </div>
  )
}
