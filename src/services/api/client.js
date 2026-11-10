import axios from 'axios'

import { ApiError } from '@/services/api/ApiError'

export const apiClient = axios.create({
  // Services supply the complete path because Backend uses /api/v1 and /api.
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15_000,
  headers: { Accept: 'application/json' },
})

// TODO(doc14:Q2): add auth/refresh only after the HttpOnly cookie contract is verified.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // TanStack Query must still recognize requests cancelled through AbortSignal.
    if (axios.isCancel(error)) return Promise.reject(error)
    return Promise.reject(ApiError.from(error))
  },
)
