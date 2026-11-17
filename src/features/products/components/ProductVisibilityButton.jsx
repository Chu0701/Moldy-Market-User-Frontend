import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { productKeys } from '@/features/products/hooks/useProductSearch'
import { changeProductStatus } from '@/services/products/productService'

export function ProductVisibilityButton({ productId, status }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const nextStatus = status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE'

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => changeProductStatus({ productId, status: nextStatus }),
    onSuccess: async () => {
      void queryClient.invalidateQueries({ queryKey: ['products', 'search'] })
      void queryClient.invalidateQueries({ queryKey: ['products', 'store-mine'] })
      void queryClient.invalidateQueries({ queryKey: ['products', 'mine'] })
      await queryClient.invalidateQueries({
        queryKey: productKeys.detail(productId),
        exact: true,
      })
    },
  })

  let errorKey = 'products.visibility.submitError'
  if (error?.code === 'PRODUCT_STATUS_LOCKED') {
    errorKey = 'products.visibility.locked'
  } else if (error?.status === 403) {
    errorKey = 'feedback.forbiddenMessage'
  }

  return (
    <div className="grid gap-2">
      <Button type="button" variant="outline" disabled={isPending} onClick={() => mutate()}>
        {t(
          isPending
            ? 'products.visibility.saving'
            : nextStatus === 'HIDDEN'
              ? 'products.visibility.hide'
              : 'products.visibility.show',
        )}
      </Button>
      {error && (
        <p className="product-create-error" role="alert">
          {t(errorKey)}
        </p>
      )}
    </div>
  )
}
