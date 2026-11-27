import { useTranslation } from 'react-i18next'

import { ProductPrice } from '@/components/common/ProductPrice'

import { CopyProductLinkButton } from './CopyProductLinkButton'
import { ProductAttributes } from './ProductAttributes'
import { SellerCard } from './SellerCard'

const conditionKeys = {
  NEW: 'products.conditions.new',
  LIKE_NEW: 'products.conditions.likeNew',
  USED: 'products.conditions.used',
  DAMAGED: 'products.conditions.damaged',
}

const statusKeys = {
  ACTIVE: 'products.statuses.active',
  HIDDEN: 'products.statuses.hidden',
  SOLD: 'products.statuses.sold',
  DELETED: 'products.statuses.deleted',
  REMOVED: 'products.statuses.removed',
}

/**
 * @param {{
 *  title: string,
 *  price: number,
 *  condition: string,
 *  status: string,
 *  description?: string|null,
 *  attributes?: Record<string, unknown> | null,
 *  storeId?: string | null,
 *  actions?: import('react').ReactNode,
 *  manageActions?: import('react').ReactNode,
 *  priceHistory?: import('react').ReactNode,
 * }} props
 */
export function ProductInfo({
  title,
  price,
  condition,
  status,
  description,
  attributes,
  storeId,
  actions,
  manageActions,
  priceHistory,
  hideInlinePrice = false,
}) {
  const { t } = useTranslation()

  return (
    <section className="product-info product-detail-column">
      <div>
        <div className="product-info-header">
          <h1>{title}</h1>
          <CopyProductLinkButton />
        </div>

        {!hideInlinePrice && <ProductPrice value={price} className="product-detail-price" />}

        <div className="product-info-badges">
          <span>{t(conditionKeys[condition] ?? 'products.conditions.unknown')}</span>
          <span data-status={status}>{t(statusKeys[status] ?? 'products.statuses.unknown')}</span>
        </div>
      </div>

      {actions}
      {manageActions}

      <div className="product-description">
        <h2>{t('products.detail.descriptionTitle')}</h2>
        <p>{description?.trim() || t('products.detail.noDescription')}</p>
      </div>

      <ProductAttributes attributes={attributes} />
      {priceHistory}
      <SellerCard storeId={storeId} />
    </section>
  )
}
