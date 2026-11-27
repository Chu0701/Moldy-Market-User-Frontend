import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { PaginationBar } from '@/components/common/PaginationBar'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { useToast } from '@/components/feedback/toastContext'
import { useStartStoreChat } from '@/features/chat/hooks/useStartStoreChat'
import { OfferHistoryModal } from '@/features/offers/components/OfferHistoryModal'
import { OfferRow } from '@/features/offers/components/OfferRow'
import {
  useAcceptOffer,
  useCounterOffer,
  useReceivedOffers,
  useRejectOffer,
} from '@/features/offers/hooks/useOffers'
import { getOfferErrorMessage } from '@/features/offers/offerErrorMessage'

const CLOSED_STATUSES = new Set(['REJECTED', 'CANCELLED', 'EXPIRED', 'SUPERSEDED'])

export function ReceivedOffersPage() {
  const { t } = useTranslation()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState('all')
  const [historyOfferId, setHistoryOfferId] = useState(null)
  const [busyOfferId, setBusyOfferId] = useState(null)

  const { userId, profileQuery, query } = useReceivedOffers({ page, size: 20 })
  const startChat = useStartStoreChat(userId)
  const acceptMutation = useAcceptOffer()
  const rejectMutation = useRejectOffer()
  const counterMutation = useCounterOffer()

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

  async function handleOpenChat(offer) {
    if (!offer.buyerId) return
    setBusyOfferId(offer.id)
    try {
      const room = await startChat.open(offer.buyerId)
      if (room) void navigate(`/chat/${encodeURIComponent(room.id)}`)
    } finally {
      setBusyOfferId(null)
    }
  }

  if (profileQuery.isPending || query.isPending) {
    return (
      <section className="offer-page" aria-labelledby="received-offers-heading" aria-busy="true">
        <header className="offer-page-header">
          <div>
            <h1 id="received-offers-heading">{t('offers.receivedTitle')}</h1>
            <p className="offer-page-subtitle">{t('offers.receivedSubtitle')}</p>
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
    (offer) => offer.status === 'PENDING' && offer.side === 'BUYER',
  ).length
  const acceptedCount = items.filter((offer) => offer.status === 'ACCEPTED').length
  const closedCount = items.filter((offer) => CLOSED_STATUSES.has(offer.status)).length

  const filteredItems = items.filter((offer) => {
    if (activeTab === 'needsAction') return offer.status === 'PENDING' && offer.side === 'BUYER'
    if (activeTab === 'accepted') return offer.status === 'ACCEPTED'
    if (activeTab === 'closed') return CLOSED_STATUSES.has(offer.status)
    return true
  })

  const tabs = [
    { key: 'all', label: t('offers.tabs.all'), count: items.length },
    { key: 'needsAction', label: t('offers.tabs.needsResponse'), count: needsActionCount },
    { key: 'accepted', label: t('offers.tabs.accepted'), count: acceptedCount },
    { key: 'closed', label: t('offers.tabs.closed'), count: closedCount },
  ]

  return (
    <section className="offer-page" aria-labelledby="received-offers-heading">
      <header className="offer-page-header">
        <div>
          <h1 id="received-offers-heading">{t('offers.receivedTitle')}</h1>
          <p className="offer-page-subtitle">{t('offers.receivedSubtitle')}</p>
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
          title={t('offers.receivedEmptyTitle')}
          description={t('offers.receivedEmptyDescription')}
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title={t('offers.tabs.emptyTitle')}
          description={t('offers.tabs.emptyDescription')}
        />
      ) : (
        <>
          <div className="kn-table-card">
            <ul className="offer-list" aria-label={t('offers.receivedTitle')}>
              {filteredItems.map((offer) => (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  viewerRole="SELLER"
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
                  onCounter={async ({ offerId, price, note }) => {
                    setBusyOfferId(offerId)
                    try {
                      await counterMutation.mutateAsync({ offerId, price, note })
                      pushToast(t('offers.toast.countered'), 'success')
                    } finally {
                      setBusyOfferId(null)
                    }
                  }}
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
