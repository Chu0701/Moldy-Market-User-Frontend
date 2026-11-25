import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useSession } from '@/features/auth/hooks/useSession'
import {
  approveAppraiser,
  getAdminAppraisers,
  rejectAppraiser,
  resumeAppraiser,
  suspendAppraiser,
} from '@/services/appraiser/appraiserService'

export function useAdminAppraiserList(status, page = 1) {
  const { profileQuery } = useSession()
  const enabled = profileQuery.data?.roles?.includes('ADMIN')
  return useQuery({
    queryKey: ['adminAppraisers', status, page],
    queryFn: enabled
      ? ({ signal }) => getAdminAppraisers({ status: status || undefined, page, signal })
      : skipToken,
    retry: false,
  })
}

export function useAdminAppraiserAction() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ action, ...params }) =>
      ({
        approve: approveAppraiser,
        reject: rejectAppraiser,
        suspend: suspendAppraiser,
        resume: resumeAppraiser,
      })[action](params),
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: ['adminAppraisers'] }),
  })
}
