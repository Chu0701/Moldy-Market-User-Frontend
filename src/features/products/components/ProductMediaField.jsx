import { ChevronLeft, ChevronRight, Play, Star, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { MediaUploadButton } from '@/components/common/MediaUploadButton'
import { isVideoUrl } from '@/services/files/fileUploadService'

function parseMediaUrls(rawValue) {
  return String(rawValue ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

/**
 * Visual media preview grid (images & videos) with cover selection, ordering, and removal,
 * synchronized with the underlying newline-separated `images` form field.
 *
 * @param {{
 *   idPrefix: string,
 *   value: string,
 *   onValueChange: (nextValue: string) => void,
 *   disabled?: boolean,
 *   uploadDisabled?: boolean,
 *   textareaProps: Record<string, unknown>,
 *   hasError?: boolean,
 *   errorNode?: import('react').ReactNode,
 * }} props
 */
export function ProductMediaField({
  idPrefix,
  value,
  onValueChange,
  disabled = false,
  uploadDisabled = false,
  textareaProps,
  hasError = false,
  errorNode = null,
}) {
  const { t } = useTranslation()
  const urls = parseMediaUrls(value)
  const hintId = `${idPrefix}-images-hint`
  const errorId = `${idPrefix}-images-error`

  function commitUrls(nextUrls) {
    onValueChange(nextUrls.join('\n'))
  }

  function handleUploaded(url) {
    const trimmed = String(url ?? '').trim()
    if (!trimmed) return
    commitUrls([...urls, trimmed])
  }

  function handleRemove(index) {
    commitUrls(urls.filter((_, idx) => idx !== index))
  }

  function handleMove(index, delta) {
    const target = index + delta
    if (target < 0 || target >= urls.length) return
    const next = [...urls]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    commitUrls(next)
  }

  function handleSetCover(index) {
    if (index <= 0 || index >= urls.length) return
    const next = [...urls]
    const [cover] = next.splice(index, 1)
    next.unshift(cover)
    commitUrls(next)
  }

  return (
    <div className="product-create-field space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={`${idPrefix}-images`}>{t('products.create.imagesLabel')}</label>
        <MediaUploadButton
          purpose="PRODUCT_IMAGE"
          disabled={disabled || uploadDisabled}
          onUploaded={handleUploaded}
        />
      </div>

      {urls.length > 0 && (
        <ul
          aria-label={t('products.media.previewList')}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
        >
          {urls.map((url, index) => {
            const isVideo = isVideoUrl(url)
            const isCover = index === 0
            return (
              <li
                key={`${url}-${index}`}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xs"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-muted">
                  {isVideo ? (
                    <>
                      <video
                        src={url}
                        muted
                        playsInline
                        preload="metadata"
                        className="size-full object-cover"
                      />
                      <span className="absolute right-1.5 bottom-1.5 inline-flex items-center gap-1 rounded-md bg-foreground/80 px-1.5 py-0.5 text-[10px] font-semibold text-background">
                        <Play aria-hidden="true" className="size-2.5" />
                        VIDEO
                      </span>
                    </>
                  ) : (
                    <ImageWithFallback src={url} alt="" className="size-full object-cover" />
                  )}

                  {isCover && (
                    <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-xs">
                      <Star aria-hidden="true" className="size-2.5 fill-current" />
                      {t('products.media.coverBadge')}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-1 border-t border-border bg-surface-subtle px-1.5 py-1">
                  <div className="flex items-center gap-0.5">
                    {!isCover && (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => handleSetCover(index)}
                        title={t('products.media.setCover')}
                        aria-label={t('products.media.setCover')}
                        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                      >
                        <Star aria-hidden="true" className="size-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={disabled || index === 0}
                      onClick={() => handleMove(index, -1)}
                      title={t('products.media.moveLeft')}
                      aria-label={t('products.media.moveLeft')}
                      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-35"
                    >
                      <ChevronLeft aria-hidden="true" className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={disabled || index === urls.length - 1}
                      onClick={() => handleMove(index, 1)}
                      title={t('products.media.moveRight')}
                      aria-label={t('products.media.moveRight')}
                      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-35"
                    >
                      <ChevronRight aria-hidden="true" className="size-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleRemove(index)}
                    title={t('products.media.remove')}
                    aria-label={t('products.media.remove')}
                    className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                  >
                    <Trash2 aria-hidden="true" className="size-3.5" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <textarea
        {...textareaProps}
        aria-invalid={Boolean(hasError)}
        aria-describedby={hasError ? `${hintId} ${errorId}` : hintId}
        rows={3}
        readOnly={disabled}
      />

      <p id={hintId} className="profile-edit-hint">
        {t('products.create.imagesHint')}
      </p>
      {errorNode}
    </div>
  )
}
