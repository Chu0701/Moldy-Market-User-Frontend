import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useSession } from '@/features/auth/hooks/useSession'
import {
  myWalletKey,
  myWalletTransactionsKey,
  myWithdrawalsKey,
  walletRootKey,
} from '@/features/wallet/walletKeys'
import {
  cancelMyWithdrawal,
  getMyWallet,
  getMyWalletTransactions,
  getMyWithdrawals,
  requestWithdrawal,
} from '@/services/wallet/walletService'

export function useMyWallet() {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = profileQuery.data?.id

  return useQuery({
    queryKey: myWalletKey(userId),
    queryFn: ({ signal }) => getMyWallet({ signal }),
    enabled: hasAccessToken && Boolean(userId),
  })
}

export function useMyWalletTransactions() {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = profileQuery.data?.id

  return useQuery({
    queryKey: myWalletTransactionsKey(userId),
    queryFn: ({ signal }) => getMyWalletTransactions({ signal }),
    enabled: hasAccessToken && Boolean(userId),
  })
}

export function useMyWithdrawals() {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = profileQuery.data?.id

  return useQuery({
    queryKey: myWithdrawalsKey(userId),
    queryFn: ({ signal }) => getMyWithdrawals({ signal }),
    enabled: hasAccessToken && Boolean(userId),
  })
}

export function useRequestWithdrawal() {
  const queryClient = useQueryClient()
  const { profileQuery } = useSession()
  const userId = profileQuery.data?.id

  return useMutation({
    mutationFn: (payload) => requestWithdrawal(payload),
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: walletRootKey(userId) })
      }
    },
  })
}

export function useCancelWithdrawal() {
  const queryClient = useQueryClient()
  const { profileQuery } = useSession()
  const userId = profileQuery.data?.id

  return useMutation({
    mutationFn: ({ withdrawalId }) => cancelMyWithdrawal({ withdrawalId }),
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: walletRootKey(userId) })
      }
    },
  })
}
