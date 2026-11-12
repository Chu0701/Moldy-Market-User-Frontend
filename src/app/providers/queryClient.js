import { QueryClient } from '@tanstack/react-query'

/** Creates an isolated cache, also useful when testing query behavior. */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => {
          // ApiError will provide status once the API layer is added.
          if (error?.status >= 400 && error?.status < 500) return false
          return failureCount < 2
        },
      },
      // A failed write may already have reached the server; do not send it twice.
      mutations: { retry: false },
    },
  })
}

// One instance for the app's lifetime; never recreate it during a React render.
export const queryClient = createQueryClient()
