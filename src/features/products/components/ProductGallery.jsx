import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ImageWithFallback } from '@/components/common/ImageWithFallback'

/** @param {{ images?: string[], title: string }} props */
export function ProductGallery({ images = [], title }) {
  const { t } = useTranslation()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const activeIndex = selectedIndex < images.length ? selectedIndex : 0

  return (
    <section className="product-gallery" aria-label={t('products.gallery.label')}>
      <div className="product-gallery-main">
        <ImageWithFallback src={images[activeIndex]} alt={title} />
      </div>

      {images.length > 1 && (
        <div className="product-gallery-thumbnails">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              aria-label={t(`products.gallery.selectImage`, {
                number: index + 1,
              })}
              aria-pressed={index === activeIndex}
              onClick={() => setSelectedIndex(index)}
            >
              <ImageWithFallback src={image} alt="" />
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
