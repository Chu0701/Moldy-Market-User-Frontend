import { useState } from 'react'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { isVideoUrl } from '@/services/files/fileUploadService'

/** @param {{ images?: string[], title: string }} props */
export function ProductGallery({ images = [], title, onMediaError }) {
  const { t } = useTranslation()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const activeIndex = selectedIndex < images.length ? selectedIndex : 0
  const activeMedia = images[activeIndex]
  const hasMultiple = images.length > 1

  function showPrevious() {
    setSelectedIndex((current) => (current <= 0 ? images.length - 1 : current - 1))
  }

  function showNext() {
    setSelectedIndex((current) => (current >= images.length - 1 ? 0 : current + 1))
  }

  return (
    <section className="product-gallery" aria-label={t('products.gallery.label')}>
      <div className="product-gallery-main">
        {isVideoUrl(activeMedia) ? (
          <video
            key={activeMedia}
            src={activeMedia}
            controls
            playsInline
            preload="metadata"
            aria-label={title}
            className="aspect-square h-full w-full bg-foreground/5 object-contain"
          />
        ) : (
          <ImageWithFallback src={activeMedia} alt={title} onError={onMediaError} />
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              aria-label={t('products.gallery.previous')}
              className="absolute top-1/2 left-2.5 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-xs transition-colors outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              onClick={showNext}
              aria-label={t('products.gallery.next')}
              className="absolute top-1/2 right-2.5 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-xs transition-colors outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="product-gallery-thumbnails">
          {images.map((media, index) => (
            <button
              key={`${media}-${index}`}
              type="button"
              aria-label={t('products.gallery.selectImage', {
                number: index + 1,
              })}
              aria-pressed={index === activeIndex}
              onClick={() => setSelectedIndex(index)}
            >
              {isVideoUrl(media) ? (
                <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-accent text-xs font-semibold text-foreground">
                  <Play aria-hidden="true" className="size-4" />
                  <span>VIDEO</span>
                </span>
              ) : (
                <ImageWithFallback src={media} alt="" />
              )}
            </button>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p aria-live="polite">
          {t('products.gallery.position', {
            current: activeIndex + 1,
            total: images.length,
          })}
        </p>
      )}
    </section>
  )
}
