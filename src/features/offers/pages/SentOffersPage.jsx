import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import { PaginationBar } from '@/components/common/PaginationBar'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { useToast } from '@/components/feedback/toastContext'
import { Button } from '@/components/ui/button'
import { useAddCartItem } from '@/features/cart/hooks/useCart'
import { useStartStoreChat } from '@/features/chat/hooks/useStartStoreChat'
import { OfferHistoryModal } from '@/features/offers/components/OfferHistoryModal'
import { OfferRow } from '@/features/offers/components/OfferRow'
import {
  useAcceptOffer,
  useCancelOffer,
  useCounterOffer,
  useRejectOffer,
  useSentOffers,
} from '@/features/offers/hooks/useOffers'
import { getOfferErrorMessage } from '@/features/offers/offerErrorMessage'
import { getPublicStore } from '@/services/stores/storeService'

const CLOSED_STATUSES = new Set(['REJECTED', 'CANCELLED', 'EXPIRED', 'SUPERSEDED'])

export function SentOffersPage() {
  const { t } = useTranslation()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState('all')
  const [historyOfferId, setHistoryOfferId] = useState(null)
  const [busyOfferId, setBusyOfferId] = useState(null)

  const { userId, profileQuery, query } = useSentOffers({ page, size: 20 })
  const startChat = useStartStoreChat(userId)
  const acceptMutation = useAcceptOffer()
  const rejectMutation = useRejectOffer()
  const cancelMutation = useCancelOffer()
  const counterMutation = useCounterOffer()
  const addCartMutation = useAddCartItem()

  async function runAction(offerId, task, successKey) {
    setBusyOfferId(offerId)
    try {
      await task()
      pushToast(t(successKey), 'success')
    } catch (error) {
      pushToast(getOfferErrorMessage(error, t), 'error')
    } finally {
      setBusyOfferId(null)
    }
  }

  async function handleCheckoutAccepted(productId, offerId) {
    setBusyOfferId(offerId)
    try {
      await addCartMutation.mutateAsync({ productId })
      void navigate(`/checkout?productId=${encodeURIComponent(productId)}`)
    } catch (error) {
      pushToast(getOfferErrorMessage(error, t), 'error')
    } finally {
      setBusyOfferId(null)
    }
  }

  async function handleOpenChat(offer) {
    setBusyOfferId(offer.id)
    try {
      let targetUserId = offer.sellerId
      if (offer.storeId) {
        try {
          const store = await getPublicStore({ storeId: offer.storeId })
          if (store?.ownerId) targetUserId = store.ownerId
        } catch {
          // Fallback to offer.sellerId
        }
      }
      if (!targetUserId) return
      const room = await startChat.open(targetUserId)
      if (room) void navigate(`/chat/${encodeURIComponent(room.id)}`)
    } finally {
      setBusyOfferId(null)
    }
  }

  if (profileQuery.isPending || query.isPending) {
    return (
      <section className="offer-page" aria-labelledby="sent-offers-heading" aria-busy="true">
        <header className="offer-page-header">
          <div>
            <h1 id="sent-offers-heading">{t('offers.sentTitle')}</h1>
            <p className="offer-page-subtitle">{t('offers.sentSubtitle')}</p>
          </div>
        </header>
        <div className="kn-table-card divide-y divide-border">
          {[0, 1, 2].map((index) => (
            <div key={index} className="p-5">
              <div className="skeleton-shimmer h-16 rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (query.error?.status === 403) return <ForbiddenState />

  if (profileQuery.isError || query.isError) {
    return (
      <ErrorState
        title={t('offers.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    )
  }

  const pageData = query.data
  const items = pageData?.items ?? []
  const needsActionCount = items.filter(
    (offer) =>
      (offer.status === 'PENDING' && offer.side === 'SELLER') ||
      (offer.status === 'ACCEPTED' && !offer.checkoutGroupId),
  ).length
  const acceptedCount = items.filter((offer) => offer.status === 'ACCEPTED').length
  const closedCount = items.filter((offer) => CLOSED_STATUSES.has(offer.status)).length

  const filteredItems = items.filter((offer) => {
    if (activeTab === 'needsAction') {
      return (
        (offer.status === 'PENDING' && offer.side === 'SELLER') ||
        (offer.status === 'ACCEPTED' && !offer.checkoutGroupId)
      )
    }
    if (activeTab === 'accepted') return offer.status === 'ACCEPTED'
    if (activeTab === 'closed') return CLOSED_STATUSES.has(offer.status)
    return true
  })

  const tabs = [
    { key: 'all', label: t('offers.tabs.all'), count: items.length },
    { key: 'needsAction', label: t('offers.tabs.needsAction'), count: needsActionCount },
    { key: 'accepted', label: t('offers.tabs.accepted'), count: acceptedCount },
    { key: 'closed', label: t('offers.tabs.closed'), count: closedCount },
  ]

  return (
    <section className="offer-page" aria-labelledby="sent-offers-heading">
      <header className="offer-page-header">
        <div>
          <h1 id="sent-offers-heading">{t('offers.sentTitle')}</h1>
          <p className="offer-page-subtitle">{t('offers.sentSubtitle')}</p>
        </div>
      </header>

      {items.length > 0 && (
        <div className="offer-tabs" role="tablist" aria-label={t('offers.tabs.label')}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className="offer-tab"
              data-active={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.label}</span>
              <span className="offer-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          title={t('offers.sentEmptyTitle')}
          description={t('offers.sentEmptyDescription')}
          action={
            <Button asChild>
              <Link to="/products">{t('offers.exploreProducts')}</Link>
            </Button>
          }
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title={t('offers.tabs.emptyTitle')}
          description={t('offers.tabs.emptyDescription')}
        />
      ) : (
        <>
          <div className="kn-table-card">
            <ul className="offer-list" aria-label={t('offers.sentTitle')}>
              {filteredItems.map((offer) => (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  viewerRole="BUYER"
                  busyOfferId={busyOfferId}
                  onAccept={(id) =>
                    void runAction(
                      id,
                      () => acceptMutation.mutateAsync({ offerId: id }),
                      'offers.toast.accepted',
                    )
                  }
                  onReject={(id) =>
                    void runAction(
                      id,
                      () => rejectMutation.mutateAsync({ offerId: id }),
                      'offers.toast.rejected',
                    )
                  }
                  onCancel={(id) =>
                    void runAction(
                      id,
                      () => cancelMutation.mutateAsync({ offerId: id }),
                      'offers.toast.cancelled',
                    )
                  }
                  onCounter={async ({ offerId, price, note }) => {
                    setBusyOfferId(offerId)
                    try {
                      await counterMutation.mutateAsync({ offerId, price, note })
                      pushToast(t('offers.toast.countered'), 'success')
                    } finally {
                      setBusyOfferId(null)
                    }
                  }}
                  onCheckoutAccepted={(productId) =>
                    void handleCheckoutAccepted(productId, offer.id)
                  }
                  onOpenHistory={setHistoryOfferId}
                  onOpenChat={(item) => void handleOpenChat(item)}
                />
              ))}
            </ul>
          </div>

          <PaginationBar
            page={pageData.page}
            hasNext={pageData.hasNext}
            totalPages={pageData.totalPages}
            totalElements={pageData.totalElements}
            onPageChange={setPage}
          />
        </>
      )}

      {historyOfferId && (
        <OfferHistoryModal offerId={historyOfferId} onClose={() => setHistoryOfferId(null)} />
      )}
    </section>
  )
}
