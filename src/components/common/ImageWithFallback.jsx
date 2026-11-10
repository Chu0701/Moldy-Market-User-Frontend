import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

/** @param {{ src?: string, alt: string, className?: string }} props */
export function ImageWithFallback({ src, alt, className }) {
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
          className="flex size-full flex-col items-center justify-center gap-3 p-4 text-center text-muted-foreground"
        >
          <ImageOff aria-hidden="true" className="size-8" />
          <span className="text-sm">{t('products.noImage')}</span>
        </div>
      )}
    </div>
  )
}
