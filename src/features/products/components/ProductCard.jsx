import { Link } from 'react-router'

import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { ProductPrice } from '@/components/common/ProductPrice'

/**
 * @param {{ id: string, title: string, price: number, imageUrl?: string,
 * conditionLabel: string }} props
 */
export function ProductCard({ id, title, price, imageUrl, conditionLabel }) {
  return (
    <Link
      to={`/products/${id}`}
      className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground outline-none hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ImageWithFallback src={imageUrl} alt={title} />
      <div className="flex flex-1 flex-col gap-3 p-4 lg:p-6">
        <p className="line-clamp-2 min-h-12 text-sm leading-6 font-medium break-words sm:text-base">
          {title}
        </p>
        <span className="self-start rounded-md bg-muted px-2 py-1 text-xs leading-5 text-muted-foreground">
          {conditionLabel}
        </span>
        <ProductPrice value={price} className="mt-auto text-lg font-semibold" />
      </div>
    </Link>
  )
}
