import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  editProductSchema,
  getEditProductDefaults,
} from '@/features/products/schemas/editProductSchema'
import { updateProduct } from '@/services/products/productService'

export function useEditProductForm({ product, refetch, onSaved }) {
  const [hasConflict, setHasConflict] = useState(false)
  const form = useForm({
    resolver: zodResolver(editProductSchema),
    defaultValues: getEditProductDefaults(product),
  })
  const { handleSubmit, reset, setError } = form

  const submit = handleSubmit(async (values) => {
    if (hasConflict) return

    try {
      await updateProduct({ ...values, productId: product.id })
    } catch (error) {
      if (error?.status === 409 && error.code === 'CONCURRENT_MODIFICATION') {
        setHasConflict(true)
        return
      }

      setError('root.server', {
        message: error?.status === 403 ? 'feedback.forbiddenMessage' : 'products.edit.submitError',
      })
      return
    }

    await onSaved()
  })

  async function reload() {
    const result = await refetch({ cancelRefetch: false })
    const latest = result.data

    if (!result.isSuccess || !Number.isSafeInteger(latest?.version) || latest.version < 0) {
      setError('root.server', { message: 'products.edit.reloadError' })
      return
    }

    reset(getEditProductDefaults(latest))
    setHasConflict(false)
  }

  return { form, submit, reload, hasConflict }
}
