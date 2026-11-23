import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DISCOUNT_TYPES,
  storeVoucherSchema,
  toVoucherPayload,
} from '@/features/vouchers/schemas/voucherSchema'

function toDatetimeLocalValue(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function mapVoucherError(error) {
  switch (error?.code) {
    case 'VOUCHER_CODE_ALREADY_EXISTS':
      return 'vouchers.errors.codeExists'
    case 'VOUCHER_NOT_FOUND':
      return 'vouchers.errors.notFound'
    default:
      return 'vouchers.errors.generic'
  }
}

/**
 * Form to create or update a shop owner's store voucher.
 * @param {{
 *   initialVoucher?: {
 *     code: string,
 *     discountType: 'PERCENT'|'FIXED',
 *     discountValue: number,
 *     remainingQuantity: number,
 *     expiredAt: string,
 *     minimumOrderValue?: number | null,
 *     maximumDiscount?: number | null
 *   } | null,
 *   isPending: boolean,
 *   error?: { code?: string } | null,
 *   onSubmit: (payload: ReturnType<typeof toVoucherPayload>) => void,
 *   onCancel: () => void
 * }} props
 */
export function StoreVoucherForm({ initialVoucher = null, isPending, error, onSubmit, onCancel }) {
  const { t } = useTranslation()
  const isEditing = Boolean(initialVoucher)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(storeVoucherSchema),
    defaultValues: initialVoucher
      ? {
          code: initialVoucher.code,
          discountType: initialVoucher.discountType,
          discountValue: initialVoucher.discountValue,
          remainingQuantity: initialVoucher.remainingQuantity,
          expiredAt: toDatetimeLocalValue(initialVoucher.expiredAt),
          minimumOrderValue: initialVoucher.minimumOrderValue ?? '',
          maximumDiscount: initialVoucher.maximumDiscount ?? '',
        }
      : {
          code: '',
          discountType: 'PERCENT',
          discountValue: 10,
          remainingQuantity: 10,
          expiredAt: '',
          minimumOrderValue: '',
          maximumDiscount: '',
        },
  })

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(toVoucherPayload(values)))}
      className="space-y-4 rounded-xl border border-border bg-background p-5"
      noValidate
    >
      <h2 className="text-xl font-semibold">
        {t(isEditing ? 'vouchers.editTitle' : 'vouchers.createTitle')}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="voucher-code" className="block text-sm font-medium">
            {t('vouchers.fields.code')}
          </label>
          <input
            id="voucher-code"
            type="text"
            disabled={isEditing}
            aria-invalid={Boolean(errors.code)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm uppercase disabled:opacity-60"
            placeholder="SHOP10"
            {...register('code')}
          />
          {errors.code && (
            <p role="alert" className="text-xs text-destructive">
              {t(errors.code.message)}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="voucher-type" className="block text-sm font-medium">
            {t('vouchers.fields.discountType')}
          </label>
          <select
            id="voucher-type"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            {...register('discountType')}
          >
            {DISCOUNT_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`vouchers.discountType.${type}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="voucher-value" className="block text-sm font-medium">
            {t('vouchers.fields.discountValue')}
          </label>
          <input
            id="voucher-value"
            type="number"
            step="any"
            aria-invalid={Boolean(errors.discountValue)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            {...register('discountValue')}
          />
          {errors.discountValue && (
            <p role="alert" className="text-xs text-destructive">
              {t(errors.discountValue.message)}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="voucher-quantity" className="block text-sm font-medium">
            {t('vouchers.fields.remainingQuantity')}
          </label>
          <input
            id="voucher-quantity"
            type="number"
            min={1}
            aria-invalid={Boolean(errors.remainingQuantity)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            {...register('remainingQuantity')}
          />
          {errors.remainingQuantity && (
            <p role="alert" className="text-xs text-destructive">
              {t(errors.remainingQuantity.message)}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="voucher-expired-at" className="block text-sm font-medium">
            {t('vouchers.fields.expiredAt')}
          </label>
          <input
            id="voucher-expired-at"
            type="datetime-local"
            aria-invalid={Boolean(errors.expiredAt)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            {...register('expiredAt')}
          />
          {errors.expiredAt && (
            <p role="alert" className="text-xs text-destructive">
              {t(errors.expiredAt.message)}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="voucher-min-order" className="block text-sm font-medium">
            {t('vouchers.fields.minimumOrderValue')}
          </label>
          <input
            id="voucher-min-order"
            type="number"
            min={0}
            aria-invalid={Boolean(errors.minimumOrderValue)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            {...register('minimumOrderValue')}
          />
          {errors.minimumOrderValue && (
            <p role="alert" className="text-xs text-destructive">
              {t(errors.minimumOrderValue.message)}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="voucher-max-discount" className="block text-sm font-medium">
            {t('vouchers.fields.maximumDiscount')}
          </label>
          <input
            id="voucher-max-discount"
            type="number"
            min={1}
            aria-invalid={Boolean(errors.maximumDiscount)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            {...register('maximumDiscount')}
          />
          {errors.maximumDiscount && (
            <p role="alert" className="text-xs text-destructive">
              {t(errors.maximumDiscount.message)}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t(mapVoucherError(error))}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {t(isPending ? 'vouchers.saving' : isEditing ? 'vouchers.saveAction' : 'vouchers.create')}
        </Button>
        <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
          {t('vouchers.cancelAction')}
        </Button>
      </div>
    </form>
  )
}
