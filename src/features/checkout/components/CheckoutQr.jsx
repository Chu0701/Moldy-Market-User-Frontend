import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

/** @param {{ src: string }} props */
export function CheckoutQr({ src }) {
  const [failed, setFailed] = useState(false)
  const { t } = useTranslation()
  if (failed)
    return (
      <div className="grid gap-3" role="alert">
        <p>{t('checkoutPayment.qrError')}</p>
        <Button type="button" variant="outline" onClick={() => setFailed(false)}>
          {t('checkoutPayment.retryQr')}
        </Button>
      </div>
    )
  return (
    <img
      className="checkout-qr"
      src={src}
      alt={t('checkoutPayment.qrAlt')}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}
