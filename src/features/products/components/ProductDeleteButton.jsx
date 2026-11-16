import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { productKeys } from '@/features/products/hooks/useProductSearch'
import { deleteProduct } from '@/services/products/productService'

export function ProductDeleteButton({ productId }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => deleteProduct({ productId }),
    onSuccess: async () => {
      const detailKey = productKeys.detail(productId)
      await queryClient.cancelQueries({ queryKey: detailKey, exact: true })

      queryClient.setQueryData(detailKey, (product) =>
        product ? { ...product, status: 'DELETED' } : undefined,
      )
      void queryClient.invalidateQueries({ queryKey: ['products', 'search'] })
      void queryClient.invalidateQueries({ queryKey: ['products', 'mine'] })
      await navigate('/products', { replace: true })
    },
  })

  function confirmDelete() {
    if (window.confirm(t('products.delete.confirm'))) {
      mutate()
    }
  }

  return (
    <div className="grid gap-2">
      <Button type="button" variant="destructive" disabled={isPending} onClick={confirmDelete}>
        {t(isPending ? 'products.delete.pending' : 'products.delete.action')}
      </Button>

      {error && (
        <p className="product-create-error" role="alert">
          {t(error.status === 403 ? 'feedback.forbiddenMessage' : 'products.delete.submitError')}
        </p>
      )}
    </div>
  )
}
