import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, Play, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { isVideoUrl } from '@/services/files/fileUploadService'

/** @param {{ images?: string[], title: string }} props */
export function ProductGallery({ images = [], title, onMediaError }) {
  const { t } = useTranslation()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const activeIndex = selectedIndex < images.length ? selectedIndex : 0
  const activeMedia = images[activeIndex]
  const activeIsVideo = isVideoUrl(activeMedia)
  const hasMultiple = images.length > 1

  const showPrevious = useCallback(() => {
    setSelectedIndex((current) => (current <= 0 ? images.length - 1 : current - 1))
  }, [images.length])

  const showNext = useCallback(() => {
    setSelectedIndex((current) => (current >= images.length - 1 ? 0 : current + 1))
  }, [images.length])

  useEffect(() => {
    if (!lightboxOpen) return
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setLightboxOpen(false)
      } else if (hasMultiple && event.key === 'ArrowLeft') {
        showPrevious()
      } else if (hasMultiple && event.key === 'ArrowRight') {
        showNext()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lightboxOpen, hasMultiple, showPrevious, showNext])

  return (
    <section className="product-gallery" aria-label={t('products.gallery.label')}>
      <div className="product-gallery-main">
        {activeIsVideo ? (
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
          <>
            <ImageWithFallback
              src={activeMedia}
              alt={title}
              className={activeMedia ? 'cursor-zoom-in' : undefined}
              onError={onMediaError}
              onClick={() => {
                if (activeMedia) setLightboxOpen(true)
              }}
            />
            {activeMedia && (
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label={t('products.gallery.zoom')}
                title={t('products.gallery.zoom')}
                className="absolute right-2.5 bottom-2.5 inline-flex size-9 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-xs transition-colors outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Maximize2 aria-hidden="true" className="size-4" />
              </button>
            )}
          </>
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

      {lightboxOpen && activeMedia && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/85 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative flex max-h-[90vh] max-w-[92vw] flex-col items-center gap-3"
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label={t('actions.close')}
              className="absolute -top-2 -right-2 z-10 inline-flex size-10 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-md transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden="true" className="size-5" />
            </button>

            {activeIsVideo ? (
              <video
                key={activeMedia}
                src={activeMedia}
                controls
                playsInline
                className="max-h-[80vh] max-w-[88vw] rounded-xl bg-background object-contain shadow-2xl"
              />
            ) : (
              <img
                src={activeMedia}
                alt={title}
                className="max-h-[80vh] max-w-[88vw] rounded-xl bg-background object-contain shadow-2xl"
              />
            )}

            {hasMultiple && (
              <div className="flex items-center gap-3 rounded-full bg-background/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-md">
                <button
                  type="button"
                  onClick={showPrevious}
                  aria-label={t('products.gallery.previous')}
                  className="inline-flex size-7 items-center justify-center rounded-full hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronLeft aria-hidden="true" className="size-4" />
                </button>
                <span className="tabular-nums">
                  {activeIndex + 1} / {images.length}
                </span>
                <button
                  type="button"
                  onClick={showNext}
                  aria-label={t('products.gallery.next')}
                  className="inline-flex size-7 items-center justify-center rounded-full hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronRight aria-hidden="true" className="size-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
