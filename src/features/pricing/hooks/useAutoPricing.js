import { useMutation } from '@tanstack/react-query'
import { calculateAutoPrice } from '@/services/pricing/pricingService'

export function useAutoPricing() {
  return useMutation({
    mutationFn: calculateAutoPrice,
    retry: false,
  })
}
