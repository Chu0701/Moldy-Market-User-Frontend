import { useMutation, useQueryClient } from '@tanstack/react-query'

import { meQueryKey } from '@/features/auth/hooks/useSession'
import { updateMyProfile } from '@/services/users/userService'

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateMyProfile,
    onSuccess: async (updatedProfile) => {
      await queryClient.cancelQueries({ queryKey: meQueryKey, exact: true })

      queryClient.setQueryData(meQueryKey, (currentProfile) => {
        if (!updatedProfile || currentProfile?.id !== updatedProfile.id) {
          return currentProfile
        }

        return updatedProfile
      })
    },
  })
}
