import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PaginationBar } from '@/components/common/PaginationBar'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { useToast } from '@/components/feedback/toastContext'
import { OfferHistoryModal } from '@/features/offers/components/OfferHistoryModal'
import { OfferRow } from '@/features/offers/components/OfferRow'
import {
  useAcceptOffer,
  useCounterOffer,
  useReceivedOffers,
  useRejectOffer,
} from '@/features/offers/hooks/useOffers'
import { getOfferErrorMessage } from '@/features/offers/offerErrorMessage'

export function ReceivedOffersPage() {
  const { t } = useTranslation()
  const { pushToast } = useToast()
  const [page, setPage] = useState(1)
  const [historyOfferId, setHistoryOfferId] = useState(null)
  const [busyOfferId, setBusyOfferId] = useState(null)

  const { profileQuery, query } = useReceivedOffers({ page, size: 10 })
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

  return (
    <section className="offer-page" aria-labelledby="received-offers-heading">
      <header className="offer-page-header">
        <div>
          <h1 id="received-offers-heading">{t('offers.receivedTitle')}</h1>
          <p className="offer-page-subtitle">{t('offers.receivedSubtitle')}</p>
        </div>
      </header>

      {items.length === 0 ? (
        <EmptyState
          title={t('offers.receivedEmptyTitle')}
          description={t('offers.receivedEmptyDescription')}
        />
      ) : (
        <>
          <div className="kn-table-card">
            <ul className="offer-list" aria-label={t('offers.receivedTitle')}>
              {items.map((offer) => (
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
                  onCounter={async ({ offerId, price }) => {
                    setBusyOfferId(offerId)
                    try {
                      await counterMutation.mutateAsync({ offerId, price })
                      pushToast(t('offers.toast.countered'), 'success')
                    } finally {
                      setBusyOfferId(null)
                    }
                  }}
                  onOpenHistory={setHistoryOfferId}
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
