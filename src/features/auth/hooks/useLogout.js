import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { clearAccessToken } from '@/lib/tokenStorage'
import { waitForPendingRefresh } from '@/services/api/authRefreshInterceptor'
import { logout } from '@/services/auth/authService'

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function signOut() {
    if (isSigningOut) return

    setIsSigningOut(true)
    clearAccessToken()
    queryClient.clear()

    try {
      await waitForPendingRefresh()
      await logout()
    } catch {
      // The local session is already cleared even if the server is unreachable.
    } finally {
      void navigate('/login', { replace: true })
      setIsSigningOut(false)
    }
  }

  return { signOut, isSigningOut }
}
