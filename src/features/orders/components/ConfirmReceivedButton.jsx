import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useConfirmOrderReceived } from '@/features/orders/hooks/useConfirmOrderReceived'

/** @param {{ order: object }} props */
export function ConfirmReceivedButton({ order }) {
  const { t } = useTranslation()
  const confirmMutation = useConfirmOrderReceived()
  const [confirming, setConfirming] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  if (!order || order.status !== 'DELIVERED') return null

  async function handleConfirm() {
    setErrorMessage(null)
    try {
      await confirmMutation.mutateAsync({ orderId: order.id })
      setConfirming(false)
    } catch (error) {
      setErrorMessage(
        error?.code === 'ORDER_NOT_DELIVERED' || error?.code === 'INVALID_ORDER_STATE'
          ? t('orders.confirmReceived.stateChanged')
          : t('orders.confirmReceived.error'),
      )
    }
  }

  return (
    <div className="grid gap-2">
      {!confirming ? (
        <Button
          type="button"
          onClick={() => {
            setErrorMessage(null)
            setConfirming(true)
          }}
          className="min-h-11 gap-2"
        >
          <CheckCircle2 aria-hidden="true" className="size-4" />
          <span>{t('orders.confirmReceived.action')}</span>
        </Button>
      ) : (
        <div className="grid gap-2 rounded-lg border border-border bg-surface-subtle p-3">
          <p className="text-sm">{t('orders.confirmReceived.confirmPrompt')}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={confirmMutation.isPending}
              onClick={() => void handleConfirm()}
            >
              {t(
                confirmMutation.isPending
                  ? 'orders.confirmReceived.pending'
                  : 'orders.confirmReceived.confirm',
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={confirmMutation.isPending}
              onClick={() => setConfirming(false)}
            >
              {t('actions.cancel')}
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
