import { useTranslation } from 'react-i18next'
import { getSafeQrUrl } from '@/features/checkout/checkoutPayment'
import { CheckoutQr } from '@/features/checkout/components/CheckoutQr'
import { usePaymentDeadline } from '@/features/checkout/hooks/usePaymentDeadline'

/** @param {{ checkout: object, stage: string, allowQr?: boolean }} props */
export function CheckoutPaymentStatus({ checkout, stage, allowQr = true }) {
  const { t } = useTranslation()
  const remaining = usePaymentDeadline(checkout.expiredAt, stage === 'bankPending')
  const qr = getSafeQrUrl(checkout.paymentResponse?.qrBankUrl)
  const clock =
    remaining == null
      ? null
      : Math.floor(remaining / 60) + ':' + String(remaining % 60).padStart(2, '0')

  return (
    <section className="checkout-panel" aria-labelledby="checkout-payment-status">
      <h2 id="checkout-payment-status">{t('checkoutPayment.stages.' + stage)}</h2>
      <p role="status">{t('checkoutPayment.descriptions.' + stage)}</p>
      {stage === 'bankPending' && (
        <>
          <p className="checkout-deadline">
            {remaining === null
              ? t('checkoutPayment.noDeadline')
              : remaining === 0
                ? t('checkoutPayment.clockExpired')
                : t('checkoutPayment.countdown', { time: clock })}
          </p>
          {remaining > 0 && qr && allowQr ? (
            <CheckoutQr key={qr} src={qr} />
          ) : (
            remaining !== 0 && <p role="alert">{t('checkoutPayment.qrUnavailable')}</p>
          )}
          <p className="text-sm text-muted-foreground">{t('checkoutPayment.bankHint')}</p>
        </>
      )}
    </section>
  )
}
