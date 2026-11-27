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

export function SentOffersPage() {
  const { t } = useTranslation()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [historyOfferId, setHistoryOfferId] = useState(null)
  const [busyOfferId, setBusyOfferId] = useState(null)

  const { profileQuery, query } = useSentOffers({ page, size: 10 })
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

  async function handleCheckoutAccepted(productId) {
    try {
      await addCartMutation.mutateAsync({ productId })
      void navigate(`/checkout?productId=${encodeURIComponent(productId)}`)
    } catch (error) {
      pushToast(
        t(error?.code === 'CART_OWN_PRODUCT' ? 'cart.ownProduct' : 'cart.addError'),
        'error',
      )
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

  return (
    <section className="offer-page" aria-labelledby="sent-offers-heading">
      <header className="offer-page-header">
        <div>
          <h1 id="sent-offers-heading">{t('offers.sentTitle')}</h1>
          <p className="offer-page-subtitle">{t('offers.sentSubtitle')}</p>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title={t('offers.sentEmptyTitle')}
            description={t('offers.sentEmptyDescription')}
          />
          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/products">{t('offers.exploreProducts')}</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="kn-table-card">
            <ul className="offer-list" aria-label={t('offers.sentTitle')}>
              {items.map((offer) => (
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
                  onCounter={async ({ offerId, price }) => {
                    setBusyOfferId(offerId)
                    try {
                      await counterMutation.mutateAsync({ offerId, price })
                      pushToast(t('offers.toast.countered'), 'success')
                    } finally {
                      setBusyOfferId(null)
                    }
                  }}
                  onCheckoutAccepted={(productId) => void handleCheckoutAccepted(productId)}
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
