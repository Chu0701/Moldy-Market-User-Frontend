import { useQueryClient } from '@tanstack/react-query'
import { meQueryKey } from './useSession'
import { clearAccessToken, setAccessToken } from '@/lib/tokenStorage'
import { login } from '@/services/auth/authService'
import { getMe } from '@/services/users/userService'

export function useLogin() {
  const queryClient = useQueryClient()

  return async function signIn(credentitials) {
    const session = await login(credentitials)

    if (!session?.accessToken) {
      throw new Error('Login response is missing an access token')
    }

    await queryClient.cancelQueries({ queryKey: meQueryKey, exact: true })
    queryClient.removeQueries({ queryKey: meQueryKey, exact: true })
    setAccessToken(session.accessToken)

    try {
      await queryClient.query({
        queryKey: meQueryKey,
        queryFn: ({ signal }) => getMe({ signal }),
        retry: false,
      })
    } catch (error) {
      clearAccessToken()
      queryClient.removeQueries({ queryKey: meQueryKey, exact: true })
      throw error
    }
  }
}
