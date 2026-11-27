import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ProductPrice } from '@/components/common/ProductPrice'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { OfferStatusBadge } from '@/features/offers/components/OfferStatusBadge'
import { useOfferHistory } from '@/features/offers/hooks/useOffers'
import { OrderDate } from '@/features/orders/components/OrderDate'

/** @param {{ offerId: string, onClose: () => void }} props */
export function OfferHistoryModal({ offerId, onClose }) {
  const { t } = useTranslation()
  const historyQuery = useOfferHistory({ offerId, enabled: Boolean(offerId) })

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const items = historyQuery.data?.items ?? []

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-history-title"
      className="offer-modal-backdrop"
      onClick={onClose}
    >
      <div className="offer-modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="offer-modal-header">
          <h2 id="offer-history-title" className="offer-modal-title">
            {t('offers.history.title')}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('actions.close')}
            onClick={onClose}
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className="offer-modal-body">
          {historyQuery.isPending ? (
            <div className="space-y-2.5" aria-busy="true">
              {[0, 1, 2].map((index) => (
                <div key={index} className="skeleton-shimmer h-14 rounded-xl" />
              ))}
            </div>
          ) : historyQuery.isError ? (
            <ErrorState
              title={t('offers.history.loadError')}
              description={t('feedback.checkBack')}
              onRetry={() => void historyQuery.refetch()}
              isRetrying={historyQuery.isFetching}
            />
          ) : (
            <ol className="offer-history-list">
              {items.map((round, index) => (
                <li key={round.id} className="offer-history-item">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      #{index + 1} · {t(`offers.side.${round.side}`)}
                    </p>
                    <ProductPrice value={round.price} className="font-semibold tabular-nums" />
                    <p className="text-[11px] text-muted-foreground">
                      <OrderDate value={round.createdAt} />
                    </p>
                  </div>
                  <OfferStatusBadge status={round.status} />
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
