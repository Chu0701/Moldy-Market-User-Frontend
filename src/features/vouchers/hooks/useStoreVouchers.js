import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/useSession'
import { voucherKeys } from '@/features/vouchers/voucherKeys'
import {
  createStoreVoucher,
  deactivateStoreVoucher,
  getMyStoreVouchers,
  updateStoreVoucher,
} from '@/services/vouchers/voucherService'

export function useStoreVouchers() {
  const queryClient = useQueryClient()
  const { hasAccessToken, profileQuery } = useSession()
  const profile = profileQuery.data
  const userId = hasAccessToken ? profile?.id : undefined
  const isOwner = Boolean(profile?.roles?.includes('OWNER'))

  const listQuery = useQuery({
    queryKey: voucherKeys.shopList(userId),
    queryFn: ({ signal }) => getMyStoreVouchers({ signal }),
    enabled: Boolean(userId && isOwner),
    retry: false,
  })

  const invalidate = () => {
    if (!userId) return
    void queryClient.invalidateQueries({ queryKey: voucherKeys.shopList(userId) })
  }

  const createMutation = useMutation({
    mutationFn: (payload) => createStoreVoucher(payload),
    retry: false,
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: (payload) => updateStoreVoucher(payload),
    retry: false,
    onSuccess: invalidate,
  })

  const deactivateMutation = useMutation({
    mutationFn: ({ code }) => deactivateStoreVoucher({ code }),
    retry: false,
    onSuccess: invalidate,
  })

  return {
    userId,
    isOwner,
    profileQuery,
    listQuery,
    createMutation,
    updateMutation,
    deactivateMutation,
  }
}
