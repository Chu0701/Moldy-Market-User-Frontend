import { useEffect, useRef, useState } from 'react'
import { Check, Share2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useToast } from '@/components/feedback/toastContext'
import { Button } from '@/components/ui/button'

export function CopyProductLinkButton({
  shareLabelKey = 'products.detail.share',
  copiedLabelKey = 'products.detail.copied',
} = {}) {
  const { t } = useTranslation()
  const { pushToast } = useToast()
  const [status, setStatus] = useState('idle')
  const timerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  async function handleCopy() {
    if (timerRef.current) clearTimeout(timerRef.current)

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href)
      } else {
        throw new Error('Clipboard API unavailable')
      }
      setStatus('copied')
      pushToast(t(copiedLabelKey), 'success')
    } catch {
      setStatus('error')
      pushToast(t('products.detail.shareError'), 'error')
    }

    timerRef.current = setTimeout(() => {
      setStatus('idle')
    }, 2200)
  }

  const labelKey =
    status === 'copied'
      ? copiedLabelKey
      : status === 'error'
        ? 'products.detail.shareError'
        : shareLabelKey

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void handleCopy()}
      aria-live="polite"
      className="min-h-10 shrink-0 gap-1.5"
    >
      {status === 'copied' ? (
        <Check aria-hidden="true" className="size-4 text-success" />
      ) : (
        <Share2 aria-hidden="true" className="size-4" />
      )}
      <span>{t(labelKey)}</span>
    </Button>
  )
}
