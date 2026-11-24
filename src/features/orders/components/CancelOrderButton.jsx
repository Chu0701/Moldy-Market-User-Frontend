import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useCancelMyOrder } from '@/features/orders/hooks/useCancelMyOrder'

/**
 * Determines whether a buyer order is eligible for self-cancellation matching OrderService.cancelOrderFromBuyer.
 * @param {object} order
 */
function canBuyerCancelOrder(order) {
  if (!order) return false
  if (order.status === 'PENDING_PAYMENT') {
    return order.paymentStatus == null || order.paymentStatus === 'PENDING'
  }
  if (order.status === 'PENDING_CONFIRMED') {
    return order.paymentStatus == null || order.paymentStatus === 'PENDING'
  }
  if (order.status === 'CONFIRMED') {
    return order.paymentMethod === 'COD' && order.paymentStatus !== 'SUCCESSFUL'
  }
  return false
}

/** @param {{ order: object }} props */
export function CancelOrderButton({ order }) {
  const { t } = useTranslation()
  const cancelMutation = useCancelMyOrder()
  const [confirming, setConfirming] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  if (!canBuyerCancelOrder(order)) return null

  async function handleConfirmCancel() {
    setErrorMessage(null)
    try {
      await cancelMutation.mutateAsync({ orderId: order.id })
      setConfirming(false)
    } catch (error) {
      setErrorMessage(
        error?.code === 'INVALID_ORDER_STATE'
          ? t('orders.cancel.stateChanged')
          : t('orders.cancel.error'),
      )
    }
  }

  return (
    <div className="grid gap-2">
      {!confirming ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setErrorMessage(null)
            setConfirming(true)
          }}
        >
          {t('orders.cancel.action')}
        </Button>
      ) : (
        <div className="grid gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-sm">{t('orders.cancel.confirmPrompt')}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={cancelMutation.isPending}
              onClick={() => void handleConfirmCancel()}
            >
              {t(cancelMutation.isPending ? 'orders.cancel.pending' : 'orders.cancel.confirm')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={cancelMutation.isPending}
              onClick={() => setConfirming(false)}
            >
              {t('orders.cancel.keep')}
            </Button>
          </div>
        </div>
      )}
      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
