import { QueryClientProvider } from '@tanstack/react-query'

import { queryClient } from '@/app/providers/queryClient'
import { ToastProvider } from '@/components/feedback/ToastProvider'

/** @param {{ children: import('react').ReactNode }} props */
export function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  )
}
