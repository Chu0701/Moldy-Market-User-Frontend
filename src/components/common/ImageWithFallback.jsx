import { useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

/** @param {{ src?: string, alt: string, className?: string, compact?: boolean }} props */
export function ImageWithFallback({ src, alt, className, compact = false }) {
  const { t } = useTranslation()
  const [failedSrc, setFailedSrc] = useState(null)

  const showImage = Boolean(src) && src !== failedSrc

  return (
    <div className={cn('aspect-square w-full overflow-hidden bg-muted', className)}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <div
          role="img"
          aria-label={alt || t('products.noImage')}
          className="flex size-full items-center justify-center bg-muted/70 text-muted-foreground"
        >
          <ImageIcon
            aria-hidden="true"
            strokeWidth={1.5}
            className={compact ? 'size-5 opacity-45' : 'size-9 opacity-35'}
          />
          <span className="sr-only">{t('products.noImage')}</span>
        </div>
      )}
    </div>
  )
}
