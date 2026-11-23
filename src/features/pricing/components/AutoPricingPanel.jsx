import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ProductPrice } from '@/components/common/ProductPrice'
import { Button } from '@/components/ui/button'
import { useAutoPricing } from '@/features/pricing/hooks/useAutoPricing'
import {
  autoPricingSchema,
  PRICING_CONDITION_LEVELS,
  PRICING_WARRANTY_STATUSES,
} from '@/features/pricing/schemas/autoPricingSchema'

/**
 * Collapsible Auto Pricing helper integrated inside ProductCreateForm / ProductEditForm.
 * Uses a div container (no nested <form>) so it never interferes with the parent form submit.
 * @param {{
 *   categoryId?: string,
 *   disabled?: boolean,
 *   onApplyPrice: (price: number) => void
 * }} props
 */
export function AutoPricingPanel({ categoryId = '', disabled = false, onApplyPrice }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [modelId, setModelId] = useState('')
  const [warrantyStatus, setWarrantyStatus] = useState('UNDER_WARRANTY')
  const [conditionLevel, setConditionLevel] = useState('NEW')
  const [usageMonths, setUsageMonths] = useState('6')
  const [fieldErrors, setFieldErrors] = useState({})
  const mutation = useAutoPricing()

  const handleCalculate = () => {
    const parsed = autoPricingSchema.safeParse({
      categoryId,
      modelId,
      origin: 'OFFICIAL_VN',
      warrantyStatus,
      conditionLevel,
      usageMonths,
    })

    if (!parsed.success) {
      const nextErrors = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || 'root')
        if (!nextErrors[key]) nextErrors[key] = issue.message
      }
      setFieldErrors(nextErrors)
      return
    }

    setFieldErrors({})
    mutation.mutate(parsed.data)
  }

  const result = mutation.data

  return (
    <div className="space-y-3 rounded-lg border border-border bg-accent/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{t('pricing.auto.title')}</p>
          <p className="text-xs text-muted-foreground">{t('pricing.auto.subtitle')}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
        >
          {t(open ? 'pricing.auto.hideAction' : 'pricing.auto.openAction')}
        </Button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-border pt-3">
          {fieldErrors.categoryId && (
            <p role="alert" className="text-xs text-destructive">
              {t(fieldErrors.categoryId)}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="auto-pricing-modelId" className="block text-xs font-medium">
                {t('pricing.auto.modelIdLabel')}
              </label>
              <input
                id="auto-pricing-modelId"
                type="text"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
                aria-invalid={Boolean(fieldErrors.modelId)}
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
              />
              {fieldErrors.modelId && (
                <p role="alert" className="text-xs text-destructive">
                  {t(fieldErrors.modelId)}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="auto-pricing-usageMonths" className="block text-xs font-medium">
                {t('pricing.auto.usageMonthsLabel')}
              </label>
              <input
                id="auto-pricing-usageMonths"
                type="number"
                min={0}
                value={usageMonths}
                onChange={(e) => setUsageMonths(e.target.value)}
                aria-invalid={Boolean(fieldErrors.usageMonths)}
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
              />
              {fieldErrors.usageMonths && (
                <p role="alert" className="text-xs text-destructive">
                  {t(fieldErrors.usageMonths)}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="auto-pricing-condition" className="block text-xs font-medium">
                {t('pricing.auto.conditionLabel')}
              </label>
              <select
                id="auto-pricing-condition"
                value={conditionLevel}
                onChange={(e) => setConditionLevel(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
              >
                {PRICING_CONDITION_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {t(`pricing.auto.condition.${level}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="auto-pricing-warranty" className="block text-xs font-medium">
                {t('pricing.auto.warrantyLabel')}
              </label>
              <select
                id="auto-pricing-warranty"
                value={warrantyStatus}
                onChange={(e) => setWarrantyStatus(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
              >
                {PRICING_WARRANTY_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`pricing.auto.warranty.${status}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || mutation.isPending}
            onClick={handleCalculate}
          >
            {t(mutation.isPending ? 'pricing.auto.calculating' : 'pricing.auto.calculateAction')}
          </Button>

          {mutation.isError && (
            <p role="alert" className="text-xs text-destructive">
              {t('pricing.auto.error')}
            </p>
          )}

          {result && (
            <div className="space-y-2 rounded-md border border-border bg-background p-3 text-sm">
              {result.status === 'SUGGESTED' && result.suggestedPrice != null ? (
                <>
                  <p className="flex flex-wrap items-center justify-between gap-2">
                    <span>{t('pricing.auto.suggestedPriceLabel')}</span>
                    <ProductPrice value={result.suggestedPrice} className="text-lg font-semibold" />
                  </p>
                  {result.referenceModelName && (
                    <p className="text-xs text-muted-foreground">
                      {t('pricing.auto.referenceModel', { name: result.referenceModelName })}
                    </p>
                  )}
                  {result.referencePrice != null && (
                    <p className="text-xs text-muted-foreground">
                      {t('pricing.auto.referencePriceLabel')}:{' '}
                      <ProductPrice value={result.referencePrice} />
                    </p>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onApplyPrice(result.suggestedPrice)}
                  >
                    {t('pricing.auto.applyAction')}
                  </Button>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t('pricing.auto.manualRequired', {
                    reason: result.reason || result.status,
                  })}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
