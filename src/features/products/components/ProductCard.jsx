import { Link } from 'react-router'

import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { ProductPrice } from '@/components/common/ProductPrice'

/**
 * Mercari-inspired square listing card with high-contrast price overlay.
 * @param {{ id: string, title: string, price: number, imageUrl?: string,
 * conditionLabel: string, statusLabel?: string }} props
 */
export function ProductCard({ id, title, price, imageUrl, conditionLabel, statusLabel }) {
  return (
    <Link
      to={`/products/${id}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground transition-[border-color,box-shadow] duration-150 outline-none hover:border-foreground/35 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <ImageWithFallback
          src={imageUrl}
          alt={title}
          className="size-full transition-transform duration-200 ease-out group-hover:scale-[1.03] motion-reduce:transform-none"
        />

        {statusLabel && (
          <span className="absolute top-2 left-2 rounded-sm bg-background/95 px-2 py-0.5 text-xs leading-5 font-semibold text-foreground shadow-xs">
            {statusLabel}
          </span>
        )}

        <ProductPrice
          value={price}
          className="absolute bottom-0 left-0 rounded-tr-md bg-primary/90 px-2.5 py-1 text-sm leading-5 font-semibold tracking-tight text-primary-foreground"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 min-h-10 text-sm leading-5 font-medium break-words text-foreground">
          {title}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="inline-flex items-center rounded-sm border border-border bg-surface-subtle px-2 py-0.5 text-xs leading-4 font-medium text-muted-foreground">
            {conditionLabel}
          </span>
        </div>
      </div>
    </Link>
  )
}
